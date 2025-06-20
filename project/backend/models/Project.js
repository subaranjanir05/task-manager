const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    required: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    defaultTaskPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  deadline: Date,
  completedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, createdAt: -1 });

// Virtual for task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// Virtual for completed task count
projectSchema.virtual('completedTaskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
  match: { status: 'completed' }
});

// Update completedAt when status changes to completed
projectSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);