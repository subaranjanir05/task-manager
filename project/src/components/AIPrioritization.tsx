import React, { useState } from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Task, Project } from '../types';
import { AIService } from '../services/aiService';

interface AIPrioritizationProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function AIPrioritization({ tasks, projects, onUpdateTask }: AIPrioritizationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    taskId: string;
    suggestedPriority: 'low' | 'medium' | 'high';
    reason: string;
    confidence: number;
  }>>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const aiService = AIService.getInstance();
      const result = await aiService.suggestPrioritization(tasks, projects);
      setSuggestions(result.suggestions);
      setInsights(result.insights);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (taskId: string, suggestedPriority: 'low' | 'medium' | 'high') => {
    onUpdateTask(taskId, { priority: suggestedPriority });
    setAppliedSuggestions(prev => new Set([...prev, taskId]));
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Prioritization Assistant</h2>
            <p className="text-sm text-gray-600">Get intelligent suggestions based on deadlines, importance, and patterns</p>
          </div>
        </div>
        <button
          onClick={handleGetSuggestions}
          disabled={isLoading || tasks.length === 0}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span>Get AI Suggestions</span>
            </>
          )}
        </button>
      </div>

      {insights.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            AI Insights
          </h3>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Priority Suggestions</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const task = tasks.find(t => t.id === suggestion.taskId);
              const isApplied = appliedSuggestions.has(suggestion.taskId);
              const isDifferent = task && task.priority !== suggestion.suggestedPriority;
              
              if (!task || !isDifferent) return null;

              return (
                <div key={suggestion.taskId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            Current: {task.priority}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.suggestedPriority)}`}>
                            Suggested: {suggestion.suggestedPriority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {Math.round(suggestion.confidence)}% confidence
                        </span>
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {isApplied ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplySuggestion(suggestion.taskId, suggestion.suggestedPriority)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {suggestions.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Click "Get AI Suggestions" to analyze your tasks and receive intelligent prioritization recommendations.</p>
          <div className="text-sm text-gray-400">
            <p>AI considers:</p>
            <ul className="mt-2 space-y-1">
              <li>• Deadline urgency</li>
              <li>• Time already invested</li>
              <li>• Current task status</li>
              <li>• Project completion rates</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}