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

const APP_CACHE_VERSION = '1';
const APP_CACHE_VERSION_KEY = 'eburon_cache_version';
const APP_CACHE_KEYS = ['eburon_settings', 'eburon_role'];

const App: React.FC = () => {
  // --- Persistent State (now Supabase) ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [propertyTable, setPropertyTable] = useState<'listings' | 'properties'>('listings');
  
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
  const [dataReloadNonce, setDataReloadNonce] = useState(0);

  const triggerDataReload = () => setDataReloadNonce(Date.now());

  const clearAppCache = () => {
    try {
      if (typeof window !== 'undefined') {
        APP_CACHE_KEYS.forEach(key => window.localStorage.removeItem(key));
        window.localStorage.setItem(APP_CACHE_VERSION_KEY, APP_CACHE_VERSION);
      }
    } catch (err) {
      console.warn('Failed clearing app cache:', err);
    }

    // Reset app-owned cached state (Supabase auth cache is intentionally untouched).
    setSettings(defaultSettings);
    setRole('admin');
    setActiveView('dashboard');
    setSidebarOpen(false);
  };

  const normalizeUserRole = (raw: any): UserRole => {
    const value = String(raw || '').trim().toLowerCase();
    if (value === 'admin' || value === 'broker' || value === 'agent') return 'admin';
    if (value === 'owner') return 'owner';
    if (value === 'maintenance' || value === 'contractor') return 'maintenance';
    if (value === 'renter' || value === 'tenant') return 'renter';
    return 'admin';
  };

  const isMissingRelationError = (error: any): boolean => {
    const msg = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    return (
      msg.includes('relation') && msg.includes('does not exist')
    ) || (
      details.includes('relation') && details.includes('does not exist')
    );
  };

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

  // One-time cache version check: clears app caches after deployments/schema changes.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const current = window.localStorage.getItem(APP_CACHE_VERSION_KEY);
      if (current !== APP_CACHE_VERSION) {
        clearAppCache();
        triggerDataReload();
      }
    } catch (err) {
      console.warn('Failed checking app cache version:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow other views/components to request reload/reset without prop drilling.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClearCache = () => {
      clearAppCache();
      triggerDataReload();
    };

    const handleReload = () => {
      triggerDataReload();
    };

    window.addEventListener('eburon:clear-cache', handleClearCache);
    window.addEventListener('eburon:reload-data', handleReload);
    return () => {
      window.removeEventListener('eburon:clear-cache', handleClearCache);
      window.removeEventListener('eburon:reload-data', handleReload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync role/profile from DB + auth metadata so Admin/Auth reflect real database fields.
  useEffect(() => {
    if (!session) return;

    const mapDbName = (row: any, fallbackEmail?: string | null): { name?: string; email?: string } => {
      const name =
        row?.full_name ||
        row?.fullName ||
        row?.name ||
        row?.raw_user_meta_data?.full_name ||
        row?.raw_user_meta_data?.fullName;

      const email = row?.email || fallbackEmail || undefined;
      return {
        name: typeof name === 'string' && name.trim() ? name : undefined,
        email: typeof email === 'string' && email.trim() ? email : undefined,
      };
    };

    const fetchUserRow = async (table: 'user_profiles' | 'users') => {
      const userId = session.user.id;
      const userEmail = session.user.email;

      const byId = await supabase
        .from(table)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!byId.error && byId.data) return byId.data;
      if (byId.error && isMissingRelationError(byId.error)) return null;

      // Some older schemas store app users keyed by email instead of auth.users id.
      if (userEmail) {
        const byEmail = await supabase
          .from(table)
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        if (!byEmail.error && byEmail.data) return byEmail.data;
      }

      return null;
    };

    const sync = async () => {
      try {
        const metaRoleRaw = (session.user.user_metadata as any)?.role;
        const metaNameRaw = (session.user.user_metadata as any)?.full_name;

        const profileRow = await fetchUserRow('user_profiles');
        const userRow = profileRow ?? (await fetchUserRow('users'));

        const dbRoleRaw = userRow?.role;
        const nextRole = normalizeUserRole(dbRoleRaw || metaRoleRaw || role);
        setRole(nextRole);

        const { name, email } = mapDbName(userRow, session.user.email);

        setSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: name || (typeof metaNameRaw === 'string' && metaNameRaw.trim() ? metaNameRaw : prev.profile.name),
            email: email || prev.profile.email,
          },
        }));
      } catch (err) {
        console.warn('Failed to sync user profile/role:', err);
      }
    };

    sync();
    // Only re-run when the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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

    const parseSortableDate = (value: any): number => {
      if (!value) return 0;
      const ms = new Date(String(value)).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    const mapLeadRow = (row: any): Lead => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      status: row.status ?? 'new',
      source: row.source ?? '',
      notes: row.notes ?? '',
      lastContact: row.lastContact || row.lastcontact || row.last_contact || row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
      createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    });

    const mapTaskRow = (row: any): Task => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      dueDate: row.dueDate || row.duedate || row.due_date || new Date().toISOString(),
      priority: row.priority ?? 'medium',
      category: row.category ?? 'General',
      completed: Boolean(row.completed),
      completedAt: row.completedAt || row.completedat || row.completed_at,
      createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    });

    const mapEventRow = (row: any): CalendarEvent => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      date: row.date,
      startTime: row.startTime || row.starttime || row.start_time || '09:00',
      endTime: row.endTime || row.endtime || row.end_time || '10:00',
      color: row.color ?? 'blue',
      duration: row.duration ?? '30m',
      createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    });

    const mapTransactionRow = (row: any): Transaction => ({
      id: row.id,
      date: row.date,
      description: row.description,
      type: row.type,
      category: row.category ?? '',
      amount: Number(row.amount) || 0,
      method: row.method ?? '',
      reference: row.reference ?? undefined,
      createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    });

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
      energyClass: row.energy_class ?? row.energyClass,
      petsAllowed: row.pets_allowed ?? row.petsAllowed,
      coordinates: row.coordinates,
      createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    });

    const isMissingRelation = (error: any): boolean => {
      const msg = String(error?.message || '').toLowerCase();
      const details = String(error?.details || '').toLowerCase();
      return (
        msg.includes('relation') && msg.includes('does not exist')
      ) || (
        details.includes('relation') && details.includes('does not exist')
      );
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);

        const [leadsRes, messagesRes, tasksRes, eventsRes, transactionsRes] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('messages').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('events').select('*'),
          supabase.from('transactions').select('*'),
        ]);

        if (leadsRes.data) {
          const normalized = (leadsRes.data as any[]).map(mapLeadRow);
          normalized.sort((a, b) => parseSortableDate(b.createdAt) - parseSortableDate(a.createdAt));
          setLeads(normalized);
        }

        if (messagesRes.data) {
          const normalized = messagesRes.data as unknown as Message[];
          normalized.sort((a, b) => parseSortableDate(b.date) - parseSortableDate(a.date));
          setMessages(normalized);
        }

        if (tasksRes.data) {
          const normalized = (tasksRes.data as any[]).map(mapTaskRow);
          normalized.sort((a, b) => parseSortableDate(b.createdAt) - parseSortableDate(a.createdAt));
          setTasks(normalized);
        }

        if (eventsRes.data) {
          const normalized = (eventsRes.data as any[]).map(mapEventRow);
          normalized.sort((a, b) => {
            const aKey = parseSortableDate(`${a.date} ${a.startTime}`);
            const bKey = parseSortableDate(`${b.date} ${b.startTime}`);
            return aKey - bKey;
          });
          setEvents(normalized);
        }

        if (transactionsRes.data) {
          const normalized = (transactionsRes.data as any[]).map(mapTransactionRow);
          normalized.sort((a, b) => parseSortableDate(b.date) - parseSortableDate(a.date));
          setTransactions(normalized);
        }

        // Properties: prefer listings; fall back to legacy properties if listings is missing or empty.
        const listingsRes = await supabase.from('listings').select('*');
        if (!listingsRes.error && listingsRes.data && listingsRes.data.length > 0) {
          setPropertyTable('listings');
          setProperties((listingsRes.data as any[]).map(mapListingToProperty));
        } else {
          const legacyRes = await supabase.from('properties').select('*');
          if (!legacyRes.error && legacyRes.data && legacyRes.data.length > 0) {
            setPropertyTable('properties');
            setProperties((legacyRes.data as any[]).map(mapListingToProperty));
          } else if (!listingsRes.error && listingsRes.data) {
            // listings exists but is empty
            setPropertyTable('listings');
            setProperties([]);
          } else if (isMissingRelation(listingsRes.error) && !legacyRes.error && legacyRes.data) {
            // listings table doesn't exist, but legacy does
            setPropertyTable('properties');
            setProperties((legacyRes.data as any[]).map(mapListingToProperty));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [session, sessionLoading, dataReloadNonce]);

  // --- Actions ---
  // Note: We use the returned data from Supabase to ensure we have the real ID and formatted fields

  const isSchemaCacheColumnError = (error: any): boolean => {
    const msg = String(error?.message || '').toLowerCase();
    return (
      (msg.includes('schema cache') && msg.includes('could not find')) ||
      (msg.includes('column') && msg.includes('does not exist')) ||
      (msg.includes('could not find') && msg.includes('column'))
    );
  };

  const insertWithFallback = async <T,>(
    table: string,
    primary: Record<string, any>,
    fallback: Record<string, any>,
  ): Promise<{ data: T | null; error: any | null }> => {
    const first = await supabase.from(table).insert(primary).select().single();
    if (!first.error) return { data: first.data as T, error: null };
    if (!isSchemaCacheColumnError(first.error)) return { data: null, error: first.error };
    const second = await supabase.from(table).insert(fallback).select().single();
    return { data: (second.data as T) ?? null, error: second.error };
  };

  const updateWithFallback = async (
    table: string,
    id: string,
    primary: Record<string, any>,
    fallback: Record<string, any>,
  ): Promise<{ error: any | null }> => {
    const first = await supabase.from(table).update(primary).eq('id', id);
    if (!first.error) return { error: null };
    if (!isSchemaCacheColumnError(first.error)) return { error: first.error };
    const second = await supabase.from(table).update(fallback).eq('id', id);
    return { error: second.error };
  };

  const mapLeadRow = (row: any): Lead => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    status: row.status ?? 'new',
    source: row.source ?? '',
    notes: row.notes ?? '',
    lastContact: row.lastContact || row.lastcontact || row.last_contact || row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
    createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
  });

  const mapTaskRow = (row: any): Task => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.dueDate || row.duedate || row.due_date || new Date().toISOString(),
    priority: row.priority ?? 'medium',
    category: row.category ?? 'General',
    completed: Boolean(row.completed),
    completedAt: row.completedAt || row.completedat || row.completed_at,
    createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
  });

  const mapEventRow = (row: any): CalendarEvent => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: row.date,
    startTime: row.startTime || row.starttime || row.start_time || '09:00',
    endTime: row.endTime || row.endtime || row.end_time || '10:00',
    color: row.color ?? 'blue',
    duration: row.duration ?? '30m',
    createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
  });

  const mapTransactionRow = (row: any): Transaction => ({
    id: row.id,
    date: row.date,
    description: row.description,
    type: row.type,
    category: row.category ?? '',
    amount: Number(row.amount) || 0,
    method: row.method ?? '',
    reference: row.reference ?? undefined,
    createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
  });

  const addLead = async (data: Omit<Lead, 'id'>) => {
    const snake = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: data.status,
      source: data.source,
      notes: data.notes,
      lastcontact: data.lastContact,
      createdat: data.createdAt,
    };
    const camel = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: data.status,
      source: data.source,
      notes: data.notes,
      lastContact: data.lastContact,
      createdAt: data.createdAt,
    };
    const { data: newLead, error } = await insertWithFallback<any>('leads', snake, camel);
    if (newLead && !error) setLeads(prev => [mapLeadRow(newLead), ...prev]);
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const snake: any = {};
    const camel: any = {};
    if (data.name !== undefined) { snake.name = data.name; camel.name = data.name; }
    if (data.email !== undefined) { snake.email = data.email; camel.email = data.email; }
    if (data.phone !== undefined) { snake.phone = data.phone; camel.phone = data.phone; }
    if (data.status !== undefined) { snake.status = data.status; camel.status = data.status; }
    if (data.source !== undefined) { snake.source = data.source; camel.source = data.source; }
    if (data.notes !== undefined) { snake.notes = data.notes; camel.notes = data.notes; }
    if (data.lastContact !== undefined) { snake.lastcontact = data.lastContact; camel.lastContact = data.lastContact; }
    if (data.createdAt !== undefined) { snake.createdat = data.createdAt; camel.createdAt = data.createdAt; }

    const { error } = await updateWithFallback('leads', id, snake, camel);
    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addProperty = async (data: Omit<Property, 'id'>) => {
    if (propertyTable === 'properties') {
      const legacyPayload = {
        name: data.name,
        address: data.address,
        price: data.price,
        type: data.type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size,
        status: data.status,
        images: data.images || [],
        createdat: data.createdAt || new Date().toISOString(),
      };
      const { data: newProp, error } = await supabase.from('properties').insert(legacyPayload).select().single();
      if (newProp && !error) setProperties(prev => [mapListingToProperty(newProp), ...prev]);
      return;
    }

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
      created_at: data.createdAt || new Date().toISOString(),
    };
    const { data: newProp, error } = await supabase.from('listings').insert(listingPayload).select().single();
    if (newProp && !error) setProperties(prev => [mapListingToProperty(newProp), ...prev]);
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    if (propertyTable === 'properties') {
      const legacyPayload: any = {
        name: data.name,
        address: data.address,
        price: data.price,
        type: data.type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size,
        status: data.status,
        images: data.images,
      };
      const { error } = await supabase.from('properties').update(legacyPayload).eq('id', id);
      if (!error) setProperties(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      return;
    }

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
      coordinates: data.coordinates,
    };
    const { error } = await supabase.from('listings').update(listingPayload).eq('id', id);
    if (!error) setProperties(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase.from(propertyTable).delete().eq('id', id);
    if (!error) setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addTask = async (data: Omit<Task, 'id'>) => {
    const snake = {
      title: data.title,
      description: data.description,
      duedate: data.dueDate,
      priority: data.priority,
      category: data.category,
      completed: data.completed,
      completedat: data.completedAt,
      createdat: data.createdAt,
    };
    const camel = {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      category: data.category,
      completed: data.completed,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
    };
    const { data: newTask, error } = await insertWithFallback<any>('tasks', snake, camel);
    if (newTask && !error) setTasks(prev => [mapTaskRow(newTask), ...prev]);
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updates: Partial<Task> = { 
      completed: !task.completed, 
      completedAt: !task.completed ? new Date().toISOString() : undefined 
    };
    
    const snake = {
      completed: updates.completed,
      completedat: updates.completedAt,
    };
    const camel = {
      completed: updates.completed,
      completedAt: updates.completedAt,
    };
    const { error } = await updateWithFallback('tasks', id, snake, camel);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addEvent = async (data: Omit<CalendarEvent, 'id'>) => {
    const snake = {
      title: data.title,
      description: data.description,
      date: data.date,
      starttime: data.startTime,
      endtime: data.endTime,
      color: data.color,
      duration: data.duration,
      createdat: data.createdAt,
    };
    const camel = {
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      color: data.color,
      duration: data.duration,
      createdAt: data.createdAt,
    };
    const { data: newEvent, error } = await insertWithFallback<any>('events', snake, camel);
    if (newEvent && !error) setEvents(prev => [...prev, mapEventRow(newEvent)]);
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    const snake = {
      date: data.date,
      description: data.description,
      type: data.type,
      category: data.category,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      createdat: data.createdAt,
    };
    const camel = {
      date: data.date,
      description: data.description,
      type: data.type,
      category: data.category,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      createdAt: data.createdAt,
    };
    const { data: newTx, error } = await insertWithFallback<any>('transactions', snake, camel);
    if (newTx && !error) setTransactions(prev => [mapTransactionRow(newTx), ...prev]);
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
    energyClass: row.energy_class ?? row.energyClass,
    petsAllowed: row.pets_allowed ?? row.petsAllowed,
    coordinates: row.coordinates,
    createdAt: row.createdAt || row.createdat || row.created_at || new Date().toISOString(),
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
