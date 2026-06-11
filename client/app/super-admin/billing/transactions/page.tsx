'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { ArrowLeftRight, RefreshCw, XCircle, DollarSign, CreditCard, Clock, Search, ChevronRight } from 'lucide-react';

interface Transaction {
  _id: string;
  tenantName: string;
  amount: number;
  method: string;
  status: 'Completed' | 'Pending' | 'Failed' | string;
  date: string;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchTxs = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/billing/transactions')
      .then(r => setTxs(r.data?.data || []))
      .catch(() => setError('Failed to load transaction history.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const filtered = txs.filter(tx => 
    !search || 
    tx.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.method?.toLowerCase().includes(search.toLowerCase()) ||
    tx._id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalVolume: txs.reduce((acc, t) => acc + (t.status === 'Completed' ? t.amount : 0), 0),
    successRate: txs.length ? Math.round((txs.filter(t => t.status === 'Completed').length / txs.length) * 100) : 100,
    pendingCount: txs.filter(t => t.status === 'Pending').length
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="bg-card rounded-2xl border border-slate-200/80 h-96 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchTxs} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#F59E0B]" /> Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-1">Audit platform payment history across all active workspaces</p>
        </div>
        <button onClick={fetchTxs} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Volume', value: `₹${stats.totalVolume.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Success Rate', value: `${stats.successRate}%`, icon: CreditCard, color: 'text-[#F59E0B] bg-amber-50' },
          { label: 'Pending Processing', value: stats.pendingCount, icon: Clock, color: 'text-yellow-600 bg-yellow-50' }
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#ededed] mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, tenant or gateway..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ArrowLeftRight className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No transactions found</p>
            <p className="text-slate-400 text-sm mt-1">Make sure you have active subscriptions running</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Transaction ID', 'Tenant', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(tx => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono text-xs text-[#F59E0B] font-semibold">{tx._id}</td>
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-[#ededed]">{tx.tenantName || 'Platform Tenant'}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-[#ededed]">₹{(tx.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-[#a3a3a3]">{tx.method}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        tx.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        tx.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {tx.date ? new Date(tx.date).toLocaleString('en-IN') : '—'}
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
