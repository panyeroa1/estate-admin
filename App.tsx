import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, User, Plus, LogOut } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import Modal from './components/UI/Modal';
import CallWidget from './components/UI/CallWidget';
import { useLocalStorage } from './hooks/useLocalStorage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { 
  Lead, Message, Property, Task, CalendarEvent, Transaction, AppSettings, ViewState, UserRole 
} from './types';

// Views
import DashboardView from './views/DashboardView';
import InboxView from './views/InboxView';
import LeadsView from './views/LeadsView';
import PropertiesView from './views/PropertiesView';
import TasksView from './views/TasksView';
import CalendarView from './views/CalendarView';
import FinanceView from './views/FinanceView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import ToolsView from './views/ToolsView';
import { AuthView } from './components/Auth/AuthView';

// Default Settings
const defaultSettings: AppSettings = {
  profile: {
    name: 'Laurent De Wilde',
    email: 'laurent@eburon.com',
    phone: '+1 (555) 123-4567',
    role: 'Broker'
  },
  notifyEmail: true,
  notifyPush: true,
  notifySms: false,
  darkMode: false,
  language: 'en',
  timezone: 'UTC'
};

const App: React.FC = () => {
  // --- Persistent State (now Supabase) ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Keep settings local for now
  const [settings, setSettings] = useLocalStorage<AppSettings>('eburon_settings', defaultSettings);

  // --- UI State ---
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [role, setRole] = useLocalStorage<UserRole>('eburon_role', 'admin');

  // Auth session listener
  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) setSession(data.session);
      setSessionLoading(false);
    };
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Sync dark mode class to document root/body for Tailwind
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (settings.darkMode) {
      root.classList.add('dark');
      body.classList.add('bg-gray-900', 'text-gray-50');
      body.classList.remove('bg-gray-50', 'text-gray-900');
    } else {
      root.classList.remove('dark');
      body.classList.add('bg-gray-50', 'text-gray-900');
      body.classList.remove('bg-gray-900', 'text-gray-50');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    const roleLabelMap: Record<UserRole, string> = {
      admin: 'Broker / Agent',
      owner: 'Property Owner',
      maintenance: 'Maintenance',
      renter: 'Renter',
    };
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, role: roleLabelMap[role] },
    }));
  }, [role, setSettings]);

  // Fetch initial data
  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [
          { data: leadsData },
          { data: messagesData },
          { data: propertiesData },
          { data: tasksData },
          { data: eventsData },
          { data: transactionsData }
        ] = await Promise.all([
          supabase.from('leads').select('*').order('createdAt', { ascending: false }),
          supabase.from('messages').select('*').order('date', { ascending: false }),
          supabase.from('listings').select('*').order('created_at', { ascending: false }),
          supabase.from('tasks').select('*').order('createdAt', { ascending: false }),
          supabase.from('events').select('*').order('date', { ascending: true }),
          supabase.from('transactions').select('*').order('date', { ascending: false })
        ]);

        if (leadsData) setLeads(leadsData as unknown as Lead[]);
        if (messagesData) setMessages(messagesData as unknown as Message[]);
        if (propertiesData) setProperties((propertiesData as unknown as any[]).map(mapListingToProperty));
        if (tasksData) setTasks(tasksData as unknown as Task[]);
        if (eventsData) setEvents(eventsData as unknown as CalendarEvent[]);
        if (transactionsData) setTransactions(transactionsData as unknown as Transaction[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [session, sessionLoading]);

  // --- Actions ---
  // Note: We use the returned data from Supabase to ensure we have the real ID and formatted fields

  const addLead = async (data: Omit<Lead, 'id'>) => {
    const { data: newLead, error } = await supabase.from('leads').insert(data).select().single();
    if (newLead && !error) setLeads(prev => [newLead as unknown as Lead, ...prev]);
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const { error } = await supabase.from('leads').update(data).eq('id', id);
    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addProperty = async (data: Omit<Property, 'id'>) => {
    const listingPayload = {
      name: data.name,
      address: data.address,
      price: data.price,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      status: data.status,
      image_urls: data.images || [],
      energy_class: data.energyClass,
      pets_allowed: data.petsAllowed ?? false,
      coordinates: data.coordinates,
      created_at: data.createdAt || new Date().toISOString()
    };
    const { data: newProp, error } = await supabase.from('listings').insert(listingPayload).select().single();
    if (newProp && !error) setProperties(prev => [mapListingToProperty(newProp), ...prev]);
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    const listingPayload = {
      name: data.name,
      address: data.address,
      price: data.price,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      status: data.status,
      image_urls: data.images,
      energy_class: data.energyClass,
      pets_allowed: data.petsAllowed,
      coordinates: data.coordinates
    };
    const { error } = await supabase.from('listings').update(listingPayload).eq('id', id);
    if (!error) setProperties(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addTask = async (data: Omit<Task, 'id'>) => {
    const { data: newTask, error } = await supabase.from('tasks').insert(data).select().single();
    if (newTask && !error) setTasks(prev => [newTask as unknown as Task, ...prev]);
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updates: Partial<Task> = { 
      completed: !task.completed, 
      completedAt: !task.completed ? new Date().toISOString() : undefined 
    };
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addEvent = async (data: Omit<CalendarEvent, 'id'>) => {
    const { data: newEvent, error } = await supabase.from('events').insert(data).select().single();
    if (newEvent && !error) setEvents(prev => [...prev, newEvent as unknown as CalendarEvent]);
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    const { data: newTx, error } = await supabase.from('transactions').insert(data).select().single();
    if (newTx && !error) setTransactions(prev => [newTx as unknown as Transaction, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addMessage = async (data: Omit<Message, 'id'>) => {
    const { data: newMsg, error } = await supabase.from('messages').insert(data).select().single();
    if (newMsg && !error) setMessages(prev => [newMsg as unknown as Message, ...prev]);
  };

  const updateMessage = async (id: string, data: Partial<Message>) => {
    const { error } = await supabase.from('messages').update(data).eq('id', id);
    if (!error) setMessages(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const markMessageRead = async (id: string) => {
    const { error } = await supabase.from('messages').update({ read: true }).eq('id', id);
    if (!error) setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) setMessages(prev => prev.filter(m => m.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...newSettings }));

  const mapListingToProperty = (row: any): Property => ({
    id: row.id,
    name: row.name,
    address: row.address,
    price: Number(row.price) || 0,
    type: row.type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    size: row.size,
    status: row.status || 'active',
    images: row.images || row.image_urls || [],
    energyClass: row.energy_class,
    petsAllowed: row.pets_allowed,
    coordinates: row.coordinates,
    createdAt: row.createdAt || row.created_at || new Date().toISOString()
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Role based views
  const roleViews: Record<UserRole, ViewState[]> = {
    admin: ['dashboard', 'inbox', 'leads', 'properties', 'tasks', 'calendar', 'finance', 'reports', 'settings', 'tools'],
    owner: ['dashboard', 'properties', 'finance', 'inbox', 'tasks', 'calendar', 'reports', 'settings'],
    maintenance: ['dashboard', 'tasks', 'calendar', 'inbox', 'settings'],
    renter: ['dashboard', 'properties', 'calendar', 'inbox', 'settings'],
  };

  useEffect(() => {
    if (!roleViews[role].includes(activeView)) {
      setActiveView(roleViews[role][0]);
    }
  }, [role, activeView]);

  // --- Render Helpers ---
  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const props = {
      leads, messages, properties, tasks, events, transactions, settings,
      addLead, updateLead, deleteLead,
      addProperty, updateProperty, deleteProperty,
      addTask, toggleTaskComplete, deleteTask,
      addEvent, deleteEvent,
      addTransaction, deleteTransaction,
      addMessage, updateMessage, markMessageRead, deleteMessage,
      updateSettings
    };

    switch (activeView) {
      case 'dashboard': return <DashboardView {...props} setActiveView={setActiveView} />;
      case 'inbox': return <InboxView {...props} />;
      case 'leads': return <LeadsView {...props} />;
      case 'properties': return <PropertiesView {...props} />;
      case 'tasks': return <TasksView {...props} />;
      case 'calendar': return <CalendarView {...props} />;
      case 'finance': return <FinanceView {...props} />;
      case 'reports': return <ReportsView {...props} />;
      case 'settings': return <SettingsView {...props} />;
      case 'tools': return <ToolsView />;
      default: return <DashboardView {...props} setActiveView={setActiveView} />;
    }
  };

  const pageTitle = activeView.charAt(0).toUpperCase() + activeView.slice(1);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthView selectedRole={role} onRoleSelect={setRole} />;
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${settings.darkMode ? 'dark' : ''}`}>
      <Sidebar 
        activeView={activeView} 
        onChangeView={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        badges={{
          inbox: messages.filter(m => !m.read).length,
          leads: leads.length,
          properties: properties.length,
          tasks: tasks.filter(t => !t.completed).length,
          calendar: events.filter(e => new Date(e.date) >= new Date()).length
        }}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-[260px] transition-all duration-300">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              type="button"
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">{pageTitle}</h1>
              <p className="hidden md:block text-sm text-gray-500">Welcome back, {settings.profile.name.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-lg group">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition active:scale-95"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Sign out</span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 cursor-pointer" onClick={() => setActiveView('settings')}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-white shadow-sm flex items-center justify-center text-emerald-700 font-semibold text-sm">
                {settings.profile.name.split(' ').map(n => n[0]).join('').substring(0,2)}
              </div>
              <div className="hidden lg:block text-right">
                <div className="text-sm font-semibold text-gray-900">{settings.profile.name}</div>
                <div className="text-xs text-gray-500">{settings.profile.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </div>
      </main>
      
      {/* Floating Call Widget */}
      <CallWidget />
    </div>
  );
};

export default App;
