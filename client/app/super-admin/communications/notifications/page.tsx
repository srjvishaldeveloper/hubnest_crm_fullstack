'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Bell, RefreshCw, XCircle, Send, X, Loader2, Users, ShieldAlert, CheckCircle } from 'lucide-react';

interface NotificationBroadcast {
  id: string;
  title: string;
  message: string;
  recipients: string;
  status: string;
  sentAt: string;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', recipients: 'All Users' });

  const fetchNotifs = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/notifications')
      .then((r: any) => setNotifs(r.data?.data || []))
      .catch(() => setError('Failed to load broadcast history.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/super-admin/notifications', form);
      setShowModal(false);
      setForm({ title: '', message: '', recipients: 'All Users' });
      fetchNotifs();
    } catch {
      // handled
    } finally {
      setSending(false);
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
        <button onClick={fetchNotifs} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Bell className="w-6 h-6 text-[#F59E0B]" /> Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Send platform broadcasts, announcements, or alerts to user groups</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm shadow-amber-500/20"
        >
          <Send className="w-4 h-4" /> Broadcast Alert
        </button>
      </div>

      {/* Broadcast history list */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
            <p className="text-slate-500 font-medium">No system broadcasts yet</p>
            <p className="text-slate-400 text-sm mt-1">Alerts help notify tenants of downtime or patches</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Broadcast Title', 'Message content', 'Audience', 'Status', 'Dispatched At'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifs.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{n.title}</td>
                    <td className="px-5 py-4 text-slate-600 max-w-sm truncate">{n.message}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {n.recipients}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">
                        <CheckCircle className="w-3 h-3" /> Dispatched
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast alert modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">New Broadcast Announcement</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Alert Header *</label>
                <input 
                  required 
                  value={form.title} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                  placeholder="e.g. Server Upgrade Schedule" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Recipients Group</label>
                <select 
                  value={form.recipients} 
                  onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                >
                  <option value="All Users">All Workspace Users</option>
                  <option value="Tenant Admins">Workspace Admins Only</option>
                  <option value="Support Agents">Customer Support Agents</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Message / Details *</label>
                <textarea 
                  required 
                  rows={4} 
                  value={form.message} 
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))} 
                  placeholder="Draft details and instructions for the users..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition resize-none" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                <button type="submit" disabled={sending} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching...</> : <><Send className="w-4 h-4" /> Broadcast</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
