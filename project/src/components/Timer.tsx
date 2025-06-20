import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target, TrendingUp } from 'lucide-react';
import { Task, Project } from '../types';
import { formatDuration } from '../utils/dateUtils';
import { FocusMode } from './FocusMode';
import { AIPrioritization } from './AIPrioritization';
import { DailyReview } from './DailyReview';

interface TimerProps {
  tasks: Task[];
  projects: Project[];
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  timerTimes: Record<string, number>;
}

export function Timer({
  tasks,
  projects,
  onStartTimer,
  onStopTimer,
  onUpdateTask,
  timerTimes
}: TimerProps) {
  const [activeTab, setActiveTab] = useState('focus');

  const todayStats = {
    totalTime: tasks.reduce((acc, task) => {
      const taskTime = task.timeSpent + (task.isTimerRunning ? Math.floor((timerTimes[task.id] || 0) / 60000) : 0);
      return acc + taskTime;
    }, 0),
    completedTasks: tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updatedAt).toDateString() === new Date().toDateString()
    ).length,
    activeSessions: tasks.filter(task => task.isTimerRunning).length
  };

  const tabs = [
    { id: 'focus', label: 'Focus Mode', icon: Target },
    { id: 'ai', label: 'AI Prioritization', icon: TrendingUp },
    { id: 'review', label: 'Daily Review', icon: Clock }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Focus & AI Assistant</h1>
          <p className="text-gray-600 mt-1">Enhance your productivity with AI-powered insights</p>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Focus Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(todayStats.totalTime)}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.completedTasks}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.activeSessions}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'focus' && (
            <FocusMode
              tasks={tasks}
              projects={projects}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
              onUpdateTask={onUpdateTask}
              timerTimes={timerTimes}
            />
          )}
          {activeTab === 'ai' && (
            <AIPrioritization
              tasks={tasks}
              projects={projects}
              onUpdateTask={onUpdateTask}
            />
          )}
          {activeTab === 'review' && (
            <DailyReview
              tasks={tasks}
              projects={projects}
            />
          )}
        </div>
      </div>
    </div>
  );
}