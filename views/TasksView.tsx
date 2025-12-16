import React, { useMemo, useState } from 'react';
import { CheckCircle, Circle, Plus, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
}

type TaskFilter = 'all' | 'open' | 'completed';

const TasksView: React.FC<TasksViewProps> = ({ tasks, addTask, toggleTaskComplete, deleteTask }) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({
    priority: 'medium',
    category: 'General',
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'open') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, filter]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) return;

    addTask({
      title: formData.title,
      description: formData.description || '',
      dueDate: formData.dueDate,
      priority: formData.priority || 'medium',
      category: formData.category || 'General',
      completed: false,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setFormData({ priority: 'medium', category: 'General', dueDate: new Date().toISOString().slice(0, 10) });
  };

  const PriorityPill = ({ priority }: { priority: Task['priority'] }) => {
    const styles: Record<Task['priority'], string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-amber-100 text-amber-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}>{priority}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-500">Stay on top of follow-ups and priorities.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'completed'] as TaskFilter[]).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${filter === key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            {key === 'all' && 'All'}
            {key === 'open' && 'Open'}
            {key === 'completed' && 'Completed'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No tasks yet.</div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="p-4 flex items-start gap-4">
              <button
                aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                onClick={() => toggleTaskComplete(task.id)}
                className="mt-1"
              >
                {task.completed ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle className="text-gray-400" size={20} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                  <PriorityPill priority={task.priority} />
                </div>
                {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span className="inline-flex items-center gap-1"><Calendar size={14} /> Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1"><AlertTriangle size={14} /> {task.category}</span>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-600 text-xs font-medium inline-flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-title">Title</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="task-title"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-description">Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="task-description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-due">Due Date</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="task-due"
                value={formData.dueDate || ''}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-priority">Priority</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="task-priority"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-category">Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="task-category"
                value={formData.category || ''}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksView;
