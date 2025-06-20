import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward, Eye, EyeOff } from 'lucide-react';
import { Task, Project } from '../types';

interface FocusModeProps {
  tasks: Task[];
  projects: Project[];
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  timerTimes: Record<string, number>;
}

export function FocusMode({
  tasks,
  projects,
  onStartTimer,
  onStopTimer,
  onUpdateTask,
  timerTimes
}: FocusModeProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workDuration: 25 * 60, // 25 minutes in seconds
    shortBreak: 5 * 60,    // 5 minutes in seconds
    longBreak: 15 * 60,    // 15 minutes in seconds
    sessionsUntilLongBreak: 4
  });
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Filter to active tasks only
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const currentTask = activeTasks[currentTaskIndex];
  const currentProject = currentTask ? projects.find(p => p.id === currentTask.projectId) : null;
  const runningTask = tasks.find(task => task.isTimerRunning);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (runningTask && !isBreakTime) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Auto-break when work session completes
          if (newTime >= pomodoroSettings.workDuration) {
            handleCompleteSession();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else if (isBreakTime) {
      interval = setInterval(() => {
        setBreakTime(prev => {
          const breakDuration = (completedSessions % pomodoroSettings.sessionsUntilLongBreak === 0 && completedSessions > 0) 
            ? pomodoroSettings.longBreak 
            : pomodoroSettings.shortBreak;
          
          const newTime = prev + 1;
          if (newTime >= breakDuration) {
            handleCompleteBreak();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runningTask, isBreakTime, pomodoroSettings, completedSessions]);

  const handleCompleteSession = () => {
    if (runningTask) {
      onStopTimer(runningTask.id);
    }
    setCompletedSessions(prev => prev + 1);
    setIsBreakTime(true);
    setSessionTime(0);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete!', {
        body: 'Time for a break. Great work!',
        icon: '/favicon.ico'
      });
    }
  };

  const handleCompleteBreak = () => {
    setIsBreakTime(false);
    setBreakTime(0);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Break Complete!', {
        body: 'Ready to focus again?',
        icon: '/favicon.ico'
      });
    }
  };

  const handleStartFocus = () => {
    if (currentTask && !runningTask) {
      onStartTimer(currentTask.id);
      setSessionTime(0);
      setIsBreakTime(false);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const handleStopFocus = () => {
    if (runningTask) {
      onStopTimer(runningTask.id);
      setSessionTime(0);
      setIsBreakTime(false);
    }
  };

  const handleSkipBreak = () => {
    setIsBreakTime(false);
    setBreakTime(0);
  };

  const handleNextTask = () => {
    if (activeTasks.length > 1) {
      setCurrentTaskIndex((prev) => (prev + 1) % activeTasks.length);
    }
  };

  const handleCompleteTask = () => {
    if (currentTask) {
      onUpdateTask(currentTask.id, { status: 'completed' });
      if (runningTask) {
        onStopTimer(runningTask.id);
      }
      // Move to next task
      if (activeTasks.length > 1) {
        setCurrentTaskIndex(prev => prev % (activeTasks.length - 1));
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (isBreakTime) {
      const breakDuration = (completedSessions % pomodoroSettings.sessionsUntilLongBreak === 0 && completedSessions > 0) 
        ? pomodoroSettings.longBreak 
        : pomodoroSettings.shortBreak;
      return (breakTime / breakDuration) * 100;
    }
    return (sessionTime / pomodoroSettings.workDuration) * 100;
  };

  if (activeTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Tasks</h2>
          <p className="text-gray-600">Create some tasks to start your focus session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 transition-all duration-300 ${
      isMinimized ? 'p-4' : 'p-8'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Focus Mode</h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMinimized ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Current Task Display */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentTask.title}</h3>
              {currentProject && (
                <div className="flex items-center justify-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <span className="text-gray-600">{currentProject.name}</span>
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="mb-6">
              <div className={`text-6xl font-mono font-bold mb-2 ${
                isBreakTime ? 'text-green-600' : runningTask ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {isBreakTime ? formatTime(breakTime) : formatTime(sessionTime)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isBreakTime ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              <div className="text-sm text-gray-600">
                {isBreakTime ? (
                  <span>Break Time - {completedSessions % pomodoroSettings.sessionsUntilLongBreak === 0 && completedSessions > 0 ? 'Long' : 'Short'} Break</span>
                ) : (
                  <span>Focus Session {completedSessions + 1}</span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              {isBreakTime ? (
                <button
                  onClick={handleSkipBreak}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <SkipForward className="w-5 h-5" />
                  <span>Skip Break</span>
                </button>
              ) : runningTask ? (
                <button
                  onClick={handleStopFocus}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Focus</span>
                </button>
              ) : (
                <button
                  onClick={handleStartFocus}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Focus</span>
                </button>
              )}
            </div>

            {/* Task Actions */}
            {!isBreakTime && (
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleCompleteTask}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Complete Task
                </button>
                {activeTasks.length > 1 && (
                  <button
                    onClick={handleNextTask}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Next Task ({currentTaskIndex + 1}/{activeTasks.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedSessions}</div>
              <div className="text-sm text-blue-800">Sessions</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((completedSessions * pomodoroSettings.workDuration) / 60)}m
              </div>
              <div className="text-sm text-green-800">Focus Time</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{activeTasks.length}</div>
              <div className="text-sm text-purple-800">Tasks Left</div>
            </div>
          </div>
        </>
      )}

      {isMinimized && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isBreakTime ? 'bg-green-500 animate-pulse' : runningTask ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="font-medium text-gray-900">
              {isBreakTime ? 'Break' : currentTask.title}
            </span>
          </div>
          <div className="font-mono font-bold text-lg">
            {isBreakTime ? formatTime(breakTime) : formatTime(sessionTime)}
          </div>
        </div>
      )}
    </div>
  );
}