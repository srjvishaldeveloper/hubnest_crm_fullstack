'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { financeGetExpenses, financeCreateExpense, financeUpdateExpense } from '../../../services/financeService';
import {
  Receipt, Search, Plus, RefreshCw, X, CheckCircle2,
  Clock, AlertCircle, XCircle
} from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendor_id: string | null;
  vendor_name: string | null;
  approved_by: string | null;
  approver_name: string | null;
  status: string;
  expense_date: string;
  created_at: string;
}

function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [expCategory, setExpCategory] = useState('General');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') {
      setShowCreateModal(true);
    }
  }, [action]);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetExpenses({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setExpenses(res.expenses);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load expenses', err);
      setError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, [statusFilter, categoryFilter, page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!expDescription || !expAmount) return;
    try {
      setSubmitting(true);
      await financeCreateExpense({
        category: expCategory,
        description: expDescription,
        amount: parseFloat(expAmount),
        expense_date: expDate
      });
      setShowCreateModal(false);
      setExpCategory('General'); setExpDescription(''); setExpAmount(''); setExpDate(new Date().toISOString().split('T')[0]);
      loadExpenses();
    } catch (err) {
      console.error('Failed to create expense', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    try {
      await financeUpdateExpense(id, { status: newStatus });
      loadExpenses();
    } catch (err) {
      console.error('Failed to update expense', err);
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'Reimbursed': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    }
  };

  const categoryColor = (c: string) => {
    const colors: Record<string, string> = {
      'Salaries': 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      'Rent': 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
      'Marketing': 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400',
      'Software': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
      'Travel': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
    };
    return colors[c] || 'bg-slate-50 dark:bg-[#161616] text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Expenses</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Track and manage all company expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search expenses..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadExpenses()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--primary)] w-52 bg-[var(--card)] text-[var(--foreground)]" />
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Reimbursed">Reimbursed</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Categories</option>
            <option value="Salaries">Salaries</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="General">General</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] px-4 py-2 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)]">
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold">Vendor</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading expenses...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--destructive)]">{error}</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--muted-foreground)]">No expenses found.</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-[var(--accent)] transition">
                    <td className="p-4">
                      <p className="font-bold text-[var(--foreground)] truncate max-w-[200px]">{exp.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${categoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">₹{parseFloat(String(exp.amount)).toLocaleString()}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{exp.vendor_name || '—'}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(exp.status)}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {exp.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleStatusUpdate(exp.id, 'Approved')} title="Approve"
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleStatusUpdate(exp.id, 'Rejected')} title="Reject"
                            className="p-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {expenses.length} of {total} expenses</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={expenses.length < 20}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Add New Expense</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs font-semibold text-[var(--muted-foreground)]">
              <div className="space-y-1">
                <label>Description *</label>
                <textarea required rows={3} value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="Describe the expense..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label>Category</label>
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none bg-[var(--card)]">
                    <option value="Salaries">Salaries</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Travel">Travel</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="General">General</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label>Amount *</label>
                  <input type="number" required value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" step="0.01"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
                <div className="space-y-1">
                  <label>Date</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--accent)] text-[var(--foreground)]">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold rounded-xl shadow-md">
                  {submitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-amber-500 border-t-transparent" />
      </div>
    }>
      <ExpensesContent />
    </Suspense>
  );
}
