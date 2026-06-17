'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Search, Loader2, Sparkles, RefreshCw,
  Edit2, Copy, Archive, X, Users, Calendar, ChevronDown,
  Send, CheckCircle2, AlertCircle, BarChart3, Clock,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  status: string;
  sent_count?: number;
  open_rate?: number;
  click_rate?: number;
  scheduled_at?: string;
  content?: { subject?: string; from_name?: string; from_email?: string; list_id?: string; audience?: string };
  type?: string;
  created_at?: string;
}

interface ContactList {
  id: string;
  name: string;
  contact_count: number;
}

interface CampaignStats {
  queued: number; sent: number; delivered: number; failed: number; total: number;
}

const STATUS_STYLES: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700',
  Paused:    'bg-amber-50 text-amber-700',
  Scheduled: 'bg-amber-50 text-amber-700',
  Completed: 'bg-slate-100 text-slate-600',
  Draft:     'bg-blue-50 text-blue-700',
  Sending:   'bg-violet-50 text-violet-700',
  Failed:    'bg-red-50 text-red-700',
};

const STATUSES = ['All', 'Draft', 'Scheduled', 'Sending', 'Completed', 'Failed'];

// ─── Create / Edit Modal ──────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onCreated: (c: Campaign) => void;
  contactLists: ContactList[];
}

