'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { RefreshCw, XCircle, DollarSign, CheckCircle, Clock, Trash2, ArrowLeft, Loader2 } from 'lucide-react';

interface Refund {
  _id: string;
  tenant: string;
  tenantName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRefunds = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/billing/refunds')
      .then(r => setRefunds(r.data?.data || []))
      .catch(() => setError('Failed to load refund requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActioningId(id + newStatus);
    try {
      await api.patch(`/super-admin/billing/refunds/${id}`, { status: newStatus });
      fetchRefunds();
    } catch {
      // error handled by interceptor
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="bg-card rounded-2xl border border-slate-200/80 h-80 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchRefunds} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <RefreshCw className="w-6 h-6 text-[#F59E0B]" /> Refund Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-1">Review and process B2B tenant invoice refund claims</p>
        </div>
        <button onClick={fetchRefunds} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table grid */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {refunds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No refund requests pending</p>
            <p className="text-slate-400 text-sm mt-1">All processed transactions are settled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Refund ID', 'Tenant', 'Amount', 'Reason', 'Status', 'Claim Date', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map(ref => (
                  <tr key={ref._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono text-xs text-[#F59E0B] font-semibold">{ref._id}</td>
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-[#ededed]">{ref.tenantName || 'Platform Tenant'}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-[#ededed]">₹{(ref.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-[#a3a3a3]">{ref.reason}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        ref.status === 'approved' ? 'bg-green-50 text-green-700' :
                        ref.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {ref.created_at ? new Date(ref.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {ref.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(ref._id, 'approved')}
                            disabled={!!actioningId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
                          >
                            {actioningId === ref._id + 'approved' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(ref._id, 'rejected')}
                            disabled={!!actioningId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {actioningId === ref._id + 'rejected' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                      {ref.status !== 'pending' && (
                        <span className="text-slate-400 text-xs block text-right pr-4">Processed</span>
                      )}
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
