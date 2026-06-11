'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Plus, Search, Loader2, RefreshCw,
  Edit2, Copy, Trash2, X, Users, ChevronDown,
  Target, Eye, MousePointerClick, IndianRupee,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface Campaign {
  id: string | number;
  name: string;
  status: string;
  objective?: string;
  platform?: string;
  budget?: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  cpl?: number;
  scheduled_at?: string;
}

const STATUS_STYLES: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Paused:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Draft:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUSES = ['All', 'Active', 'Draft', 'Scheduled', 'Completed', 'Paused'];

const OBJECTIVES = ['Lead Gen', 'Traffic', 'Awareness', 'Conversion'];
const PLATFORMS = ['Facebook', 'Instagram', 'Both'];

// ─── Modal ────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}

function CreateModal({ onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({
    name: '', objective: '', platform_target: '', budget: '', audience: '', scheduled_at: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/campaigns', {
        name: form.name,
        type: 'Meta',
        status: form.scheduled_at ? 'Scheduled' : 'Draft',
        scheduled_at: form.scheduled_at || undefined,
        objective: form.objective,
        platform: form.platform_target,
        budget: form.budget ? Number(form.budget) : undefined,
        audience: form.audience,
      });
      const created: Campaign = res.data?.campaign || res.data?.data || res.data;
      onCreated(created);
    } catch {
      // api interceptor handles alerts
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#ededed]">Create Meta Campaign</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500 dark:text-[#a3a3a3]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Campaign Name *</label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="e.g. Diwali Lead Generation"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Objective</label>
              <div className="relative">
                <select
                  value={form.objective} onChange={e => set('objective', e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select…</option>
                  {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Platform</label>
              <div className="relative">
                <select
                  value={form.platform_target} onChange={e => set('platform_target', e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select…</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Budget (₹)</label>
              <input
                type="number" min="0" value={form.budget} onChange={e => set('budget', e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Audience</label>
              <div className="relative">
                <select
                  value={form.audience} onChange={e => set('audience', e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select…</option>
                  <option value="lookalike">Lookalike Audience</option>
                  <option value="retargeting">Website Retargeting</option>
                  <option value="interest">Interest Based</option>
                  <option value="custom">Custom Audience</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Schedule Date &amp; Time</label>
            <input
              type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] text-slate-700 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium transition disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function MetaCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/campaigns?type=Meta');
      const raw = res.data?.campaigns || res.data?.data || res.data || [];
      setCampaigns(Array.isArray(raw) ? raw : []);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const avgCpl = campaigns.filter(c => c.cpl != null).length > 0
    ? campaigns.filter(c => c.cpl != null).reduce((s, c) => s + (c.cpl || 0), 0) / campaigns.filter(c => c.cpl != null).length
    : null;
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '—';

  const statCards = [
    { label: 'Total Reach', value: loading ? null : totalReach.toLocaleString(), icon: Users },
    { label: 'Impressions', value: loading ? null : totalImpressions.toLocaleString(), icon: Eye },
    { label: 'CTR', value: loading ? null : (totalImpressions > 0 ? `${overallCtr}%` : '—'), icon: MousePointerClick },
    { label: 'Avg. CPL', value: loading ? null : (avgCpl != null ? `₹${avgCpl.toFixed(0)}` : '—'), icon: IndianRupee },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-[#ededed]">Meta Campaigns</h1>
            <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">Facebook &amp; Instagram advertising campaigns</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-[#ededed]">
              {s.value === null ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#555]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-blue-700" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">{error}</p>
            <button onClick={fetchData} className="mt-3 text-sm text-blue-700 hover:underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Globe className="w-10 h-10 text-slate-300 dark:text-[#333] mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-[#ededed]">No Meta campaigns yet</p>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Create your first Facebook or Instagram campaign to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                  {['Campaign', 'Objective', 'Platform', 'Budget', 'Reach', 'Impressions', 'Clicks', 'CPL', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-[#a3a3a3] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                {filtered.map(c => {
                  const ctr = c.impressions && c.impressions > 0
                    ? `${(((c.clicks || 0) / c.impressions) * 100).toFixed(2)}%`
                    : '—';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <Globe className="w-3.5 h-3.5 text-blue-700" />
                          </div>
                          <span className="font-medium text-slate-900 dark:text-[#ededed] whitespace-nowrap">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.objective ? (
                          <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400">
                            <Target className="w-3.5 h-3.5" />
                            {c.objective}
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-[#a3a3a3]">{c.platform ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 text-xs text-slate-700 dark:text-[#ededed]">
                          <IndianRupee className="w-3 h-3" />
                          {c.budget != null ? c.budget.toLocaleString() : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-[#ededed]">{c.reach?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-[#ededed]">{c.impressions?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="text-slate-700 dark:text-[#ededed]">{c.clicks?.toLocaleString() ?? '—'}</span>
                          {c.impressions ? <span className="text-slate-400 ml-1">({ctr})</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 text-xs text-slate-700 dark:text-[#ededed]">
                          <IndianRupee className="w-3 h-3" />
                          {c.cpl != null ? c.cpl.toFixed(0) : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status] || STATUS_STYLES.Draft}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition text-slate-400 hover:text-blue-700">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition text-slate-400 hover:text-slate-600 dark:hover:text-[#ededed]">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={c => { setCampaigns(prev => [c, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
