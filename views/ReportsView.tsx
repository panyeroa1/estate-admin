import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, Clock4, Home, Mail } from 'lucide-react';
import { CalendarEvent, Lead, Property, Task, Transaction } from '../types';

interface ReportsViewProps {
  leads: Lead[];
  tasks: Task[];
  events: CalendarEvent[];
  transactions: Transaction[];
  properties: Property[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ leads, tasks, events, transactions, properties }) => {
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const qualified = leads.filter(l => l.status === 'qualified').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const conversionRate = totalLeads ? Math.round((qualified / totalLeads) * 100) : 0;

    const completedTasks = tasks.filter(t => t.completed).length;
    const taskCompletion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const net = income - expenses;

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;
    const soldProperties = properties.filter(p => p.status === 'sold').length;

    return { totalLeads, qualified, lost, conversionRate, completedTasks, taskCompletion, income, expenses, net, upcomingEvents, soldProperties };
  }, [leads, tasks, events, transactions, properties]);

  const cards = [
    {
      title: 'Lead Conversion',
      value: `${metrics.conversionRate}%`,
      subtext: `${metrics.qualified} qualified / ${metrics.totalLeads} total`,
      trend: ArrowUpRight,
      color: 'text-emerald-600',
      icon: Mail,
    },
    {
      title: 'Task Completion',
      value: `${metrics.taskCompletion}%`,
      subtext: `${metrics.completedTasks} of ${tasks.length || 0} done`,
      trend: ArrowUpRight,
      color: 'text-blue-600',
      icon: CheckCircle2,
    },
    {
      title: 'Net Revenue',
      value: `€${metrics.net.toLocaleString()}`,
      subtext: `Income €${metrics.income.toLocaleString()} / Expenses €${metrics.expenses.toLocaleString()}`,
      trend: metrics.net >= 0 ? ArrowUpRight : ArrowDownRight,
      color: metrics.net >= 0 ? 'text-emerald-600' : 'text-red-600',
      icon: BarChart3,
    },
    {
      title: 'Closings',
      value: metrics.soldProperties,
      subtext: `${metrics.upcomingEvents} upcoming events`,
      trend: ArrowUpRight,
      color: 'text-purple-600',
      icon: Home,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500">Health of your pipeline, tasks, and revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Lead Pipeline</h3>
            <span className="text-xs text-gray-500">Updated {new Date().toLocaleDateString()}</span>
          </div>
          <div className="space-y-3">
            {[{ label: 'New', key: 'new' }, { label: 'Contacted', key: 'contacted' }, { label: 'Qualified', key: 'qualified' }, { label: 'Lost', key: 'lost' }].map(stage => {
              const count = leads.filter(l => l.status === stage.key).length;
              const pct = metrics.totalLeads ? Math.round((count / metrics.totalLeads) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{stage.label}</span>
                    <span>{count} · {pct}%</span>
                  </div>
                  <progress
                    className="w-full h-2 overflow-hidden rounded-full bg-gray-100 [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500"
                    value={pct}
                    max={100}
                    aria-label={`${stage.label} progress`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
            <span className="text-xs text-gray-500">{metrics.upcomingEvents} scheduled</span>
          </div>
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-gray-400 text-sm">No events planned.</div>
            ) : (
              events
                .filter(e => new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()} · {event.startTime} - {event.endTime}</p>
                    </div>
                    <span className="text-xs text-gray-500">{event.duration}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Tasks Overview</h3>
          <Clock4 className="text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['low', 'medium', 'high', 'urgent'] as Task['priority'][]).map(priority => {
            const total = tasks.filter(t => t.priority === priority).length;
            const done = tasks.filter(t => t.priority === priority && t.completed).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={priority} className="p-4 border border-gray-100 rounded-lg">
                <p className="text-sm font-medium text-gray-700 capitalize">{priority}</p>
                <p className="text-2xl font-bold text-gray-900">{done}/{total}</p>
                <p className="text-sm text-gray-500">{pct}% completed</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
