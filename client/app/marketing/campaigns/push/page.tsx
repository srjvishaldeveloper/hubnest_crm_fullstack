'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Plus, Search, Loader2, RefreshCw, Trash2,
  CheckCircle, X, Users, Send, MousePointerClick,
  BellOff, Calendar, ToggleLeft, ToggleRight, ChevronDown,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface PushCampaign {
  id: string | number;
  name: string;
  title: string;
  body?: string;
  image_url?: string;
  target_url?: string;
  audience_segment?: string;
  status: string;
  sent_count?: number;
  clicked_count?: number;
  scheduled_at?: string;
  type: string;
}

interface FormState {
  name: string;
  title: string;
  body: string;
  image_url: string;
  target_url: string;
  audience_segment: string;
  scheduled_at: string;
  send_now: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Draft:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Paused:    'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

const SEGMENTS = ['All Subscribers', 'New Users', 'Active Users', 'Lapsed Users', 'Premium Users'];

const EMPTY_FORM: FormState = {
  name: '', title: '', body: '', image_url: '',
  target_url: '', audience_segment: 'All Subscribers',
  scheduled_at: '', send_now: true,
};

// ─── Component ────────────────────────────────────────────────

export default function PushNotificationCampaigns() {
  const [campaigns, setCampaigns]   = useState<PushCampaign[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating]     = useState(false);
  const [bodyCount, setBodyCount]   = useState(0);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns', { params: { type: 'Push' } });
      const data: PushCampaign[] = res.data?.campaigns || res.data?.data || [];
      setCampaigns(data);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filtered = campaigns.filter(c =>
    search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    subscribers: campaigns.reduce((a, c) => a + (c.sent_count || 0), 0),
    sent_today:  campaigns.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === new Date().toDateString()).length,
    click_rate:  campaigns.length ? Math.round(campaigns.reduce((a, c) => a + ((c.clicked_count || 0) / Math.max(c.sent_count || 1, 1)) * 100, 0) / campaigns.length) : 0,
    opt_out:     2,
  };

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    if (k === 'body') setBodyCount(String(v).length);
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      showToast('Name, Title and Body are required.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        ...form,
        type: 'Push',
        status: form.send_now ? 'Active' : 'Scheduled',
        scheduled_at: form.send_now ? null : form.scheduled_at,
      };
      const res = await api.post('/campaigns', payload);
      const created: PushCampaign = res.data?.campaign || { id: Date.now(), ...payload };
      setCampaigns(prev => [created, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setBodyCount(0);
      showToast('Push campaign created.');
    } catch {
      showToast('Failed to create campaign.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string | number) {
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      showToast('Campaign deleted.');
    } catch { showToast('Delete failed.'); }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0e0e0e] p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 dark:bg-[#1f1f1f] text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Push Notification Campaigns</h1>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Send targeted push notifications to your subscribers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCampaigns} className="p-2 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
            <Plus size={13} /> Create Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Subscribers',  value: stats.subscribers.toLocaleString(), icon: Users,            color: 'text-blue-600' },
          { label: 'Sent Today',   value: stats.sent_today.toString(),         icon: Send,             color: 'text-emerald-600' },
          { label: 'Click Rate',   value: `${stats.click_rate}%`,              icon: MousePointerClick, color: 'text-violet-600' },
          { label: 'Opt-out Rate', value: `${stats.opt_out}%`,                 icon: BellOff,          color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <s.icon size={15} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{loading ? '–' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
          </div>
          <span className="text-xs text-slate-500 dark:text-[#a3a3a3] ml-auto">{filtered.length} campaigns</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                {['Campaign Name', 'Title', 'Audience', 'Status', 'Sent', 'Clicked', 'Scheduled', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-blue-500" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Bell size={32} className="mx-auto text-slate-300 dark:text-[#333] mb-3" />
                  <p className="text-slate-400 dark:text-[#a3a3a3] font-semibold">No push campaigns yet</p>
                  <p className="text-slate-400 dark:text-[#a3a3a3] text-[10px] mt-1">Create your first push notification campaign.</p>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-[#1a1a1a] hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-[#ededed]">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3] max-w-[160px] truncate">{c.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{c.audience_segment || 'All'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3]">{(c.sent_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3]">{(c.clicked_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '–'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Create Push Campaign</h3>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setBodyCount(0); }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400 transition">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Campaign Name *', key: 'name', placeholder: 'e.g. Summer Sale Push' },
                { label: 'Notification Title *', key: 'title', placeholder: 'e.g. 50% Off Today Only!' },
                { label: 'Image URL (optional)', key: 'image_url', placeholder: 'https://...' },
                { label: 'Target URL', key: 'target_url', placeholder: 'https://...' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">{label}</label>
                  <input value={form[key as keyof FormState] as string}
                    onChange={e => setField(key as keyof FormState, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 flex justify-between">
                  <span>Body *</span>
                  <span className={`font-normal ${bodyCount > 100 ? 'text-red-500' : 'text-slate-400 dark:text-[#a3a3a3]'}`}>{bodyCount}/100</span>
                </label>
                <textarea rows={3} maxLength={100} value={form.body} onChange={e => setField('body', e.target.value)}
                  placeholder="Notification message (max 100 chars)…"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Audience Segment</label>
                <div className="relative">
                  <select value={form.audience_segment} onChange={e => setField('audience_segment', e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold pr-8">
                    {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#ededed]">Send Now</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3]">Send immediately instead of scheduling</p>
                </div>
                <button onClick={() => setField('send_now', !form.send_now)}>
                  {form.send_now ? <ToggleRight size={24} className="text-blue-600" /> : <ToggleLeft size={24} className="text-slate-300 dark:text-[#333]" />}
                </button>
              </div>
              {!form.send_now && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Schedule Date & Time</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setField('scheduled_at', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setBodyCount(0); }}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#252525] transition">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                {creating && <Loader2 size={12} className="animate-spin" />}
                {form.send_now ? 'Send Now' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
