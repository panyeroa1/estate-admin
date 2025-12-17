import React from 'react';
import { CheckCircle2, Wand2, Cloud, MapPin, CalendarRange, FolderGit2, ShieldCheck } from 'lucide-react';

const services = [
  {
    name: 'Google Calendar',
    description: 'Two-way sync for events, reminders, and tour slots.',
    accent: 'from-blue-500 to-indigo-500',
    icon: CalendarRange,
  },
  {
    name: 'Google Drive',
    description: 'Listing photos, contracts, and disclosures auto-organized.',
    accent: 'from-emerald-500 to-teal-500',
    icon: Cloud,
  },
  {
    name: 'Google Maps',
    description: 'Deep links for directions and neighborhood insights.',
    accent: 'from-amber-500 to-orange-500',
    icon: MapPin,
  },
  {
    name: 'Google Workspace',
    description: 'Gmail templates and shared Team Drives for your brokerage.',
    accent: 'from-purple-500 to-fuchsia-500',
    icon: FolderGit2,
  },
];

const ToolsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 text-white text-xs shadow-sm">
            <ShieldCheck size={14} /> Google services activated via Supabase OAuth
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-3">Tools & Integrations</h2>
          <p className="text-gray-500">Smooth, haptic-like interactions with your connected Google stack.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-150 active:scale-95">Open Console</button>
          <button
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-150 active:scale-95"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('eburon:clear-cache'));
              }
            }}
          >
            Sync Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div
            key={service.name}
            className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
          >
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${service.accent}`} />
            <div className="relative p-5 flex gap-4 items-start">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${service.accent} text-white shadow-sm`}> 
                <service.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <CheckCircle2 size={14} /> Connected
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                <div className="mt-3 flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Live</span>
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">OAuth</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">Auto-sync</span>
                </div>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors active:scale-95">Manage</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200 active:scale-[0.99]">
          <div className="p-3 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-sm">
            <Wand2 size={22} />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Automation Recipes</h4>
            <p className="text-sm text-gray-600">Send Gmail follow-ups, create calendar invites, and drop files into Drive when a lead converts.</p>
          </div>
          <button className="ml-auto px-3 py-2 bg-gray-900 text-white rounded-lg text-sm shadow hover:shadow-lg transition-all duration-150 active:scale-95">View Recipes</button>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition-all duration-200 active:scale-[0.99]">
          <p className="text-sm text-gray-500">Status</p>
          <div className="mt-2 flex items-center gap-2 text-emerald-600 font-semibold">
            <CheckCircle2 size={18} /> All Google services synced
          </div>
          <p className="text-xs text-gray-500 mt-1">Last sync a few moments ago</p>
        </div>
      </div>
    </div>
  );
};

export default ToolsView;
