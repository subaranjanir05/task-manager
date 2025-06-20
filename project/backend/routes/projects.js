const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      userId: req.userId,
      status: { $ne: 'archived' }
    })
    .populate('taskCount')
    .populate('completedTaskCount')
    .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// Get single project with tasks
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.userId
    })
    .populate('taskCount')
    .populate('completedTaskCount');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project tasks
    const tasks = await Task.find({
      projectId: req.params.id,
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// Create new project
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required and must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('color').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please provide a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = new Project({
      ...req.body,
      userId: req.userId
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// Update project
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('status').optional().isIn(['active', 'completed', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project has tasks
    const taskCount = await Task.countDocuments({
      projectId: req.params.id,
      userId: req.userId
    });

    if (taskCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete project with existing tasks. Please move or delete all tasks first.',
        taskCount
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

// Get project analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project tasks with analytics
    const tasks = await Task.find({
      projectId: req.params.id,
      userId: req.userId
    });

    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length,
      totalTimeSpent: tasks.reduce((acc, task) => acc + task.timeSpent, 0),
      averageTaskTime: tasks.length > 0 ? Math.round(tasks.reduce((acc, task) => acc + task.timeSpent, 0) / tasks.length) : 0,
      priorityDistribution: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
      recentActivity: tasks
        .filter(t => t.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10)
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ message: 'Server error fetching project analytics' });
  }
});

module.exports = router;