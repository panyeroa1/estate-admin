import React, { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { Transaction } from '../types';

interface FinanceViewProps {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, addTransaction, deleteTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'income',
    method: 'bank transfer',
    date: new Date().toISOString().slice(0, 10),
  });

  const { incomeTotal, expenseTotal } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { incomeTotal: income, expenseTotal: expense };
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.description || formData.amount === undefined || !formData.date || !formData.type || !formData.category) return;

    addTransaction({
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      type: formData.type,
      category: formData.category,
      method: formData.method || 'bank transfer',
      reference: formData.reference,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setFormData({ type: 'income', method: 'bank transfer', date: new Date().toISOString().slice(0, 10) });
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finance</h2>
          <p className="text-gray-500">Track income, expenses, and payment references.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold">Income</p>
              <p className="text-2xl font-bold text-emerald-600">€{incomeTotal.toLocaleString()}</p>
            </div>
            <ArrowUpCircle className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold">Expenses</p>
              <p className="text-2xl font-bold text-red-600">€{expenseTotal.toLocaleString()}</p>
            </div>
            <ArrowDownCircle className="text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold">Net</p>
              <p className={`text-2xl font-bold ${incomeTotal - expenseTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                €{(incomeTotal - expenseTotal).toLocaleString()}
              </p>
            </div>
            <Wallet className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions recorded.</td>
              </tr>
            ) : (
              transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.method}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.reference || '—'}</td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}€{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-red-600 text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-type">Type</label>
              <select
                className={inputClass}
                id="tx-type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as Transaction['type'] })}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-date">Date</label>
              <input
                required
                type="date"
                className={inputClass}
                id="tx-date"
                value={formData.date || ''}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-amount">Amount (€)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                id="tx-amount"
                value={formData.amount ?? ''}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-description">Description</label>
              <input
                required
                type="text"
                className={inputClass}
                id="tx-description"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-category">Category</label>
              <input
                required
                type="text"
                className={inputClass}
                id="tx-category"
                value={formData.category || ''}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-method">Method</label>
              <input
                type="text"
                className={inputClass}
                id="tx-method"
                value={formData.method || ''}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tx-reference">Reference</label>
              <input
                type="text"
                className={inputClass}
                id="tx-reference"
                value={formData.reference || ''}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FinanceView;
