import React, { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  project: Project | null;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'taskCount' | 'completedTasks'>) => void;
  onClose: () => void;
  onDelete?: (projectId: string) => void;
}

const PROJECT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#6366F1', '#F43F5E', '#06B6D4'
];

export function ProjectModal({ project, onSave, onClose, onDelete }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0]
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        color: project.color
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: PROJECT_COLORS[0]
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter project name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Add project description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Palette className="w-4 h-4 inline mr-2" />
              Project Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${
                    formData.color === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {project && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(project.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete Project
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {project ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}