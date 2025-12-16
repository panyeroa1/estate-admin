import React from 'react';
import { 
  Euro, TrendingUp, TrendingDown, ClipboardList, Mail, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Lead, Task, Message, Transaction, ViewState } from '../types';

interface DashboardProps {
  leads: Lead[];
  tasks: Task[];
  messages: Message[];
  transactions: Transaction[];
  setActiveView: (view: ViewState) => void;
}

const DashboardView: React.FC<DashboardProps> = ({ leads, tasks, messages, transactions, setActiveView }) => {
  // --- Derived Data ---
  const income = transactions.filter(t => t.type === 'income');
  const totalRevenue = income.reduce((acc, t) => acc + t.amount, 0);
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const unreadMessagesCount = messages.filter(m => !m.read).length;

  // Mock chart data structure based on transactions or empty
  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
    { name: 'Aug', revenue: 4200 },
    { name: 'Sep', revenue: 5100 },
    { name: 'Oct', revenue: 4800 },
    { name: 'Nov', revenue: 5400 },
    { name: 'Dec', revenue: 6000 },
  ];

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass}`} />
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass.replace('from-', 'bg-').replace('to-', '').split(' ')[0]} bg-opacity-10 text-gray-700`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className="text-emerald-500 flex items-center font-medium">
          {subtext}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Real-time insights and performance metrics.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
             Export Report
           </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`€${(totalRevenue / 1000).toFixed(1)}k`}
          subtext={<><ArrowUpRight size={16} className="mr-1" /> +12.5% vs last month</>}
          icon={Euro} 
          colorClass="from-gray-700 to-gray-900"
          onClick={() => setActiveView('finance')}
        />
        <StatCard 
          title="Active Leads" 
          value={leads.length}
          subtext={<><TrendingUp size={16} className="mr-1" /> {newLeadsCount} new this week</>}
          icon={TrendingUp} 
          colorClass="from-emerald-400 to-emerald-600"
          onClick={() => setActiveView('leads')}
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasksCount}
          subtext={<><ClipboardList size={16} className="mr-1" /> {tasks.filter(t => t.priority === 'urgent' && !t.completed).length} urgent</>}
          icon={ClipboardList} 
          colorClass="from-amber-400 to-amber-600"
          onClick={() => setActiveView('tasks')}
        />
        <StatCard 
          title="Unread Messages" 
          value={unreadMessagesCount}
          subtext={<><Mail size={16} className="mr-1" /> Response needed</>}
          icon={Mail} 
          colorClass="from-blue-400 to-blue-600"
          onClick={() => setActiveView('inbox')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Revenue Analytics</h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [`€${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {leads.slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New lead: {lead.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Interested in {lead.source}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">2m ago</span>
              </div>
            ))}
            {tasks.slice(0, 2).map(task => (
               <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
               <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                 <ClipboardList size={14} />
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-900">{task.title}</p>
                 <p className="text-xs text-gray-500 mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
               </div>
               <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">1h ago</span>
             </div>
            ))}
             {leads.length === 0 && tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
            )}
          </div>
          <button onClick={() => setActiveView('leads')} className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
