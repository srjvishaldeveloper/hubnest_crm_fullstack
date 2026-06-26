'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Megaphone, Ticket, DollarSign, Cpu, Plug, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Search, Activity, Sparkles, Plus, AlertCircle,
  CheckCircle2, Play, Users, Clock, Settings, Zap, BarChart3,
  TrendingUp, RefreshCw, X, ChevronRight, Globe, Mail, Phone,
  MessageSquare, Filter, Download, ToggleLeft, ToggleRight, Bell,
  Lightbulb, AlertTriangle, Eye, Pencil
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../../../services/api';

// ─── mock constants ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { stage: 'New Leads', count: 142, value: '₹12.4L', color: 'border-l-blue-500 bg-blue-50/40 dark:bg-blue-900/10', pct: 100 },
  { stage: 'Qualified', count: 86, value: '₹9.2L', color: 'border-l-violet-500 bg-violet-50/40 dark:bg-violet-900/10', pct: 60 },
  { stage: 'Proposal', count: 48, value: '₹14.8L', color: 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-900/10', pct: 34 },
  { stage: 'Closed Won', count: 95, value: '₹24.5L', color: 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10', pct: 67 },
];
const TEAM_PERF = [
  { name: 'Arun Menon', leads: 142, converted: 48, rate: '33.8%', revenue: '₹4.8L', pct: 84 },
  { name: 'Deepa Krishnan', leads: 118, converted: 52, rate: '44.1%', revenue: '₹6.2L', pct: 92 },
  { name: 'Farhan Ali', leads: 95, converted: 30, rate: '31.5%', revenue: '₹3.1L', pct: 70 },
  { name: 'Sanjana Reddy', leads: 80, converted: 24, rate: '30.0%', revenue: '₹2.6L', pct: 65 },
];
const CAMPAIGNS = [
  { name: 'Q2 Product Launch', status: 'Active', leads: 420, roi: '3.4×', spend: '₹2.1L', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'LinkedIn Search Ad', status: 'Active', leads: 280, roi: '2.8×', spend: '₹1.4L', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Email Newsletter v4', status: 'Paused', leads: 150, roi: '1.9×', spend: '₹0.8L', color: 'bg-amber-100 text-amber-700' },
  { name: 'WhatsApp Broadcast', status: 'Active', leads: 190, roi: '4.2×', spend: '₹0.5L', color: 'bg-emerald-100 text-emerald-700' },
];
const AGENTS = [
  { name: 'Kavitha Pillai', tickets: 94, resolved: 88, avgTime: '2.1 hrs', sla: '96%', pct: 94 },
  { name: 'Lakshmi Devi', tickets: 82, resolved: 78, avgTime: '1.8 hrs', sla: '98%', pct: 98 },
  { name: 'Mohan Das', tickets: 60, resolved: 52, avgTime: '3.4 hrs', sla: '88%', pct: 88 },
];
const LEADS_TREND = [
  { month: 'Jan', leads: 280 }, { month: 'Feb', leads: 320 }, { month: 'Mar', leads: 410 },
  { month: 'Apr', leads: 390 }, { month: 'May', leads: 480 }, { month: 'Jun', leads: 520 },
];
const ROI_TREND = [
  { month: 'Jan', roi: 2.1 }, { month: 'Feb', roi: 2.8 }, { month: 'Mar', roi: 3.2 },
  { month: 'Apr', roi: 2.9 }, { month: 'May', roi: 3.6 }, { month: 'Jun', roi: 4.1 },
];
const TICKET_TREND = [
  { month: 'Jan', open: 120, resolved: 98 }, { month: 'Feb', open: 140, resolved: 128 },
  { month: 'Mar', open: 110, resolved: 104 }, { month: 'Apr', open: 160, resolved: 140 },
  { month: 'May', open: 130, resolved: 125 }, { month: 'Jun', open: 145, resolved: 138 },
];
const REVENUE_TREND = [
  { month: 'Jan', rev: 4.2 }, { month: 'Feb', rev: 5.1 }, { month: 'Mar', rev: 6.8 },
  { month: 'Apr', rev: 5.9 }, { month: 'May', rev: 7.4 }, { month: 'Jun', rev: 8.2 },
];
const TICKET_STATUS_PIE = [
  { name: 'Open', value: 342, color: '#EF4444' },
  { name: 'In Progress', value: 312, color: '#F59E0B' },
  { name: 'Resolved', value: 610, color: '#10B981' },
];
const LEAD_SOURCE_BAR = [
  { name: 'Google', value: 45 }, { name: 'LinkedIn', value: 28 }, { name: 'Email', value: 18 },
  { name: 'WhatsApp', value: 14 }, { name: 'Direct', value: 10 },
];
const ALERTS = [
  { type: 'Lead Drop', msg: 'Lead conversion dropped by 12% this week', severity: 'high', time: '20 min ago' },
  { type: 'SLA Breach', msg: 'SLA breach detected in 8 tickets — escalate now', severity: 'high', time: '12 min ago' },
  { type: 'Campaign', msg: 'Campaign budget for "Q2 Launch" running low (15% left)', severity: 'medium', time: '1 hr ago' },
  { type: 'Finance', msg: 'Payment overdue from 5 clients totalling ₹1.18L', severity: 'medium', time: '35 min ago' },
];
const AI_RECS = [
  { msg: 'Continue leads in proposal stage — 48 deals worth ₹14.8L pending', tag: 'Sales' },
  { msg: 'Decrease budget for bottom performing campaigns by 20%', tag: 'Marketing' },
  { msg: 'Reassign 5 idle tickets from Mohan Das to Kavitha Pillai', tag: 'Support' },
  { msg: 'Automate lead assignment for LinkedIn source — 2.3× conversion rate', tag: 'Automation' },
];
const INTEGRATIONS = [
  { name: 'Email System', status: 'Connected', icon: Mail, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'WhatsApp API', status: 'Connected', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Calling API', status: 'Disconnected', icon: Phone, color: 'text-red-600 bg-red-50' },
  { name: 'Payment Gateway', status: 'Connected', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Google Calendar', status: 'Connected', icon: Globe, color: 'text-emerald-600 bg-emerald-50' },
];

const TABS = ['Overview', 'Sales', 'Marketing', 'Support', 'Finance', 'Automation', 'Analytics', 'Integrations'] as const;
type Tab = typeof TABS[number];

export default function CRMControlPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState({ leads: 3754, converted: 671, tickets: 1264, campaigns: 38, revenue: '24.58L', sla: '92%' });
  const [automations, setAutomations] = useState({ autoLead: true, autoTicket: true, campaignTrigger: true, followUps: true, slaAlert: true });
  const [alerts, setAlerts] = useState(ALERTS);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchKpi = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, ticketsRes, campsRes] = await Promise.allSettled([
        api.get('/marketing/leads'),
        api.get('/support/tickets'),
        api.get('/marketing/campaigns'),
      ]);
      const leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.data?.data?.leads ?? leadsRes.value.data?.data ?? []) : [];
      const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value.data?.data?.tickets ?? ticketsRes.value.data?.data ?? []) : [];
      const camps = campsRes.status === 'fulfilled' ? (campsRes.value.data?.data?.campaigns ?? campsRes.value.data?.data ?? []) : [];
      if (Array.isArray(leads) && leads.length > 0) {
        setKpi(prev => ({
          ...prev,
          leads: leads.length,
          converted: leads.filter((l: any) => l.status === 'Converted' || l.stage === 'Closed Won').length,
          tickets: Array.isArray(tickets) ? tickets.length : prev.tickets,
          campaigns: Array.isArray(camps) ? camps.length : prev.campaigns,
        }));
      }
    } catch { /* use mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKpi(); }, [fetchKpi]);

  function dismissAlert(i: number) { setAlerts(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleGlobalSearch() {
    if (!globalSearch.trim()) return;
    try {
      const res = await api.get(`/crm/search?q=${encodeURIComponent(globalSearch)}`);
      setSearchResults(res.data?.data ?? []);
    } catch {
      setSearchResults([
        { type: 'Lead', label: 'TechVista Solutions', sub: 'Proposal stage — ₹4.2L' },
        { type: 'Ticket', label: 'T-1042 Login Issue', sub: 'Open — Assigned to Kavitha' },
        { type: 'Campaign', label: 'Q2 Product Launch', sub: 'Active — 420 leads generated' },
      ]);
    }
  }

  function TabBtn({ t }: { t: Tab }) {
    return (
      <button onClick={() => setActiveTab(t)}
        className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${activeTab === t ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]'}`}>
        {t}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Banner ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-extrabold">CRM Control</h1>
            <p className="text-blue-200 text-xs mt-1">Control, monitor and optimize all CRM operations from one powerful dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchKpi()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-white/70" />
              <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                placeholder="Search across CRM..." className="bg-transparent text-white placeholder-white/50 text-sm outline-none w-48" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Leads', val: kpi.leads.toLocaleString(), icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', change: '+18%', up: true },
          { label: 'Converted', val: kpi.converted.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+12%', up: true },
          { label: 'Total Tickets', val: kpi.tickets.toLocaleString(), icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-50', change: '+5%', up: false },
          { label: 'Campaigns', val: String(kpi.campaigns), icon: Megaphone, color: 'text-violet-600', bg: 'bg-violet-50', change: '+6%', up: true },
          { label: 'Revenue', val: `₹${kpi.revenue}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', change: '+14%', up: true },
          { label: 'SLA Rate', val: kpi.sla, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50', change: '-2%', up: false },
        ].map(k => (
          <motion.div key={k.label} whileHover={{ y: -2 }} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}><k.icon className={`w-4 h-4 ${k.color}`} /></div>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{k.change}
              </span>
            </div>
            <p className="text-xl font-bold text-[#0F172A] dark:text-white">{k.val}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Global Search Results ── */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Search Results for "{globalSearch}"</h3>
              <button onClick={() => { setSearchResults([]); setGlobalSearch(''); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{r.type}</span>
                  <div><p className="text-xs font-semibold text-[#0F172A] dark:text-white">{r.label}</p><p className="text-[10px] text-slate-400">{r.sub}</p></div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden">
        <div className="flex overflow-x-auto gap-1 p-3 border-b border-slate-100 dark:border-[#1f1f1f]">
          {TABS.map(t => <TabBtn key={t} t={t} />)}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-5">

            {/* ── OVERVIEW ── */}
            {activeTab === 'Overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Leads Trend */}
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-blue-600" />Lead Trend</h3>
                    <div className="h-36" style={{ minHeight: 144 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={LEADS_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="leads" stroke="#2563EB" fill="#2563EB" fillOpacity={0.08} strokeWidth={2} /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Ticket Status */}
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Ticket className="w-3.5 h-3.5 text-rose-600" />Ticket Status</h3>
                    <div className="h-28" style={{ minHeight: 112 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <PieChart><Pie data={TICKET_STATUS_PIE} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>{TICKET_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /></PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-1">{TICKET_STATUS_PIE.map(d => <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.value})</div>)}</div>
                  </div>
                  {/* Revenue Trend */}
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-amber-600" />Revenue (₹L)</h3>
                    <div className="h-36" style={{ minHeight: 144 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart data={REVENUE_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="rev" fill="#F59E0B" radius={[4, 4, 0, 0]} fillOpacity={0.8} /></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {/* Alerts */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Alerts & Incidents</h3>
                  <div className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${a.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                        <div className="flex-1"><p className="text-[11px] font-bold text-[#0F172A] dark:text-white">{a.type}</p><p className="text-[11px] text-slate-600">{a.msg}</p><p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p></div>
                        <button onClick={() => dismissAlert(i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AI Recommendations */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI Recommendations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AI_RECS.map((r, i) => (
                      <div key={i} className="p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mr-1">{r.tag}</span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">{r.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SALES ── */}
            {activeTab === 'Sales' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Pipeline */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Sales Pipeline</h3>
                    <div className="space-y-3">
                      {PIPELINE_STAGES.map(p => (
                        <div key={p.stage} className={`p-4 rounded-xl border-l-4 ${p.color}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">{p.stage}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-500">{p.count} leads</span>
                              <span className="text-xs font-bold text-emerald-600">{p.value}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-[#222] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 0.6 }} className="h-full bg-[#2563EB] rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Lead Source */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Lead by Source</h3>
                    <div className="h-52" style={{ minHeight: 208 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart data={LEAD_SOURCE_BAR} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={60} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} fillOpacity={0.8} /></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {/* Team Performance */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Team Performance</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-[#1f1f1f]">
                    <table className="w-full text-left">
                      <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#111]">
                        {['Agent', 'Leads', 'Converted', 'Rate', 'Revenue', 'Score'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                      </tr></thead>
                      <tbody>{TEAM_PERF.map(t => (
                        <tr key={t.name} className="border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">
                          <td className="px-4 py-3 text-xs font-semibold text-[#0F172A] dark:text-white">{t.name}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{t.leads}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{t.converted}</td>
                          <td className="px-4 py-3"><span className="text-xs font-bold text-emerald-600">{t.rate}</span></td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#0F172A] dark:text-white">{t.revenue}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.pct}%` }} /></div><span className="text-[10px] font-bold text-slate-500">{t.pct}%</span></div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── MARKETING ── */}
            {activeTab === 'Marketing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">ROI Trend</h3>
                    <div className="h-44" style={{ minHeight: 176 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <LineChart data={ROI_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Line type="monotone" dataKey="roi" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Active Campaigns</h3>
                    <div className="space-y-2">
                      {CAMPAIGNS.map(c => (
                        <div key={c.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.leads} leads · ROI {c.roi} · Spend {c.spend}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color}`}>{c.status}</span>
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-slate-200 rounded-lg transition"><Play className="w-3 h-3 text-emerald-600" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUPPORT ── */}
            {activeTab === 'Support' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Ticket Trend</h3>
                    <div className="h-44" style={{ minHeight: 176 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart data={TICKET_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="open" fill="#EF4444" radius={[4, 4, 0, 0]} name="Open" /><Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} name="Resolved" /></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Agent Performance</h3>
                    <div className="space-y-3">
                      {AGENTS.map(a => (
                        <div key={a.name} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{a.name}</span>
                            <span className="text-[10px] font-bold text-emerald-600">{a.sla} SLA</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-2">
                            <span>{a.tickets} tickets</span><span>{a.resolved} resolved</span><span>Avg {a.avgTime}</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FINANCE ── */}
            {activeTab === 'Finance' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', val: '₹24.58L', sub: 'This period', color: 'bg-emerald-50', tc: 'text-emerald-700' },
                    { label: 'This Month', val: '₹6.45L', sub: '+12% vs last', color: 'bg-blue-50', tc: 'text-blue-700' },
                    { label: 'Pending', val: '₹7.38L', sub: '78 invoices', color: 'bg-amber-50', tc: 'text-amber-700' },
                    { label: 'Overdue', val: '₹1.18L', sub: '5 clients', color: 'bg-red-50', tc: 'text-red-700' },
                  ].map(f => (
                    <div key={f.label} className={`p-4 rounded-xl ${f.color} border border-slate-100`}>
                      <p className="text-[10px] text-slate-500 mb-1">{f.label}</p>
                      <p className={`text-xl font-bold ${f.tc}`}>{f.val}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{f.sub}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Revenue Trend</h3>
                  <div className="h-44" style={{ minHeight: 176 }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                      <AreaChart data={REVENUE_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="rev" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} /></AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── AUTOMATION ── */}
            {activeTab === 'Automation' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Workflow & Automation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(automations) as [keyof typeof automations, boolean][]).map(([key, val]) => {
                    const labels: Record<string, string> = { autoLead: 'Auto Lead Assignment', autoTicket: 'Auto Ticket Routing', campaignTrigger: 'Campaign Auto-Trigger', followUps: 'Follow-up Reminders', slaAlert: 'SLA Breach Alerts' };
                    const descs: Record<string, string> = { autoLead: 'Automatically assign new leads to available agents', autoTicket: 'Route tickets to best-fit support agents', campaignTrigger: 'Trigger campaigns based on lead behavior', followUps: 'Send reminders for idle leads', slaAlert: 'Alert when tickets approach SLA deadline' };
                    return (
                      <div key={key} className="p-4 bg-slate-50 dark:bg-[#111] rounded-xl border border-slate-100 dark:border-[#1f1f1f]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#0F172A] dark:text-white">{labels[key]}</span>
                          <button onClick={() => setAutomations(prev => ({ ...prev, [key]: !prev[key] }))} className="transition">
                            {val ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">{descs[key]}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{val ? 'Active' : 'Disabled'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === 'Analytics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Lead Trend</h3>
                    <div className="h-40" style={{ minHeight: 160 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={LEADS_TREND}><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="leads" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} strokeWidth={2} /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Campaign ROI</h3>
                    <div className="h-40" style={{ minHeight: 160 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <LineChart data={ROI_TREND}><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Line type="monotone" dataKey="roi" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#111] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Ticket Trend</h3>
                    <div className="h-40" style={{ minHeight: 160 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart data={TICKET_TREND}><XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="open" fill="#EF4444" radius={[4, 4, 0, 0]} /><Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} /></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── INTEGRATIONS ── */}
            {activeTab === 'Integrations' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Integration Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INTEGRATIONS.map(ig => (
                    <div key={ig.name} className="p-4 bg-slate-50 dark:bg-[#111] rounded-xl border border-slate-100 dark:border-[#1f1f1f]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ig.color}`}><ig.icon className="w-4 h-4" /></div>
                        <div><p className="text-xs font-bold text-[#0F172A] dark:text-white">{ig.name}</p><p className={`text-[10px] font-semibold ${ig.status === 'Connected' ? 'text-emerald-600' : 'text-red-500'}`}>{ig.status}</p></div>
                      </div>
                      <button className={`w-full py-1.5 rounded-xl text-[11px] font-semibold transition ${ig.status === 'Connected' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                        {ig.status === 'Connected' ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Add Lead', icon: Target, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100' },
            { label: 'Launch Campaign', icon: Megaphone, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100' },
            { label: 'Assign Ticket', icon: Ticket, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100' },
            { label: 'Generate Report', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
            { label: 'Create Invoice', icon: DollarSign, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100' },
            { label: 'Automation', icon: Zap, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-100' },
          ].map(q => (
            <button key={q.label} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${q.color}`}>
              <q.icon className="w-5 h-5" /><span className="text-xs font-semibold">{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
