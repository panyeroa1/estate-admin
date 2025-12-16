export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  source: string;
  notes: string;
  lastContact: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: string;
  email: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  price: number;
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land' | 'studio' | 'loft';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  status: 'active' | 'pending' | 'sold' | 'rented';
  images?: string[];
  energyClass?: string;
  petsAllowed?: boolean;
  coordinates?: unknown;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  duration: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  method: string;
  reference?: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface AppSettings {
  profile: UserProfile;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySms: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export type ViewState = 'dashboard' | 'inbox' | 'leads' | 'properties' | 'tasks' | 'calendar' | 'finance' | 'reports' | 'settings' | 'tools';
export type UserRole = 'admin' | 'owner' | 'maintenance' | 'renter';

export interface AppContextType {
  leads: Lead[];
  messages: Message[];
  properties: Property[];
  tasks: Task[];
  events: CalendarEvent[];
  transactions: Transaction[];
  settings: AppSettings;
  activeView: ViewState;
  
  // Actions
  setActiveView: (view: ViewState) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addMessage: (msg: Omit<Message, 'id'>) => void;
  updateMessage: (id: string, msg: Partial<Message>) => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  addProperty: (prop: Omit<Property, 'id'>) => void;
  updateProperty: (id: string, prop: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  addEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}
