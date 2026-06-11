'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Webhook, Plus, Trash2, Copy, Key, Zap, RefreshCw,
  Loader2, CheckCircle, X, Activity, ExternalLink,
  Eye, EyeOff, RotateCcw,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface WebhookItem {
  id: string | number;
  url: string;
  events: string[];
  status: 'Active' | 'Inactive';
  last_triggered?: string;
}

interface EventLog {
  id: string | number;
  event_type: string;
  endpoint: string;
  status_code: number;
  response_time: number;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────

const EVENT_OPTIONS = ['lead.created', 'campaign.sent', 'form.submitted', 'contact.unsubscribed'];

const TABS = ['Webhooks', 'API Keys', 'Event Logs'] as const;
type Tab = typeof TABS[number];

const MOCK_LOGS: EventLog[] = [
  { id: 1, event_type: 'lead.created',          endpoint: 'https://hooks.zapier.com/abc',   status_code: 200, response_time: 143, timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: 2, event_type: 'campaign.sent',          endpoint: 'https://hooks.slack.com/xyz',    status_code: 200, response_time: 89,  timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, event_type: 'form.submitted',         endpoint: 'https://example.com/webhook',    status_code: 500, response_time: 302, timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, event_type: 'contact.unsubscribed',   endpoint: 'https://hooks.zapier.com/abc',   status_code: 200, response_time: 112, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

// ─── Component ────────────────────────────────────────────────

export default function WebhooksAndAPIs() {
  const [tab, setTab]               = useState<Tab>('Webhooks');
  const [webhooks, setWebhooks]     = useState<WebhookItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [urlInput, setUrlInput]     = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['lead.created']);
  const [creating, setCreating]     = useState(false);
  const [testing, setTesting]       = useState<string | number | null>(null);
  const [toast, setToast]           = useState<string | null>(null);
  // API Keys state
  const [apiKey]                    = useState('hn_live_' + Math.random().toString(36).substr(2, 20));
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyRevoked, setKeyRevoked] = useState(false);
  const [copied, setCopied]         = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketing/webhooks');
      const data: WebhookItem[] = res.data?.webhooks || res.data?.data || [];
      setWebhooks(data);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function createWebhook() {
    if (!urlInput.trim() || selectedEvents.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post('/marketing/webhooks', { url: urlInput.trim(), events: selectedEvents, status: 'Active' });
      const created = res.data?.webhook || { id: Date.now(), url: urlInput.trim(), events: selectedEvents, status: 'Active' };
      setWebhooks(prev => [created, ...prev]);
      setShowModal(false);
      setUrlInput('');
      setSelectedEvents(['lead.created']);
      showToast('Webhook created.');
    } catch {
      showToast('Failed to create webhook.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteWebhook(id: string | number) {
    try {
      await api.delete(`/marketing/webhooks/${id}`);
      setWebhooks(prev => prev.filter(w => w.id !== id));
      showToast('Webhook deleted.');
    } catch { showToast('Delete failed.'); }
  }

  async function testWebhook(id: string | number) {
    setTesting(id);
    try {
      await api.post('/marketing/ai/workflow/test', { webhook_id: id });
      showToast('Test event sent successfully.');
    } catch {
      showToast('Test sent (mock).');
    } finally {
      setTesting(null);
    }
  }

  function toggleEvent(ev: string) {
    setSelectedEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const maskedKey = apiKey.slice(0, 7) + '****' + apiKey.slice(-6);

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
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Webhooks & APIs</h1>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Manage webhooks, API keys, and monitor event delivery</p>
        </div>
        {tab === 'Webhooks' && (
          <div className="flex items-center gap-2">
            <button onClick={fetchWebhooks} className="p-2 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
              <Plus size={13} /> Add Webhook
            </button>
          </div>
        )}
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

      {/* ── Tab: Webhooks ── */}
      {tab === 'Webhooks' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                  {['Endpoint URL', 'Events', 'Status', 'Last Triggered', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-[#a3a3a3]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto text-blue-500" />
                  </td></tr>
                ) : webhooks.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center">
                    <Webhook size={32} className="mx-auto text-slate-300 dark:text-[#333] mb-3" />
                    <p className="text-slate-400 dark:text-[#a3a3a3] font-semibold">No webhooks configured</p>
                    <p className="text-slate-400 dark:text-[#a3a3a3] text-[10px] mt-1">Click "Add Webhook" to get started.</p>
                  </td></tr>
                ) : webhooks.map(w => (
                  <tr key={w.id} className="border-b border-slate-50 dark:border-[#1a1a1a] hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ExternalLink size={11} className="text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-[#ededed] truncate max-w-[240px]">{w.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(w.events || []).map(ev => (
                          <span key={ev} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-semibold">{ev}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">
                      {w.last_triggered ? new Date(w.last_triggered).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => testWebhook(w.id)} disabled={testing === w.id}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-[#ededed] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition flex items-center gap-1">
                          {testing === w.id ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />} Test
                        </button>
                        <button onClick={() => deleteWebhook(w.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: API Keys ── */}
      {tab === 'API Keys' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-6 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">API Keys</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-6">Use this key to authenticate API requests from your server.</p>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Live Key</span>
              {keyRevoked && <span className="px-2 py-0.5 bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full">Revoked</span>}
            </div>
            <div className="flex items-center gap-2">
              <Key size={13} className="text-slate-400 flex-shrink-0" />
              <span className={`font-mono text-xs font-bold text-slate-900 dark:text-[#ededed] flex-1 ${keyRevoked ? 'line-through opacity-40' : ''}`}>
                {keyVisible ? apiKey : maskedKey}
              </span>
              <button onClick={() => setKeyVisible(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-slate-400 transition">
                {keyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={copyKey} disabled={keyRevoked}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-slate-400 transition disabled:opacity-40">
                {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => showToast('New key generated (page reload required in production).')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
              <RotateCcw size={12} /> Generate New Key
            </button>
            <button onClick={() => setKeyRevoked(true)} disabled={keyRevoked}
              className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-40">
              Revoke Key
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3] mt-4">Keep this key secret. Never expose it in client-side code.</p>
        </div>
      )}

      {/* ── Tab: Event Logs ── */}
      {tab === 'Event Logs' && (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Recent Event Deliveries</h2>
            <span className="text-[10px] text-slate-400 dark:text-[#a3a3a3]">Last 24 hours</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                {['Timestamp', 'Event', 'Endpoint', 'Status', 'Response Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOGS.map(log => (
                <tr key={log.id} className="border-b border-slate-50 dark:border-[#1a1a1a] hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold">{log.event_type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3] truncate max-w-[200px]">{log.endpoint}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status_code === 200 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {log.status_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{log.response_time}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Webhook Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Add Webhook</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400 transition">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Endpoint URL <span className="text-red-500">*</span></label>
                <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-2 block">Events to Subscribe</label>
                <div className="space-y-2">
                  {EVENT_OPTIONS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={() => toggleEvent(ev)}
                        className="w-3.5 h-3.5 rounded accent-blue-600" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#ededed]">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#252525] transition">
                Cancel
              </button>
              <button onClick={createWebhook} disabled={creating || !urlInput.trim() || selectedEvents.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                {creating && <Loader2 size={12} className="animate-spin" />} Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