function CreateModal({ onClose, onCreated, contactLists }: ModalProps) {
  const [form, setForm] = useState({
    name: '', subject: '', from_name: '', from_email: '',
    list_id: '', audience: 'all_subscribers', scheduled_at: '', body: '',
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Campaign name is required'); return; }
    if (!form.subject.trim()) { setError('Subject line is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/marketing/campaigns', {
        name: form.name,
        type: 'Email',
        status: form.scheduled_at ? 'Scheduled' : 'Draft',
        scheduled_at: form.scheduled_at || undefined,
        content: {
          subject: form.subject,
          from_name: form.from_name,
          from_email: form.from_email,
          body: form.body,
          list_id: form.list_id || undefined,
          audience: form.audience,
        },
      });
      const created: Campaign = res.data?.data?.campaign || res.data?.campaign || res.data?.data;
      if (created) onCreated(created);
      else { onClose(); }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  function handleAiGenerate() {
    setAiLoading(true);
    setTimeout(() => {
      set('body', `<p>Hi {{name}},</p>\n\n<p>We have an exciting offer just for you!</p>\n\n<p>Click below to discover more about our latest products and services.</p>\n\n<p>Best regards,<br/>${form.from_name || 'The Team'}</p>`);
      if (!form.subject) set('subject', 'An exciting offer awaits you!');
      setAiLoading(false);
    }, 1000);
  }

  const inp = 'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1f1f1f] shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Create Email Campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Campaign Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="e.g. Q3 Product Launch" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Subject Line *</label>
              <input value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Exclusive offer just for you!" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">From Name</label>
              <input value={form.from_name} onChange={e => set('from_name', e.target.value)}
                placeholder="HubNest Team" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">From Email</label>
              <input type="email" value={form.from_email} onChange={e => set('from_email', e.target.value)}
                placeholder="hello@yourcompany.com" className={inp} />
            </div>

            {/* Contact List — real data */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Contact List</label>
              <select value={form.list_id} onChange={e => set('list_id', e.target.value)} className={inp}>
                <option value="">— All leads with email —</option>
                {contactLists.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.contact_count} contacts)</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">Leave blank to send to all leads with an email address.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} className={inp} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">Email Body (HTML or plain text)</label>
              <button type="button" onClick={handleAiGenerate} disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition disabled:opacity-60">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </button>
            </div>
            <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={7}
              placeholder="Write your email content here. Use {{name}}, {{email}} for personalization."
              className={inp + ' resize-none font-mono text-xs'} />
            <p className="text-[10px] text-slate-400">Supports HTML. Use {'{{name}}'}, {'{{email}}'}, {'{{phone}}'} for personalization.</p>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-[#1f1f1f] shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Modal ──────────────────────────────────────────────

function StatsModal({ campaignId, campaignName, onClose }: { campaignId: string; campaignName: string; onClose: () => void }) {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetch() {
      try {
        const res = await api.get(`/marketing/campaigns/${campaignId}/stats`);
        if (active) setStats(res.data?.data?.stats || res.data?.stats);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetch();
    const t = setInterval(fetch, 4000);
    return () => { active = false; clearInterval(t); };
  }, [campaignId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800">Campaign Stats</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4 font-medium truncate">{campaignName}</p>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : stats ? (
          <div className="space-y-3">
            {[
              { label: 'Total Recipients', value: stats.total, color: 'text-slate-800' },
              { label: 'Sent', value: stats.sent, color: 'text-emerald-600' },
              { label: 'Queued', value: stats.queued, color: 'text-blue-600' },
              { label: 'Failed', value: stats.failed, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-600">{s.label}</span>
                <span className={`text-sm font-black ${s.color}`}>{s.value ?? 0}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 text-center pt-1">Auto-refreshes every 4s while sending</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No stats available yet</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [statsModal, setStatsModal] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [campRes, listsRes] = await Promise.all([
        api.get('/marketing/campaigns?type=Email'),
        api.get('/marketing/lists').catch(() => ({ data: { data: { lists: [] } } })),
      ]);
      const raw = campRes.data?.data?.campaigns || campRes.data?.campaigns || campRes.data?.data || campRes.data || [];
      setCampaigns(Array.isArray(raw) ? raw.filter((c: Campaign) => !c.type || c.type === 'Email') : []);
      const lists = listsRes.data?.data?.lists || listsRes.data?.lists || [];
      setContactLists(Array.isArray(lists) ? lists : []);
    } catch {
      setError('Failed to load campaigns. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSend(campaign: Campaign) {
    if (!confirm(`Send "${campaign.name}" to all recipients now?`)) return;
    setSending(campaign.id);
    setSuccessMsg('');
    try {
      const res = await api.post(`/marketing/campaigns/${campaign.id}/send`);
      const queued = res.data?.data?.queued || res.data?.queued || 0;
      setSuccessMsg(`Campaign queued for ${queued} recipient(s). Emails are being sent in the background.`);
      setTimeout(() => setSuccessMsg(''), 6000);
      fetchData();
      setStatsModal({ id: campaign.id, name: campaign.name });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send campaign';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(null);
    }
  }

  async function handleDuplicate(c: Campaign) {
    try {
      const res = await api.post('/marketing/campaigns', {
        name: `${c.name} (Copy)`, type: 'Email', status: 'Draft', content: c.content,
      });
      const created = res.data?.data?.campaign || res.data?.campaign;
      if (created) setCampaigns(prev => [created, ...prev]);
      else fetchData();
    } catch { fetchData(); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/marketing/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch { setError('Failed to delete campaign'); }
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const sending_count = campaigns.filter(c => c.status === 'Sending').length;
  const completed = campaigns.filter(c => c.status === 'Completed').length;
  const draft = campaigns.filter(c => c.status === 'Draft').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Email Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and send email campaigns to your contact lists</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Email Campaign
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, icon: Mail, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Sent', value: totalSent.toLocaleString(), icon: Send, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Draft', value: draft, icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-[#ededed]">
                {loading ? '—' : s.value}
              </p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#333] text-slate-600 hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SMTP notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>SMTP required to send:</strong> Go to <strong>Integrations → SMTP</strong> and add your SMTP credentials (Gmail, Mailgun, etc.), or set <code>SMTP_USER</code> / <code>SMTP_PASS</code> in the server <code>.env</code> file.
        </span>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-16 text-center">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-[#ededed]">No email campaigns yet</p>
          <p className="text-xs text-slate-500 mt-1">Create your first email campaign to get started</p>
          <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition mx-auto">
            <Plus className="w-3.5 h-3.5" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-3">
              {/* Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#ededed] truncate">{c.name}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[c.status] || STATUS_STYLES.Draft}`}>
                  {c.status}
                </span>
              </div>

              {/* Subject */}
              {c.content?.subject && (
                <p className="text-xs text-slate-500 truncate">Subject: <span className="font-medium text-slate-700">{c.content.subject}</span></p>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Sent: <span className="font-semibold text-slate-700">{c.sent_count?.toLocaleString() ?? '0'}</span></span>
                </div>
                {c.scheduled_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="truncate">{new Date(c.scheduled_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Sending progress bar */}
              {c.status === 'Sending' && (
                <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full animate-pulse w-2/3" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-[#1f1f1f] flex-wrap">
                {/* Send button — only for Draft/Scheduled/Failed */}
                {['Draft', 'Scheduled', 'Failed'].includes(c.status) && (
                  <button
                    onClick={() => handleSend(c)}
                    disabled={sending === c.id}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition disabled:opacity-60"
                  >
                    {sending === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {sending === c.id ? 'Sending...' : 'Send Now'}
                  </button>
                )}
                {/* Stats button */}
                <button
                  onClick={() => setStatsModal({ id: c.id, name: c.name })}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Stats
                </button>
                <button
                  onClick={() => handleDuplicate(c)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-slate-50 transition ml-auto"
                >
                  <Archive className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={c => { setCampaigns(prev => [c, ...prev]); setShowModal(false); }}
          contactLists={contactLists}
        />
      )}

      {/* Stats Modal */}
      {statsModal && (
        <StatsModal
          campaignId={statsModal.id}
          campaignName={statsModal.name}
          onClose={() => setStatsModal(null)}
        />
      )}
    </div>
  );
}
