import { Task, Project } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export class AIService {
  private static instance: AIService;
  private token: string | null = null;
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async suggestPrioritization(tasks: Task[], projects: Project[]): Promise<{
    suggestions: Array<{
      taskId: string;
      suggestedPriority: 'low' | 'medium' | 'high';
      reason: string;
      confidence: number;
    }>;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const data = await this.makeRequest('/ai/prioritize', {
        method: 'POST',
      });
      
      return {
        suggestions: data.suggestions || [],
        insights: data.insights || [],
        recommendations: data.recommendations || []
      };
    } catch (error) {
      console.error('AI prioritization failed:', error);
      // Fallback to local analysis
      return this.fallbackPrioritization(tasks, projects);
    }
  }

  async generateDailyReview(tasks: Task[], projects: Project[]): Promise<{
    summary: string;
    achievements: string[];
    recommendations: string[];
    tomorrowFocus: string[];
    motivationalNote: string;
  }> {
    try {
      const data = await this.makeRequest('/ai/daily-review', {
        method: 'POST',
      });
      
      return {
        summary: data.summary || '',
        achievements: data.achievements || [],
        recommendations: data.recommendations || [],
        tomorrowFocus: data.tomorrowFocus || [],
        motivationalNote: data.motivationalNote || 'Keep up the great work!'
      };
    } catch (error) {
      console.error('AI daily review failed:', error);
      return this.fallbackDailyReview(tasks, projects);
    }
  }

  async suggestTasks(projectId: string, context: string = ''): Promise<{
    suggestions: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedTime: number;
    }>;
  }> {
    try {
      const data = await this.makeRequest('/ai/suggest-tasks', {
        method: 'POST',
        body: JSON.stringify({ projectId, context }),
      });
      
      return {
        suggestions: data.suggestions || []
      };
    } catch (error) {
      console.error('AI task suggestions failed:', error);
      return { suggestions: [] };
    }
  }

  private fallbackPrioritization(tasks: Task[], projects: Project[]) {
    const now = new Date();
    
    const suggestions = tasks.map(task => {
      let score = 0;
      let reasons = [];

      // Deadline urgency
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

      let suggestedPriority: 'low' | 'medium' | 'high';
      if (score >= 60) suggestedPriority = 'high';
      else if (score >= 30) suggestedPriority = 'medium';
      else suggestedPriority = 'low';

      return {
        taskId: task.id,
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

    const recommendations = [
      'Focus on high-priority items first',
      'Break large tasks into smaller, manageable chunks',
      'Use time-blocking to allocate focused work periods',
      'Review and adjust priorities weekly'
    ];

    return { suggestions, insights, recommendations };
  }

  private fallbackDailyReview(tasks: Task[], projects: Project[]) {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => 
      new Date(task.updatedAt).toDateString() === today
    );
    const completedToday = todayTasks.filter(task => task.status === 'completed');
    const totalTimeToday = todayTasks.reduce((acc, task) => acc + task.timeSpent, 0);

    return {
      summary: `Today you completed ${completedToday.length} task${completedToday.length !== 1 ? 's' : ''} and spent ${Math.floor(totalTimeToday / 60)}h ${totalTimeToday % 60}m on focused work.`,
      achievements: completedToday.slice(0, 3).map(t => `✅ Completed "${t.title}"`),
      recommendations: [
        totalTimeToday > 300 ? 'Great focus time today!' : 'Consider longer focus sessions tomorrow',
        completedToday.length > 3 ? 'Excellent task completion rate!' : 'Try breaking larger tasks into smaller chunks',
        'Plan your most important work for your peak energy hours'
      ],
      tomorrowFocus: tasks
        .filter(t => t.status !== 'completed' && t.priority === 'high')
        .slice(0, 3)
        .map(t => t.title),
      motivationalNote: 'Every step forward is progress. Keep up the great work!'
    };
  }
}