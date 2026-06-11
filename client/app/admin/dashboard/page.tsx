'use client';
import { motion } from 'framer-motion';
import { Users, UserCheck, Target, DollarSign, Ticket, Megaphone, ArrowUpRight, ArrowDownRight, Plus, BarChart3, Rocket, Shield, Wifi, WifiOff, AlertTriangle, Lightbulb, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { getUserStats, getLeadStats, MOCK_USERS } from '../../../store/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Link from 'next/link';

const weeklyData = [
  { day: 'Mon', leads: 12, converted: 4 }, { day: 'Tue', leads: 18, converted: 7 },
  { day: 'Wed', leads: 15, converted: 6 }, { day: 'Thu', leads: 22, converted: 9 },
  { day: 'Fri', leads: 28, converted: 12 }, { day: 'Sat', leads: 16, converted: 5 },
  { day: 'Sun', leads: 10, converted: 3 },
];
const pieData = [
  { name: 'Sales', value: 8, color: '#2563EB' }, { name: 'Marketing', value: 5, color: '#8B5CF6' },
  { name: 'Support', value: 4, color: '#06B6D4' }, { name: 'Finance', value: 3, color: '#F59E0B' },
  { name: 'Admin', value: 2, color: '#EF4444' },
];
const loginData = [
  { day: 'Mon', logins: 14 }, { day: 'Tue', logins: 18 }, { day: 'Wed', logins: 12 },
  { day: 'Thu', logins: 22 }, { day: 'Fri', logins: 20 }, { day: 'Sat', logins: 8 }, { day: 'Sun', logins: 5 },
];
const recentActivities = [
  { action: 'New user Arun Menon created', time: '2 min ago', color: 'bg-blue-500' },
  { action: 'Lead converted — TechVista Solutions', time: '15 min ago', color: 'bg-emerald-500' },
  { action: 'Campaign "Q2 Push" launched', time: '1 hr ago', color: 'bg-violet-500' },
  { action: 'Ticket #1042 resolved by Kavitha', time: '2 hrs ago', color: 'bg-amber-500' },
  { action: 'Password reset for Farhan Ali', time: '3 hrs ago', color: 'bg-red-500' },
];
const alerts = [
  { type: 'Security', msg: '3 failed login attempts detected', severity: 'text-red-600 bg-red-50' },
  { type: 'SLA', msg: '2 tickets nearing SLA breach', severity: 'text-amber-600 bg-amber-50' },
  { type: 'System', msg: 'WhatsApp API rate limit at 80%', severity: 'text-blue-600 bg-blue-50' },
];
const aiInsights = [
  { title: 'Boost Conversions', desc: 'Leads from LinkedIn convert 2.3x more. Increase LinkedIn budget by 15%.', color: 'border-blue-200 bg-blue-50/50' },
  { title: 'At-Risk Leads', desc: '8 leads haven\'t been contacted in 5+ days. Assign follow-ups now.', color: 'border-amber-200 bg-amber-50/50' },
  { title: 'Top Performer', desc: 'Deepa Krishnan closed 12 deals this month — 40% above average.', color: 'border-emerald-200 bg-emerald-50/50' },
  { title: 'Cost Saving', desc: 'Reduce email campaign frequency on weekends to save ₹1.2L/month.', color: 'border-violet-200 bg-violet-50/50' },
];
const integrations = [
  { name: 'Email (SMTP)', status: true }, { name: 'WhatsApp API', status: true },
  { name: 'Calling API', status: false }, { name: 'Payment Gateway', status: true },
];
const quickActions = [
  { label: 'Add User', href: '/admin/users?action=add', icon: Users, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { label: 'Assign Role', href: '/admin/roles', icon: Shield, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
  { label: 'View Reports', href: '/admin/reports', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { label: 'Subscription', href: '/admin/subscription', icon: Rocket, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
];

function Sec({ children, title, sub, delay = 0 }: { children: React.ReactNode; title: string; sub?: string; delay?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <div className="flex items-end justify-between mb-4">
        <div><h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">{title}</h2>{sub && <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{sub}</p>}</div>
      </div>
      {children}
    </motion.section>
  );
}

function KPI({ label, value, change, positive, icon: Icon, color, bg }: { label: string; value: string; change: string; positive: boolean; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
        </span>
      </div>
      <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{value}</p>
      <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const us = getUserStats();
  const ls = getLeadStats();
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* KPI Cards */}
      <Sec title="Overview" sub="Your organization performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPI label="Total Users" value={String(us.total)} change="+8.2%" positive icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <KPI label="Active Today" value={String(us.active)} change="+12.5%" positive icon={UserCheck} color="text-emerald-600" bg="bg-emerald-50" />
          <KPI label="Total Leads" value={String(ls.total)} change="+15.3%" positive icon={Target} color="text-violet-600" bg="bg-violet-50" />
          <KPI label="Total Tickets" value="186" change="-3.1%" positive={false} icon={Ticket} color="text-rose-600" bg="bg-rose-50" />
          <KPI label="Campaigns" value="24" change="+18.7%" positive icon={Megaphone} color="text-cyan-600" bg="bg-cyan-50" />
          <KPI label="Revenue" value="₹8.24L" change="+22.4%" positive icon={DollarSign} color="text-amber-600" bg="bg-amber-50" />
        </div>
      </Sec>

      {/* Overview Panels 2x2 */}
      <Sec title="Department Overview" sub="Sales, marketing, support & finance at a glance" delay={0.05}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Sales Overview</h3><span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3"/>+18%</span></div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ls.total}</p><p className="text-[10px] text-slate-500">Leads</p></div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ls.converted}</p><p className="text-[10px] text-slate-500">Converted</p></div>
              <div className="p-3 bg-violet-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">42%</p><p className="text-[10px] text-slate-500">Conv. Rate</p></div>
            </div>
            <div className="h-28"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData}><Area type="monotone" dataKey="converted" stroke="#2563EB" fill="#2563EB" fillOpacity={0.08} strokeWidth={2}/><XAxis dataKey="day" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/></AreaChart></ResponsiveContainer></div>
          </div>
          {/* Marketing */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Marketing Overview</h3><span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3"/>+24%</span></div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-3 bg-violet-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">24</p><p className="text-[10px] text-slate-500">Campaigns</p></div>
              <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">3.2x</p><p className="text-[10px] text-slate-500">ROI</p></div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">₹2.1L</p><p className="text-[10px] text-slate-500">Spend</p></div>
            </div>
            <div className="h-28"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><Bar dataKey="leads" fill="#8B5CF6" radius={[4,4,0,0]} fillOpacity={0.7}/><XAxis dataKey="day" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/></BarChart></ResponsiveContainer></div>
          </div>
          {/* Support */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Support Overview</h3><span className="text-xs text-amber-600 font-semibold">4 pending SLA</span></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-rose-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">42</p><p className="text-[10px] text-slate-500">Open</p></div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">128</p><p className="text-[10px] text-slate-500">Resolved</p></div>
              <div className="p-3 bg-amber-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">16</p><p className="text-[10px] text-slate-500">Pending</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:'69%'}}/></div><span className="text-[11px] text-slate-500 font-medium">69% resolved</span></div>
          </div>
          {/* Finance */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Finance Snapshot</h3><span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3"/>+22%</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-slate-500 mb-0.5">Revenue</p><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">₹8.24L</p></div>
              <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-slate-500 mb-0.5">Pending</p><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">₹1.86L</p></div>
              <div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs text-slate-500 mb-0.5">Collected</p><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">₹6.38L</p></div>
              <div className="p-3 bg-rose-50 rounded-xl"><p className="text-xs text-slate-500 mb-0.5">Overdue</p><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">₹0.42L</p></div>
            </div>
          </div>
        </div>
      </Sec>

      {/* User Activity + Role Distribution */}
      <Sec title="User Analytics" sub="Activity patterns and role breakdown" delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-1">User Activity</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">5</p><p className="text-[10px] text-slate-500">New Users</p></div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">{us.active}</p><p className="text-[10px] text-slate-500">Active Today</p></div>
              <div className="p-3 bg-violet-50 rounded-xl text-center"><p className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">94%</p><p className="text-[10px] text-slate-500">Retention</p></div>
            </div>
            <div className="h-40"><ResponsiveContainer width="100%" height="100%"><AreaChart data={loginData}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/><XAxis dataKey="day" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid #E2E8F0',fontSize:12}}/><Area type="monotone" dataKey="logins" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Role Distribution</h3>
            <div className="h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{borderRadius:12,border:'1px solid #E2E8F0',fontSize:12}}/></PieChart></ResponsiveContainer></div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{pieData.map(d=><div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-2 h-2 rounded-full" style={{backgroundColor:d.color}}/>{d.name} ({d.value})</div>)}</div>
          </div>
        </div>
      </Sec>

      {/* Recent Activities + Alerts + AI Insights */}
      <Sec title="Activity & Intelligence" sub="Timeline, alerts, and smart suggestions" delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#2563EB]"/>Recent Activities</h3>
            <div className="space-y-4">{recentActivities.map((a,i)=><div key={i} className="flex gap-3"><div className="flex flex-col items-center"><div className={`w-2.5 h-2.5 rounded-full ${a.color} mt-1 shrink-0`}/>{i<recentActivities.length-1&&<div className="w-px flex-1 bg-slate-200 my-1"/>}</div><div><p className="text-sm text-[#0F172A] dark:text-[#F9FAFB]">{a.action}</p><p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p></div></div>)}</div>
          </div>
          {/* Alerts */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/>Alerts</h3>
            <div className="space-y-3">{alerts.map((a,i)=><div key={i} className={`p-3 rounded-xl border ${a.severity}`}><span className="text-[11px] font-semibold uppercase tracking-wide">{a.type}</span><p className="text-sm mt-1">{a.msg}</p></div>)}</div>
            {/* Security Status */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Security Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Login Attempts (24h)</span><span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">142</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Failed Logins</span><span className="font-semibold text-red-600">3</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Active Sessions</span><span className="font-semibold text-emerald-600">18</span></div>
              </div>
            </div>
          </div>
          {/* AI Insights */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500"/>AI Insights</h3>
            <div className="space-y-3">{aiInsights.map((ins,i)=><div key={i} className={`p-3 rounded-xl border ${ins.color}`}><p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p><p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{ins.desc}</p></div>)}</div>
          </div>
        </div>
      </Sec>

      {/* Quick Actions + Integrations */}
      <Sec title="Quick Actions & Integrations" sub="Shortcuts and service status" delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{quickActions.map(q=><Link key={q.label} href={q.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-[#1f1f1f] transition ${q.color}`}><q.icon className="w-5 h-5"/><span className="text-xs font-semibold">{q.label}</span></Link>)}</div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Integration Status</h3>
            <div className="space-y-3">{integrations.map(ig=><div key={ig.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f]"><div className="flex items-center gap-3">{ig.status?<Wifi className="w-4 h-4 text-emerald-500"/>:<WifiOff className="w-4 h-4 text-red-500"/>}<span className="text-sm text-[#0F172A] dark:text-[#F9FAFB] font-medium">{ig.name}</span></div><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ig.status?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>{ig.status?'Active':'Down'}</span></div>)}</div>
          </div>
        </div>
      </Sec>

      {/* Recent Users */}
      <Sec title="Recent Users" sub="Latest team members" delay={0.25}>
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Users</h3>
            <Link href="/admin/users" className="text-xs text-[#2563EB] font-semibold hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">{['Name','Role','Department','Status','Last Login'].map(h=><th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{MOCK_USERS.slice(0,5).map(u=><tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-[#161616]/50 transition-colors">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{u.avatar}</div><span className="text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">{u.name}</span></div></td>
              <td className="px-5 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-lg">{u.role}</span></td>
              <td className="px-5 py-3 text-xs text-slate-600">{u.department}</td>
              <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${u.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':u.status==='Inactive'?'bg-amber-50 text-amber-700 border-amber-200':'bg-red-50 text-red-700 border-red-200'}`}>{u.status}</span></td>
              <td className="px-5 py-3 text-xs text-slate-500">{u.lastLogin}</td>
            </tr>)}</tbody></table></div>
        </div>
      </Sec>
    </div>
  );
}
