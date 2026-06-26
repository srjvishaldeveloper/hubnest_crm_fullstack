'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, Target, DollarSign, Ticket, Megaphone,
  ArrowUpRight, ArrowDownRight, Plus, BarChart3, Rocket, Shield,
  Wifi, WifiOff, AlertTriangle, Lightbulb, Activity, CheckCircle2,
  XCircle, Bell, RefreshCw, TrendingUp, Zap, Search, Eye,
  ChevronRight, Clock, Server, ShieldAlert, Globe, Settings,
  UserPlus, FileText, X, Play, Pause, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line
} from 'recharts';
import api from '../../../services/api';

// ─── mock fallback constants ───────────────────────────────────────────────────
const MOCK_WEEKLY = [
  { day: 'Mon', leads: 12, converted: 4, tickets: 8 },
  { day: 'Tue', leads: 18, converted: 7, tickets: 14 },
  { day: 'Wed', leads: 15, converted: 6, tickets: 10 },
  { day: 'Thu', leads: 22, converted: 9, tickets: 18 },
  { day: 'Fri', leads: 28, converted: 12, tickets: 22 },
  { day: 'Sat', leads: 16, converted: 5, tickets: 9 },
  { day: 'Sun', leads: 10, converted: 3, tickets: 5 },
];
const MOCK_LOGIN_DATA = [
  { day: 'Mon', logins: 14 }, { day: 'Tue', logins: 18 }, { day: 'Wed', logins: 12 },
  { day: 'Thu', logins: 22 }, { day: 'Fri', logins: 20 }, { day: 'Sat', logins: 8 }, { day: 'Sun', logins: 5 },
];
const MOCK_ROLE_PIE = [
  { name: 'Sales', value: 85, color: '#2563EB' },
  { name: 'Marketing', value: 48, color: '#8B5CF6' },
  { name: 'Support', value: 46, color: '#06B6D4' },
  { name: 'Finance', value: 25, color: '#F59E0B' },
  { name: 'Admin', value: 12, color: '#EF4444' },
];
const MOCK_ACTIVITIES = [
  { action: 'New user Arun Menon created by Admin', time: '2 min ago', color: 'bg-blue-500', type: 'user' },
  { action: 'Lead converted — TechVista Solutions', time: '15 min ago', color: 'bg-emerald-500', type: 'lead' },
  { action: 'Campaign "Q2 Push" launched', time: '1 hr ago', color: 'bg-violet-500', type: 'campaign' },
  { action: 'Ticket #1042 resolved by Kavitha', time: '2 hrs ago', color: 'bg-amber-500', type: 'ticket' },
  { action: 'Password reset for Farhan Ali', time: '3 hrs ago', color: 'bg-red-500', type: 'security' },
  { action: 'SLA breach on Ticket #998 — escalated', time: '4 hrs ago', color: 'bg-rose-500', type: 'alert' },
];
const MOCK_ALERTS = [
  { type: 'Security', msg: '3 failed login attempts detected from 192.168.1.45', severity: 'high', age: '5 min ago' },
  { type: 'SLA', msg: '2 tickets nearing SLA breach — action needed', severity: 'medium', age: '12 min ago' },
  { type: 'System', msg: 'WhatsApp API rate limit at 80% — consider upgrade', severity: 'low', age: '1 hr ago' },
  { type: 'Finance', msg: 'Payment overdue from 3 clients — ₹1.8L total', severity: 'medium', age: '2 hrs ago' },
];
const MOCK_AI_INSIGHTS = [
  { title: 'Boost Conversions', desc: 'Leads from LinkedIn convert 2.3× more. Increase LinkedIn budget by 15%.', color: 'border-blue-200 bg-blue-50/50', badge: 'Sales', badgeColor: 'bg-blue-100 text-blue-700' },
  { title: 'At-Risk Leads', desc: '8 leads haven\'t been contacted in 5+ days. Assign follow-ups now.', color: 'border-amber-200 bg-amber-50/50', badge: 'Action', badgeColor: 'bg-amber-100 text-amber-700' },
  { title: 'Top Performer', desc: 'Deepa Krishnan closed 12 deals this month — 40% above average.', color: 'border-emerald-200 bg-emerald-50/50', badge: 'HR', badgeColor: 'bg-emerald-100 text-emerald-700' },
  { title: 'Cost Saving', desc: 'Reduce email campaign frequency on weekends — save ₹1.2L/month.', color: 'border-violet-200 bg-violet-50/50', badge: 'Finance', badgeColor: 'bg-violet-100 text-violet-700' },
];
const MOCK_INTEGRATIONS = [
  { name: 'Email (SMTP)', status: true, latency: '42ms' },
  { name: 'WhatsApp API', status: true, latency: '128ms' },
  { name: 'Calling API', status: false, latency: '—' },
  { name: 'Payment Gateway', status: true, latency: '68ms' },
];
const QUICK_ACTIONS = [
  { label: 'Add User', href: '/admin/users?action=add', icon: UserPlus, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100' },
  { label: 'Assign Role', href: '/admin/roles', icon: Shield, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100' },
  { label: 'View Reports', href: '/admin/reports', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
  { label: 'CRM Control', href: '/admin/crm-control', icon: Settings, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-100' },
  { label: 'Subscription', href: '/admin/subscription', icon: Rocket, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100' },
];

function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${map[s]}`}>{s}</span>;
}

function KPICard({ label, value, change, positive, icon: Icon, color, bg, href }: {
  label: string; value: string; change: string; positive: boolean;
  icon: React.ElementType; color: string; bg: string; href?: string;
}) {
  const router = useRouter();
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => href && router.push(href)}
      className={`bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5 transition-shadow hover:shadow-md ${href ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {change && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{value}</p>
      <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [kpi, setKpi] = useState({ totalUsers: 256, activeUsers: 168, totalLeads: 3754, totalTickets: 1264, campaigns: 38, revenue: '24.58L' });
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [aiInsights, setAiInsights] = useState(MOCK_AI_INSIGHTS);
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
  const [weeklyData, setWeeklyData] = useState(MOCK_WEEKLY);
  const [loginData, setLoginData] = useState(MOCK_LOGIN_DATA);
  const [rolePie, setRolePie] = useState(MOCK_ROLE_PIE);
  const [chartTab, setChartTab] = useState<'leads' | 'tickets' | 'logins'>('leads');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(4);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [moduleToggles, setModuleToggles] = useState({ sales: true, marketing: true, support: true, finance: true });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, leadsRes, campRes, ticketsRes, adminRes] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/marketing/leads'),
        api.get('/marketing/campaigns'),
        api.get('/support/tickets'),
        api.get('/admin/dashboard'),
      ]);
      const uList = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.users ?? []) : [];
      const leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.data?.data?.leads ?? leadsRes.value.data?.data ?? []) : [];
      const camps = campRes.status === 'fulfilled' ? (campRes.value.data?.data?.campaigns ?? campRes.value.data?.data ?? []) : [];
      const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value.data?.data?.tickets ?? ticketsRes.value.data?.data ?? []) : [];
      
      const adminData = adminRes.status === 'fulfilled' ? (adminRes.value.data?.data ?? adminRes.value.data ?? null) : null;
      if (adminData?.weeklyActivity) setWeeklyData(adminData.weeklyActivity);
      if (adminData?.loginActivity) setLoginData(adminData.loginActivity);
      if (adminData?.rolePie) setRolePie(adminData.rolePie);

      if (uList.length > 0) {
        setUsers(uList.slice(0, 6));
        setRolePie([
          { name: 'Sales', value: uList.filter((u: any) => u.department === 'Sales').length || 85, color: '#2563EB' },
          { name: 'Marketing', value: uList.filter((u: any) => u.department === 'Marketing').length || 48, color: '#8B5CF6' },
          { name: 'Support', value: uList.filter((u: any) => u.department === 'Support').length || 46, color: '#06B6D4' },
          { name: 'Finance', value: uList.filter((u: any) => u.department === 'Finance').length || 25, color: '#F59E0B' },
          { name: 'Admin', value: uList.filter((u: any) => u.role === 'Admin').length || 12, color: '#EF4444' },
        ]);
        setKpi(prev => ({
          ...prev,
          totalUsers: uList.length,
          activeUsers: uList.filter((u: any) => u.status === 'Active').length,
          totalLeads: Array.isArray(leads) ? leads.length : prev.totalLeads,
          campaigns: Array.isArray(camps) ? camps.length : prev.campaigns,
          totalTickets: Array.isArray(tickets) ? tickets.length : prev.totalTickets,
        }));
      }
    } catch {
      // use mock data
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  function dismissAlert(i: number) {
    setAlerts(prev => prev.filter((_, idx) => idx !== i));
    setNotifCount(prev => Math.max(0, prev - 1));
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">{greeting}, Admin</p>
            <h1 className="text-white text-2xl font-extrabold mt-0.5">CRM Admin Dashboard</h1>
            <p className="text-blue-200 text-xs mt-1">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDashboard()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white">
                <Bell className="w-4 h-4" />
                {notifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{notifCount}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2a2a2a] z-50"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0F172A] dark:text-white">Notifications</span>
                      <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-[#2a2a2a] max-h-72 overflow-y-auto">
                      {alerts.map((a, i) => (
                        <div key={i} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#222] transition">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{a.type}</p>
                            <p className="text-[11px] text-slate-500 truncate">{a.msg}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{a.age}</p>
                          </div>
                          <button onClick={() => dismissAlert(i)}><X className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" /></button>
                        </div>
                      ))}
                      {alerts.length === 0 && <p className="text-center text-xs text-slate-400 py-6">All clear!</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setAddUserOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#2563EB] rounded-xl text-sm font-bold hover:bg-blue-50 transition">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard label="Total Users" value={kpi.totalUsers.toLocaleString()} change="+12%" positive icon={Users} color="text-blue-600" bg="bg-blue-50" href="/admin/users" />
          <KPICard label="Active Users" value={kpi.activeUsers.toLocaleString()} change="+8%" positive icon={UserCheck} color="text-emerald-600" bg="bg-emerald-50" href="/admin/user-activity" />
          <KPICard label="Total Leads" value={kpi.totalLeads.toLocaleString()} change="+18%" positive icon={Target} color="text-violet-600" bg="bg-violet-50" href="/admin/crm-control" />
          <KPICard label="Tickets" value={kpi.totalTickets.toLocaleString()} change="+5%" positive={false} icon={Ticket} color="text-rose-600" bg="bg-rose-50" href="/admin/crm-control" />
          <KPICard label="Campaigns" value={kpi.campaigns.toLocaleString()} change="+6%" positive icon={Megaphone} color="text-cyan-600" bg="bg-cyan-50" href="/admin/crm-control" />
          <KPICard label="Revenue" value={`₹${kpi.revenue}`} change="+14%" positive icon={DollarSign} color="text-amber-600" bg="bg-amber-50" href="/admin/reports" />
        </div>
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Weekly Trends</h3>
            <div className="flex gap-1">
              {(['leads', 'tickets', 'logins'] as const).map(t => (
                <button key={t} onClick={() => setChartTab(t)} className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize transition ${chartTab === t ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-48" style={{ minHeight: 192 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              {chartTab === 'leads' ? (
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="leads" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} strokeWidth={2} name="Leads" />
                  <Area type="monotone" dataKey="converted" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Converted" />
                </AreaChart>
              ) : chartTab === 'tickets' ? (
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="tickets" fill="#EF4444" radius={[4, 4, 0, 0]} fillOpacity={0.8} name="Tickets" />
                </BarChart>
              ) : (
                <LineChart data={loginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="logins" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} name="Logins" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        {/* Role Distribution Donut */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Role Distribution</h3>
          <div className="h-36" style={{ minHeight: 144 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <PieChart>
                <Pie data={rolePie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {rolePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {rolePie.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} /><span className="text-slate-600 dark:text-slate-400">{d.name}</span></div>
                <span className="font-semibold text-[#0F172A] dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Department Overview ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Department Overview</h2>
          <Link href="/admin/crm-control" className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-0.5">View CRM Control <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center"><Target className="w-3.5 h-3.5 text-blue-600" /></div><span className="text-xs font-bold text-[#0F172A] dark:text-white">Sales</span></div>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+18%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 bg-blue-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">{kpi.totalLeads.toLocaleString()}</p><p className="text-[9px] text-slate-500">Leads</p></div>
              <div className="p-2 bg-emerald-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">671</p><p className="text-[9px] text-slate-500">Won</p></div>
              <div className="p-2 bg-violet-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">17.9%</p><p className="text-[9px] text-slate-500">Rate</p></div>
            </div>
            <div className="h-16" style={{ minHeight: 64 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <AreaChart data={weeklyData}><Area type="monotone" dataKey="converted" stroke="#2563EB" fill="#2563EB" fillOpacity={0.08} strokeWidth={1.5} /><XAxis dataKey="day" hide /></AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Marketing */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center"><Megaphone className="w-3.5 h-3.5 text-violet-600" /></div><span className="text-xs font-bold text-[#0F172A] dark:text-white">Marketing</span></div>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+24%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 bg-violet-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">{kpi.campaigns}</p><p className="text-[9px] text-slate-500">Campaigns</p></div>
              <div className="p-2 bg-blue-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">3.2×</p><p className="text-[9px] text-slate-500">ROI</p></div>
              <div className="p-2 bg-emerald-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">₹2.1L</p><p className="text-[9px] text-slate-500">Spend</p></div>
            </div>
            <div className="h-16" style={{ minHeight: 64 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={weeklyData}><Bar dataKey="leads" fill="#8B5CF6" radius={[3, 3, 0, 0]} fillOpacity={0.6} /><XAxis dataKey="day" hide /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Support */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center"><Ticket className="w-3.5 h-3.5 text-rose-600" /></div><span className="text-xs font-bold text-[#0F172A] dark:text-white">Support</span></div>
              <span className="text-[10px] font-semibold text-amber-600">4 SLA at risk</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 bg-rose-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">342</p><p className="text-[9px] text-slate-500">Open</p></div>
              <div className="p-2 bg-emerald-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">610</p><p className="text-[9px] text-slate-500">Resolved</p></div>
              <div className="p-2 bg-amber-50 rounded-xl"><p className="text-sm font-bold text-[#0F172A] dark:text-white">92%</p><p className="text-[9px] text-slate-500">SLA</p></div>
            </div>
            <div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '69%' }} /></div><span className="text-[10px] text-slate-500">69%</span></div>
          </div>
          {/* Finance */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-amber-600" /></div><span className="text-xs font-bold text-[#0F172A] dark:text-white">Finance</span></div>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+22%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-emerald-50 rounded-xl"><p className="text-[9px] text-slate-500 mb-0.5">Revenue</p><p className="text-sm font-bold text-[#0F172A] dark:text-white">₹8.24L</p></div>
              <div className="p-2 bg-amber-50 rounded-xl"><p className="text-[9px] text-slate-500 mb-0.5">Pending</p><p className="text-sm font-bold text-[#0F172A] dark:text-white">₹1.86L</p></div>
              <div className="p-2 bg-blue-50 rounded-xl"><p className="text-[9px] text-slate-500 mb-0.5">Collected</p><p className="text-sm font-bold text-[#0F172A] dark:text-white">₹6.38L</p></div>
              <div className="p-2 bg-rose-50 rounded-xl"><p className="text-[9px] text-slate-500 mb-0.5">Overdue</p><p className="text-sm font-bold text-[#0F172A] dark:text-white">₹0.42L</p></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Module Toggle Control ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Module Control</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(moduleToggles) as Array<keyof typeof moduleToggles>).map(mod => (
            <div key={mod} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white capitalize">{mod}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${moduleToggles[mod] ? 'text-emerald-600' : 'text-red-500'}`}>{moduleToggles[mod] ? 'Active' : 'Disabled'}</p>
              </div>
              <button onClick={() => setModuleToggles(prev => ({ ...prev, [mod]: !prev[mod] }))} className="transition-colors">
                {moduleToggles[mod]
                  ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                  : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Activity, Alerts, AI Insights ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Activity & Intelligence</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#2563EB]" />Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${a.color} mt-1 shrink-0`} />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-[#2a2a2a] my-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs text-[#0F172A] dark:text-[#F9FAFB] leading-snug">{a.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/audit-logs" className="mt-4 flex items-center gap-1 text-xs text-[#2563EB] font-semibold hover:underline">View Audit Logs <ChevronRight className="w-3 h-3" /></Link>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Alerts & Incidents</h3>
            <div className="space-y-2">
              {alerts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">All systems clear</p>}
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border ${a.severity === 'high' ? 'bg-red-50 border-red-200' : a.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <SeverityBadge s={a.severity} />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{a.age}</span>
                      <button onClick={() => dismissAlert(i)}><X className="w-3 h-3 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{a.msg}</p>
                </div>
              ))}
            </div>
            {/* Security snapshot */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2a2a2a] space-y-2">
              {[{ label: 'Login Attempts (24h)', val: '142', color: 'text-[#0F172A] dark:text-white' }, { label: 'Failed Logins', val: '3', color: 'text-red-600' }, { label: 'Active Sessions', val: '18', color: 'text-emerald-600' }].map(s => (
                <div key={s.label} className="flex justify-between text-xs"><span className="text-slate-500">{s.label}</span><span className={`font-bold ${s.color}`}>{s.val}</span></div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />AI Insights</h3>
            <div className="space-y-3">
              {aiInsights.map((ins, i) => (
                <div key={i} className={`p-3 rounded-xl border ${ins.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${ins.badgeColor}`}>{ins.badge}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{ins.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions + Integrations ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Quick Actions & Integrations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map(q => (
                <Link key={q.label} href={q.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${q.color}`}>
                  <q.icon className="w-5 h-5" /><span className="text-xs font-semibold">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Integration Status</h3>
            <div className="space-y-2.5">
              {integrations.map(ig => (
                <div key={ig.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-2.5">
                    {ig.status ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                    <span className="text-xs font-medium text-[#0F172A] dark:text-white">{ig.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ig.latency !== '—' && <span className="text-[10px] text-slate-400">{ig.latency}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ig.status ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{ig.status ? 'Active' : 'Down'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Recent Users Table ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-[#2563EB] font-semibold hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                {['Name', 'Role', 'Department', 'Status', 'Last Login'].map(h => <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>
                {(users.length > 0 ? users : [
                  { id: '1', name: 'Rahul Sharma', role: 'Sales Executive', department: 'Sales', status: 'Active', lastLogin: '10:30 AM', avatar: 'RS' },
                  { id: '2', name: 'Neha Verma', role: 'Marketing Manager', department: 'Marketing', status: 'Active', lastLogin: '09:15 AM', avatar: 'NV' },
                  { id: '3', name: 'Amit Patel', role: 'Support Agent', department: 'Support', status: 'Active', lastLogin: '11:20 AM', avatar: 'AP' },
                  { id: '4', name: 'Priya Singh', role: 'Finance Executive', department: 'Finance', status: 'Inactive', lastLogin: '04:45 PM', avatar: 'PS' },
                  { id: '5', name: 'Vikram Joshi', role: 'Admin', department: 'Administration', status: 'Active', lastLogin: '08:30 AM', avatar: 'VJ' },
                ]).slice(0, 5).map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{u.avatar || u.name?.substring(0, 2).toUpperCase()}</div>
                        <span className="text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-lg">{u.role}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">{u.department}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : u.status === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : u.status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />{u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Add User Modal ── */}
      <AnimatePresence>
        {addUserOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Add New User</h3>
                <button onClick={() => setAddUserOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                {[{ label: 'Full Name', type: 'text', placeholder: 'Enter full name' }, { label: 'Email', type: 'email', placeholder: 'name@company.com' }, { label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' }].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Role</label>
                  <select className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                    <option>Sales Executive</option><option>Marketing Executive</option><option>Support Agent</option><option>Finance Executive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setAddUserOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <Link href="/admin/users?action=add" className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold text-center hover:bg-blue-700 transition">Create User</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
