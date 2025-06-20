const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Get calendar events (tasks with due dates)
router.get('/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const query = {
      userId: req.userId,
      dueDate: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    };

    const tasks = await Task.find(query)
      .populate('projectId', 'name color')
      .sort({ dueDate: 1 });

    const events = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      allDay: true,
      backgroundColor: task.projectId?.color || '#3B82F6',
      borderColor: task.projectId?.color || '#3B82F6',
      textColor: '#FFFFFF',
      extendedProps: {
        taskId: task._id,
        description: task.description,
        priority: task.priority,
        status: task.status,
        projectName: task.projectId?.name,
        timeSpent: task.timeSpent,
        estimatedTime: task.estimatedTime
      }
    }));

    res.json({ events });
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ message: 'Server error fetching calendar events' });
  }
});

// Create time block
router.post('/time-blocks', async (req, res) => {
  try {
    const { taskId, startTime, endTime, title } = req.body;

    let task = null;
    if (taskId) {
      task = await Task.findOne({
        _id: taskId,
        userId: req.userId
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    // For now, we'll store time blocks as special tasks
    // In a full implementation, you might want a separate TimeBlock model
    const timeBlock = new Task({
      title: title || (task ? `Work on: ${task.title}` : 'Time Block'),
      description: task ? `Scheduled work time for: ${task.description}` : 'Scheduled time block',
      userId: req.userId,
      projectId: task?.projectId || req.body.projectId,
      status: 'todo',
      priority: task?.priority || 'medium',
      dueDate: new Date(startTime),
      estimatedTime: Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)), // in minutes
      tags: ['time-block']
    });

    await timeBlock.save();
    await timeBlock.populate('projectId', 'name color');

    res.status(201).json({
      message: 'Time block created successfully',
      timeBlock
    });
  } catch (error) {
    console.error('Create time block error:', error);
    res.status(500).json({ message: 'Server error creating time block' });
  }
});

// Update time block (reschedule)
router.put('/time-blocks/:id', async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const timeBlock = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
        tags: 'time-block'
      },
      {
        dueDate: new Date(startTime),
        estimatedTime: Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60))
      },
      { new: true }
    ).populate('projectId', 'name color');

    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    res.json({
      message: 'Time block updated successfully',
      timeBlock
    });
  } catch (error) {
    console.error('Update time block error:', error);
    res.status(500).json({ message: 'Server error updating time block' });
  }
});

// Delete time block
router.delete('/time-blocks/:id', async (req, res) => {
  try {
    const timeBlock = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
      tags: 'time-block'
    });

    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    res.json({ message: 'Time block deleted successfully' });
  } catch (error) {
    console.error('Delete time block error:', error);
    res.status(500).json({ message: 'Server error deleting time block' });
  }
});

// Get available time slots
router.get('/available-slots', async (req, res) => {
  try {
    const { date, duration = 60 } = req.query; // duration in minutes
    
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    // Get existing time blocks for the day
    const existingBlocks = await Task.find({
      userId: req.userId,
      dueDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate available slots (simplified algorithm)
    const slots = [];
    const slotDuration = parseInt(duration);
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        // Check if slot conflicts with existing blocks
        const hasConflict = existingBlocks.some(block => {
          const blockStart = new Date(block.dueDate);
          const blockEnd = new Date(blockStart);
          blockEnd.setMinutes(blockEnd.getMinutes() + (block.estimatedTime || 60));

          return (slotStart < blockEnd && slotEnd > blockStart);
        });

        if (!hasConflict && slotEnd <= endOfDay) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            duration: slotDuration
          });
        }
      }
    }

    res.json({ availableSlots: slots.slice(0, 10) }); // Return first 10 slots
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Server error finding available slots' });
  }
});

module.exports = router;