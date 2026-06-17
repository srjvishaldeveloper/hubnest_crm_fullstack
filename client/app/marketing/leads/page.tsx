'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Search, Filter, Download, Users, TrendingUp, CheckCircle2,
  MoreVertical, Mail, Phone, Star, Sparkles, AlertTriangle,
  ChevronDown, ArrowUpRight, UserPlus, Upload, FileText,
  BarChart3, ChevronRight, Layers, Loader2, X, Check, Send,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  campaign?: string;
  campaign_name?: string;
  platform?: string;
  date?: string;
  created_at?: string;
  status: string;
  quality?: number;
  quality_score?: number;
}

// ─── Static data (non-API) ────────────────────────────────────

const aiInsights = [
  { title: 'High-Value Leads Waiting', desc: 'High-quality leads not contacted in 48h. Assign now.', action: 'Assign Leads', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Lead Quality', desc: 'Top source leads have highest quality score.', action: 'Scale', color: 'border-blue-200 bg-blue-50/50' },
  { title: 'Spam Filter', desc: 'Some leads flagged as spam. Review to improve accuracy.', action: 'Review', color: 'border-red-200 bg-red-50/50' },
  { title: 'Conversion Tip', desc: 'Leads contacted within 1h convert 7× more. Speed up follow-up.', action: 'Set Alert', color: 'border-green-200 bg-green-50/50' },
];

// ─── Sub-components ───────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Facebook: { label: 'FB', cls: 'bg-blue-100 text-blue-700' },
    Google: { label: 'GG', cls: 'bg-red-100 text-red-700' },
    Instagram: { label: 'IG', cls: 'bg-pink-100 text-pink-700' },
    Website: { label: 'WEB', cls: 'bg-slate-100 text-slate-600' },
    LinkedIn: { label: 'LI', cls: 'bg-sky-100 text-sky-700' },
    Email: { label: 'EM', cls: 'bg-green-100 text-green-700' },
  };
  const p = map[platform] ?? { label: platform?.slice(0, 2) || '??', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.cls}`}>{p.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    New: 'bg-blue-100 text-blue-700',
    new: 'bg-blue-100 text-blue-700',
    Qualified: 'bg-violet-100 text-violet-700',
    qualified: 'bg-violet-100 text-violet-700',
    Converted: 'bg-green-100 text-green-700',
    converted: 'bg-green-100 text-green-700',
    'Follow-up': 'bg-amber-100 text-amber-700',
    'follow-up': 'bg-amber-100 text-amber-700',
    'Not Interested': 'bg-red-100 text-red-700',
    'not interested': 'bg-red-100 text-red-700',
    Spam: 'bg-slate-100 text-slate-500',
    spam: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function QualityBadge({ score }: { score: number }) {
  const level = score >= 80 ? { label: 'High', cls: 'text-green-700 bg-green-50' }
    : score >= 60 ? { label: 'Medium', cls: 'text-blue-700 bg-blue-50' }
    : score >= 30 ? { label: 'Low', cls: 'text-amber-700 bg-amber-50' }
    : { label: 'Spam', cls: 'text-red-700 bg-red-50' };
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{score}</span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${level.cls}`}>{level.label}</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      <span className="ml-3 text-sm text-slate-500 font-medium">Loading leads...</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

