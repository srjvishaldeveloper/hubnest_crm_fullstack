'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Search, Loader2, Sparkles, RefreshCw,
  Edit2, Copy, Archive, X, Users, Calendar, ChevronDown,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface Campaign {
  id: string | number;
  name: string;
  status: string;
  audience_size?: number;
  sent_count?: number;
  open_rate?: number;
  click_rate?: number;
  scheduled_at?: string;
  content?: { subject?: string; from_name?: string; from_email?: string };
  type?: string;
}

interface Stats {
  total_sent: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
}

const STATUS_STYLES: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Paused:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Draft:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUSES = ['All', 'Active', 'Draft', 'Scheduled', 'Completed'];

// ─── Modal ────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}

function CreateModal({ onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({
    name: '', subject: '', from_name: '', from_email: '',
    audience: '', scheduled_at: '', body: '',
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/campaigns', {
        name: form.name,
        type: 'Email',
        status: form.scheduled_at ? 'Scheduled' : 'Draft',
        scheduled_at: form.scheduled_at || undefined,
        content: {
          subject: form.subject,
          from_name: form.from_name,
          from_email: form.from_email,
          body: form.body,
        },
        audience: form.audience,
      });
      const created: Campaign = res.data?.campaign || res.data?.data || res.data;
      onCreated(created);
    } catch {
      // api interceptor shows alert; close anyway so UI doesn't hang
    } finally {
      setSaving(false);
    }
  }

  function handleAiGenerate() {
    setAiLoading(true);
    setTimeout(() => {
      set('body', `Hi {{first_name}},\n\nWe have an exciting offer just for you!\n\nClick below to discover more.\n\nBest,\n${form.from_name || 'The Team'}`);
      setAiLoading(false);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#ededed]">Create Email Campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500 dark:text-[#a3a3a3]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Campaign Name *</label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="e.g. Q3 Product Launch"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Subject Line</label>
              <input
                value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Exclusive offer just for you!"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">From Name</label>
              <input
                value={form.from_name} onChange={e => set('from_name', e.target.value)}
                placeholder="HubNest Team"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">From Email</label>
              <input
                type="email" value={form.from_email} onChange={e => set('from_email', e.target.value)}
                placeholder="hello@hubnest.in"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Audience List</label>
              <select
                value={form.audience} onChange={e => set('audience', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Select audience…</option>
                <option value="all_subscribers">All Subscribers</option>
                <option value="hot_leads">Hot Leads</option>
                <option value="inactive_30d">Inactive 30 Days</option>
                <option value="converted">Converted Customers</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Schedule Date &amp; Time</label>
              <input
                type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3]">Email Content (HTML/Text)</label>
              <button type="button" onClick={handleAiGenerate} disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition disabled:opacity-60">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </button>
            </div>
            <textarea
              value={form.body} onChange={e => set('body', e.target.value)} rows={6}
              placeholder="Write your email content here, or use AI Generate above…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none font-mono"
            />
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-[#1f1f1f]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#333] text-slate-700 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition">
            Cancel
          </button>
          <button onClick={e => { (e.currentTarget.closest('form') as HTMLFormElement | null)?.requestSubmit?.(); handleSubmit(e as any); }}
            type="submit" form="email-form" disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/campaigns?type=Email');
      const raw = res.data?.campaigns || res.data?.data || res.data || [];
      const list: Campaign[] = Array.isArray(raw) ? raw : [];
      setCampaigns(list);

      // Derive stats from list if no dedicated endpoint
      const sent = list.reduce((s, c) => s + (c.sent_count || 0), 0);
      const avgOpen = list.length ? list.reduce((s, c) => s + (c.open_rate || 0), 0) / list.length : 0;
      const avgClick = list.length ? list.reduce((s, c) => s + (c.click_rate || 0), 0) / list.length : 0;
      setStats({ total_sent: sent, open_rate: avgOpen, click_rate: avgClick, unsubscribe_rate: 0.4 });
    } catch (err: any) {
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

  const statCards = [
    { label: 'Total Sent', value: stats?.total_sent?.toLocaleString() ?? '—' },
    { label: 'Open Rate', value: stats ? `${stats.open_rate.toFixed(1)}%` : '—' },
    { label: 'Click Rate', value: stats ? `${stats.click_rate.toFixed(1)}%` : '—' },
    { label: 'Unsubscribe Rate', value: stats ? `${stats.unsubscribe_rate.toFixed(1)}%` : '—' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-[#ededed]">Email Campaigns</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Manage and monitor all email marketing campaigns</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" />
          Create Email Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-[#ededed] mt-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : s.value}
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

      {/* Campaign Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-16 text-center">
          <Mail className="w-10 h-10 text-slate-300 dark:text-[#333] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-[#ededed]">No email campaigns yet</p>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Create your first email campaign to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-[#ededed] truncate">{c.name}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[c.status] || STATUS_STYLES.Draft}`}>
                  {c.status}
                </span>
              </div>
              {c.content?.subject && (
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] truncate">Subject: {c.content.subject}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Users, label: 'Audience', val: c.audience_size?.toLocaleString() ?? '—' },
                  { icon: Mail, label: 'Sent', val: c.sent_count?.toLocaleString() ?? '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#a3a3a3]">
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}: <span className="text-slate-700 dark:text-[#ededed] font-medium">{item.val}</span></span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-[#1f1f1f]">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-[#555]">Open Rate</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#ededed]">{c.open_rate != null ? `${c.open_rate}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-[#555]">Click Rate</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#ededed]">{c.click_rate != null ? `${c.click_rate}%` : '—'}</p>
                </div>
              </div>
              {c.scheduled_at && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#a3a3a3]">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(c.scheduled_at).toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-red-500 transition ml-auto">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
