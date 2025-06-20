const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Get comprehensive analytics
router.get('/', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all user data
    const allTasks = await Task.find({ userId: req.userId });
    const allProjects = await Project.find({ userId: req.userId });
    const periodTasks = allTasks.filter(task => 
      new Date(task.updatedAt) >= startDate
    );

    // Basic metrics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = allTasks.filter(t => t.status === 'todo').length;

    // Time metrics
    const totalTimeSpent = allTasks.reduce((acc, task) => acc + task.timeSpent, 0);
    const periodTimeSpent = periodTasks.reduce((acc, task) => acc + task.timeSpent, 0);

    // Priority distribution
    const priorityStats = {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };

    // Project analytics
    const projectStats = await Promise.all(
      allProjects.map(async (project) => {
        const projectTasks = allTasks.filter(t => t.projectId.toString() === project._id.toString());
        const completedProjectTasks = projectTasks.filter(t => t.status === 'completed').length;
        const projectTimeSpent = projectTasks.reduce((acc, task) => acc + task.timeSpent, 0);

        return {
          id: project._id,
          name: project.name,
          color: project.color,
          totalTasks: projectTasks.length,
          completedTasks: completedProjectTasks,
          completionRate: projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0,
          timeSpent: projectTimeSpent
        };
      })
    );

    // Daily activity for the period
    const dailyActivity = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = allTasks.filter(task => {
        const taskDate = new Date(task.updatedAt).toISOString().split('T')[0];
        return taskDate === dateString;
      });

      dailyActivity.push({
        date: dateString,
        tasksCompleted: dayTasks.filter(t => t.status === 'completed').length,
        timeSpent: dayTasks.reduce((acc, task) => acc + task.timeSpent, 0),
        tasksCreated: dayTasks.filter(task => {
          const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
          return createdDate === dateString;
        }).length
      });
    }

    // Productivity trends
    const weeklyStats = [];
    for (let week = 0; week < Math.min(4, Math.floor(periodDays / 7)); week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - week * 7);

      const weekTasks = allTasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate >= weekStart && taskDate < weekEnd;
      });

      weeklyStats.push({
        week: `Week ${week + 1}`,
        tasksCompleted: weekTasks.filter(t => t.status === 'completed').length,
        timeSpent: weekTasks.reduce((acc, task) => acc + task.timeSpent, 0)
      });
    }

    // Overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    ).length;

    // Average task completion time
    const completedTasksWithTime = allTasks.filter(t => 
      t.status === 'completed' && t.timeSpent > 0
    );
    const avgTaskTime = completedTasksWithTime.length > 0 
      ? Math.round(completedTasksWithTime.reduce((acc, task) => acc + task.timeSpent, 0) / completedTasksWithTime.length)
      : 0;

    // Most productive day of week
    const dayOfWeekStats = {};
    allTasks.forEach(task => {
      if (task.status === 'completed') {
        const dayOfWeek = new Date(task.updatedAt).getDay();
        dayOfWeekStats[dayOfWeek] = (dayOfWeekStats[dayOfWeek] || 0) + 1;
      }
    });

    const mostProductiveDay = Object.keys(dayOfWeekStats).reduce((a, b) => 
      dayOfWeekStats[a] > dayOfWeekStats[b] ? a : b, '0'
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const analytics = {
      overview: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTimeSpent,
        avgTaskTime,
        overdueTasks,
        mostProductiveDay: dayNames[parseInt(mostProductiveDay)]
      },
      period: {
        days: periodDays,
        timeSpent: periodTimeSpent,
        tasksWorked: periodTasks.length,
        tasksCompleted: periodTasks.filter(t => t.status === 'completed').length
      },
      priorityStats,
      projectStats: projectStats.sort((a, b) => b.timeSpent - a.timeSpent),
      dailyActivity,
      weeklyStats: weeklyStats.reverse(),
      trends: {
        productivity: calculateProductivityTrend(dailyActivity),
        taskCompletion: calculateCompletionTrend(dailyActivity)
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// Get focus session analytics
router.get('/focus-sessions', async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const tasks = await Task.find({
      userId: req.userId,
      'timerSessions.startTime': { $gte: startDate }
    }).populate('projectId', 'name color');

    // Extract all timer sessions within the period
    const sessions = [];
    tasks.forEach(task => {
      task.timerSessions.forEach(session => {
        if (session.startTime >= startDate) {
          sessions.push({
            taskId: task._id,
            taskTitle: task.title,
            projectName: task.projectId?.name,
            projectColor: task.projectId?.color,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            type: session.type
          });
        }
      });
    });

    // Group sessions by day
    const dailySessions = {};
    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      if (!dailySessions[date]) {
        dailySessions[date] = [];
      }
      dailySessions[date].push(session);
    });

    // Calculate daily focus metrics
    const dailyFocusMetrics = Object.keys(dailySessions).map(date => {
      const daySessions = dailySessions[date];
      const workSessions = daySessions.filter(s => s.type === 'work');
      
      return {
        date,
        totalSessions: workSessions.length,
        totalFocusTime: workSessions.reduce((acc, s) => acc + s.duration, 0),
        averageSessionLength: workSessions.length > 0 
          ? Math.round(workSessions.reduce((acc, s) => acc + s.duration, 0) / workSessions.length)
          : 0,
        longestSession: workSessions.length > 0 
          ? Math.max(...workSessions.map(s => s.duration))
          : 0
      };
    });

    // Overall focus statistics
    const workSessions = sessions.filter(s => s.type === 'work');
    const totalFocusTime = workSessions.reduce((acc, s) => acc + s.duration, 0);
    const averageSessionLength = workSessions.length > 0 
      ? Math.round(totalFocusTime / workSessions.length)
      : 0;

    const focusAnalytics = {
      period: {
        days: periodDays,
        totalSessions: workSessions.length,
        totalFocusTime,
        averageSessionLength,
        longestSession: workSessions.length > 0 
          ? Math.max(...workSessions.map(s => s.duration))
          : 0
      },
      dailyMetrics: dailyFocusMetrics.sort((a, b) => new Date(a.date) - new Date(b.date)),
      recentSessions: sessions
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10)
    };

    res.json({ focusAnalytics });
  } catch (error) {
    console.error('Focus analytics error:', error);
    res.status(500).json({ message: 'Server error fetching focus analytics' });
  }
});

// Helper functions
function calculateProductivityTrend(dailyActivity) {
  if (dailyActivity.length < 2) return 'stable';
  
  const recent = dailyActivity.slice(-7);
  const previous = dailyActivity.slice(-14, -7);
  
  const recentAvg = recent.reduce((acc, day) => acc + day.tasksCompleted, 0) / recent.length;
  const previousAvg = previous.reduce((acc, day) => acc + day.tasksCompleted, 0) / previous.length;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

function calculateCompletionTrend(dailyActivity) {
  if (dailyActivity.length < 2) return 'stable';
  
  const recent = dailyActivity.slice(-7);
  const previous = dailyActivity.slice(-14, -7);
  
  const recentAvg = recent.reduce((acc, day) => acc + day.timeSpent, 0) / recent.length;
  const previousAvg = previous.reduce((acc, day) => acc + day.timeSpent, 0) / previous.length;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 15) return 'increasing';
  if (change < -15) return 'decreasing';
  return 'stable';
}

module.exports = router;