import React from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Clock, 
  BarChart3, 
  Settings,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  projects: Project[];
  onCreateProject: () => void;
  selectedProject: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export function Sidebar({ 
  currentView, 
  onViewChange, 
  projects, 
  onCreateProject,
  selectedProject,
  onSelectProject 
}: SidebarProps) {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'All Tasks', icon: FolderOpen },
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <p className="text-sm text-gray-500 mt-1">Time & Task Manager</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
          <button
            onClick={onCreateProject}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
              selectedProject === null
                ? 'bg-gray-50 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Projects
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 group ${
                selectedProject === project.id
                  ? 'bg-gray-50 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate flex-1">{project.name}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}