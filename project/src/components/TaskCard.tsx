import React from 'react';
import { 
  Clock, 
  Calendar, 
  Flag, 
  Play, 
  Pause, 
  MoreHorizontal,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Task, Project } from '../types';
import { formatDate, isOverdue, formatDuration } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  project: Project;
  onToggleStatus: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  timerTime?: number;
}

export function TaskCard({ 
  task, 
  project, 
  onToggleStatus, 
  onStartTimer, 
  onStopTimer, 
  onEditTask,
  timerTime = 0
}: TaskCardProps) {
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate);
  const totalTimeSpent = task.timeSpent + (task.isTimerRunning ? Math.floor(timerTime / 60) : 0);

  return (
    <div className={`bg-white rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-300 group ${
      task.status === 'completed' ? 'opacity-75 border-green-200' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggleStatus(task.id)}
            className="mt-1 transition-colors"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 mb-1 ${
              task.status === 'completed' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onEditTask(task)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-xs text-gray-500">{project.name}</span>
          </div>
          
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>

          {task.dueDate && (
            <div className={`flex items-center space-x-1 text-xs ${
              isTaskOverdue ? 'text-red-600' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {totalTimeSpent > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(totalTimeSpent)}</span>
            </div>
          )}
          
          {task.status !== 'completed' && (
            <button
              onClick={() => task.isTimerRunning ? onStopTimer(task.id) : onStartTimer(task.id)}
              className={`p-2 rounded-lg transition-all ${
                task.isTimerRunning 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {task.isTimerRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}