'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Webhook, RefreshCw, XCircle, Plus, Trash2, X, Loader2, Link2, CheckCircle } from 'lucide-react';

interface WebhookSub {
  id: string;
  name: string;
  url: string;
  events: string;
  status: string;
  lastTriggered: string;
}

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<WebhookSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', events: 'lead.created, ticket.created' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHooks = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/webhooks')
      .then(r => setHooks(r.data?.data || []))
      .catch(() => setError('Failed to load webhook endpoints.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/super-admin/webhooks', form);
      setShowModal(false);
      setForm({ name: '', url: '', events: 'lead.created, ticket.created' });
      fetchHooks();
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook listener? Outgoing events will no longer post to this URL.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/super-admin/webhooks/${id}`);
      fetchHooks();
    } catch {
      // handled
    } finally {
      setDeletingId(null);
    }
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
        <button onClick={fetchHooks} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Webhook className="w-6 h-6 text-[#F59E0B]" /> Webhooks
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure outgoing HTTPS request hooks triggered by platform events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {/* Table list */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {hooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Webhook className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No webhook endpoints configured</p>
            <p className="text-slate-400 text-sm mt-1">Create a webhook url to start receiving real-time payloads</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Friendly Name', 'Payload URL', 'Subscribed Events', 'Last Triggered', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hooks.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{w.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 max-w-xs truncate flex items-center gap-1.5 pt-4">
                      <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {w.url}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {w.events.split(',').map((ev, i) => (
                          <span key={i} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{ev.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {w.lastTriggered ? new Date(w.lastTriggered).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3" /> {w.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(w.id)}
                        disabled={deletingId === w.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
                        title="Delete Webhook"
                      >
                        {deletingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Add Outgoing Webhook URL</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Webhook Name *</label>
                <input 
                  required 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="e.g. Acme Webhook Dispatcher" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Payload URL *</label>
                <input 
                  required 
                  type="url"
                  value={form.url} 
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} 
                  placeholder="https://yourdomain.com/webhook-listener" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Listen Events (comma separated)</label>
                <input 
                  value={form.events} 
                  onChange={e => setForm(f => ({ ...f, events: e.target.value }))} 
                  placeholder="lead.created, ticket.created" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
