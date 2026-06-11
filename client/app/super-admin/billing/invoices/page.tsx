'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { FileText, RefreshCw, XCircle, Download, Eye, Search } from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  tenant: string;
  tenantName?: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  issuedDate: string;
  items?: { description: string; amount: number }[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    paid: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    overdue: 'bg-red-50 text-red-600',
    cancelled: 'bg-slate-100 text-slate-600',
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
};

const STATUS_FILTERS = ['all', 'paid', 'pending', 'overdue', 'cancelled'];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true); setError('');
    api.get('/super-admin/billing/invoices')
      .then(r => setInvoices(r.data?.data || []))
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  const handleDownload = async (id: string, invoiceNumber: string, viewOnly = false) => {
    try {
      const response = await api.get(`/super-admin/billing/invoices/${id}/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (viewOnly) {
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
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
      alert('Failed to process invoice PDF. Please try again.');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'all' || inv.status === filter;
    const matchSearch = !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || (inv.tenantName || inv.tenant)?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-44 bg-slate-200 rounded-xl" />
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-96" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <XCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium mb-4">{error}</p>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2"><FileText className="w-6 h-6 text-[#F59E0B]" /> Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-1">All billing invoices across tenants</p>
      </div>

      {/* Razorpay Integration Card */}
      <div className="bg-card dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/15 rounded-xl flex items-center justify-center">
            <span className="font-bold text-[#F59E0B] text-xl">R</span>
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-[#ededed]">Razorpay Gateway</h3>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">Accept B2B payments and subscriptions</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-slate-100 dark:bg-[#161616] text-slate-700 dark:text-[#ededed] text-sm font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#333] transition">
          Configure
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice # or tenant..." className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition ${filter === s ? 'bg-[#F59E0B] text-white' : 'bg-card border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#161616]'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No invoices found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Invoice #', 'Tenant', 'Amount', 'Status', 'Due Date', 'Issued Date', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono font-semibold text-[#F59E0B] text-xs">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{inv.tenantName || inv.tenant}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">${(inv.amount || 0).toLocaleString()} <span className="text-slate-400 font-normal text-xs">{inv.currency}</span></td>
                    <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDownload(inv._id, inv.invoiceNumber, true)} className="p-1.5 rounded-lg hover:bg-amber-50 text-[#F59E0B] transition" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownload(inv._id, inv.invoiceNumber, false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition" title="Download"><Download className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
