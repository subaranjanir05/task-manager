const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed', 'archived'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  dueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  estimatedTime: {
    type: Number, // in minutes
    min: [0, 'Estimated time cannot be negative']
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  timerSessions: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['work', 'break'],
      default: 'work'
    }
  }],
  isTimerRunning: {
    type: Boolean,
    default: false
  },
  timerStartTime: {
    type: Date,
    default: null
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  aiInsights: {
    priorityScore: Number,
    estimatedCompletion: Date,
    suggestions: [String],
    lastAnalyzed: Date
  },
  completedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, projectId: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Update completedAt when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);