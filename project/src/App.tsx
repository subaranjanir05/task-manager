import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AIService } from './services/aiService';
import { Task, Project } from './types';
import { LogIn } from 'lucide-react';

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Personal',
    color: '#3B82F6',
    description: 'Personal tasks and activities',
    createdAt: new Date().toISOString(),
    taskCount: 0,
    completedTasks: 0
  },
  {
    id: '2',
    name: 'Work',
    color: '#8B5CF6',
    description: 'Work-related tasks and projects',
    createdAt: new Date().toISOString(),
    taskCount: 0,
    completedTasks: 0
  }
];

function AppContent() {
  const { user, token, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Data storage
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('taskflow-projects', INITIAL_PROJECTS);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Timer states
  const [timerTimes, setTimerTimes] = useState<Record<string, number>>({});

  // Set AI service token when user logs in
  useEffect(() => {
    const aiService = AIService.getInstance();
    aiService.setToken(token);
  }, [token]);

  // Update timer times for running tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const runningTasks = tasks.filter(task => task.isTimerRunning);
      if (runningTasks.length > 0) {
        setTimerTimes(prev => {
          const updated = { ...prev };
          runningTasks.forEach(task => {
            if (task.timerStartTime) {
              updated[task.id] = Date.now() - task.timerStartTime;
            }
          });
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Update project stats
  useEffect(() => {
    const updatedProjects = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      
      return {
        ...project,
        taskCount: projectTasks.length,
        completedTasks
      };
    });

    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
      setProjects(updatedProjects);
    }
  }, [tasks, projects, setProjects]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading TaskFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              TaskFlow
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              AI-Powered Time & Task Manager
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
        
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  // Task operations
  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTask(taskId, { 
      status: newStatus,
      isTimerRunning: newStatus === 'completed' ? false : task.isTimerRunning
    });
  };

  const startTimer = (taskId: string) => {
    // Stop all other running timers
    tasks.forEach(task => {
      if (task.isTimerRunning && task.id !== taskId) {
        const timeElapsed = task.timerStartTime ? Date.now() - task.timerStartTime : 0;
        updateTask(task.id, {
          isTimerRunning: false,
          timerStartTime: null,
          timeSpent: task.timeSpent + Math.floor(timeElapsed / 60000)
        });
      }
    });

    updateTask(taskId, {
      isTimerRunning: true,
      timerStartTime: Date.now(),
      status: 'in-progress'
    });
    setTimerTimes(prev => ({ ...prev, [taskId]: 0 }));
  };

  const stopTimer = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timerStartTime) return;

    const timeElapsed = Date.now() - task.timerStartTime;
    const minutesElapsed = Math.floor(timeElapsed / 60000);

    updateTask(taskId, {
      isTimerRunning: false,
      timerStartTime: null,
      timeSpent: task.timeSpent + minutesElapsed
    });
    setTimerTimes(prev => ({ ...prev, [taskId]: 0 }));
  };

  // Project operations
  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'taskCount' | 'completedTasks'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    ));
  };

  const deleteProject = (projectId: string) => {
    // Move tasks to the first available project
    const remainingProjects = projects.filter(p => p.id !== projectId);
    if (remainingProjects.length > 0) {
      const targetProjectId = remainingProjects[0].id;
      setTasks(prev => prev.map(task => 
        task.projectId === projectId 
          ? { ...task, projectId: targetProjectId }
          : task
      ));
    }
    setProjects(prev => prev.filter(project => project.id !== projectId));
    if (selectedProject === projectId) {
      setSelectedProject(null);
    }
  };

  // Settings operations
  const handleImportData = (data: { tasks: Task[], projects: Project[] }) => {
    setTasks(data.tasks);
    setProjects(data.projects);
  };

  const handleClearAllData = () => {
    setTasks([]);
    setProjects(INITIAL_PROJECTS);
    setSelectedProject(null);
  };

  // Modal handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      createTask(taskData);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'taskCount' | 'completedTasks'>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      createProject(projectData);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            projects={projects}
            onCreateTask={handleCreateTask}
            onToggleTaskStatus={toggleTaskStatus}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onEditTask={handleEditTask}
            timerTimes={timerTimes}
          />
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            projects={projects}
            selectedProject={selectedProject}
            onCreateTask={handleCreateTask}
            onToggleTaskStatus={toggleTaskStatus}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onEditTask={handleEditTask}
            timerTimes={timerTimes}
          />
        );
      case 'timer':
        return (
          <Timer
            tasks={tasks}
            projects={projects}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onUpdateTask={updateTask}
            timerTimes={timerTimes}
          />
        );
      case 'analytics':
        return (
          <Analytics
            tasks={tasks}
            projects={projects}
          />
        );
      case 'settings':
        return (
          <Settings
            tasks={tasks}
            projects={projects}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
          />
        );
      default:
        return (
          <div className="p-6 flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon</h2>
              <p className="text-gray-600 dark:text-gray-400">This feature is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        projects={projects}
        onCreateProject={handleCreateProject}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />
      
      <div className="flex-1 overflow-auto">
        {renderCurrentView()}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          projects={projects}
          onSave={handleSaveTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onDelete={editingTask ? deleteTask : undefined}
        />
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <ProjectModal
          project={editingProject}
          onSave={handleSaveProject}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onDelete={editingProject ? deleteProject : undefined}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;