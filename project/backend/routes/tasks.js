const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Get all tasks for user
router.get('/', [
  query('status').optional().isIn(['todo', 'in-progress', 'completed', 'archived']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('projectId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      priority,
      projectId,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { userId: req.userId };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId) query.projectId = projectId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const tasks = await Task.find(query)
      .populate('projectId', 'name color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('projectId', 'name color description');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
});

// Create new task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in-progress', 'completed']),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('estimatedTime').optional().isInt({ min: 0 }).withMessage('Estimated time must be a positive number'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: req.body.projectId,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create task
    const task = new Task({
      ...req.body,
      userId: req.userId
    });

    await task.save();
    await task.populate('projectId', 'name color');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in-progress', 'completed', 'archived']),
  body('dueDate').optional().isISO8601(),
  body('estimatedTime').optional().isInt({ min: 0 }),
  body('timeSpent').optional().isInt({ min: 0 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'name color');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// Start timer for task
router.post('/:id/timer/start', async (req, res) => {
  try {
    // Stop any currently running timers for this user
    await Task.updateMany(
      { userId: req.userId, isTimerRunning: true },
      {
        $set: { isTimerRunning: false },
        $unset: { timerStartTime: 1 }
      }
    );

    // Start timer for this task
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        isTimerRunning: true,
        timerStartTime: new Date(),
        status: 'in-progress'
      },
      { new: true }
    ).populate('projectId', 'name color');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      message: 'Timer started successfully',
      task
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Server error starting timer' });
  }
});

// Stop timer for task
router.post('/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
      isTimerRunning: true
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or timer not running' });
    }

    // Calculate time spent
    const timeElapsed = Math.floor((Date.now() - task.timerStartTime.getTime()) / 60000); // in minutes
    
    // Create timer session record
    const session = {
      startTime: task.timerStartTime,
      endTime: new Date(),
      duration: timeElapsed,
      type: 'work'
    };

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isTimerRunning: false,
          timeSpent: task.timeSpent + timeElapsed
        },
        $unset: { timerStartTime: 1 },
        $push: { timerSessions: session }
      },
      { new: true }
    ).populate('projectId', 'name color');

    res.json({
      message: 'Timer stopped successfully',
      task: updatedTask,
      sessionDuration: timeElapsed
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Server error stopping timer' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// Bulk operations
router.post('/bulk', [
  body('action').isIn(['delete', 'update', 'archive']).withMessage('Invalid bulk action'),
  body('taskIds').isArray({ min: 1 }).withMessage('Task IDs array is required'),
  body('updates').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, taskIds, updates } = req.body;

    let result;
    switch (action) {
      case 'delete':
        result = await Task.deleteMany({
          _id: { $in: taskIds },
          userId: req.userId
        });
        break;
      case 'update':
        result = await Task.updateMany(
          { _id: { $in: taskIds }, userId: req.userId },
          updates,
          { runValidators: true }
        );
        break;
      case 'archive':
        result = await Task.updateMany(
          { _id: { $in: taskIds }, userId: req.userId },
          { status: 'archived', archivedAt: new Date() }
        );
        break;
    }

    res.json({
      message: `Bulk ${action} completed successfully`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ message: 'Server error performing bulk operation' });
  }
});

module.exports = router;