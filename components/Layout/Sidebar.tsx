import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  Home, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  BarChart2, 
  Settings,
  Wrench,
  X
} from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
  activeView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  badges: {
    inbox: number;
    leads: number;
    properties: number;
    tasks: number;
    calendar: number;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, isOpen, onClose, badges }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: badges.inbox },
  ];

  const businessItems = [
    { id: 'leads', label: 'Leads', icon: Users, badge: badges.leads },
    { id: 'properties', label: 'Properties', icon: Home, badge: badges.properties },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: badges.tasks },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: badges.calendar },
  ];

  const managementItems = [
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'tools', label: 'Tools', icon: Wrench, badge: 0 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item }: { item: any }) => (
    <div 
      onClick={() => {
        onChangeView(item.id as ViewState);
        if (window.innerWidth < 1024) onClose();
      }}
      className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-all duration-200 border-l-4 ${
        activeView === item.id 
          ? 'bg-gray-100 text-gray-900 border-gray-900 font-semibold' 
          : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <item.icon size={20} />
        <span className="text-sm">{item.label}</span>
      </div>
      {item.badge > 0 && (
        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[20px] rounded-full flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[260px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold text-lg">
              E
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">
              Eburon
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {menuItems.map(item => <NavItem key={item.id} item={item} />)}

          <div className="px-6 pt-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Business
          </div>
          {businessItems.map(item => <NavItem key={item.id} item={item} />)}

          <div className="px-6 pt-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Management
          </div>
          {managementItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
