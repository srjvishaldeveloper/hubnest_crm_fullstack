'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { financeGetInvoices, financeCreateInvoice, financeUpdateInvoice } from '../../../services/financeService';
import {
  FileText, Search, Plus, RefreshCw, X, Download, Eye
} from 'lucide-react';
import api from '../../../services/api';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
}

function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [invNumber, setInvNumber] = useState('');
  const [custName, setCustName] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [dueDate, setDueDate] = useState('');

  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') {
      setShowCreateModal(true);
    }
  }, [action]);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetInvoices({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setInvoices(res.invoices);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load invoices', err);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!invNumber || !custName || !amount || !dueDate) return;
    try {
      setSubmitting(true);
      const amt = parseFloat(amount);
      const txAmt = parseFloat(tax) || 0;
      await financeCreateInvoice({
        invoice_number: invNumber,
        customer_name: custName,
        amount: amt,
        tax: txAmt,
        total: amt + txAmt,
        due_date: dueDate
      });
      setShowCreateModal(false);
      setInvNumber(''); setCustName(''); setAmount(''); setTax(''); setDueDate('');
      loadInvoices();
    } catch (err) {
      console.error('Failed to create invoice', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(id: string, invoiceNumber: string, viewOnly = false) {
    try {
      const response = await api.get(`/finance/invoices/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (viewOnly) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch {
      alert('Failed to process invoice PDF');
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    try {
      const updates: Record<string, string> = { status: newStatus };
      if (newStatus === 'Paid') updates.paid_date = new Date().toISOString().split('T')[0];
      await financeUpdateInvoice(id, updates);
      loadInvoices();
    } catch (err) {
      console.error('Failed to update invoice', err);
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Overdue': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'Sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'Cancelled': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Invoices</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Manage and track all customer invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search invoices..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadInvoices()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--primary)] w-52 bg-[var(--card)] text-[var(--foreground)]" />
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] px-4 py-2 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)]">
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-right">Tax</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4 font-semibold">Due Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading invoices...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--destructive)]">{error}</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--muted-foreground)]">No invoices found.</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[var(--accent)] transition">
                    <td className="p-4 font-bold text-[var(--primary)]">{inv.invoice_number}</td>
                    <td className="p-4">{inv.customer_name}</td>
                    <td className="p-4 text-right">₹{parseFloat(String(inv.amount)).toLocaleString()}</td>
                    <td className="p-4 text-right text-[var(--muted-foreground)]">₹{parseFloat(String(inv.tax)).toLocaleString()}</td>
                    <td className="p-4 text-right font-bold">₹{parseFloat(String(inv.total)).toLocaleString()}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(inv.id, inv.invoice_number, true)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(inv.id, inv.invoice_number, false)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <select value="" onChange={e => e.target.value && handleStatusUpdate(inv.id, e.target.value)}
                            className="p-1.5 border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--muted-foreground)] bg-[var(--card)]">
                            <option value="">Update...</option>
                            {inv.status === 'Draft' && <option value="Sent">Mark as Sent</option>}
                            <option value="Paid">Mark as Paid</option>
                            <option value="Cancelled">Cancel</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {invoices.length} of {total} invoices</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={invoices.length < 20}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Create New Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs font-semibold text-[var(--muted-foreground)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Invoice Number *</label>
                  <input type="text" required value={invNumber} onChange={e => setInvNumber(e.target.value)} placeholder="INV-2026-006"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
                <div className="space-y-1">
                  <label>Customer Name *</label>
                  <input type="text" required value={custName} onChange={e => setCustName(e.target.value)} placeholder="Company Name"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label>Amount *</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
                <div className="space-y-1">
                  <label>Tax</label>
                  <input type="number" value={tax} onChange={e => setTax(e.target.value)} placeholder="0.00" step="0.01"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
                <div className="space-y-1">
                  <label>Due Date *</label>
                  <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--accent)] text-[var(--foreground)]">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold rounded-xl shadow-md">
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-amber-500 border-t-transparent" />
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