interface SalesUser { id: string; name: string; email: string; active_leads: number; }

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [assignModal, setAssignModal] = useState<Lead | null>(null);
  const [assignTarget, setAssignTarget] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchLeads() {
    setLoading(true);
    setError('');
    try {
      const [leadsRes, usersRes] = await Promise.all([
        api.get('/marketing/leads'),
        api.get('/marketing/leads/sales-users').catch(() => ({ data: { data: { users: [] } } })),
      ]);
      const data = leadsRes.data?.data?.leads || leadsRes.data?.leads || [];
      setLeads(Array.isArray(data) ? data : []);
      setSalesUsers(usersRes.data?.data?.users || []);
    } catch {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  async function handleAssign() {
    if (!assignModal || !assignTarget) return;
    setAssigning(true);
    try {
      await api.post('/marketing/leads/assign', { leadIds: [assignModal.id], assignedTo: assignTarget });
      const user = salesUsers.find(u => u.id === assignTarget);
      setSuccessMsg(`${assignModal.name} assigned to ${user?.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAssignModal(null);
      setAssignTarget('');
      fetchLeads();
    } catch {
      setError('Assignment failed');
    } finally {
      setAssigning(false);
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase())
      || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || l.status === statusFilter || l.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Compute stats from real data
  const totalLeads = leads.length;
  const newToday = leads.filter(l => {
    const d = l.created_at || l.date;
    if (!d) return false;
    return new Date(d).toDateString() === new Date().toDateString();
  }).length;
  const converted = leads.filter(l => l.status?.toLowerCase() === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0';
  const avgQuality = totalLeads > 0
    ? Math.round(leads.reduce((sum, l) => sum + (l.quality ?? l.quality_score ?? 0), 0) / totalLeads)
    : 0;

  const statsCards = [
    { label: 'Total Leads', value: totalLeads.toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'New Today', value: String(newToday), icon: UserPlus, color: 'text-violet-600 bg-violet-50' },
    { label: 'Converted', value: String(converted), icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Avg Quality', value: `${avgQuality}%`, icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  // Quality breakdown computed from data
  const highQuality = leads.filter(l => (l.quality ?? l.quality_score ?? 0) >= 80).length;
  const medQuality = leads.filter(l => { const q = l.quality ?? l.quality_score ?? 0; return q >= 60 && q < 80; }).length;
  const lowQuality = leads.filter(l => { const q = l.quality ?? l.quality_score ?? 0; return q >= 30 && q < 60; }).length;
  const spamQuality = leads.filter(l => (l.quality ?? l.quality_score ?? 0) < 30).length;

  const qualityData = [
    { name: 'High', value: totalLeads > 0 ? Math.round((highQuality / totalLeads) * 100) : 0, color: '#16A34A' },
    { name: 'Medium', value: totalLeads > 0 ? Math.round((medQuality / totalLeads) * 100) : 0, color: '#2563EB' },
    { name: 'Low', value: totalLeads > 0 ? Math.round((lowQuality / totalLeads) * 100) : 0, color: '#D97706' },
    { name: 'Spam', value: totalLeads > 0 ? Math.round((spamQuality / totalLeads) * 100) : 0, color: '#DC2626' },
  ];

  // Source data computed from leads
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => {
    const src = l.source || l.platform || 'Other';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceColors: Record<string, string> = {
    Facebook: '#4F46E5', Google: '#2563EB', Instagram: '#7C3AED',
    Website: '#0891B2', LinkedIn: '#0EA5E9', Email: '#16A34A', Other: '#64748B',
  };
  const sourceData = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, leads]) => ({
      name,
      value: totalLeads > 0 ? Math.round((leads / totalLeads) * 100) : 0,
      leads,
      color: sourceColors[name] || '#64748B',
    }));

  // Status breakdown
  const statusMap: Record<string, number> = {};
  leads.forEach(l => {
    const s = l.status || 'Unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusColors: Record<string, string> = {
    New: '#4F46E5', new: '#4F46E5',
    Qualified: '#2563EB', qualified: '#2563EB',
    'Follow-up': '#D97706', 'follow-up': '#D97706',
    Converted: '#16A34A', converted: '#16A34A',
    'Not Interested': '#DC2626', 'not interested': '#DC2626',
    Spam: '#64748B', spam: '#64748B',
  };
  const leadStatusData = Object.entries(statusMap).map(([name, count]) => ({
    name,
    value: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    color: statusColors[name] || '#64748B',
  }));

  // Unique status values for filter
  const uniqueStatuses = Array.from(new Set(leads.map(l => l.status)));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total: {totalLeads.toLocaleString()} leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-48 focus-within:border-[#4F46E5] transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition">
            <Filter className="w-4 h-4 text-slate-500" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-[#161616] text-slate-700 text-xs font-semibold rounded-xl transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> {successMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {statsCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-lg font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Two-column: Leads List + Right Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leads Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-[#1f1f1f] flex-wrap">
            {['All Status', ...uniqueStatuses].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition capitalize ${
                  statusFilter === s
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">{search || statusFilter !== 'All Status' ? 'No leads match your filters' : 'No leads found'}</p>
              <p className="text-xs text-slate-400 mt-1">Leads will appear here when generated from campaigns.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-[#161616]">
                  <tr>
                    {['Lead', 'Source/Campaign', 'Platform', 'Date', 'Status', 'Quality', ''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:bg-[#161616]/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {l.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{l.name}</p>
                            <p className="text-[10px] text-slate-400">{l.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0F172A] dark:text-[#F9FAFB]">{l.source || '—'}</p>
                        <p className="text-[10px] text-slate-400">{l.campaign_name || l.campaign || '—'}</p>
                      </td>
                      <td className="px-4 py-3"><PlatformBadge platform={l.platform || l.source || 'N/A'} /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleDateString() : l.date || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3"><QualityBadge score={l.quality ?? l.quality_score ?? 0} /></td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 transition"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <AnimatePresence>
                            {menuOpen === l.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-6 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                                >
                                  {[
                                    { label: 'View Details', action: () => {} },
                                    { label: 'Edit Lead', action: () => {} },
                                    { label: 'Assign To Sales', action: () => { setAssignModal(l as any); setAssignTarget(''); } },
                                    { label: 'Mark Converted', action: async () => { await api.patch(`/marketing/leads/${l.id}`, { status: 'Converted' }).catch(()=>{}); fetchLeads(); } },
                                  ].map(({ label, action }) => (
                                    <button key={label} onClick={() => { setMenuOpen(null); action(); }}
                                      className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-slate-50 dark:bg-[#161616] ${label === 'Assign To Sales' ? 'text-indigo-600 font-semibold' : 'text-slate-700'}`}>
                                      {label}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Quality Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Lead Quality Overview</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={qualityData.filter(q => q.value > 0)} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={3}>
                      {qualityData.filter(q => q.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{avgQuality}%</p>
                  <p className="text-[9px] text-slate-400">Avg Score</p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {qualityData.map(q => (
                  <div key={q.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                      <span className="text-slate-600">{q.name}</span>
                    </div>
                    <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{q.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-50 rounded-xl text-center">
              <p className="text-xs font-bold text-green-700">High Quality Leads: <span className="text-[#0F172A] dark:text-[#F9FAFB]">{highQuality.toLocaleString()}</span></p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Assign Leads', icon: UserPlus, color: 'text-violet-600 bg-violet-50' },
                { label: 'Bulk Assign', icon: Layers, color: 'text-blue-600 bg-blue-50' },
                { label: 'Import Leads', icon: Upload, color: 'text-green-600 bg-green-50' },
                { label: 'Export Leads', icon: Download, color: 'text-amber-600 bg-amber-50' },
                { label: 'Create Segment', icon: Filter, color: 'text-pink-600 bg-pink-50' },
                { label: 'Lead Reports', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition text-left">
                    <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">AI Insights</h3>
            </div>
            <div className="space-y-2.5">
              {aiInsights.slice(0, 3).map((ins) => (
                <div key={ins.title} className={`p-3 rounded-xl border ${ins.color}`}>
                  <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ins.desc}</p>
                  <button className="mt-1.5 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Sections ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Leads by Source</h3>
          {sourceData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No source data available</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="leads" paddingAngle={3}>
                    {sourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sourceData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.leads}</span>
                      <span className="text-slate-400 ml-1">({s.value}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversion Tracking */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Conversion Tracking</h3>
          <div className="space-y-3">
            {[
              { stage: 'Total Leads', count: totalLeads, pct: 100 },
              { stage: 'Qualified', count: leads.filter(l => l.status?.toLowerCase() === 'qualified').length, pct: totalLeads > 0 ? Math.round((leads.filter(l => l.status?.toLowerCase() === 'qualified').length / totalLeads) * 100) : 0 },
              { stage: 'Follow-up', count: leads.filter(l => l.status?.toLowerCase() === 'follow-up').length, pct: totalLeads > 0 ? Math.round((leads.filter(l => l.status?.toLowerCase() === 'follow-up').length / totalLeads) * 100) : 0 },
              { stage: 'Converted', count: converted, pct: totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0 },
            ].map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{stage.stage}</span>
                  <div className="text-right">
                    <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{stage.count.toLocaleString()}</span>
                    <span className="text-slate-400 ml-1">({stage.pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stage.pct}%`,
                      background: ['#4F46E5', '#2563EB', '#7C3AED', '#16A34A'][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <p className="text-xs font-bold text-green-700">Conversion Rate: {conversionRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Lead Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Lead Status Overview</h3>
          {leadStatusData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No status data available</p>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={leadStatusData.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={2}>
                      {leadStatusData.filter(s => s.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {leadStatusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-600 capitalize">{s.name}</span>
                    </div>
                    <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Lead Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-xs font-semibold text-blue-700">Total Leads</span>
              <span className="text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{totalLeads.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-xs font-semibold text-green-700">Converted</span>
              <span className="text-sm font-extrabold text-green-600">{converted}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
              <span className="text-xs font-semibold text-violet-700">New Today</span>
              <span className="text-sm font-extrabold text-violet-600">{newToday}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <span className="text-xs font-semibold text-amber-700">Avg Quality</span>
              <span className="text-sm font-extrabold text-amber-600">{avgQuality}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assign Modal ── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800">Assign to Sales</h3>
                <button onClick={() => setAssignModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-700">{assignModal.name}</p>
                <p className="text-[10px] text-slate-400">{assignModal.email}</p>
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Assign to Sales Rep</label>
                {salesUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">No sales users found. Add users with Sales Executive role first.</p>
                ) : (
                  <select
                    value={assignTarget}
                    onChange={e => setAssignTarget(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
                  >
                    <option value="">Select sales rep...</option>
                    {salesUsers.map((u: SalesUser) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.active_leads} active leads)</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAssignModal(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={!assignTarget || assigning || salesUsers.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {assigning ? 'Assigning...' : 'Assign Lead'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
