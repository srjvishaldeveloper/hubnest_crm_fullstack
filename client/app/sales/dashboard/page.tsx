'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  Sparkles, CheckCircle2, TrendingUp, Users, Clock, Phone, Mail,
  Plus, Calendar, Trophy, ArrowRight, Target, Zap, Activity,
  BarChart2, Send, RefreshCw, BadgeCheck, AlertTriangle, X,
  Filter, ChevronDown, Bell, Star, Flame, TrendingDown,
  Eye, MessageSquare, GitBranch, Layers, PieChart as PieIcon,
  LayoutDashboard, CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </motion.div>
  );
}

// ─── Mock / fallback rich data ────────────────────────────────────────────────
const WEEKLY_PERF = [
  { day: 'Mon', calls: 12, emails: 8, meetings: 2, revenue: 18000, leads: 5 },
  { day: 'Tue', calls: 18, emails: 12, meetings: 3, revenue: 25000, leads: 8 },
  { day: 'Wed', calls: 9,  emails: 7,  meetings: 1, revenue: 12000, leads: 3 },
  { day: 'Thu', calls: 22, emails: 15, meetings: 4, revenue: 38000, leads: 11 },
  { day: 'Fri', calls: 16, emails: 10, meetings: 2, revenue: 22000, leads: 7 },
  { day: 'Sat', calls: 6,  emails: 4,  meetings: 1, revenue: 8000,  leads: 2 },
  { day: 'Sun', calls: 3,  emails: 2,  meetings: 0, revenue: 5000,  leads: 1 },
];

const FUNNEL_DATA = [
  { stage: 'Assigned Leads', value: 128, color: '#3B82F6' },
  { stage: 'Contacted',      value: 92,  color: '#8B5CF6' },
  { stage: 'Interested',     value: 56,  color: '#F59E0B' },
  { stage: 'Negotiation',    value: 28,  color: '#F97316' },
  { stage: 'Converted',      value: 22,  color: '#10B981' },
];

const SOURCE_PIE = [
  { name: 'Facebook Ads', value: 38, color: '#3B82F6' },
  { name: 'Referral',     value: 26, color: '#10B981' },
  { name: 'Website',      value: 20, color: '#8B5CF6' },
  { name: 'WhatsApp',     value: 15, color: '#F59E0B' },
  { name: 'Manual',       value: 11, color: '#F97316' },
  { name: 'Google Ads',   value: 18, color: '#EF4444' },
];

const MOCK_HOT_LEADS = [
  { id: '1', name: 'Amit Sharma',    phone: '+91 98765 43210', company: 'Sharma Enterprises', conversion_probability: 90, priority: 'Hot', status: 'Interested' },
  { id: '2', name: 'Neha Verma',     phone: '+91 91234 56789', company: 'Verma Solutions',    conversion_probability: 75, priority: 'Warm', status: 'Contacted' },
  { id: '3', name: 'Rajeev Kumar',   phone: '+91 99887 66554', company: 'Kumar Traders',       conversion_probability: 60, priority: 'Warm', status: 'New' },
  { id: '4', name: 'Pooja Aggarwal', phone: '+91 98712 33445', company: 'Aggarwal Industries', conversion_probability: 85, priority: 'Hot', status: 'Interested' },
];

const MOCK_TASKS = [
  { id: 't1', title: 'Call Amit Sharma',    type: 'Call',      scheduled_at: new Date().toISOString(), lead_name: 'Amit Sharma',    status: 'Pending', priority: 'High' },
  { id: 't2', title: 'Meeting — Neha Verma', type: 'Meeting',  scheduled_at: new Date().toISOString(), lead_name: 'Neha Verma',     status: 'Pending', priority: 'Medium' },
  { id: 't3', title: 'Follow-up Rajeev',    type: 'Follow-up', scheduled_at: new Date().toISOString(), lead_name: 'Rajeev Kumar',   status: 'Pending', priority: 'High' },
  { id: 't4', title: 'Send Proposal',       type: 'Email',     scheduled_at: new Date().toISOString(), lead_name: 'Pooja Aggarwal', status: 'Done',    priority: 'Low' },
];

