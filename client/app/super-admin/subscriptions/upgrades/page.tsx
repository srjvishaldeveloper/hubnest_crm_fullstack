'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { ArrowUpCircle, RefreshCw, XCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface UpgradeRequest {
  _id: string;
  tenant: string;
  tenantName?: string;
  currentPlan: string;
  requestedPlan: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: { cls: 'bg-yellow-50 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
    approved: { cls: 'bg-green-50 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { cls: 'bg-red-50 text-red-600', icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${s.cls}`}>
      {s.icon} {status}
    </span>
  );
};

export default function UpgradesPage() {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/upgrade-requests')
      .then(r => setRequests(r.data?.data || []))
      .catch(() => setError('Failed to load upgrade requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setActionId(id + action);
    try {
      await api.patch(`/super-admin/upgrade-requests/${id}`, { status: action });
      fetchData();
    } catch { } finally { setActionId(null); }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-56 bg-slate-200 rounded-xl" />
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-80" />
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
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ArrowUpCircle className="w-6 h-6 text-[#F59E0B]" /> Upgrade Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Review and process tenant plan upgrade requests</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, cls: 'text-yellow-600 bg-yellow-50' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, cls: 'text-green-600 bg-green-50' },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, cls: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${s.cls}`}>{s.value}</div>
            <span className="text-sm font-semibold text-slate-700">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ArrowUpCircle className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No upgrade requests</p>
            <p className="text-slate-400 text-sm mt-1">All tenant plans are up to date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Tenant', 'Current Plan', 'Requested Plan', 'Requested At', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{r.tenantName || r.tenant}</td>
                    <td className="px-5 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{r.currentPlan}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{r.requestedPlan}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{new Date(r.requestedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-4">
                      {r.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(r._id, 'approved')}
                            disabled={!!actionId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
                          >
                            {actionId === r._id + 'approved' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                          </button>
                          <button
                            onClick={() => handleAction(r._id, 'rejected')}
                            disabled={!!actionId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {actionId === r._id + 'rejected' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                          </button>
                        </div>
                      )}
                      {r.status !== 'pending' && <span className="text-slate-400 text-xs text-right block pr-1">—</span>}
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
