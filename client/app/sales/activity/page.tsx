'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, Mail, Calendar, Activity, Plus, Download, Clock,
  Sparkles, X, BadgeCheck, AlertTriangle, RefreshCw, Filter,
  MessageSquare, Users, TrendingUp, Target, Zap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-green-500 ring-green-100',
  Email: 'bg-blue-500 ring-blue-100',
  Meeting: 'bg-amber-500 ring-amber-100',
  WhatsApp: 'bg-emerald-500 ring-emerald-100',
  Demo: 'bg-indigo-500 ring-indigo-100',
  'Follow-up': 'bg-violet-500 ring-violet-100',
};

const OUTCOME_COLORS: Record<string, string> = {
  Connected: 'bg-green-100 text-green-700',
  Interested: 'bg-emerald-100 text-emerald-700',
  'No Answer': 'bg-slate-100 text-slate-500',
  'Not Interested': 'bg-red-100 text-red-500',
  Converted: 'bg-blue-100 text-blue-700',
  'Callback Requested': 'bg-amber-100 text-amber-700',
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(secs: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [summary, setSummary] = useState({ Call: 0, Email: 0, Meeting: 0 });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [newLog, setNewLog] = useState({ lead_id: '', type: 'Call', outcome: 'Connected', duration_seconds: 0, notes: '' });
  const [logLoading, setLogLoading] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [actRes, leadsRes, summaryRes] = await Promise.all([
        api.get('/sales/activities'),
        api.get('/sales/leads'),
        api.get('/sales/activities/summary'),
      ]);
      setActivities(actRes.data.data.activities || []);
      setLeads(leadsRes.data.data.leads || []);
      setSummary(summaryRes.data.data.summary || { Call: 0, Email: 0, Meeting: 0 });
    } catch {
      showToast('Could not load activities', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const res = await api.post('/sales/activities', newLog);
      const lead = leads.find(l => l.id === newLog.lead_id);
      setActivities(prev => [{ ...res.data.data.activity, lead_name: lead?.name }, ...prev]);
      setSummary(prev => ({ ...prev, [newLog.type]: ((prev as any)[newLog.type] || 0) + 1 }));
      setIsLogOpen(false);
      setNewLog({ lead_id: '', type: 'Call', outcome: 'Connected', duration_seconds: 0, notes: '' });
      showToast('Activity logged successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to log activity', 'error');
    } finally {
      setLogLoading(false);
    }
  };

  const handleExport = () => {
    const csv = ['Type,Lead,Outcome,Duration,Notes,Date',
      ...activities.map(a => `${a.type},${a.lead_name || ''},${a.outcome || ''},${fmtDuration(a.duration_seconds)},${(a.notes || '').replace(/,/g, ';')},${fmtDateTime(a.created_at)}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activities.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Activities exported!');
  };

  const filtered = activities.filter(act => {
    if (activeTab === 'Calls') return act.type === 'Call';
    if (activeTab === 'Emails') return act.type === 'Email';
    if (activeTab === 'Meetings') return act.type === 'Meeting';
    if (activeTab === 'WhatsApp') return act.type === 'WhatsApp';
    return true;
  });

  const totalAct = (summary.Call || 0) + (summary.Email || 0) + (summary.Meeting || 0);

  const barData = [
    { name: 'Calls', value: summary.Call || 0 },
    { name: 'Emails', value: summary.Email || 0 },
    { name: 'Meetings', value: (summary as any).Meeting || 0 },
  ];

  const tabs = [
    { key: 'All', count: activities.length },
    { key: 'Calls', count: activities.filter(a => a.type === 'Call').length },
    { key: 'Emails', count: activities.filter(a => a.type === 'Email').length },
    { key: 'Meetings', count: activities.filter(a => a.type === 'Meeting').length },
    { key: 'WhatsApp', count: activities.filter(a => a.type === 'WhatsApp').length },
  ];

  return (
    <div className="space-y-5 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">{activities.length} total interactions logged</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setIsLogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Log Activity
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Calls Today', value: summary.Call || 0, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Emails Sent', value: summary.Email || 0, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Meetings Done', value: (summary as any).Meeting || 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Today', value: totalAct, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(item => (
          <div key={item.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === tab.key ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}>
            {tab.key}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

        {/* Timeline */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-5">Activity Timeline</h3>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No activities logged in this category.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6 max-h-[60vh] overflow-y-auto">
              {filtered.map((act, i) => {
                const dot = TYPE_COLORS[act.type] || 'bg-slate-400 ring-slate-100';
                return (
                  <motion.div key={act.id || i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative">
                    <span className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 border-white ring-2 flex items-center justify-center text-white ${dot}`}>
                      {act.type === 'Call' ? <Phone className="w-2.5 h-2.5" /> :
                       act.type === 'Email' ? <Mail className="w-2.5 h-2.5" /> :
                       act.type === 'WhatsApp' ? <MessageSquare className="w-2.5 h-2.5" /> :
                       <Calendar className="w-2.5 h-2.5" />}
                    </span>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">
                            {act.type} with{' '}
                            <button onClick={() => router.push('/sales/leads')} className="text-blue-600 hover:underline">
                              {act.lead_name || 'No Lead'}
                            </button>
                          </span>
                          {act.outcome && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${OUTCOME_COLORS[act.outcome] || 'bg-slate-100 text-slate-500'}`}>
                              {act.outcome}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">{fmtDateTime(act.created_at)}</span>
                      </div>
                      {act.duration_seconds > 0 && (
                        <p className="text-[10px] text-slate-400 font-mono mb-1">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" /> {fmtDuration(act.duration_seconds)}
                        </p>
                      )}
                      {act.notes && (
                        <p className="text-[11px] text-slate-600 leading-relaxed">{act.notes}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Chart + Metrics */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4">Today's Breakdown</h3>
            <div className="h-40" style={{minHeight:160}}>
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Productivity Metrics</h3>
            {[
              { label: 'Response Rate', value: activities.length ? `${Math.round((activities.filter(a => a.outcome === 'Connected').length / activities.length) * 100)}%` : '0%', color: 'text-blue-600 bg-blue-50' },
              { label: 'Conversion Rate', value: activities.length ? `${Math.round((activities.filter(a => a.outcome === 'Converted').length / activities.length) * 100)}%` : '0%', color: 'text-green-600 bg-green-50' },
              { label: 'Total Logged', value: activities.length, color: 'text-violet-600 bg-violet-50' },
              { label: 'Avg per Day', value: activities.length > 0 ? Math.max(1, Math.round(activities.length / 7)) : 0, color: 'text-amber-600 bg-amber-50' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-600">{m.label}</span>
                <span className={`px-2 py-0.5 rounded-lg font-extrabold text-xs ${m.color}`}>{m.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-[11px] font-semibold text-blue-900 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              AI tip: Log detailed notes after every call so AI can suggest the best next action for each lead.
            </p>
          </div>
        </div>
      </div>

      {/* Log Activity Panel */}
      <AnimatePresence>
        {isLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsLogOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-md h-full relative z-10 border-l border-slate-200 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Log Communication</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Record a call, email or meeting</p>
                </div>
                <button onClick={() => setIsLogOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleLogActivity} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activity Type</label>
                    <select value={newLog.type} onChange={e => setNewLog({ ...newLog, type: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call', 'Email', 'Meeting', 'WhatsApp', 'Demo', 'Follow-up'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outcome</label>
                    <select value={newLog.outcome} onChange={e => setNewLog({ ...newLog, outcome: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Connected', 'No Answer', 'Interested', 'Not Interested', 'Converted', 'Callback Requested', 'Voicemail'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link to Lead</label>
                  <select value={newLog.lead_id} onChange={e => setNewLog({ ...newLog, lead_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                    <option value="">No Lead</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
                  </select>
                </div>

                {(newLog.type === 'Call' || newLog.type === 'Meeting') && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration (minutes)</label>
                    <input type="number" min={0} placeholder="0" value={newLog.duration_seconds ? newLog.duration_seconds / 60 : ''}
                      onChange={e => setNewLog({ ...newLog, duration_seconds: Number(e.target.value) * 60 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:border-blue-500 transition" />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes *</label>
                  <textarea required rows={4} placeholder="What was discussed? Next steps..." value={newLog.notes}
                    onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-blue-800 leading-snug">Detailed notes help AI identify the best next action for this lead automatically.</p>
                </div>

                <button type="submit" disabled={logLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {logLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
                  Save Log
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
