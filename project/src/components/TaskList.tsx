import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, SortAsc } from 'lucide-react';
import { Task, Project } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  selectedProject: string | null;
  onCreateTask: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  timerTimes: Record<string, number>;
}

export function TaskList({
  tasks,
  projects,
  selectedProject,
  onCreateTask,
  onToggleTaskStatus,
  onStartTimer,
  onStopTimer,
  onEditTask,
  timerTimes
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = selectedProject ? task.projectId === selectedProject : true;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [tasks, searchTerm, selectedProject, statusFilter, priorityFilter, sortBy]);

  const projectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.name 
    : 'All Projects';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {projectName} • {filteredAndSortedTasks.length} tasks
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

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredAndSortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedTasks.map((task) => {
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
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters or search term'
              : 'Create your first task to get started'
            }
          </p>
          <button
            onClick={onCreateTask}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      )}
    </div>
  );
}