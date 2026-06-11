'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { MessageSquare, RefreshCw, XCircle, Clock, AlertTriangle, User, Search, Tag, Eye } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  tenantName: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | string;
  assignee?: string;
  created: string;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTickets = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/support/tickets')
      .then(r => setTickets(r.data?.data || []))
      .catch(() => setError('Failed to load support tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search || 
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const map: Record<string, string> = {
      High: 'bg-red-50 text-red-700 border border-red-100',
      Medium: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
      Low: 'bg-amber-50 text-amber-700 border border-amber-100',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[priority] || 'bg-slate-50 dark:bg-[#161616] text-slate-600'}`}>
        {priority}
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
        <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <MessageSquare className="w-6 h-6 text-[#F59E0B]" /> Support Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and audit customer support request queues across all tenant workspaces</p>
        </div>
        <button onClick={fetchTickets} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by subject, tenant, assignee..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-card min-w-[120px]"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No tickets found</p>
            <p className="text-slate-400 text-sm mt-1">Tenant support agents handle workspace tickets</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Ticket ID', 'Subject', 'Tenant Name', 'Priority', 'Assignee', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono text-xs text-[#F59E0B] font-semibold">#{t.id.substring(0, 8)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{t.subject}</td>
                    <td className="px-5 py-4 text-slate-700">{t.tenantName || 'Unknown Workspace'}</td>
                    <td className="px-5 py-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {t.assignee || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.status === 'Resolved' || t.status === 'Closed' ? 'bg-green-50 text-green-700' :
                        t.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {t.created ? new Date(t.created).toLocaleString('en-IN') : '—'}
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
