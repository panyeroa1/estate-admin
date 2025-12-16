import React, { useMemo, useState } from 'react';
import { CalendarRange, Clock3, MapPin, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
}

const colors: CalendarEvent['color'][] = ['blue', 'green', 'orange', 'purple'];

const computeDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '30m';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diff = endMinutes - startMinutes;
  if (Number.isNaN(diff) || diff <= 0) return '30m';
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ events, addEvent, deleteEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    color: 'blue',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
  });

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime());
  }, [events]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;

    addEvent({
      title: formData.title,
      description: formData.description || '',
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      color: formData.color || 'blue',
      duration: computeDuration(formData.startTime, formData.endTime),
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setFormData({ color: 'blue', date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '10:00' });
  };

  const ColorDot = ({ color }: { color: CalendarEvent['color'] }) => {
    const classMap: Record<CalendarEvent['color'], string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      orange: 'bg-amber-500',
      purple: 'bg-purple-500',
    };
    return <span className={`w-2.5 h-2.5 rounded-full ${classMap[color]}`} />;
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-500">Schedule view of meetings, tours, and deadlines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {sortedEvents.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No events scheduled.</div>
        ) : (
          sortedEvents.map(event => (
            <div key={event.id} className="p-4 flex items-start gap-4">
              <div className="pt-1">
                <ColorDot color={event.color} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{event.title}</p>
                  <span className="text-xs text-gray-500 inline-flex items-center gap-1"><Clock3 size={14} /> {event.duration}</span>
                </div>
                {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  <span className="inline-flex items-center gap-1"><CalendarRange size={14} /> {new Date(event.date).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={14} /> {event.startTime} - {event.endTime}</span>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(event.id)}
                className="text-red-600 text-xs font-medium inline-flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-title">Title</label>
            <input
              required
              type="text"
              className={inputClass}
              id="event-title"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-description">Description</label>
            <textarea
              rows={3}
              className={inputClass}
              id="event-description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-date">Date</label>
              <input
                required
                type="date"
                className={inputClass}
                id="event-date"
                value={formData.date || ''}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-start">Start</label>
                <input
                  required
                  type="time"
                  className={inputClass}
                  id="event-start"
                  value={formData.startTime || ''}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-end">End</label>
                <input
                  required
                  type="time"
                  className={inputClass}
                  id="event-end"
                  value={formData.endTime || ''}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-3">
              {colors.map(color => (
                <label key={color} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer ${formData.color === color ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} htmlFor={`event-color-${color}`}>
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={formData.color === color}
                    onChange={() => setFormData({ ...formData, color })}
                    id={`event-color-${color}`}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-emerald-500' : color === 'orange' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                  <span className="text-sm capitalize">{color}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Event</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarView;
