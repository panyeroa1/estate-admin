import React, { useMemo, useState } from 'react';
import { Mail, Search, Star, Trash2, Plus, Send, CircleDot } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { Message } from '../types';

interface InboxViewProps {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
}

type MessageFilter = 'all' | 'unread' | 'starred';

const InboxView: React.FC<InboxViewProps> = ({ messages, addMessage, updateMessage, markMessageRead, deleteMessage }) => {
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Message, 'id'>>({
    sender: '',
    email: '',
    subject: '',
    body: '',
    date: new Date().toISOString(),
    read: false,
    starred: false,
  });

  const filteredMessages = useMemo(() => {
    const searchLower = search.toLowerCase();
    return messages
      .filter(m => {
        if (filter === 'unread' && m.read) return false;
        if (filter === 'starred' && !m.starred) return false;
        if (searchLower) {
          return (
            m.sender.toLowerCase().includes(searchLower) ||
            m.subject.toLowerCase().includes(searchLower) ||
            m.email.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [messages, filter, search]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.sender || !draft.email || !draft.subject || !draft.body) return;

    addMessage({
      ...draft,
      date: new Date().toISOString(),
      read: false,
      starred: false,
    });
    setDraft({ sender: '', email: '', subject: '', body: '', date: new Date().toISOString(), read: false, starred: false });
    setIsModalOpen(false);
  };

  const toggleStar = (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    updateMessage(id, { starred: !msg.starred });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
          <p className="text-gray-500">Track all client communication.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Compose
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search by sender or subject"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'unread', 'starred'] as MessageFilter[]).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${filter === key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}
            >
              {key === 'all' && 'All'}
              {key === 'unread' && 'Unread'}
              {key === 'starred' && 'Starred'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="divide-y divide-gray-100">
          {filteredMessages.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Mail size={48} className="mx-auto mb-3 opacity-20" />
              <p>No messages yet.</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div key={msg.id} className="p-4 flex gap-4 items-start hover:bg-gray-50">
                <button
                  aria-label={msg.starred ? 'Unstar message' : 'Star message'}
                  className={`p-2 rounded-full border ${msg.starred ? 'border-yellow-300 bg-yellow-50 text-yellow-600' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}
                  onClick={() => toggleStar(msg.id)}
                >
                  <Star size={16} fill={msg.starred ? 'currentColor' : 'none'} />
                </button>
                <div className="flex-1 min-w-0" onClick={() => !msg.read && markMessageRead(msg.id)}>
                  <div className="flex items-center gap-2">
                    {!msg.read && <CircleDot size={12} className="text-blue-500" />}
                    <p className="font-semibold text-gray-900 truncate">{msg.subject}</p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">From {msg.sender} · {msg.email}</p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{msg.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(msg.date).toLocaleString()}</span>
                  <div className="flex gap-2">
                    {!msg.read && (
                      <button
                        onClick={() => markMessageRead(msg.id)}
                        className="text-blue-600 text-xs font-medium hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-red-600 text-xs font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Message">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message-sender">Sender Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="message-sender"
                value={draft.sender}
                onChange={e => setDraft({ ...draft, sender: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message-email">Sender Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="message-email"
                value={draft.email}
                onChange={e => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message-subject">Subject</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="message-subject"
              value={draft.subject}
              onChange={e => setDraft({ ...draft, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message-body">Message</label>
            <textarea
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="message-body"
              value={draft.body}
              onChange={e => setDraft({ ...draft, body: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
              <Send size={16} /> Send
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InboxView;