const NOTIFICATIONS = [
  { id: 1, text: 'New lead assigned: Pooja Aggarwal', time: '5 min ago',  type: 'lead',   read: false },
  { id: 2, text: 'Follow-up reminder: Amit Sharma',   time: '10 min ago', type: 'task',   read: false },
  { id: 3, text: 'Manager message: Great work today!', time: '1 hr ago',  type: 'message',read: true },
  { id: 4, text: 'You have 5 pending tasks',           time: '2 hrs ago', type: 'alert',  read: true },
];











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

  // UI state
  const [chartTab, setChartTab] = useState<'revenue' | 'calls' | 'leads'>('revenue');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(raw.map(n => ({
        id: n.id, text: n.message || n.title || '', time: n.sent_at || n.created_at || '',
        type: n.type || 'info', read: n.status === 'read',
      })));
    } catch { setNotifications(NOTIFICATIONS); }
  }, []);

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
        pendingLeadsCount: 28,
        todayFollowupsCount: 15,
        hotLeads: MOCK_HOT_LEADS,
        todayTasks: MOCK_TASKS,
        todayActivities: []
      });
      setActivitySummary({ Call: 12, Email: 18, Meeting: 3 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); fetchNotifications(); }, [fetchDashboard, fetchNotifications]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const t = data?.target || {};
  const dailyPct = t.dailyTarget ? Math.min(Math.round((t.achievedToday / t.dailyTarget) * 100), 100) : 80;
  const monthlyPct = t.monthlyTarget ? Math.min(Math.round((t.monthlyAchieved / t.monthlyTarget) * 100), 100) : 86;
  const totalAct = (activitySummary.Call || 0) + (activitySummary.Email || 0) + (activitySummary.Meeting || 0);

  const hotLeads = data?.hotLeads || [];
  const todayTasks = data?.todayTasks || [];

  const kpis = [
    { id: 'target',    label: 'Daily Target',      value: `₹${(t.dailyTarget||50000).toLocaleString('en-IN')}`,   sub: `₹${(t.achievedToday||40000).toLocaleString('en-IN')} achieved`, pct: dailyPct,   icon: Trophy,       color: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500',   href: '/sales/profile' },
    { id: 'monthly',   label: 'Monthly Goal',       value: `${monthlyPct}%`,   sub: `₹${(t.monthlyAchieved||86000).toLocaleString('en-IN')} of ₹${(t.monthlyTarget||100000).toLocaleString('en-IN')}`, pct: monthlyPct, icon: TrendingUp, color: 'text-green-600',   bg: 'bg-green-50',   bar: 'bg-green-500',   href: '/sales/profile' },
    { id: 'leads',     label: 'Pending Leads',      value: data?.pendingLeadsCount ?? 28, sub: 'Assigned to you',   icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50',    bar: undefined,       href: '/sales/leads' },
    { id: 'followups', label: "Today's Follow-ups", value: data?.todayFollowupsCount ?? 15, sub: 'Tasks due today', icon: Clock,       color: 'text-violet-600',  bg: 'bg-violet-50',  bar: undefined,       href: '/sales/tasks' },
    { id: 'activity',  label: 'Total Activities',   value: totalAct || 33, sub: `${activitySummary.Call||12} calls · ${activitySummary.Email||18} emails`, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', bar: undefined, href: '/sales/activity' },
    { id: 'converted', label: 'Converted Leads',    value: t.convertedLeads ?? 22, sub: `Target: ${t.targetLeads ?? 50} leads`, pct: t.targetLeads ? Math.min(Math.round(((t.convertedLeads||22)/(t.targetLeads||50))*100),100) : 44, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', href: '/sales/leads' },
  ];

  const chartData = data?.weeklyPerf?.length ? data.weeklyPerf : WEEKLY_PERF;
  const chartKey = chartTab === 'revenue' ? 'revenue' : chartTab === 'calls' ? 'calls' : 'leads';
  const chartColor = chartTab === 'revenue' ? '#2563EB' : chartTab === 'calls' ? '#10B981' : '#F59E0B';

  // Derive funnel data from API pipeline or fallback to mock
  const funnelData = data?.pipeline?.length
    ? data.pipeline.map((p: any, i: number) => ({
        stage: p.stage, value: p.count,
        color: ['#3B82F6','#8B5CF6','#F59E0B','#F97316','#10B981'][i % 5],
      }))
    : FUNNEL_DATA;

  // Source pie from API or fallback
  const sourcePie: Array<{name:string;value:number;color:string}> = data?.sourcePie?.length
    ? data.sourcePie
    : SOURCE_PIE;

  // Weekly summary totals from live chartData
  const weeklyTotals = {
    revenue: chartData.reduce((a: number, b: any) => a + (b.revenue || 0), 0),
    calls:   chartData.reduce((a: number, b: any) => a + (b.calls || 0), 0),
    leads:   chartData.reduce((a: number, b: any) => a + (b.leads || 0), 0),
  };

  const quickActions = [
    { label: 'Add Lead',      icon: Plus,        color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',     href: '/sales/leads' },
    { label: 'Call Lead',     icon: Phone,       color: 'bg-green-50 hover:bg-green-100 text-green-700',  href: '/sales/leads' },
    { label: 'Pipeline',      icon: GitBranch,   color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', href: '/sales/leads/pipeline' },
    { label: 'Schedule Task', icon: Calendar,    color: 'bg-violet-50 hover:bg-violet-100 text-violet-700', href: '/sales/tasks' },
    { label: 'Log Activity',  icon: Activity,    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700',  href: '/sales/activity' },
    { label: 'View Tasks',    icon: CheckSquare, color: 'bg-teal-50 hover:bg-teal-100 text-teal-700',     href: '/sales/tasks' },
  ];

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── Header Banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}
        className="rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-semibold">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            <h1 className="text-xl font-extrabold mt-1">{greeting()}, {user?.name?.split(' ')[0] || 'Rahul'} 👋</h1>
            <p className="text-blue-100 text-sm mt-1">Have a productive day and close more deals!</p>
            {/* AI Insight strip */}
            <div className="mt-3 flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-3 py-2 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-white">AI: Focus on 3 hot leads — you&apos;re {dailyPct}% to your daily target!</p>
              <button onClick={() => router.push('/sales/leads')} className="text-[10px] font-bold text-amber-300 hover:text-amber-200 whitespace-nowrap ml-1">View →</button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotifPanel(v => !v)}
                className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition">
                <Bell className="w-4 h-4 text-white" />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute right-0 top-12 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Notifications</p>
                      <button onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No notifications</p>}
                      {notifications.map(n => (
                        <div key={n.id} className={`flex gap-2.5 p-3 cursor-pointer hover:bg-slate-50 transition ${!n.read ? 'bg-blue-50/40' : ''}`}
                          onClick={() => { setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); api.put(`/notifications/${n.id}/read`).catch(() => {}); }}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-200'}`} />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-800 leading-snug">{n.text}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{n.time ? (() => { const d = Date.now() - new Date(n.time).getTime(); const m = Math.floor(d/60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`; })() : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => fetchDashboard(true)} disabled={refreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {/* Filter toggle */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${showFilters ? 'bg-white text-blue-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500">
                  {['today','this_week','this_month','last_month'].map(v => (
                    <option key={v} value={v}>{v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                <div className="flex gap-1">
                  {['All','Hot','Warm','Cold'].map(p => (
                    <button key={p} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-600 transition">{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
                <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500">
                  {['Follow-up Time','Win Probability','Last Activity','Date Created'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setShowFilters(false)} className="mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">Apply</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => router.push(kpi.href)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 leading-none">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">{kpi.label}</p>
              {kpi.sub && <p className="text-[9px] text-slate-400 mt-0.5">{kpi.sub}</p>}
            </div>
            {kpi.pct !== undefined && kpi.bar && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${kpi.bar}`} style={{ width: `${kpi.pct}%` }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row: Performance + Funnel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Weekly Performance Chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" /> Weekly Performance
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">This week&apos;s revenue, calls &amp; leads</p>
            </div>
            <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              {([['revenue','Revenue'],['calls','Calls'],['leads','Leads']] as const).map(([k,l]) => (
                <button key={k} onClick={() => setChartTab(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartTab === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                  formatter={(v: any) => chartTab === 'revenue' ? [`₹${(v || 0).toLocaleString()}`, 'Revenue'] : [v || 0, chartTab === 'leads' ? 'Leads' : 'Conversions']} />
                <Area type="monotone" dataKey={chartKey} stroke={chartColor} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ r: 3, fill: chartColor }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-slate-100">
            {[
              { label: 'Total Revenue', val: `₹${weeklyTotals.revenue.toLocaleString('en-IN')}`, color: 'text-blue-600' },
              { label: 'Total Calls',   val: weeklyTotals.calls,   color: 'text-green-600' },
              { label: 'Total Leads',   val: weeklyTotals.leads,   color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Source Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-500" /> Lead Sources
            </h3>
            <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {sourcePie.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} formatter={(v: any) => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {sourcePie.slice(0,4).map((s,i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="font-semibold text-slate-600">{s.name}</span>
                </div>
                <span className="font-extrabold text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Funnel + Hot Leads ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Lead Conversion Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Lead Funnel
          </h3>
          <div className="space-y-2.5">
            {funnelData.map((f: { stage: string; value: number; color: string }, i: number) => {
              const pct = funnelData[0]?.value ? Math.round((f.value / funnelData[0].value) * 100) : 0;
              const dropPct = i > 0 && funnelData[i-1]?.value ? Math.round(((funnelData[i-1].value - f.value) / funnelData[i-1].value) * 100) : 0;
              return (
                <div key={i}>
                  {i > 0 && (
                    <div className="flex items-center gap-1.5 ml-2 mb-1">
                      <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                      <span className="text-[9px] text-red-400 font-semibold">-{dropPct}% drop-off</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 w-24 shrink-0">{f.stage}</span>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-lg flex items-center justify-end pr-2"
                        style={{ background: f.color }}>
                        <span className="text-[10px] font-bold text-white">{f.value}</span>
                      </motion.div>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-600 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] font-bold text-emerald-700">Overall Conversion Rate</p>
            <p className="text-lg font-extrabold text-emerald-600">
              {funnelData.length >= 2 && funnelData[0]?.value
                ? Math.round((funnelData[funnelData.length-1].value / funnelData[0].value) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-slate-800">Priority Leads (Hot)</h3>
            </div>
            <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
          </div>
          <div className="space-y-2.5">
            {hotLeads.slice(0, 4).map((lead: any, i: number) => (
              <motion.div key={lead.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => router.push('/sales/leads')}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-red-50/40 rounded-xl border border-transparent hover:border-red-100 transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    lead.priority === 'Hot' ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-amber-400 to-yellow-500'}`}>
                    {(lead.name||'L').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${lead.priority==='Hot'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                        {lead.priority==='Hot'?'Hot 🔥':'Warm'}
                      </span>
                      {(lead.conversion_probability||0) >= 80 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Contact Now</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lead.company} · {lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Win %</span>
                    <span className={`text-sm font-extrabold ${(lead.conversion_probability||0)>=70?'text-green-600':'text-amber-600'}`}>
                      {lead.conversion_probability||0}%
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={e=>{e.stopPropagation();if(lead.phone)window.open(`tel:${lead.phone}`)}}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e=>{e.stopPropagation();if(lead.email)window.open(`mailto:${lead.email}`)}}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600 transition">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            AI Suggestion: Contact Amit Sharma now — 90% conversion probability!
          </p>
        </div>
      </div>

      {/* ── Today Follow-ups + Quick Actions + Best Call Time ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Today Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Today&apos;s Follow-ups
            </h3>
            <button onClick={() => router.push('/sales/tasks')} className="text-xs font-bold text-blue-600 hover:underline">All →</button>
          </div>
          <div className="space-y-2">
            {[
              { time: '10:00 AM', name: 'Amit Sharma',    company: 'Sharma Enterprises', done: false },
              { time: '12:00 PM', name: 'Neha Verma',     company: 'Verma Solutions',    done: false },
              { time: '02:30 PM', name: 'Rajeev Kumar',   company: 'Kumar Traders',      done: true },
              { time: '04:00 PM', name: 'Pooja Aggarwal', company: 'Aggarwal Industries',done: false },
            ].map((f, i) => (
              <div key={i} onClick={() => router.push('/sales/tasks')}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition ${f.done ? 'opacity-50' : ''}`}>
                <div className="text-center shrink-0 w-14">
                  <p className="text-[10px] font-extrabold text-blue-600">{f.time}</p>
                </div>
                <div className={`w-1 h-8 rounded-full shrink-0 ${f.done ? 'bg-green-400' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{f.name}</p>
                  <p className="text-[9px] text-slate-400">{f.company}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={e=>{e.stopPropagation()}} className="p-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition">
                    <Phone className="w-3 h-3" />
                  </button>
                  {f.done && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {quickActions.map((act, i) => (
              <button key={i} onClick={() => router.push(act.href)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition cursor-pointer ${act.color}`}>
                <act.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold leading-tight text-center">{act.label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">AI Best Time to Call</p>
            <p className="text-sm font-extrabold text-blue-900 mt-0.5">10:00 AM – 12:00 PM</p>
            <p className="text-[9px] text-blue-600 mt-0.5">Based on your lead response history</p>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Today&apos;s Tasks
            </h3>
            <button onClick={() => router.push('/sales/tasks')} className="text-xs font-bold text-blue-600 hover:underline">All →</button>
          </div>
          <div className="flex-1 space-y-2 max-h-56 overflow-y-auto">
            {todayTasks.map((task: any, i: number) => (
              <div key={task.id || i} onClick={() => router.push('/sales/tasks')}
                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.status === 'Done' ? 'bg-green-400' : task.priority === 'High' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-1 items-start">
                    <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">{task.lead_name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block
                    ${task.type==='Call'?'bg-green-100 text-green-700':task.type==='Meeting'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>
                    {task.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sales Performance + Activity Bar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Sales Performance
            </h3>
            <button onClick={() => router.push('/sales/profile')} className="text-xs font-bold text-blue-600 hover:underline">Report →</button>
          </div>
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">Daily Progress</span>
              <span className="text-sm font-extrabold text-blue-700">{dailyPct}%</span>
            </div>
            <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${dailyPct}%` }} transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>
            <p className="text-[10px] text-blue-600 mt-1.5 font-semibold">
              ₹{(t.achievedToday||40000).toLocaleString('en-IN')} / ₹{(t.dailyTarget||50000).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Weekly Sales',     val: '₹2,80,000', sub: '▲12%',  color: 'text-green-600' },
              { label: 'Conversion Rate',  val: '24%',        sub: '▲8%',   color: 'text-blue-600' },
              { label: 'Avg. Deal Size',   val: '₹15,000',    sub: '▲5%',   color: 'text-violet-600' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{r.label}</span>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-800">{r.val}</span>
                  <span className={`ml-1.5 text-[10px] font-bold ${r.color}`}>{r.sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Prediction
            </p>
            <p className="text-xs font-bold text-amber-900 mt-0.5">You can achieve ₹55,000 today!</p>
            <p className="text-[9px] text-amber-700">5 pending follow-ups — complete them to hit your goal</p>
          </div>
        </div>

        {/* Activity Snapshot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" /> Activity Snapshot
            </h3>
            <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">Log →</button>
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Calls',    value: activitySummary.Call||12,    fill: '#22C55E' },
                { name: 'Emails',   value: activitySummary.Email||18,   fill: '#3B82F6' },
                { name: 'Meetings', value: activitySummary.Meeting||3,  fill: '#F59E0B' },
              ]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[5,5,0,0]} fill="#3B82F6">
                  {[0,1,2].map(i => <Cell key={i} fill={['#22C55E','#3B82F6','#F59E0B'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-slate-100">
            {[
              { l:'Calls',    v:activitySummary.Call||12,   c:'text-green-600',  sub:'+12%' },
              { l:'Emails',   v:activitySummary.Email||18,  c:'text-blue-600',   sub:'+8%' },
              { l:'Meetings', v:activitySummary.Meeting||3, c:'text-amber-600',  sub:'+25%' },
            ].map(s=>(
              <div key={s.l} className="text-center">
                <p className={`text-base font-extrabold ${s.c}`}>{s.v}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase">{s.l}</p>
                <p className="text-[9px] text-green-500 font-bold">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation / AI Insight */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 flex flex-col justify-between text-white">
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-base font-extrabold mb-2">
              {dailyPct >= 100 ? 'Target Crushed! 🏆' : dailyPct >= 75 ? 'Almost There! 💪' : 'Keep Going! 🚀'}
            </h4>
            <p className="text-sm text-blue-100 leading-relaxed">
              You are {dailyPct}% toward your daily goal. Focus on hot leads and today&apos;s follow-ups to close the gap.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${dailyPct}%` }} />
            </div>
            <div className="flex justify-between text-xs font-semibold text-blue-200">
              <span>{dailyPct}% achieved</span><span>{100 - dailyPct}% remaining</span>
            </div>
            <button onClick={() => router.push('/sales/leads')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 hover:text-white transition uppercase tracking-wide">
              View Hot Leads <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Insights Panel ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> AI Insights &amp; Recommendations
          </h3>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">AI-Powered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(data?.aiInsights || []).map((ins: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${ins.color} border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5`}
              onClick={() => router.push(ins.action === 'Call Now' ? '/sales/leads' : ins.action === 'View Tasks' ? '/sales/tasks' : ins.action === 'Schedule' ? '/sales/tasks' : '/sales/leads')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{ins.icon}</span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-white/70 rounded-full text-slate-700 uppercase tracking-wider">{ins.badge}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">{ins.title}</p>
              <p className="text-[10px] text-slate-600 leading-snug">{ins.desc}</p>
              <button className="mt-2 text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-0.5">
                {ins.action} <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Radar + Recent Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Activity Radar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Performance Radar
          </h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { metric: 'Calls',     you: 80, target: 100 },
                { metric: 'Emails',    you: 90, target: 100 },
                { metric: 'Meetings',  you: 60, target: 100 },
                { metric: 'Deals',     you: 44, target: 100 },
                { metric: 'Follow-up', you: 75, target: 100 },
              ]}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize: 8 }} />
                <Radar name="You" dataKey="you" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                <Radar name="Target" dataKey="target" stroke="#E2E8F0" fill="#E2E8F0" fillOpacity={0.1} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 p-2.5 bg-blue-50 rounded-xl text-center">
            <p className="text-[10px] font-bold text-blue-600">Productivity Score</p>
            <p className="text-xl font-extrabold text-blue-800">82% <span className="text-xs text-blue-500">Excellent</span></p>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Today&apos;s Activity Timeline
            </h3>
            <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
          </div>
          <div className="space-y-3">
            {[
              { type: 'Call',    time: '05:30 PM', lead: 'Amit Sharma',    co: 'Sharma Enterprises', outcome: 'Connected',  notes: 'Discussed pricing. Interested.' },
              { type: 'Email',   time: '04:15 PM', lead: 'Neha Verma',     co: 'Verma Solutions',    outcome: 'Opened',     notes: 'Sent product brochure.' },
              { type: 'Meeting', time: '03:30 PM', lead: 'Rajeev Kumar',   co: 'Kumar Traders',      outcome: 'Completed',  notes: 'Demo done. Will decide Friday.' },
              { type: 'Call',    time: '02:20 PM', lead: 'Pooja Aggarwal', co: 'Aggarwal Industries',outcome: 'No Answer',  notes: 'Will retry at 5PM.' },
            ].map((act, i) => (
              <div key={i} onClick={() => router.push('/sales/activity')}
                className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded-xl transition">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  act.type==='Call'?'bg-green-100':act.type==='Email'?'bg-blue-100':'bg-amber-100'}`}>
                  {act.type==='Call'?<Phone className="w-3.5 h-3.5 text-green-700"/>:act.type==='Email'?<Mail className="w-3.5 h-3.5 text-blue-700"/>:<Calendar className="w-3.5 h-3.5 text-amber-700"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-bold text-slate-800">{act.type} · {act.lead}</p>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.co}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      act.outcome==='Connected'||act.outcome==='Completed'?'bg-green-100 text-green-700':act.outcome==='No Answer'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>
                      {act.outcome}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">{act.notes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
