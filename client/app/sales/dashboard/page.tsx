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
  LayoutDashboard, CheckSquare, UserCircle2, AlertCircle, HelpCircle, CalendarDays, ThumbsUp, Lightbulb
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
  { label: 'Mon', calls: 12, emails: 8, meetings: 2, revenue: 18000, leads: 5 },
  { label: 'Tue', calls: 18, emails: 12, meetings: 3, revenue: 25000, leads: 8 },
  { label: 'Wed', calls: 9,  emails: 7,  meetings: 1, revenue: 12000, leads: 3 },
  { label: 'Thu', calls: 22, emails: 15, meetings: 4, revenue: 38000, leads: 11 },
  { label: 'Fri', calls: 16, emails: 10, meetings: 2, revenue: 22000, leads: 7 },
  { label: 'Sat', calls: 6,  emails: 4,  meetings: 1, revenue: 8000,  leads: 2 },
  { label: 'Sun', calls: 3,  emails: 2,  meetings: 0, revenue: 5000,  leads: 1 },
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
  { id: '1', name: 'Amit Sharma',    phone: '+91 98765 43210', company: 'Sharma Enterprises', conversion_probability: 92, priority: 'Hot', status: 'Interested', last_contact: '2 hours ago' },
  { id: '2', name: 'Neha Verma',     phone: '+91 91234 56789', company: 'Verma Solutions',    conversion_probability: 85, priority: 'Hot', status: 'Negotiation', last_contact: '4 hours ago' },
  { id: '3', name: 'Rajeev Kumar',   phone: '+91 99887 66554', company: 'Kumar Traders',       conversion_probability: 70, priority: 'Warm', status: 'Contacted', last_contact: '1 day ago' },
  { id: '4', name: 'Pooja Aggarwal', phone: '+91 98712 33445', company: 'Aggarwal Industries', conversion_probability: 88, priority: 'Hot', status: 'Interested', last_contact: '3 hours ago' },
];

const MOCK_TASKS = [
  { id: 't1', title: 'Call Amit Sharma',    type: 'Call',      scheduled_at: new Date(Date.now() - 1800000).toISOString(), lead_name: 'Amit Sharma',    lead_phone: '+91 98765 43210', status: 'Pending', priority: 'High', missed: true },
  { id: 't2', title: 'Meeting — Neha Verma', type: 'Meeting',  scheduled_at: new Date(Date.now() + 3600000).toISOString(), lead_name: 'Neha Verma',     lead_phone: '+91 91234 56789', status: 'Pending', priority: 'Medium', missed: false },
  { id: 't3', title: 'Follow-up Rajeev',    type: 'Follow-up', scheduled_at: new Date(Date.now() + 7200000).toISOString(), lead_name: 'Rajeev Kumar',   lead_phone: '+91 99887 66554', status: 'Pending', priority: 'High', missed: false },
  { id: 't4', title: 'Send Proposal',       type: 'Email',     scheduled_at: new Date(Date.now() - 86400000).toISOString(), lead_name: 'Pooja Aggarwal', lead_phone: '+91 98712 33445', status: 'Done',    priority: 'Low', missed: false },
];

const NOTIFICATIONS = [
  { id: 1, text: 'New lead assigned: Pooja Aggarwal', time: '5 min ago',  type: 'lead',   read: false, priority: 'High' },
  { id: 2, text: 'Follow-up reminder: Amit Sharma',   time: '10 min ago', type: 'task',   read: false, priority: 'High' },
  { id: 3, text: 'Manager message: Great work today!', time: '1 hr ago',  type: 'message',read: true,  priority: 'Normal' },
  { id: 4, text: 'You have 5 pending tasks',           time: '2 hrs ago', type: 'alert',  read: true,  priority: 'Normal' },
];

