import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings }) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-400";

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSettings(form);
  };

  const toggleDarkMode = () => {
    const next = !form.darkMode;
    setForm(prev => ({ ...prev, darkMode: next }));
    updateSettings({ darkMode: next });
  };

  const updateProfile = (key: keyof AppSettings['profile'], value: string) => {
    setForm(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500">Profile, notifications, and localization.</p>
        </div>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium"
        >
          {form.darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {form.darkMode ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="settings-name">Full Name</label>
              <input
                type="text"
                required
                className={inputClass}
                id="settings-name"
                value={form.profile.name}
                onChange={e => updateProfile('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="settings-role">Role</label>
              <input
                type="text"
                className={inputClass}
                id="settings-role"
                value={form.profile.role}
                onChange={e => updateProfile('role', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="settings-email">Email</label>
              <input
                type="email"
                required
                className={inputClass}
                id="settings-email"
                value={form.profile.email}
                onChange={e => updateProfile('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="settings-phone">Phone</label>
              <input
                type="tel"
                className={inputClass}
                id="settings-phone"
                value={form.profile.phone}
                onChange={e => updateProfile('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            {([
              { key: 'notifyEmail', label: 'Email alerts' },
              { key: 'notifyPush', label: 'Push notifications' },
              { key: 'notifySms', label: 'SMS alerts' },
            ] as const).map(item => (
              <label key={item.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <span className="text-gray-800">{item.label}</span>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={e => setForm(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-gray-900 mb-2 block" htmlFor="settings-language">Language</label>
            <select
              className={inputClass}
              id="settings-language"
              value={form.language}
              onChange={e => setForm(prev => ({ ...prev, language: e.target.value }))}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-900 mb-2 block" htmlFor="settings-timezone">Timezone</label>
            <select
              className={inputClass}
              id="settings-timezone"
              value={form.timezone}
              onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
