import React from 'react';
import { Plus, Clock, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Task, Project } from '../types';
import { TaskCard } from './TaskCard';
import { formatDuration } from '../utils/dateUtils';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  onCreateTask: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  timerTimes: Record<string, number>;
}

export function Dashboard({
  tasks,
  projects,
  onCreateTask,
  onToggleTaskStatus,
  onStartTimer,
  onStopTimer,
  onEditTask,
  timerTimes
}: DashboardProps) {
  const today = new Date().toDateString();
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const totalTimeSpent = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const tasksToday = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate).toDateString() === today
  );
  const recentTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Target,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500'
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      bgColor: 'bg-yellow-500'
    },
    {
      label: 'Time Spent',
      value: formatDuration(totalTimeSpent),
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      bgColor: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your tasks.
          </p>
        </div>
        <button
          onClick={onCreateTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-sm text-gray-500">{completionRate}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Today's Tasks */}
      {tasksToday.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Due Today</h2>
          <div className="space-y-3">
            {tasksToday.map((task) => {
              const project = projects.find(p => p.id === task.projectId)!;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  onToggleStatus={onToggleTaskStatus}
                  onStartTimer={onStartTimer}
                  onStopTimer={onStopTimer}
                  onEditTask={onEditTask}
                  timerTime={timerTimes[task.id]}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        {recentTasks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentTasks.map((task) => {
              const project = projects.find(p => p.id === task.projectId)!;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  onToggleStatus={onToggleTaskStatus}
                  onStartTimer={onStartTimer}
                  onStopTimer={onStopTimer}
                  onEditTask={onEditTask}
                  timerTime={timerTimes[task.id]}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent tasks</p>
            <button
              onClick={onCreateTask}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}