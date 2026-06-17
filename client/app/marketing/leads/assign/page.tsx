'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../../services/api';
import {
  Users, CheckCircle2, Loader2, RefreshCw, Send, X,
  UserCheck, AlertCircle, Search, Flame, Thermometer, Snowflake,
} from 'lucide-react';

interface SalesUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active_leads: number;
  converted_leads: number;
  total_leads: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  quality_score?: number;
  priority?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at?: string;
}

interface AssignHistory {
  leadId: string; leadName: string; assignedToName: string; time: string;
}

function PriorityIcon({ p }: { p?: string }) {
  if (p === 'Hot') return <Flame className="w-3 h-3 text-red-500" />;
  if (p === 'Cold') return <Snowflake className="w-3 h-3 text-blue-400" />;
  return <Thermometer className="w-3 h-3 text-amber-500" />;
}

export default function MarketingLeadAssignmentPage() {
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<AssignHistory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, leadsRes] = await Promise.all([
        api.get('/marketing/leads/sales-users'),
        api.get('/marketing/leads'),
      ]);
      const users: SalesUser[] = usersRes.data?.data?.users || [];
      const leads: Lead[] = leadsRes.data?.data?.leads || leadsRes.data?.leads || [];
      setSalesUsers(users);
      setAllLeads(leads);
      setUnassignedLeads(leads.filter(l => !l.assigned_to));
    } catch {
      setError('Failed to load data. Make sure Sales users exist in your tenant.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }

  async function assignSingleLead(lead: Lead, user: SalesUser) {
    setAssigning(lead.id);
    try {
      await api.post('/marketing/leads/assign', { leadIds: [lead.id], assignedTo: user.id });
      setHistory(prev => [
        { leadId: lead.id, leadName: lead.name, assignedToName: user.name, time: 'Just now' },
        ...prev.slice(0, 19),
      ]);
      flash(`${lead.name} assigned to ${user.name}`);
      await fetchData();
      setSelectedLeads(new Set());
    } catch {
      setError('Assignment failed. Try again.');
    } finally {
      setAssigning(null);
    }
  }

  async function handleBulkAssign() {
    if (!bulkTarget || selectedLeads.size === 0) return;
    const user = salesUsers.find(u => u.id === bulkTarget);
    if (!user) return;
    setBulkAssigning(true);
    try {
      const ids = Array.from(selectedLeads);
      await api.post('/marketing/leads/assign', { leadIds: ids, assignedTo: bulkTarget });
      const names = ids.map(id => allLeads.find(l => l.id === id)?.name || id).join(', ');
      setHistory(prev => [
        { leadId: 'bulk', leadName: `${ids.length} leads`, assignedToName: user.name, time: 'Just now' },
        ...prev.slice(0, 19),
      ]);
      flash(`${ids.length} lead(s) assigned to ${user.name}`);
      setSelectedLeads(new Set());
      setBulkTarget('');
      await fetchData();
    } catch {
      setError('Bulk assignment failed. Try again.');
    } finally {
      setBulkAssigning(false);
    }
  }

  const filteredUnassigned = unassignedLeads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLeads.size === filteredUnassigned.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredUnassigned.map(l => l.id)));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
      <span className="ml-3 text-sm text-slate-500">Loading leads & sales team...</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lead Assignment</h2>
          <p className="text-xs text-slate-500 mt-1">Send unassigned leads from Marketing to Sales</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: allLeads.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Unassigned', value: unassignedLeads.length, color: 'text-orange-600 bg-orange-50' },
          { label: 'Assigned', value: allLeads.length - unassignedLeads.length, color: 'text-green-600 bg-green-50' },
          { label: 'Sales Team', value: salesUsers.length, color: 'text-indigo-600 bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Unassigned Leads ({filteredUnassigned.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Search className="w-3 h-3 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="text-xs bg-transparent outline-none w-28 text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Bulk assign bar */}
          {selectedLeads.size > 0 && (
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-indigo-700">{selectedLeads.size} selected</span>
              <select
                value={bulkTarget}
                onChange={e => setBulkTarget(e.target.value)}
                className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none"
              >
                <option value="">Select sales rep...</option>
                {salesUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkTarget || bulkAssigning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition hover:bg-indigo-700"
              >
                {bulkAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {bulkAssigning ? 'Assigning...' : 'Bulk Assign'}
              </button>
              <button onClick={() => setSelectedLeads(new Set())} className="text-xs text-indigo-500 hover:underline ml-auto">Clear</button>
            </div>
          )}

          {filteredUnassigned.length === 0 ? (
            <div className="text-center py-14">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">
                {unassignedLeads.length === 0 ? 'All leads are assigned!' : 'No leads match your search'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === filteredUnassigned.length && filteredUnassigned.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    {['Lead', 'Source', 'Quality', 'Assign To'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUnassigned.map(lead => (
                    <tr key={lead.id} className={`hover:bg-slate-50 transition ${selectedLeads.has(lead.id) ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLead(lead.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                            {lead.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{lead.name}</p>
                            <p className="text-[10px] text-slate-400">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{lead.source || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PriorityIcon p={lead.priority} />
                          <span className="font-mono font-bold text-slate-700">{lead.quality_score ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue=""
                          onChange={async e => {
                            if (!e.target.value) return;
                            const user = salesUsers.find(u => u.id === e.target.value);
                            if (user) await assignSingleLead(lead, user);
                            e.target.value = '';
                          }}
                          disabled={assigning === lead.id}
                          className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none disabled:opacity-50 cursor-pointer"
                        >
                          <option value="">Select rep...</option>
                          {salesUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.active_leads} active)
                            </option>
                          ))}
                        </select>
                        {assigning === lead.id && (
                          <Loader2 className="inline w-3 h-3 animate-spin ml-2 text-indigo-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Sales Team */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Sales Team
              </h3>
            </div>
            {salesUsers.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-slate-400">No sales users found.</p>
                <p className="text-[10px] text-slate-300 mt-1">Add users with Sales Executive or Sales Manager role.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {salesUsers.map(user => {
                  const convRate = user.total_leads > 0
                    ? Math.round((Number(user.converted_leads) / Number(user.total_leads)) * 100)
                    : 0;
                  return (
                    <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-700">{user.active_leads} active</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">{convRate}% conv.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignment History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Assignment History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No assignments this session.</p>
            ) : (
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                    <p className="text-xs text-slate-700 font-bold">{item.leadName}</p>
                    <p className="text-[10px] text-slate-500">→ {item.assignedToName}</p>
                    <span className="text-[9px] text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Leads Preview */}
      {allLeads.filter(l => l.assigned_to).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Already Assigned ({allLeads.filter(l => l.assigned_to).length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['Lead', 'Source', 'Status', 'Assigned To', 'Quality'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allLeads.filter(l => l.assigned_to).slice(0, 20).map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{lead.name}</p>
                      <p className="text-[10px] text-slate-400">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.source || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 capitalize">{lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {lead.assigned_to_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-slate-700 font-medium">{lead.assigned_to_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{lead.quality_score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
