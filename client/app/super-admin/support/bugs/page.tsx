'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Bug, RefreshCw, XCircle, Clock, AlertCircle, CheckCircle, Check, Loader2 } from 'lucide-react';

interface BugReport {
  id: string;
  title: string;
  reporter: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  status: 'Open' | 'Resolved' | string;
  date: string;
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchBugs = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/support/bugs')
      .then(r => setBugs(r.data?.data || []))
      .catch(() => setError('Failed to load bug reports.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.patch(`/super-admin/support/bugs/${id}`, { status: 'Resolved' });
      fetchBugs();
    } catch {
      // handled
    } finally {
      setResolvingId(null);
    }
  };

  const SeverityBadge = ({ severity }: { severity: string }) => {
    const map: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800 font-extrabold border border-red-200',
      High: 'bg-red-50 text-red-700 font-semibold border border-red-100',
      Medium: 'bg-yellow-50 text-yellow-700 font-semibold border border-yellow-100',
      Low: 'bg-slate-100 text-slate-600 font-medium',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${map[severity] || 'bg-slate-50 dark:bg-[#161616]'}`}>
        {severity}
      </span>
    );
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
        <button onClick={fetchBugs} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-[#F59E0B]" /> Bug Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review, prioritize and resolve system issues reported by platform users</p>
        </div>
        <button onClick={fetchBugs} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bugs list */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {bugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-slate-500 font-medium">All clear! No reported bugs</p>
            <p className="text-slate-400 text-sm mt-1">Platform microservices and frontend scripts are executing healthily</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Bug ID', 'Title / Description', 'Reporter', 'Severity', 'Status', 'Reported At', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bugs.map(bug => (
                  <tr key={bug.id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono text-xs text-[#F59E0B] font-semibold">#{bug.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{bug.title}</td>
                    <td className="px-5 py-4 text-slate-600">{bug.reporter}</td>
                    <td className="px-5 py-4"><SeverityBadge severity={bug.severity} /></td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        bug.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {bug.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {bug.date ? new Date(bug.date).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {bug.status !== 'Resolved' ? (
                        <button
                          onClick={() => handleResolve(bug.id)}
                          disabled={resolvingId === bug.id}
                          className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
                        >
                          {resolvingId === bug.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Resolve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs pr-4 block">Fixed</span>
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
