'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  Sparkles, CheckCircle2, TrendingUp, Users, Clock, Phone, Mail,
  Plus, Calendar, Trophy, ArrowRight, Target, Zap, Activity,
  BarChart2, GitBranch, Send, RefreshCw, BadgeCheck, AlertTriangle, X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

export default function SalesDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activitySummary, setActivitySummary] = useState<any>({ Call: 0, Email: 0, Meeting: 0 });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [dashRes, actRes] = await Promise.all([
        api.get('/sales/dashboard'),
        api.get('/sales/activities/summary'),
      ]);
      setData(dashRes.data.data);
      setActivitySummary(actRes.data.data.summary || { Call: 0, Email: 0, Meeting: 0 });
    } catch {
      setData({
        target: { dailyTarget: 50000, achievedToday: 40000, monthlyTarget: 100000, monthlyAchieved: 86000, targetLeads: 50, convertedLeads: 12 },
        pendingLeadsCount: 12,
        todayFollowupsCount: 8,
        hotLeads: [],
        todayTasks: [],
        todayActivities: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = data?.target || {};
  const dailyPct = t.dailyTarget ? Math.min(Math.round((t.achievedToday / t.dailyTarget) * 100), 100) : 0;
  const monthlyPct = t.monthlyTarget ? Math.min(Math.round((t.monthlyAchieved / t.monthlyTarget) * 100), 100) : 0;
  const totalAct = (activitySummary.Call || 0) + (activitySummary.Email || 0) + (activitySummary.Meeting || 0);

  const kpis = [
    {
      label: "Daily Target", value: `₹${(t.dailyTarget || 0).toLocaleString('en-IN')}`,
      sub: `₹${(t.achievedToday || 0).toLocaleString('en-IN')} achieved`, pct: dailyPct,
      icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500'
    },
    {
      label: 'Monthly Goal', value: `${monthlyPct}%`,
      sub: `₹${(t.monthlyAchieved || 0).toLocaleString('en-IN')} of ₹${(t.monthlyTarget || 0).toLocaleString('en-IN')}`,
      pct: monthlyPct, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500'
    },
    {
      label: 'Pending Leads', value: data?.pendingLeadsCount ?? 0,
      sub: 'Assigned to you', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50'
    },
    {
      label: "Today's Follow-ups", value: data?.todayFollowupsCount ?? 0,
      sub: 'Tasks due today', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50'
    },
    {
      label: "Today's Activities", value: totalAct,
      sub: `${activitySummary.Call || 0} calls · ${activitySummary.Email || 0} emails`,
      icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50'
    },
    {
      label: 'Converted Leads', value: t.convertedLeads ?? 0,
      sub: `Target: ${t.targetLeads ?? 0} leads`,
      pct: t.targetLeads ? Math.min(Math.round(((t.convertedLeads || 0) / t.targetLeads) * 100), 100) : 0,
      icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500'
    },
  ];

  const activityBarData = [
    { name: 'Calls', value: activitySummary.Call || 0, fill: '#22C55E' },
    { name: 'Emails', value: activitySummary.Email || 0, fill: '#3B82F6' },
    { name: 'Meetings', value: activitySummary.Meeting || 0, fill: '#F59E0B' },
  ];

  const quickActions = [
    { label: 'Add Lead', icon: Plus, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', href: '/sales/leads', action: () => router.push('/sales/leads') },
    { label: 'Call Lead', icon: Phone, color: 'bg-green-50 hover:bg-green-100 text-green-700', href: '/sales/leads', action: () => router.push('/sales/leads') },
    { label: 'Pipeline', icon: GitBranch, color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', href: '/sales/leads/pipeline', action: () => router.push('/sales/leads/pipeline') },
    { label: 'Schedule Task', icon: Calendar, color: 'bg-violet-50 hover:bg-violet-100 text-violet-700', href: '/sales/tasks', action: () => router.push('/sales/tasks') },
    { label: 'Log Activity', icon: Activity, color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', href: '/sales/activity', action: () => router.push('/sales/activity') },
    { label: 'View Tasks', icon: CheckCircle2, color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', href: '/sales/tasks', action: () => router.push('/sales/tasks') },
    { label: 'My Profile', icon: BarChart2, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700', href: '/sales/profile', action: () => router.push('/sales/profile') },
  ];

  return (
    <div className="space-y-5 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchDashboard(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Target</span>
            <span className="text-xs font-extrabold text-slate-800">₹{(t.dailyTarget || 50000).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <p className="text-xs font-semibold text-amber-900">
            AI Insight: You are <strong>{dailyPct}%</strong> toward your daily target.
            {data?.hotLeads?.length > 0 ? ` Focus on ${data.hotLeads.length} hot lead${data.hotLeads.length > 1 ? 's' : ''} to hit your goal.` : ' Keep up the momentum!'}
          </p>
        </div>
        <button onClick={() => router.push('/sales/leads')} className="text-[10px] font-bold text-amber-700 hover:underline whitespace-nowrap shrink-0 uppercase">
          View Leads →
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition">
            <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 leading-none">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">{kpi.label}</p>
              {kpi.sub && <p className="text-[9px] text-slate-400 mt-0.5">{kpi.sub}</p>}
            </div>
            {kpi.pct !== undefined && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${kpi.bar}`} style={{ width: `${kpi.pct}%` }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Priority Leads + Today Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Hot Leads */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-slate-800">Hot Priority Leads</h3>
            </div>
            <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
          </div>

          {(!data?.hotLeads || data.hotLeads.length === 0) ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No hot leads yet. Add leads and mark them as Hot priority.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.hotLeads.map((lead: any, i: number) => (
                <div key={lead.id || i}
                  onClick={() => router.push('/sales/leads')}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-red-50/30 rounded-xl border border-slate-100 hover:border-red-100 transition cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {(lead.name || 'L').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">Hot 🔥</span>
                        {(lead.conversion_probability || 0) >= 85 && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase">Contact Now</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lead.phone || lead.email || 'No contact info'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Win %</span>
                      <span className={`text-sm font-extrabold ${(lead.conversion_probability || 0) >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                        {lead.conversion_probability || 0}%
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e => { e.stopPropagation(); if (lead.phone) window.open(`tel:${lead.phone}`); }}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); if (lead.email) window.open(`mailto:${lead.email}`); }}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600 transition">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-bold text-slate-800">Today's Tasks</h3>
            </div>
            <button onClick={() => router.push('/sales/tasks')} className="text-xs font-bold text-blue-600 hover:underline">All →</button>
          </div>

          {(!data?.todayTasks || data.todayTasks.length === 0) ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <div>
                <CheckCircle2 className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No tasks scheduled for today.</p>
                <button onClick={() => router.push('/sales/tasks')} className="mt-2 text-xs font-bold text-blue-600 hover:underline">+ Add Task</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
              {data.todayTasks.map((task: any, i: number) => (
                <div key={task.id || i} onClick={() => router.push('/sales/tasks')}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.status === 'Done' ? 'bg-green-400' : 'bg-blue-500 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                      {task.scheduled_at && (
                        <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                          {new Date(task.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {task.lead_name && <p className="text-[10px] text-slate-500 mt-0.5">Lead: {task.lead_name}</p>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block
                      ${task.type === 'Call' ? 'bg-green-100 text-green-700' : task.type === 'Meeting' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide block">Best Call Window</span>
            <span className="text-xs font-bold text-blue-900 mt-0.5 block">10:30 AM – 12:00 PM</span>
          </div>
        </div>
      </div>

      {/* Quick Actions + Activity Chart + Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Quick Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((act, i) => (
              <button key={i} onClick={act.action}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition ${act.color} text-center`}>
                <act.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold leading-tight">{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today Activity Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" /> Today's Activity
            </h3>
            <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">Log →</button>
          </div>
          <div className="h-32" style={{minHeight:128}}>
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={activityBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {activityBarData.map((d, i) => (
                    <rect key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-slate-100">
            {[
              { label: 'Calls', val: activitySummary.Call || 0, color: 'text-green-600' },
              { label: 'Emails', val: activitySummary.Email || 0, color: 'text-blue-600' },
              { label: 'Meetings', val: activitySummary.Meeting || 0, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Performance
            </h3>
            <button onClick={() => router.push('/sales/profile')} className="text-xs font-bold text-blue-600 hover:underline">Full Report →</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Daily Target', achieved: t.achievedToday || 0, total: t.dailyTarget || 50000, pct: dailyPct, color: 'bg-amber-500', fmt: (v: number) => `₹${v.toLocaleString('en-IN')}` },
              { label: 'Monthly Revenue', achieved: t.monthlyAchieved || 0, total: t.monthlyTarget || 100000, pct: monthlyPct, color: 'bg-green-500', fmt: (v: number) => `₹${v.toLocaleString('en-IN')}` },
              { label: 'Lead Conversion', achieved: t.convertedLeads || 0, total: t.targetLeads || 50, pct: t.targetLeads ? Math.round(((t.convertedLeads || 0) / t.targetLeads) * 100) : 0, color: 'bg-blue-500', fmt: (v: number) => `${v}` },
            ].map(row => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{row.label}</span>
                  <span>{row.fmt(row.achieved)} / {row.fmt(row.total)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
                <p className="text-[9px] text-slate-400">{row.pct}% achieved</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Motivational + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent Activities */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
            </h3>
            <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
          </div>
          {(!data?.todayActivities || data.todayActivities.length === 0) ? (
            <div className="py-8 text-center">
              <Activity className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No activities logged today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.todayActivities.slice(0, 5).map((act: any, i: number) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.type === 'Call' ? 'bg-green-100' : act.type === 'Email' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {act.type === 'Call' ? <Phone className="w-3.5 h-3.5 text-green-700" /> :
                     act.type === 'Email' ? <Mail className="w-3.5 h-3.5 text-blue-700" /> :
                     <Calendar className="w-3.5 h-3.5 text-amber-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-slate-800">{act.type} · {act.lead_name || 'No Lead'}</p>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        {new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.outcome && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${act.outcome === 'Connected' || act.outcome === 'Interested' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{act.outcome}</span>}
                    {act.notes && <p className="text-[10px] text-slate-500 mt-1 truncate">{act.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 flex flex-col justify-between text-white">
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-base font-extrabold mb-2">
              {dailyPct >= 100 ? 'Target Crushed! 🏆' : dailyPct >= 75 ? 'Almost There! 💪' : 'Keep Going! 🚀'}
            </h4>
            <p className="text-sm text-blue-100 leading-relaxed">
              {dailyPct >= 100
                ? `Outstanding, ${user?.name?.split(' ')[0] || 'you'}! You have smashed your daily target. Keep the momentum going!`
                : `You are ${dailyPct}% toward your daily goal. Focus on hot leads and today's follow-ups to close the gap.`
              }
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${dailyPct}%` }} />
            </div>
            <div className="flex justify-between text-xs font-semibold text-blue-200">
              <span>{dailyPct}% achieved</span>
              <span>{100 - dailyPct}% remaining</span>
            </div>
            <button onClick={() => router.push('/sales/leads')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 hover:text-white transition uppercase tracking-wide">
              Go to Leads <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
