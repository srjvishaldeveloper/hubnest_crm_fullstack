'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { financeGetPayments, financeCreatePayment } from '../../../services/financeService';
import {
  CreditCard, Search, Plus, RefreshCw, X, DollarSign,
  CheckCircle2, Clock, AlertCircle, Banknote
} from 'lucide-react';

interface Payment {
  id: string;
  invoice_id: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  paid_at: string;
  created_at: string;
}

function PaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');

  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') {
      setShowCreateModal(true);
    }
  }, [action]);

  async function loadPayments() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetPayments({
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setPayments(res.payments);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load payments', err);
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter, page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!payAmount) return;
    try {
      setSubmitting(true);
      await financeCreatePayment({
        amount: parseFloat(payAmount),
        method: payMethod,
        reference: payReference || undefined
      });
      setShowCreateModal(false);
      setPayAmount(''); setPayMethod('Bank Transfer'); setPayReference('');
      loadPayments();
    } catch (err) {
      console.error('Failed to create payment', err);
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'Refunded': return 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    }
  };

  const methodIcon = (m: string) => {
    switch (m) {
      case 'Credit Card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'UPI': return <DollarSign className="w-3.5 h-3.5" />;
      case 'Cash': return <Banknote className="w-3.5 h-3.5" />;
      default: return <CreditCard className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Payments</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Track all incoming and outgoing payments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search payments..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadPayments()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--primary)] w-52 bg-[var(--card)] text-[var(--foreground)]" />
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] px-4 py-2 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Record Payment
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)]">
                <th className="p-4 font-semibold">Payment ID</th>
                <th className="p-4 font-semibold">Invoice</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading payments...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--destructive)]">{error}</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--muted-foreground)]">No payments found.</td></tr>
              ) : (
                payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-[var(--accent)] transition">
                    <td className="p-4 font-bold text-[var(--foreground)]">#{pay.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <p className="font-semibold">{pay.invoice_number || 'Direct'}</p>
                      {pay.customer_name && <span className="text-[10px] text-[var(--muted-foreground)]">{pay.customer_name}</span>}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600">₹{parseFloat(String(pay.amount)).toLocaleString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                        {methodIcon(pay.method)} {pay.method}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted-foreground)]">{pay.reference || '—'}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{new Date(pay.paid_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(pay.status)}`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {payments.length} of {total} payments</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={payments.length < 20}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Record Payment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs font-semibold text-[var(--muted-foreground)]">
              <div className="space-y-1">
                <label>Amount *</label>
                <input type="number" required value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" step="0.01"
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none bg-[var(--card)]">
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label>Reference</label>
                  <input type="text" value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="NEFT-REF-..."
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--accent)] text-[var(--foreground)]">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold rounded-xl shadow-md">
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-amber-500 border-t-transparent" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
