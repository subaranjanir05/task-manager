const express = require('express');
const OpenAI = require('openai');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Task Prioritization
router.post('/prioritize', async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      status: { $ne: 'completed' }
    }).populate('projectId', 'name');

    const projects = await Project.find({ userId: req.userId });

    if (tasks.length === 0) {
      return res.json({
        suggestions: [],
        insights: ['No active tasks found to prioritize.']
      });
    }

    // Prepare data for AI analysis
    const taskData = tasks.map(task => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      timeSpent: task.timeSpent,
      estimatedTime: task.estimatedTime,
      projectName: task.projectId?.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    const prompt = `
    As an AI productivity assistant, analyze the following tasks and provide prioritization suggestions:

    Tasks: ${JSON.stringify(taskData, null, 2)}

    Current Date: ${new Date().toISOString()}

    Please provide:
    1. Priority suggestions for each task (high/medium/low) with reasoning
    2. General productivity insights
    3. Recommendations for better task management

    Consider:
    - Deadline urgency
    - Time already invested
    - Task dependencies
    - Current status
    - Project context

    Respond in JSON format:
    {
      "suggestions": [
        {
          "taskId": "string",
          "suggestedPriority": "high|medium|low",
          "reason": "string",
          "confidence": number (0-100)
        }
      ],
      "insights": ["string array of general insights"],
      "recommendations": ["string array of actionable recommendations"]
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert productivity consultant and task management specialist. Provide clear, actionable advice based on data analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      // Fallback to rule-based prioritization
      aiResponse = generateRuleBasedPrioritization(tasks);
    }

    res.json(aiResponse);
  } catch (error) {
    console.error('AI prioritization error:', error);
    
    // Fallback to rule-based system if AI fails
    try {
      const tasks = await Task.find({
        userId: req.userId,
        status: { $ne: 'completed' }
      });
      
      const fallbackResponse = generateRuleBasedPrioritization(tasks);
      res.json(fallbackResponse);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Server error generating prioritization' });
    }
  }
});

// AI Daily Review
router.post('/daily-review', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const tasks = await Task.find({
      userId: req.userId,
      updatedAt: { $gte: startOfDay }
    }).populate('projectId', 'name');

    const allTasks = await Task.find({ userId: req.userId });
    const projects = await Project.find({ userId: req.userId });

    const completedToday = tasks.filter(t => t.status === 'completed');
    const totalTimeToday = tasks.reduce((acc, task) => acc + task.timeSpent, 0);

    const reviewData = {
      date: today.toISOString().split('T')[0],
      tasksWorkedOn: tasks.length,
      tasksCompleted: completedToday.length,
      totalFocusTime: totalTimeToday,
      completedTasks: completedToday.map(t => ({
        title: t.title,
        project: t.projectId?.name,
        timeSpent: t.timeSpent
      })),
      pendingHighPriority: allTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      overdueCount: allTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed').length
    };

    const prompt = `
    Generate a daily productivity review based on this data:
    ${JSON.stringify(reviewData, null, 2)}

    Provide an encouraging and insightful review in JSON format:
    {
      "summary": "Brief overview of the day's productivity",
      "achievements": ["List of specific accomplishments"],
      "recommendations": ["Actionable suggestions for improvement"],
      "tomorrowFocus": ["Suggested priorities for tomorrow"],
      "motivationalNote": "Encouraging message"
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a supportive productivity coach. Provide encouraging, specific, and actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback response
      aiResponse = generateRuleBasedDailyReview(reviewData);
    }

    res.json(aiResponse);
  } catch (error) {
    console.error('AI daily review error:', error);
    res.status(500).json({ message: 'Server error generating daily review' });
  }
});

// AI Task Suggestions
router.post('/suggest-tasks', async (req, res) => {
  try {
    const { projectId, context } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingTasks = await Task.find({
      projectId,
      userId: req.userId
    });

    const prompt = `
    Suggest 5 relevant tasks for this project:
    
    Project: ${project.name}
    Description: ${project.description}
    Context: ${context || 'General project tasks'}
    
    Existing tasks: ${existingTasks.map(t => t.title).join(', ')}
    
    Provide task suggestions in JSON format:
    {
      "suggestions": [
        {
          "title": "Task title",
          "description": "Task description",
          "priority": "high|medium|low",
          "estimatedTime": number (in minutes)
        }
      ]
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a project management expert. Suggest practical, actionable tasks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    res.json(aiResponse);
  } catch (error) {
    console.error('AI task suggestion error:', error);
    res.status(500).json({ message: 'Server error generating task suggestions' });
  }
});

// Fallback rule-based prioritization
function generateRuleBasedPrioritization(tasks) {
  const now = new Date();
  
  const suggestions = tasks.map(task => {
    let score = 0;
    let reasons = [];

    // Deadline urgency
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        score += 40;
        reasons.push('Due very soon');
      } else if (daysUntilDue <= 3) {
        score += 25;
        reasons.push('Due within 3 days');
      } else if (daysUntilDue <= 7) {
        score += 15;
        reasons.push('Due this week');
      }
    }

    // Current priority weight
    const priorityWeights = { high: 30, medium: 15, low: 5 };
    score += priorityWeights[task.priority];

    // Time investment
    if (task.timeSpent > 120) {
      score += 20;
      reasons.push('Significant time invested');
    }

    // Status consideration
    if (task.status === 'in-progress') {
      score += 15;
      reasons.push('Currently in progress');
    }

    let suggestedPriority;
    if (score >= 60) suggestedPriority = 'high';
    else if (score >= 30) suggestedPriority = 'medium';
    else suggestedPriority = 'low';

    return {
      taskId: task._id.toString(),
      suggestedPriority,
      reason: reasons.join(', ') || 'Based on current workload analysis',
      confidence: Math.min(95, Math.max(60, score + Math.random() * 20))
    };
  });

  const insights = [
    'Prioritization based on deadlines, time investment, and current status',
    tasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length > 0 
      ? 'You have overdue tasks that need immediate attention' 
      : 'No overdue tasks - good job staying on track!'
  ];

  return { suggestions, insights };
}

// Fallback rule-based daily review
function generateRuleBasedDailyReview(data) {
  return {
    summary: `Today you worked on ${data.tasksWorkedOn} tasks and completed ${data.tasksCompleted}. You spent ${Math.floor(data.totalFocusTime / 60)} hours in focused work.`,
    achievements: data.completedTasks.slice(0, 3).map(t => `✅ Completed "${t.title}"`),
    recommendations: [
      data.totalFocusTime > 300 ? 'Great focus time today!' : 'Consider longer focus sessions tomorrow',
      data.tasksCompleted > 3 ? 'Excellent task completion rate!' : 'Try breaking larger tasks into smaller chunks'
    ],
    tomorrowFocus: ['Focus on high-priority items', 'Review overdue tasks', 'Plan your most important work'],
    motivationalNote: 'Every step forward is progress. Keep up the great work!'
  };
}

module.exports = router;