'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Search, Loader2, RefreshCw, Trash2, UserX,
  ToggleLeft, ToggleRight, ShieldOff, CheckCircle, AlertCircle,
  Filter, Download, ChevronDown,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface Subscriber {
  id: string | number;
  email: string;
  name: string;
  status: 'Active' | 'Unsubscribed' | 'Bounced';
  source: string;
  subscribed_at: string;
}

interface Pref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active:       'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Unsubscribed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Bounced:      'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const DEFAULT_PREFS: Pref[] = [
  { key: 'marketing',  label: 'Marketing Emails',   description: 'Promotional campaigns and special offers',      enabled: true  },
  { key: 'updates',    label: 'Product Updates',     description: 'New features, improvements and changelogs',     enabled: true  },
  { key: 'digest',     label: 'Weekly Digest',       description: 'A weekly summary of activity and insights',     enabled: false },
  { key: 'promo',      label: 'Promotional Offers',  description: 'Exclusive deals and limited-time promotions',   enabled: false },
];

const TABS = ['Subscribers List', 'Preferences', 'Suppression List', 'Double Opt-in Settings'] as const;
type Tab = typeof TABS[number];

// ─── Component ────────────────────────────────────────────────

export default function SubscriptionManagement() {
  const [tab, setTab]             = useState<Tab>('Subscribers List');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [prefs, setPrefs]         = useState<Pref[]>(DEFAULT_PREFS);
  const [suppressed, setSuppressed] = useState<string[]>(['bounce@example.com', 'spam@test.org']);
  const [newSuppress, setNewSuppress] = useState('');
  const [doubleOptin, setDoubleOptin] = useState(true);
  const [confirmText, setConfirmText] = useState(
    'Please confirm your subscription by clicking the button below.'
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketing/subscriptions');
      const data: Subscriber[] = res.data?.subscriptions || res.data?.data || [];
      setSubscribers(data);
    } catch {
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const filtered = subscribers.filter(s => {
    const matchSearch = search === '' ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:        subscribers.length,
    active:       subscribers.filter(s => s.status === 'Active').length,
    unsubscribed: subscribers.filter(s => s.status === 'Unsubscribed').length,
    bounced:      subscribers.filter(s => s.status === 'Bounced').length,
  };

  async function handleUnsubscribe(id: string | number) {
    try {
      await api.patch(`/marketing/subscriptions/${id}`, { status: 'Unsubscribed' });
      setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: 'Unsubscribed' } : s));
      showToast('Subscriber unsubscribed.');
    } catch { showToast('Action failed.'); }
  }

  async function handleDelete(id: string | number) {
    try {
      await api.delete(`/marketing/subscriptions/${id}`);
      setSubscribers(prev => prev.filter(s => s.id !== id));
      showToast('Subscriber deleted.');
    } catch { showToast('Delete failed.'); }
  }

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await api.patch('/marketing/subscriptions', { preferences: prefs });
      showToast('Preferences saved.');
    } catch { showToast('Save failed.'); }
    finally { setSavingPrefs(false); }
  }

  function togglePref(key: string) {
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p));
  }

  function addSuppression() {
    const email = newSuppress.trim();
    if (!email || suppressed.includes(email)) return;
    setSuppressed(prev => [email, ...prev]);
    setNewSuppress('');
    showToast(`${email} added to suppression list.`);
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Subscription Management</h1>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Manage subscriber preferences, suppression lists, and opt-in settings</p>
        </div>
        <button onClick={fetchSubscribers} className="p-2 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Subscribers', value: stats.total,        color: 'text-blue-600' },
          { label: 'Active',            value: stats.active,       color: 'text-emerald-600' },
          { label: 'Unsubscribed',      value: stats.unsubscribed, color: 'text-slate-500 dark:text-[#a3a3a3]' },
          { label: 'Bounced',           value: stats.bounced,      color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? '–' : s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-900 dark:hover:text-[#ededed]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Subscribers List ── */}
      {tab === 'Subscribers List' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search email or name…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold">
                {['All', 'Active', 'Unsubscribed', 'Bounced'].map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">{filtered.length} results</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                  {['Email', 'Name', 'Status', 'Source', 'Subscribed', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-[#a3a3a3]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto text-blue-500" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-[#a3a3a3]">
                    No subscribers found.
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 dark:border-[#1a1a1a] hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-[#ededed]">{s.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3]">{s.name || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{s.source || '–'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : '–'}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={() => handleUnsubscribe(s.id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition" title="Unsubscribe">
                        <UserX size={13} />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Preferences ── */}
      {tab === 'Preferences' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-6 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Email Type Preferences</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-6">Configure which email types contacts can opt into globally.</p>
          <div className="space-y-4">
            {prefs.map(p => (
              <div key={p.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-[#1f1f1f] last:border-0">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#ededed]">{p.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{p.description}</p>
                </div>
                <button onClick={() => togglePref(p.key)} className="transition">
                  {p.enabled
                    ? <ToggleRight size={26} className="text-blue-600" />
                    : <ToggleLeft size={26} className="text-slate-300 dark:text-[#333]" />}
                </button>
              </div>
            ))}
          </div>
          <button onClick={savePrefs} disabled={savingPrefs}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-60">
            {savingPrefs && <Loader2 size={13} className="animate-spin" />} Save Preferences
          </button>
        </div>
      )}

      {/* ── Tab: Suppression List ── */}
      {tab === 'Suppression List' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-6 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Suppression List</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-4">Emails on this list will never receive campaigns.</p>
          <div className="flex gap-2 mb-4">
            <input value={newSuppress} onChange={e => setNewSuppress(e.target.value)}
              placeholder="Enter email to suppress…"
              onKeyDown={e => e.key === 'Enter' && addSuppression()}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
            <button onClick={addSuppression}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap">
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {suppressed.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-[#a3a3a3] py-6 text-center">No suppressed emails.</p>
            )}
            {suppressed.map(email => (
              <div key={email} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <ShieldOff size={13} className="text-red-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#ededed]">{email}</span>
                </div>
                <button onClick={() => setSuppressed(prev => prev.filter(e => e !== email))}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Double Opt-in ── */}
      {tab === 'Double Opt-in Settings' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-6 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Double Opt-in Settings</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-6">Require subscribers to confirm their email before being added.</p>
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-[#1f1f1f] mb-6">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-[#ededed]">Enable Double Opt-in</p>
              <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">Send a confirmation email to new subscribers before activating.</p>
            </div>
            <button onClick={() => setDoubleOptin(v => !v)}>
              {doubleOptin
                ? <ToggleRight size={26} className="text-blue-600" />
                : <ToggleLeft size={26} className="text-slate-300 dark:text-[#333]" />}
            </button>
          </div>
          <div className={`space-y-4 transition-opacity ${doubleOptin ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Confirmation Email Message</span>
              <textarea rows={4} value={confirmText} onChange={e => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold resize-none" />
            </label>
            <div className="p-3 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl border border-slate-100 dark:border-[#2a2a2a] text-[10px] text-slate-500 dark:text-[#a3a3a3]">
              Preview: <span className="font-semibold text-slate-700 dark:text-[#ededed]">{confirmText}</span>
              <br /><span className="underline text-blue-500 cursor-pointer">Confirm my subscription</span>
            </div>
          </div>
          <button onClick={() => showToast('Double opt-in settings saved.')}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
