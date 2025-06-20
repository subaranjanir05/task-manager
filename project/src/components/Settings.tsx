import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Download, 
  Upload,
  Trash2,
  Save,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Task, Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
  tasks: Task[];
  projects: Project[];
  onImportData: (data: { tasks: Task[], projects: Project[] }) => void;
  onClearAllData: () => void;
}

export function Settings({ tasks, projects, onImportData, onClearAllData }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    autoSave: true,
    pomodoroTimer: 25,
    shortBreak: 5,
    longBreak: 15,
    dailyGoal: 8
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setSettings({
        notifications: user.preferences.notifications,
        soundEnabled: true,
        autoSave: true,
        pomodoroTimer: user.preferences.pomodoroSettings.workDuration,
        shortBreak: user.preferences.pomodoroSettings.shortBreak,
        longBreak: user.preferences.pomodoroSettings.longBreak,
        dailyGoal: 8
      });
      setProfileData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Download }
  ];

  const handleExportData = () => {
    const data = {
      tasks,
      projects,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.tasks && data.projects) {
          onImportData({ tasks: data.tasks, projects: data.projects });
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format. Please select a valid TaskFlow backup file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      onClearAllData();
      alert('All data has been cleared.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: profileData.name,
        preferences: {
          ...user!.preferences,
          notifications: settings.notifications,
          pomodoroSettings: {
            workDuration: settings.pomodoroTimer,
            shortBreak: settings.shortBreak,
            longBreak: settings.longBreak,
            sessionsUntilLongBreak: 4
          }
        }
      });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timer Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pomodoro Timer (minutes)
            </label>
            <input
              type="number"
              value={settings.pomodoroTimer}
              onChange={(e) => setSettings({ ...settings, pomodoroTimer: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max="60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Break (minutes)
            </label>
            <input
              type="number"
              value={settings.shortBreak}
              onChange={(e) => setSettings({ ...settings, shortBreak: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Long Break (minutes)
            </label>
            <input
              type="number"
              value={settings.longBreak}
              onChange={(e) => setSettings({ ...settings, longBreak: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max="60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Goal (hours)
            </label>
            <input
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max="24"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-save</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoSave ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sound Effects</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for timer and notifications</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Sun className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Monitor className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Scheme</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'Blue', color: '#3B82F6' },
            { name: 'Purple', color: '#8B5CF6' },
            { name: 'Green', color: '#10B981' },
            { name: 'Orange', color: '#F59E0B' },
            { name: 'Red', color: '#EF4444' },
            { name: 'Pink', color: '#EC4899' },
            { name: 'Teal', color: '#14B8A6' },
            { name: 'Indigo', color: '#6366F1' }
          ].map((scheme) => (
            <button
              key={scheme.name}
              className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              style={{ backgroundColor: scheme.color + '20' }}
            >
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-2"
                style={{ backgroundColor: scheme.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Notifications</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for tasks and timers</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notification Types</h4>
            <div className="space-y-3">
              {[
                { id: 'task-due', label: 'Task Due Reminders', description: 'Get notified when tasks are due' },
                { id: 'timer-complete', label: 'Timer Completion', description: 'Alert when timer sessions end' },
                { id: 'daily-summary', label: 'Daily Summary', description: 'Daily productivity summary' },
                { id: 'goal-achieved', label: 'Goal Achievements', description: 'Celebrate when you reach goals' }
              ].map((notification) => (
                <div key={notification.id} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">{notification.label}</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                  </div>
                  <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download all your tasks and projects as a JSON file for backup or transfer.
            </p>
            <button
              onClick={handleExportData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Import Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Import tasks and projects from a previously exported JSON file.
            </p>
            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 cursor-pointer inline-flex">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-medium text-red-900 dark:text-red-400 mb-2">Clear All Data</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Permanently delete all tasks, projects, and settings. This action cannot be undone.
            </p>
            <button
              onClick={handleClearData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Information</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
              <div className="font-medium text-gray-900 dark:text-white">{tasks.length}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Projects:</span>
              <div className="font-medium text-gray-900 dark:text-white">{projects.length}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Data Size:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(JSON.stringify({ tasks, projects }).length / 1024)} KB
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
              <div className="font-medium text-gray-900 dark:text-white capitalize">{user?.subscription.plan}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your TaskFlow experience</p>
        </div>
        <button
          onClick={handleSaveProfile}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'data' && renderDataSettings()}
        </div>
      </div>
    </div>
  );
}