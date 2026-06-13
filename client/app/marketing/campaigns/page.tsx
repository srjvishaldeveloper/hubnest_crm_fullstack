'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import {
  Plus, Search, Filter, Megaphone, Users, DollarSign, TrendingUp, BarChart3,
  MoreVertical, Edit2, Pause, Copy, Trash2, AlertTriangle, ChevronDown,
  Sparkles, CheckCircle2, FileText, Settings, Zap, Target, Activity,
  ArrowUpRight, ChevronRight, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────

interface Campaign {
  id: number;
  name: string;
  type?: string;
  platform: string;
  budget: number;
  leads_count?: number;
  cost_per_lead?: number;
  roi?: number;
  status: string;
  badge?: string | null;
}

// ─── Static data (non-API) ────────────────────────────────────

const aiInsights = [
  { title: 'Scale Facebook', desc: 'Facebook ROI 245% — increase budget for 40+ extra leads.', action: 'Scale Up', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Pause Email Drip', desc: 'Email ROI 88% — below target. Pause to save ₹8K.', action: 'Pause Now', color: 'border-red-200 bg-red-50/50' },
  { title: 'A/B Test Instagram', desc: 'Test 2 creatives on Instagram to find top performer.', action: 'Create Test', color: 'border-pink-200 bg-pink-50/50' },
  { title: 'LinkedIn Opportunity', desc: 'B2B leads from LinkedIn have highest LTV. Increase budget.', action: 'Boost Budget', color: 'border-sky-200 bg-sky-50/50' },
  { title: 'Retargeting Fix', desc: 'Website retargeting CPL too high. Adjust audience segments.', action: 'Fix Now', color: 'border-amber-200 bg-amber-50/50' },
];

const featureCards = [
  { title: 'A/B Testing', desc: 'Test variations', icon: Activity, color: 'bg-violet-50 border-violet-100 text-violet-600' },
  { title: 'Automation', desc: 'Auto-rules', icon: Zap, color: 'bg-blue-50 border-blue-100 text-blue-600' },
  { title: 'Budget Manager', desc: 'Track spend', icon: DollarSign, color: 'bg-amber-50 border-amber-100 text-amber-600' },
  { title: 'Lead Management', desc: 'Manage leads', icon: Users, color: 'bg-green-50 border-green-100 text-green-600' },
  { title: 'Reports', desc: 'Export anytime', icon: FileText, color: 'bg-pink-50 border-pink-100 text-pink-600' },
  { title: 'AI Optimiser', desc: 'Smart bidding', icon: Sparkles, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
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
    YouTube: { label: 'YT', cls: 'bg-red-100 text-red-600' },
    Twitter: { label: 'TW', cls: 'bg-sky-100 text-sky-600' },
  };
  const p = map[platform] ?? { label: platform?.slice(0, 2) || '??', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.cls}`}>{p.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    Paused: 'bg-amber-100 text-amber-700',
    paused: 'bg-amber-100 text-amber-700',
    Draft: 'bg-slate-100 text-slate-600',
    draft: 'bg-slate-100 text-slate-600',
    Ended: 'bg-red-100 text-red-700',
    ended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      <span className="ml-3 text-sm text-slate-500 font-medium">Loading campaigns...</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [processing, setProcessing] = useState<number | 'bulk' | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/marketing/campaigns');
        const data = res.data?.data?.campaigns || res.data?.campaigns || res.data?.data || res.data || [];
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const handleAction = async (id: number, action: string) => {
    setProcessing(id);
    try {
      if (action === 'Delete') {
        if (!confirm('Are you sure you want to delete this campaign?')) return setProcessing(null);
        await api.delete(`/marketing/campaigns/${id}`);
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } else if (action === 'Pause') {
        const c = campaigns.find(x => x.id === id);
        const newStatus = c?.status.toLowerCase() === 'active' ? 'paused' : 'active';
        await api.patch(`/marketing/campaigns/${id}`, { status: newStatus });
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else if (action === 'Duplicate') {
        const c = campaigns.find(x => x.id === id);
        if (c) {
          const res = await api.post('/marketing/campaigns', { ...c, name: `${c.name} (Copy)`, id: undefined, status: 'draft' });
          if (res.data?.data) setCampaigns(prev => [res.data.data, ...prev]);
          else fetchCampaigns();
        }
      }
    } catch {}
    setProcessing(null);
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} campaigns?`)) return;
    setProcessing('bulk');
    try {
      await Promise.all(selected.map(id => api.delete(`/marketing/campaigns/${id}`)));
      setCampaigns(prev => prev.filter(c => !selected.includes(c.id)));
      setSelected([]);
    } catch {}
    setProcessing(null);
  };

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, visibleCount);

  const exportToCSV = () => {
    if (campaigns.length === 0) return;
    const headers = ['ID', 'Name', 'Type', 'Platform', 'Status', 'Budget', 'Leads', 'CPL', 'ROI'];
    const rows = campaigns.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.type || 'N/A',
      c.platform || 'N/A',
      c.status,
      c.budget || 0,
      c.leads_count || 0,
      c.cost_per_lead || 0,
      c.roi || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaigns_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats from API data
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_count ?? 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget ?? 0), 0);
  const avgCpl = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
  const avgRoi = campaigns.length > 0
    ? Math.round(campaigns.reduce((sum, c) => sum + (c.roi ?? 0), 0) / campaigns.length)
    : 0;

  const statsCards = [
    { label: 'Active Campaigns', value: String(activeCampaigns), icon: Megaphone, color: 'text-violet-600 bg-violet-50' },
    { label: 'Leads Generated', value: totalLeads.toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Cost Spent', value: formatCurrency(totalSpent), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
    { label: 'Avg CPL', value: formatCurrency(avgCpl), icon: Target, color: 'text-pink-600 bg-pink-50' },
    { label: 'ROI This Month', value: `${avgRoi}%`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ];

  // Top/Low performers computed from API data
  const sortedByRoi = [...campaigns].sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
  const topCampaigns = sortedByRoi.filter(c => (c.roi ?? 0) >= 150).slice(0, 3);
  const lowCampaigns = sortedByRoi.filter(c => (c.roi ?? 0) < 150).slice(0, 3);

  // Lead source data derived from campaigns by platform
  const platformMap: Record<string, number> = {};
  campaigns.forEach(c => {
    const p = c.platform || 'Other';
    platformMap[p] = (platformMap[p] || 0) + (c.leads_count ?? 0);
  });
  const platformColors: Record<string, string> = {
    Facebook: '#4F46E5', Google: '#2563EB', Instagram: '#7C3AED',
    Website: '#0891B2', LinkedIn: '#0EA5E9', Email: '#16A34A', Other: '#64748B',
  };
  const leadSourceData = Object.entries(platformMap).map(([name, value]) => ({
    name,
    value,
    color: platformColors[name] || '#64748B',
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">Campaigns</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total: {campaigns.length} campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-52 focus-within:border-[#4F46E5] transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} disabled={processing === 'bulk'}
              className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {processing === 'bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete ({selected.length})
            </button>
          )}
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition">
            <Filter className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#1f1f1f] rounded-xl text-sm font-semibold text-slate-700 dark:text-[#ededed] hover:bg-slate-50 transition shadow-sm">
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <Link href="/marketing/campaigns/create" className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
      )}

      {/* ── Stats Cards ── */}
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

      {/* ── Two-column: Campaign List + Right Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Campaign List */}
        <div className="xl:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">
                {search ? 'No campaigns match your search' : 'No campaigns found'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Create your first campaign to get started.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input 
                      type="checkbox" 
                      checked={selected.includes(c.id)} 
                      onChange={e => setSelected(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
                      className="w-4 h-4 accent-[#4F46E5] rounded shrink-0 mr-1"
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-[#4F46E5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                        {(c.roi ?? 0) >= 200 && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Top Performer</span>}
                        {(c.roi ?? 0) < 100 && (c.roi ?? 0) > 0 && <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">Needs Attention</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <PlatformBadge platform={c.platform || 'N/A'} />
                        {c.type && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{c.type}</span>}
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  </div>
                  {/* 3-dot menu */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === c.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                          >
                            {[
                              { label: 'Edit', icon: Edit2, color: 'text-slate-700' },
                              { label: c.status.toLowerCase() === 'active' ? 'Pause' : 'Activate', icon: Pause, color: 'text-amber-600', action: 'Pause' },
                              { label: 'Duplicate', icon: Copy, color: 'text-blue-600' },
                              { label: 'Delete', icon: Trash2, color: 'text-red-500' },
                            ].map(item => {
                              const Icon = item.icon;
                              const act = item.action || item.label;
                              return (
                                <button key={item.label} onClick={() => { setMenuOpen(null); handleAction(c.id, act); }} className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:bg-[#161616] ${item.color}`}>
                                  {processing === c.id && (act === 'Delete' || act === 'Pause' || act === 'Duplicate') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />} {item.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-[#1f1f1f]">
                  {[
                    { label: 'Budget', val: formatCurrency(c.budget || 0) },
                    { label: 'Leads', val: c.leads_count ?? 0 },
                    { label: 'CPL', val: c.cost_per_lead ? formatCurrency(c.cost_per_lead) : '—' },
                    { label: 'ROI', val: `${c.roi ?? 0}%` },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <p className={`text-sm font-extrabold ${item.label === 'ROI' ? ((c.roi ?? 0) >= 180 ? 'text-green-600' : (c.roi ?? 0) >= 130 ? 'text-blue-600' : 'text-red-500') : 'text-[#0F172A] dark:text-[#F9FAFB]'}`}>
                        {item.val}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          {visibleCount < campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length && (
            <button
              onClick={() => setVisibleCount(v => v + 3)}
              className="w-full py-2.5 text-xs font-semibold text-[#4F46E5] bg-white border border-[#4F46E5]/30 rounded-xl hover:bg-violet-50 transition"
            >
              Load More ({campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length - visibleCount} remaining)
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create Campaign', icon: Plus, color: 'text-violet-600 bg-violet-50', link: '/marketing/campaigns/create' },
                { label: 'View Leads', icon: Users, color: 'text-blue-600 bg-blue-50', link: '/crm/leads' },
                { label: 'A/B Testing', icon: Activity, color: 'text-pink-600 bg-pink-50', link: '/marketing/campaigns/ab-testing' },
                { label: 'Automation', icon: Zap, color: 'text-indigo-600 bg-indigo-50', link: '/marketing/automation' },
                { label: 'Budget Manager', icon: DollarSign, color: 'text-amber-600 bg-amber-50', link: '/marketing/campaigns/budget' },
                { label: 'Export Reports (CSV)', icon: FileText, color: 'text-green-600 bg-green-50', action: exportToCSV },
              ].map(item => {
                const Icon = item.icon;
                
                const ButtonContent = (
                  <>
                    <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                  </>
                );

                if (item.link) {
                  return (
                    <Link key={item.label} href={item.link} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition text-left">
                      {ButtonContent}
                    </Link>
                  );
                }

                return (
                  <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition text-left">
                    {ButtonContent}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">AI Insights</h3>
            </div>
            <div className="space-y-3">
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
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Leads Summary */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Leads Summary</h3>
          {leadSourceData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No leads data available</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" paddingAngle={3}>
                      {leadSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-base font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{totalLeads.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400">Total</p>
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                {leadSourceData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cost & Budget */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Cost & Budget Overview</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Spent', value: formatCurrency(totalSpent), color: 'text-amber-600' },
              { label: 'Campaigns', value: String(campaigns.length), color: 'text-blue-600' },
              { label: 'Avg CPL', value: formatCurrency(avgCpl), color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top + Low Performing */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Top Performing</h3>
          {topCampaigns.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No top performers yet</p>
          ) : (
            <div className="space-y-2.5">
              {topCampaigns.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-green-50/50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <PlatformBadge platform={c.platform || 'N/A'} />
                  <p className="flex-1 text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                  <span className="text-xs font-extrabold text-green-600">{c.roi ?? 0}% ROI</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Low Performing</h3>
          {lowCampaigns.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">All campaigns performing well! 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {lowCampaigns.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <PlatformBadge platform={c.platform || 'N/A'} />
                  <p className="flex-1 text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                  <span className="text-xs font-extrabold text-red-500">{c.roi ?? 0}% ROI</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Campaign Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {featureCards.map((f) => {
            const Icon = f.icon;
            return (
              <button key={f.title} className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${f.color} transition hover:shadow-sm`}>
                <Icon className="w-5 h-5" />
                <p className="text-xs font-bold">{f.title}</p>
                <p className="text-[10px] text-slate-500">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">AI Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
              <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ins.desc}</p>
              <button className="mt-2 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
