export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  timeSpent: number; // in minutes
  isTimerRunning: boolean;
  timerStartTime: number | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  taskCount: number;
  completedTasks: number;
}

export interface TimerSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in minutes
}