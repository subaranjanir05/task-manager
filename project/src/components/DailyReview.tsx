import React, { useState } from 'react';
import { Calendar, TrendingUp, Target, Loader2, Sparkles } from 'lucide-react';
import { Task, Project } from '../types';
import { AIService } from '../services/aiService';

interface DailyReviewProps {
  tasks: Task[];
  projects: Project[];
}

export function DailyReview({ tasks, projects }: DailyReviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<{
    summary: string;
    achievements: string[];
    recommendations: string[];
    tomorrowFocus: string[];
  } | null>(null);

  const handleGenerateReview = async () => {
    setIsLoading(true);
    try {
      const aiService = AIService.getInstance();
      const result = await aiService.generateDailyReview(tasks, projects);
      setReview(result);
    } catch (error) {
      console.error('Failed to generate daily review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toDateString();
  const todayTasks = tasks.filter(task => 
    new Date(task.updatedAt).toDateString() === today
  );
  const completedToday = todayTasks.filter(task => task.status === 'completed');
  const totalTimeToday = todayTasks.reduce((acc, task) => acc + task.timeSpent, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Daily Review Assistant</h2>
            <p className="text-sm text-gray-600">AI-powered insights about your productivity</p>
          </div>
        </div>
        <button
          onClick={handleGenerateReview}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Review</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{completedToday.length}</div>
          <div className="text-sm text-blue-800">Tasks Completed</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Math.floor(totalTimeToday / 60)}h {totalTimeToday % 60}m
          </div>
          <div className="text-sm text-green-800">Focus Time</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{todayTasks.length}</div>
          <div className="text-sm text-purple-800">Tasks Worked On</div>
        </div>
      </div>

      {review ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Daily Summary</h3>
            <p className="text-gray-700">{review.summary}</p>
          </div>

          {/* Achievements */}
          {review.achievements.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-600" />
                Today's Achievements
              </h3>
              <div className="space-y-2">
                {review.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-700">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {review.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow's Focus */}
          {review.tomorrowFocus.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                Tomorrow's Focus
              </h3>
              <div className="space-y-2">
                {review.tomorrowFocus.map((task, index) => (
                  <div key={index} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                    <span className="text-purple-800">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Generate your daily review to get AI-powered insights about your productivity.</p>
          <div className="text-sm text-gray-400">
            <p>The review includes:</p>
            <ul className="mt-2 space-y-1">
              <li>• Summary of today's work</li>
              <li>• Key achievements</li>
              <li>• Personalized recommendations</li>
              <li>• Tomorrow's focus suggestions</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}