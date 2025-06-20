const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');

// Daily cleanup job - runs at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily cleanup job...');
    
    // Stop any running timers that have been running for more than 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const stuckTimers = await Task.find({
      isTimerRunning: true,
      timerStartTime: { $lt: twelveHoursAgo }
    });

    for (const task of stuckTimers) {
      const timeElapsed = Math.floor((Date.now() - task.timerStartTime.getTime()) / 60000);
      
      await Task.findByIdAndUpdate(task._id, {
        $set: {
          isTimerRunning: false,
          timeSpent: task.timeSpent + timeElapsed
        },
        $unset: { timerStartTime: 1 },
        $push: {
          timerSessions: {
            startTime: task.timerStartTime,
            endTime: new Date(),
            duration: timeElapsed,
            type: 'work'
          }
        }
      });
    }

    console.log(`Cleaned up ${stuckTimers.length} stuck timers`);
  } catch (error) {
    console.error('Daily cleanup job error:', error);
  }
});

// Weekly analytics update - runs every Sunday at 1 AM
cron.schedule('0 1 * * 0', async () => {
  try {
    console.log('Running weekly analytics update...');
    
    // Update AI insights for active tasks
    const activeTasks = await Task.find({
      status: { $in: ['todo', 'in-progress'] },
      'aiInsights.lastAnalyzed': {
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // older than 7 days
      }
    }).limit(100); // Process in batches

    for (const task of activeTasks) {
      // Simple priority scoring algorithm
      let priorityScore = 0;
      
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) priorityScore += 40;
        else if (daysUntilDue <= 3) priorityScore += 25;
        else if (daysUntilDue <= 7) priorityScore += 15;
      }

      if (task.priority === 'high') priorityScore += 30;
      else if (task.priority === 'medium') priorityScore += 15;
      else priorityScore += 5;

      if (task.timeSpent > 120) priorityScore += 20;
      if (task.status === 'in-progress') priorityScore += 15;

      await Task.findByIdAndUpdate(task._id, {
        'aiInsights.priorityScore': priorityScore,
        'aiInsights.lastAnalyzed': new Date()
      });
    }

    console.log(`Updated AI insights for ${activeTasks.length} tasks`);
  } catch (error) {
    console.error('Weekly analytics update error:', error);
  }
});

// Archive completed tasks older than 90 days - runs monthly
cron.schedule('0 2 1 * *', async () => {
  try {
    console.log('Running monthly archive job...');
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const result = await Task.updateMany(
      {
        status: 'completed',
        completedAt: { $lt: ninetyDaysAgo },
        status: { $ne: 'archived' }
      },
      {
        status: 'archived',
        archivedAt: new Date()
      }
    );

    console.log(`Archived ${result.modifiedCount} old completed tasks`);
  } catch (error) {
    console.error('Monthly archive job error:', error);
  }
});

module.exports = {
  // Export functions for manual testing if needed
  cleanupStuckTimers: async () => {
    // Implementation here
  },
  updateAIInsights: async () => {
    // Implementation here
  }
};