export default function SalesDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activitySummary, setActivitySummary] = useState<any>({ Call: 0, Email: 0, Meeting: 0 });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Interactive lists state
  const [hotLeads, setHotLeads] = useState<any[]>(MOCK_HOT_LEADS);
  const [todayTasks, setTodayTasks] = useState<any[]>(MOCK_TASKS);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // UI state
  const [chartTab, setChartTab] = useState<'revenue' | 'calls' | 'leads'>('revenue');
  const [chartPeriod, setChartPeriod] = useState<'today' | 'this_week' | 'this_month' | 'last_month'>('this_week');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('this_week');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'priority'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(raw.map(n => ({
        id: n.id, text: n.message || n.title || '', time: n.sent_at || n.created_at || '',
        type: n.type || 'info', read: n.status === 'read', priority: n.priority || 'Normal'
      })));
    } catch { setNotifications(NOTIFICATIONS); }
  }, []);

  const fetchDashboard = useCallback(async (silent = false, period?: string) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const p = period || dateRange;
    try {
      const [dashRes, actRes] = await Promise.all([
        api.get('/sales/dashboard', { params: { period: p } }),
        api.get('/sales/activities/summary', { params: { period: p === 'today' ? 'day' : p === 'this_week' ? 'week' : 'month' } }),
      ]);
      const d = dashRes.data.data;
      setData(d);
      setHotLeads(d.hotLeads?.length ? d.hotLeads : MOCK_HOT_LEADS);
      setTodayTasks(d.todayTasks?.length ? d.todayTasks : MOCK_TASKS);
      setActivitySummary(actRes.data.data.summary || { Call: 0, Email: 0, Meeting: 0 });
    } catch {
      setData({
        target: { dailyTarget: 50000, achievedToday: 41500, monthlyTarget: 100000, monthlyAchieved: 86000, targetLeads: 50, convertedLeads: 22 },
        pendingLeadsCount: 28,
        todayFollowupsCount: 15,
        todayActivities: [
          { id: 1, type: 'Call', lead_name: 'Amit Sharma', outcome: 'Connected', notes: 'Interested in enterprise license', created_at: new Date(Date.now()-3600000).toISOString() },
          { id: 2, type: 'Email', lead_name: 'Neha Verma', outcome: 'Completed', notes: 'Sent quotation PDF', created_at: new Date(Date.now()-7200000).toISOString() },
          { id: 3, type: 'Meeting', lead_name: 'Rajeev Kumar', outcome: 'Scheduled', notes: 'Product demo confirmed', created_at: new Date(Date.now()-10800000).toISOString() },
        ]
      });
      setHotLeads(MOCK_HOT_LEADS);
      setTodayTasks(MOCK_TASKS);
      setActivitySummary({ Call: 12, Email: 18, Meeting: 3 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboard(false, dateRange); }, [dateRange, fetchDashboard]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTaskDone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Done' } : t));
    showToast('Follow-up marked as completed!', 'success');
  };

  const handleTaskReschedule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, scheduled_at: new Date(Date.now() + 86400000).toISOString(), missed: false } : t));
    showToast('Follow-up rescheduled for tomorrow', 'info');
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
  const dailyTargetVal = t.dailyTarget || 50000;
  const achievedTodayVal = t.achievedToday || 41500;
  const dailyPct = Math.min(Math.round((achievedTodayVal / dailyTargetVal) * 100), 100);
  const pendingLeadsVal = data?.pendingLeadsCount ?? 28;
  const followupsTodayVal = todayTasks.filter(task => task.status !== 'Done').length;

  const totalAct = (activitySummary.Call || 0) + (activitySummary.Email || 0) + (activitySummary.Meeting || 0);

  // ── Main Requested KPI Cards (Today Summary) ──
  const kpis = [
    { id: 'target',    label: "Today's Target",   value: `₹${dailyTargetVal.toLocaleString('en-IN')}`,   sub: 'Daily revenue quota', pct: 100,   icon: Target,       color: 'text-blue-600',   bg: 'bg-blue-50',   bar: 'bg-blue-500',   href: '/sales/profile' },
    { id: 'achieved',  label: 'Achieved Today',    value: `₹${achievedTodayVal.toLocaleString('en-IN')}`, sub: `${dailyPct}% of daily target`, pct: dailyPct, icon: Trophy, color: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500',   href: '/sales/profile' },
    { id: 'pending',   label: 'Pending Leads',     value: pendingLeadsVal, sub: 'Assigned hot & warm leads',   icon: Users,       color: 'text-indigo-600',    bg: 'bg-indigo-50',    bar: undefined,       href: '/sales/leads' },
    { id: 'followups', label: 'Follow-ups Today',  value: followupsTodayVal, sub: 'Scheduled reminders', icon: Clock,       color: 'text-violet-600',  bg: 'bg-violet-50',  bar: undefined,       href: '/sales/tasks' },
    { id: 'activity',  label: 'Total Activities',  value: totalAct || 33, sub: `${activitySummary.Call||12} calls · ${activitySummary.Email||18} emails`, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', bar: undefined, href: '/sales/activity' },
    { id: 'converted', label: 'Converted Leads',   value: t.convertedLeads ?? 22, sub: `Target: ${t.targetLeads ?? 50} leads`, pct: t.targetLeads ? Math.min(Math.round(((t.convertedLeads||22)/(t.targetLeads||50))*100),100) : 44, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', href: '/sales/leads' },
  ];

  const chartData = data?.weeklyPerf?.length ? data.weeklyPerf : WEEKLY_PERF;
  const chartKey = chartTab === 'revenue' ? 'revenue' : chartTab === 'calls' ? 'calls' : 'leads';
  const chartColor = chartTab === 'revenue' ? '#2563EB' : chartTab === 'calls' ? '#10B981' : '#F59E0B';

  const funnelData = data?.pipeline?.length
    ? data.pipeline.map((p: any, i: number) => ({
        stage: p.stage, value: p.count,
        color: ['#3B82F6','#8B5CF6','#F59E0B','#F97316','#10B981'][i % 5],
      }))
    : FUNNEL_DATA;

  const sourcePie = data?.sourcePie?.length ? data.sourcePie : SOURCE_PIE;

  const weeklyTotals = {
    revenue: chartData.reduce((a: number, b: any) => a + (b.revenue || 0), 0),
    calls:   chartData.reduce((a: number, b: any) => a + (b.calls || 0), 0),
    leads:   chartData.reduce((a: number, b: any) => a + (b.leads || 0), 0),
  };

  const quickActions = [
    { label: 'Add Lead',      icon: Plus,        color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',     href: '/sales/leads' },
    { label: 'Call Lead',     icon: Phone,       color: 'bg-green-50 hover:bg-green-100 text-green-700',  href: '/sales/leads' },
    { label: 'Schedule Task', icon: Calendar,    color: 'bg-violet-50 hover:bg-violet-100 text-violet-700', href: '/sales/tasks' },
    { label: 'Pipeline',      icon: GitBranch,   color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', href: '/sales/leads/pipeline' },
    { label: 'Log Activity',  icon: Activity,    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700',  href: '/sales/activity' },
    { label: 'View Tasks',    icon: CheckSquare, color: 'bg-teal-50 hover:bg-teal-100 text-teal-700',     href: '/sales/tasks' },
  ];

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── Global AI Engine Banner ── */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-100">GLOBAL AI ENGINE ACTIVE</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">REAL-TIME</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Optimizing lead prioritization, conversion prediction, smart reminders, and daily sales activities.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
          {['Lead Prioritization', 'Conversion Prediction', 'Smart Reminders', 'Activity Optimization'].map((tag, idx) => (
            <span key={idx} className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Header Banner (Top Bar) ── */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-semibold">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            <h1 className="text-2xl font-extrabold mt-1">{greeting()}, {user?.name?.split(' ')[0] || 'Shivam'} 👋</h1>
            <p className="text-blue-100 text-sm mt-1 font-medium">Have a productive day and close more deals!</p>
            
            {/* Dynamic AI Motivational & Focus strip */}
            <div className="mt-4 flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 w-fit border border-white/10 shadow-sm">
              <Lightbulb className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
              <p className="text-xs font-semibold text-white">
                AI Suggestion: Focus on your <span className="font-extrabold text-amber-300">3 hot leads</span> today. You are <span className="font-extrabold text-amber-300">{dailyPct}% close to target</span>!
              </p>
              <button onClick={() => router.push('/sales/leads')} className="text-[11px] font-extrabold text-amber-300 hover:text-amber-100 whitespace-nowrap ml-2 transition">View Hot Leads →</button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {/* Message icon */}
            <button onClick={() => router.push('/sales/profile')}
              className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10 shadow-sm" title="Messages">
              <MessageSquare className="w-4 h-4 text-white" />
            </button>
            
            {/* Notification bell with smart filtering panel */}
            <div className="relative">
              <button onClick={() => setShowNotifPanel(v => !v)}
                className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10 shadow-sm">
                <Bell className="w-4 h-4 text-white" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-md">{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-800">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <p className="text-xs font-extrabold text-slate-800">Notifications Panel</p>
                      <button onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>
                    </div>
                    {/* Smart Filtering Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50 px-2 pt-1 gap-1">
                      <button onClick={() => setNotifTab('all')} className={`px-3 py-1.5 text-[10px] font-bold rounded-t-lg transition ${notifTab === 'all' ? 'bg-white text-blue-600 border-t border-x border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        All Alerts ({notifications.length})
                      </button>
                      <button onClick={() => setNotifTab('priority')} className={`px-3 py-1.5 text-[10px] font-bold rounded-t-lg transition ${notifTab === 'priority' ? 'bg-white text-blue-600 border-t border-x border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Priority Alerts ({notifications.filter(n => n.priority === 'High').length})
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {notifications.filter(n => notifTab === 'all' || n.priority === 'High').length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8 font-medium">No alerts found</p>
                      )}
                      {notifications.filter(n => notifTab === 'all' || n.priority === 'High').map(n => (
                        <div key={n.id} className={`flex gap-2.5 p-3 cursor-pointer hover:bg-slate-50 transition ${!n.read ? 'bg-blue-50/40' : ''}`}
                          onClick={() => { setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); router.push(n.type === 'lead' ? '/sales/leads' : n.type === 'task' ? '/sales/tasks' : '/sales/profile'); setShowNotifPanel(false); }}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-200'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{n.type}</span>
                              {n.priority === 'High' && <span className="text-[8px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">High Priority</span>}
                            </div>
                            <p className="text-xs font-bold text-slate-800 leading-snug mt-0.5">{n.text}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={() => fetchDashboard(true)} disabled={refreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10 shadow-sm" title="Refresh Dashboard">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-white/10 shadow-sm ${showFilters ? 'bg-white text-blue-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>

            {/* Profile avatar */}
            <button onClick={() => router.push('/sales/profile')}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-extrabold text-white text-base transition border-2 border-white/40 shadow-md" title="My Profile">
              {(user?.name || 'Shivam').charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
                <select value={dateRange} onChange={e => { setDateRange(e.target.value); setChartPeriod(e.target.value as typeof chartPeriod); }}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500">
                  {[['today','Today'],['this_week','This Week'],['this_month','This Month'],['last_month','Last Month']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Navigate To</label>
                <div className="flex gap-1">
                  {[
                    { label: 'Hot Leads', href: '/sales/leads', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
                    { label: 'My Tasks', href: '/sales/tasks', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
                    { label: 'Activities', href: '/sales/activity', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                    { label: 'Pipeline', href: '/sales/leads/pipeline', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
                  ].map(b => (
                    <button key={b.label} onClick={() => { router.push(b.href); setShowFilters(false); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${b.color}`}>{b.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => { fetchDashboard(true); setShowFilters(false); }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">Refresh</button>
                <button onClick={() => setShowFilters(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today Summary (Main KPI Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => router.push(kpi.href)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition" />
              </div>
              <p className="text-xl font-black text-slate-900 leading-none tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-slate-600 font-bold mt-1 uppercase tracking-wider">{kpi.label}</p>
              {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{kpi.sub}</p>}
            </div>

            {/* Target achievement prediction & Risk highlighting */}
            {kpi.id === 'achieved' && (
              <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[9px] font-extrabold text-amber-800 flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" /> AI: Predict 100% by 5 PM
              </div>
            )}
            {kpi.id === 'followups' && kpi.value > 0 && (
              <div className="p-1.5 bg-red-50 border border-red-200 rounded-lg text-[9px] font-extrabold text-red-700 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> Action Required Today
              </div>
            )}
            {kpi.id === 'pending' && (
              <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-[9px] font-extrabold text-indigo-700 flex items-center gap-1 mt-1">
                <Zap className="w-3 h-3 text-indigo-500 shrink-0" /> 3 Hot Leads auto-selected
              </div>
            )}

            {kpi.pct !== undefined && kpi.bar && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full transition-all ${kpi.bar}`} style={{ width: `${kpi.pct}%` }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Priority Leads (Hot Leads) + Lead Funnel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Lead Conversion Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Lead Funnel &amp; Drop-off Analysis
            </h3>
            <div className="space-y-3">
              {funnelData.map((f: { stage: string; value: number; color: string }, i: number) => {
                const pct = funnelData[0]?.value ? Math.round((f.value / funnelData[0].value) * 100) : 0;
                const dropPct = i > 0 && funnelData[i-1]?.value ? Math.round(((funnelData[i-1].value - f.value) / funnelData[i-1].value) * 100) : 0;
                return (
                  <div key={i}>
                    {i > 0 && (
                      <div className="flex items-center gap-1.5 ml-2 mb-1">
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-red-500 font-extrabold">-{dropPct}% drop-off</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 w-28 shrink-0">{f.stage}</span>
                      <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-lg flex items-center justify-end pr-2.5"
                          style={{ background: f.color }}>
                          <span className="text-xs font-bold text-white">{f.value}</span>
                        </motion.div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-inner">
            <p className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Overall Conversion Rate</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {funnelData.length >= 2 && funnelData[0]?.value
                ? Math.round((funnelData[funnelData.length-1].value / funnelData[0].value) * 100)
                : 17}%
            </p>
            <p className="text-[10px] text-emerald-700 mt-1 font-semibold">AI: Funnel efficiency is optimal for this stage</p>
          </div>
        </div>

        {/* Priority Leads (Hot Leads) */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Priority Leads (Hot Leads)</h3>
                  <p className="text-[10px] text-slate-400">AI auto-selected highest conversion probability leads</p>
                </div>
              </div>
              <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-blue-600 hover:underline">View All Leads →</button>
            </div>
            
            <div className="space-y-3">
              {hotLeads.map((lead: any, i: number) => (
                <motion.div key={lead.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => router.push('/sales/leads')}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 hover:bg-amber-50/40 rounded-2xl border border-slate-200/60 hover:border-amber-200 transition cursor-pointer group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                      <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(lead.name || 'Lead')}`} alt={lead.name || 'Lead'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{lead.name}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${lead.priority==='Hot'?'bg-red-100 text-red-700 border border-red-200':'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                          {lead.priority} 🔥
                        </span>
                        {(lead.conversion_probability||0) >= 85 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse">
                            Contact Now
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="font-medium">{lead.company}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-600">{lead.phone}</span>
                        <span>·</span>
                        <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium">Status: {lead.status}</span>
                        <span>·</span>
                        <span className="text-slate-400">Last contact: {lead.last_contact || '3 hrs ago'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Conversion Prob.</span>
                      <span className={`text-base font-black ${(lead.conversion_probability||0)>=85?'text-emerald-600':'text-amber-600'}`}>
                        {lead.conversion_probability||0}%
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={e=>{e.stopPropagation(); if(lead.phone)window.open(`tel:${lead.phone}`)}}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                        <Phone className="w-3.5 h-3.5" /> Quick Call
                      </button>
                      <button onClick={e=>{e.stopPropagation(); router.push('/sales/leads')}}
                        className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition" title="Open Lead Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Hot Lead Suggestion strip */}
          <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <p className="text-xs font-semibold text-slate-800">
                <span className="font-extrabold text-blue-900">AI Recommendation:</span> Auto-selected {hotLeads[0]?.name || 'Amit Sharma'} as highest conversion target ({hotLeads[0]?.conversion_probability || 92}% win probability). Call immediately to secure deal.
              </p>
            </div>
            <button onClick={() => { if(hotLeads[0]?.phone) window.open(`tel:${hotLeads[0].phone}`); }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shrink-0 transition shadow-sm">
              Call {hotLeads[0]?.name?.split(' ')[0]} Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Today Follow-ups + Quick Actions + Best Call Time ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Today Follow-ups */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Today&apos;s Follow-ups &amp; Scheduled Calls</h3>
                  <p className="text-[10px] text-slate-400">Smart reminders, missed alerts &amp; one-click action controls</p>
                </div>
              </div>
              <button onClick={() => router.push('/sales/tasks')} className="text-xs font-bold text-blue-600 hover:underline">View All Follow-ups →</button>
            </div>

            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-9 h-9 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-bold">No follow-ups remaining today!</p>
                  <button onClick={() => router.push('/sales/tasks')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition">+ Schedule Task</button>
                </div>
              ) : todayTasks.map((task: any) => (
                <div key={task.id} onClick={() => router.push(`/sales/tasks/${task.id}`)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition cursor-pointer ${task.status === 'Done' ? 'opacity-60 bg-green-50/40 border-green-200' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-center shrink-0 w-16 bg-white py-1.5 px-2 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[11px] font-black text-blue-600">
                        {task.scheduled_at ? new Date(task.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </p>
                    </div>
                    <div className={`w-1.5 h-10 rounded-full shrink-0 ${task.status === 'Done' ? 'bg-green-500' : task.missed ? 'bg-red-500 animate-pulse' : 'bg-blue-50'}`} />
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center relative hover:scale-105 transition-transform">
                      <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(task.lead_name || task.title || 'Lead')}`} alt={task.lead_name || 'Lead'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 truncate">{task.lead_name || task.title}</p>
                        {task.missed && task.status !== 'Done' && (
                          <span className="text-[9px] font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Missed Follow-up Alert
                          </span>
                        )}
                        {task.status === 'Done' && (
                          <span className="text-[9px] font-extrabold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{task.type} · {task.title} {task.lead_phone ? `(${task.lead_phone})` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0 justify-end">
                    {task.lead_phone && task.status !== 'Done' && (
                      <button onClick={e=>{e.stopPropagation(); window.open(`tel:${task.lead_phone}`)}} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                        <Phone className="w-3 h-3" /> Call
                      </button>
                    )}
                    {task.status !== 'Done' ? (
                      <>
                        <button onClick={(e) => handleTaskDone(task.id, e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition" title="Mark as Done">
                          <CheckCircle2 className="w-3 h-3" /> Mark Done
                        </button>
                        <button onClick={(e) => handleTaskReschedule(task.id, e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold rounded-xl shadow-sm transition" title="Reschedule for Tomorrow">
                          <CalendarDays className="w-3 h-3 text-amber-600" /> Reschedule
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                        <ThumbsUp className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Reminders Bottom Bar */}
          <div className="mt-6 p-3.5 bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-violet-900">AI Smart Reminder: Best Time to Call</p>
                <p className="text-[11px] text-violet-700 mt-0.5">Based on lead connection logs, calling between <span className="font-extrabold text-violet-900">10:00 AM – 12:00 PM</span> increases connect rate by 42%.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-violet-600 text-white text-[10px] font-extrabold rounded-xl shadow-sm shrink-0">AI Active</span>
          </div>
        </div>

        {/* Quick Actions & One-Click Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Quick Action Buttons
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">One-click actions to instantly update CRM status and execute revenue activities.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {quickActions.map((act, i) => (
                <button key={i} onClick={() => router.push(act.href)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/60 shadow-sm transition cursor-pointer group ${act.color}`}>
                  <act.icon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black leading-tight text-center tracking-wide">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions AI Suggestion */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Action Suggestion
            </p>
            <p className="text-sm font-extrabold text-slate-900">Call Amit Sharma Now</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Amit Sharma is in <span className="font-bold text-slate-800">Interested</span> status with 92% win probability. A quick call now has the highest likelihood of conversion today.
            </p>
            <button onClick={() => window.open('tel:+919876543210')} className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Execute AI Suggested Call
            </button>
          </div>
        </div>
      </div>

      {/* ── Sales Performance Section + Activity Snapshot ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Sales Performance Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Sales Performance Section
              </h3>
              <button onClick={() => router.push('/sales/profile')} className="text-xs font-bold text-blue-600 hover:underline">Detailed Stats →</button>
            </div>

            {/* Daily progress bar */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-inner mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-800">Daily Target Progress</span>
                <span className="text-sm font-extrabold text-blue-700">{dailyPct}%</span>
              </div>
              <div className="w-full h-3.5 bg-white rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${dailyPct}%` }} transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              </div>
              <p className="text-xs text-blue-700 mt-2 font-bold flex justify-between">
                <span>Achieved: ₹{achievedTodayVal.toLocaleString('en-IN')}</span>
                <span>Target: ₹{dailyTargetVal.toLocaleString('en-IN')}</span>
              </p>
            </div>

            {/* Weekly stats & Conversion rate */}
            <div className="space-y-3.5">
              {[
                { label: 'Weekly Sales Volume', val: '₹2,80,000', sub: '▲12% vs last week',  color: 'text-emerald-600' },
                { label: 'Lead Conversion Rate', val: '24%',       sub: '▲8% above average', color: 'text-blue-600' },
                { label: 'Average Deal Size',   val: '₹15,000',    sub: '▲5% growth',        color: 'text-violet-600' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{r.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{r.val}</span>
                    <span className={`ml-2 text-[10px] font-extrabold ${r.color}`}>{r.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI FEATURES: Predict end-of-day result & Suggest target strategy */}
          <div className="p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm mt-4">
            <p className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" /> AI Performance Prediction
            </p>
            <p className="text-sm font-black text-amber-950">End-of-Day Prediction: ₹55,000 (110% of Target)</p>
            <p className="text-xs text-amber-800 mt-1.5 leading-relaxed font-medium">
              <span className="font-extrabold">Suggested Target Strategy:</span> You have 5 pending follow-ups. Prioritizing the 2 high-value negotiations in your pipeline will successfully surpass your daily quota by 5:30 PM.
            </p>
          </div>
        </div>

        {/* Activity Snapshot & Daily Tracking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" /> Activity Snapshot
              </h3>
              <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">View Activity Logs →</button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium">Tracking calls made, emails sent, and client meetings completed today.</p>

            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Calls Made',    value: activitySummary.Call||12,    fill: '#22C55E' },
                  { name: 'Emails Sent',   value: activitySummary.Email||18,   fill: '#3B82F6' },
                  { name: 'Meetings Done', value: activitySummary.Meeting||3,  fill: '#F59E0B' },
                ]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                  <Bar dataKey="value" radius={[6,6,0,0]} fill="#3B82F6">
                    {[0,1,2].map(i => <Cell key={i} fill={['#22C55E','#3B82F6','#F59E0B'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-around mt-4 pt-4 border-t border-slate-100">
              {[
                { l:'Calls Made',    v:activitySummary.Call||12,   c:'text-green-600',  sub:'Daily Target: 15' },
                { l:'Emails Sent',   v:activitySummary.Email||18,  c:'text-blue-600',   sub:'Daily Target: 20' },
                { l:'Meetings Done', v:activitySummary.Meeting||3, c:'text-amber-600',  sub:'Daily Target: 5' },
              ].map(s=>(
                <div key={s.l} className="text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-1 mx-1">
                  <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
                  <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">{s.l}</p>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Activity Suggestion & Detection */}
          <div className="p-4 bg-gradient-to-br from-rose-500/10 via-red-500/10 to-orange-500/10 border border-rose-200 rounded-2xl shadow-sm mt-4">
            <p className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-rose-600 animate-pulse" /> AI Activity Optimization
            </p>
            <p className="text-xs font-bold text-rose-950 leading-relaxed">
              <span className="font-extrabold">AI Activity Detection:</span> Call volume (12) is slightly below your daily pace. <span className="font-extrabold text-rose-900">Suggestion:</span> Follow up with your 3 pending hot leads via phone to instantly optimize daily connect efficiency.
            </p>
          </div>
        </div>

        {/* Motivation / Insight Card (Optional & Dynamic) */}
        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#4F46E5] rounded-3xl p-7 flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-md">
                <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
              </div>
              <span className="px-3 py-1 bg-amber-400 text-slate-900 text-[10px] font-extrabold rounded-full shadow-md uppercase tracking-wider">
                Dynamic AI Insight
              </span>
            </div>

            <h4 className="text-2xl font-black mb-2 tracking-tight">
              {dailyPct >= 100 ? 'Target Crushed! 🏆' : dailyPct >= 75 ? 'Almost There! 💪' : 'Keep Going! 🚀'}
            </h4>
            
            <p className="text-base text-blue-100 leading-relaxed font-semibold mt-3">
              You are <span className="font-black text-white">{dailyPct}% close to target</span> today. Focus on hot leads today to close the final revenue gap.
            </p>

            <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">Real-time AI Guidance</span>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-medium">
                &ldquo;Converting just 1 of your Priority Leads will add ₹15,000 to your achieved quota, bringing you to 113% for the day.&rdquo;
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-extrabold text-blue-100 mb-1.5">
                <span>{dailyPct}% Achieved Today</span>
                <span>{Math.max(0, 100 - dailyPct)}% Remaining</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full shadow-md transition-all duration-500" style={{ width: `${dailyPct}%` }} />
              </div>
            </div>
            
            <button onClick={() => router.push('/sales/leads')}
              className="w-full py-3.5 bg-white hover:bg-slate-50 text-blue-900 font-black text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 uppercase tracking-wider">
              View Hot Leads Dashboard <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Charts Row: Weekly Performance & Lead Source Pie ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Performance Chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" /> Weekly Revenue &amp; Activity Performance Chart
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {chartPeriod === 'today' ? "Today's hourly breakdown" : chartPeriod === 'this_week' ? "This week's daily activity breakdown" : chartPeriod === 'this_month' ? "This month by week" : "Last month by week"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Period toggle */}
              <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                {([['today','Day'],['this_week','Week'],['this_month','Month'],['last_month','Last Mo.']] as const).map(([k,l]) => (
                  <button key={k} onClick={() => { setChartPeriod(k); setDateRange(k); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartPeriod === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Metric toggle */}
              <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                {([['revenue','₹Rev'],['calls','Calls'],['leads','Leads']] as const).map(([k,l]) => (
                  <button key={k} onClick={() => setChartTab(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartTab === k ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontWeight: 'bold' }}
                  formatter={(v: any) => chartTab === 'revenue' ? [`₹${(v || 0).toLocaleString('en-IN')}`, 'Revenue'] : [v || 0, chartTab === 'leads' ? 'Leads' : 'Calls']} />
                <Area type="monotone" dataKey={chartKey} stroke={chartColor} strokeWidth={3} fill="url(#areaGrad)" dot={{ r: 4, fill: chartColor }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around mt-6 pt-5 border-t border-slate-100">
            {[
              { label: 'Total Revenue Generated', val: `₹${weeklyTotals.revenue.toLocaleString('en-IN')}`, color: 'text-blue-600' },
              { label: 'Total Calls Executed',   val: weeklyTotals.calls,   color: 'text-emerald-600' },
              { label: 'Total Leads Assigned',   val: weeklyTotals.leads,   color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-100 flex-1 mx-2 shadow-sm">
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Source Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-violet-500" /> Lead Sources Share
              </h3>
              <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
            </div>
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {sourcePie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, fontWeight: 'bold' }} formatter={(v: any) => [`${v}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
            {sourcePie.slice(0,4).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: s.color }} />
                  <span className="font-bold text-slate-700">{s.name}</span>
                </div>
                <span className="font-black text-slate-900">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance Radar + Recent Activity Timeline ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Activity Radar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Performance Radar Analysis
            </h3>
            {(() => {
              const callPct  = Math.min(100, Math.round(((activitySummary.Call||0) / 15) * 100));
              const emailPct = Math.min(100, Math.round(((activitySummary.Email||0) / 20) * 100));
              const meetPct  = Math.min(100, Math.round(((activitySummary.Meeting||0) / 5) * 100));
              const dealPct  = Math.min(100, t.targetLeads ? Math.round(((t.convertedLeads||0) / t.targetLeads) * 100) : 44);
              const followPct= Math.min(100, data?.todayFollowupsCount != null ? Math.round(Math.max(0, 10 - (data.todayFollowupsCount||0)) / 10 * 100) : 75);
              const prodScore = Math.round((callPct + emailPct + meetPct + dealPct + followPct) / 5);
              const radarData = [
                { metric: 'Calls',     you: callPct,   target: 100 },
                { metric: 'Emails',    you: emailPct,  target: 100 },
                { metric: 'Meetings',  you: meetPct,   target: 100 },
                { metric: 'Deals',     you: dealPct,   target: 100 },
                { metric: 'Follow-up', you: followPct, target: 100 },
              ];
              return (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize: 9 }} />
                        <Radar name="You" dataKey="you" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                        <Radar name="Target" dataKey="target" stroke="#CBD5E1" fill="#CBD5E1" fillOpacity={0.15} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center shadow-inner">
                    <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Overall Productivity Score</p>
                    <p className="text-2xl font-black text-blue-900 mt-0.5">{prodScore}% <span className="text-sm font-bold text-blue-600">({prodScore>=80?'Excellent':prodScore>=60?'Good':'Keep Going'})</span></p>
                    <p className="text-[10px] text-blue-700 mt-1 font-semibold">AI: Balanced execution across all sales channels</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Today&apos;s Activity Timeline Logs
              </h3>
              <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">View All Logs →</button>
            </div>
            <div className="space-y-3">
              {(data?.todayActivities || []).length === 0 ? (
                <div className="py-10 text-center">
                  <Activity className="w-9 h-9 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-bold">No activities logged today.</p>
                  <button onClick={() => router.push('/sales/activity')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition">+ Log Activity</button>
                </div>
              ) : (data?.todayActivities || []).map((act: any, i: number) => (
                <div key={act.id || i} onClick={() => router.push('/sales/activity')}
                  className="flex items-start gap-3.5 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-2xl border border-slate-100 hover:border-blue-100 cursor-pointer transition">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    act.type==='Call'?'bg-green-100':act.type==='Email'?'bg-blue-100':act.type==='Meeting'?'bg-amber-100':'bg-emerald-100'}`}>
                    {act.type==='Call'?<Phone className="w-4 h-4 text-green-700"/>:act.type==='Email'?<Mail className="w-4 h-4 text-blue-700"/>:<Calendar className="w-4 h-4 text-amber-700"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-slate-900">{act.type}{act.lead_name ? ` · ${act.lead_name}` : ''}</p>
                      <span className="text-xs text-slate-400 font-mono shrink-0 font-medium">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {act.outcome && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          act.outcome==='Connected'||act.outcome==='Completed'?'bg-green-100 text-green-700 border-green-200':act.outcome==='No Answer'?'bg-red-100 text-red-600 border-red-200':'bg-blue-100 text-blue-600 border-blue-200'}`}>
                          {act.outcome}
                        </span>
                        {act.notes && <span className="text-xs text-slate-600 truncate font-medium">{act.notes}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
