import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Award,
  Activity,
  CheckCircle
} from 'lucide-react';
import { Task, Project } from '../types';
import { formatDuration } from '../utils/dateUtils';

interface AnalyticsProps {
  tasks: Task[];
  projects: Project[];
}

export function Analytics({ tasks, projects }: AnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Time-based analytics
    const todayTasks = tasks.filter(task => 
      new Date(task.updatedAt).toDateString() === today
    );
    const weekTasks = tasks.filter(task => 
      new Date(task.updatedAt) >= thisWeek
    );
    const monthTasks = tasks.filter(task => 
      new Date(task.updatedAt) >= thisMonth
    );

    // Completion analytics
    const completedToday = todayTasks.filter(task => task.status === 'completed').length;
    const completedThisWeek = weekTasks.filter(task => task.status === 'completed').length;
    const completedThisMonth = monthTasks.filter(task => task.status === 'completed').length;

    // Time tracking analytics
    const totalTimeSpent = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
    const timeToday = todayTasks.reduce((acc, task) => acc + task.timeSpent, 0);
    const timeThisWeek = weekTasks.reduce((acc, task) => acc + task.timeSpent, 0);

    // Priority distribution
    const priorityStats = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length
    };

    // Status distribution
    const statusStats = {
      todo: tasks.filter(task => task.status === 'todo').length,
      'in-progress': tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length
    };

    // Project analytics
    const projectStats = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      const totalTime = projectTasks.reduce((acc, task) => acc + task.timeSpent, 0);
      
      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks,
        completionRate: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
        totalTime
      };
    }).sort((a, b) => b.totalTime - a.totalTime);

    // Weekly productivity (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toDateString();
      const dayTasks = tasks.filter(task => 
        new Date(task.updatedAt).toDateString() === dateString
      );
      const completed = dayTasks.filter(task => task.status === 'completed').length;
      const timeSpent = dayTasks.reduce((acc, task) => acc + task.timeSpent, 0);
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        timeSpent
      };
    }).reverse();

    return {
      todayTasks: todayTasks.length,
      completedToday,
      timeToday,
      completedThisWeek,
      completedThisMonth,
      totalTimeSpent,
      timeThisWeek,
      priorityStats,
      statusStats,
      projectStats,
      weeklyData,
      completionRate: tasks.length > 0 ? Math.round((statusStats.completed / tasks.length) * 100) : 0,
      averageTaskTime: statusStats.completed > 0 ? Math.round(totalTimeSpent / statusStats.completed) : 0
    };
  }, [tasks, projects]);

  const maxWeeklyCompleted = Math.max(...analytics.weeklyData.map(d => d.completed), 1);
  const maxWeeklyTime = Math.max(...analytics.weeklyData.map(d => d.timeSpent), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your productivity and progress</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.totalTimeSpent)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Task Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageTaskTime)}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Today
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tasks</span>
              <span className="font-medium">{analytics.todayTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{analytics.completedToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Spent</span>
              <span className="font-medium">{formatDuration(analytics.timeToday)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            This Week
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{analytics.completedThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Spent</span>
              <span className="font-medium">{formatDuration(analytics.timeThisWeek)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Avg</span>
              <span className="font-medium">{Math.round(analytics.completedThisWeek / 7)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            This Month
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{analytics.completedThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Projects</span>
              <span className="font-medium">{projects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Productivity</span>
              <span className="font-medium">
                {analytics.completedThisMonth > 20 ? 'High' : 
                 analytics.completedThisMonth > 10 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Weekly Activity
        </h3>
        <div className="grid grid-cols-7 gap-4">
          {analytics.weeklyData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-600 mb-2">{day.date}</div>
              <div className="space-y-2">
                <div className="bg-gray-100 rounded-lg p-2 h-20 flex flex-col justify-end">
                  <div 
                    className="bg-blue-500 rounded transition-all duration-300"
                    style={{ 
                      height: `${(day.completed / maxWeeklyCompleted) * 100}%`,
                      minHeight: day.completed > 0 ? '8px' : '0px'
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500">{day.completed} tasks</div>
                <div className="text-xs text-gray-500">{formatDuration(day.timeSpent)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status</h3>
          <div className="space-y-4">
            {Object.entries(analytics.statusStats).map(([status, count]) => {
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              const colors = {
                'todo': 'bg-gray-500',
                'in-progress': 'bg-yellow-500',
                'completed': 'bg-green-500'
              };
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{status.replace('-', ' ')}</span>
                    <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${colors[status as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.priorityStats).map(([priority, count]) => {
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              const colors = {
                'low': 'bg-green-500',
                'medium': 'bg-yellow-500',
                'high': 'bg-red-500'
              };
              
              return (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{priority}</span>
                    <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${colors[priority as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Performance</h3>
        <div className="space-y-4">
          {analytics.projectStats.map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="font-medium text-gray-900">{project.name}</span>
                </div>
                <span className="text-sm text-gray-500">{project.completionRate}% complete</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Tasks</span>
                  <div className="font-medium">{project.totalTasks}</div>
                </div>
                <div>
                  <span className="text-gray-600">Completed</span>
                  <div className="font-medium text-green-600">{project.completedTasks}</div>
                </div>
                <div>
                  <span className="text-gray-600">Time Spent</span>
                  <div className="font-medium">{formatDuration(project.totalTime)}</div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${project.completionRate}%`,
                      backgroundColor: project.color
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}