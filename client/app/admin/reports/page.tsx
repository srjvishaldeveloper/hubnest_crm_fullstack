'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Target, Megaphone, Ticket, DollarSign, Users, Award, Download,
  Filter, Search, Calendar, Sparkles, PlusCircle, CheckCircle, RefreshCw,
  FileText, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronDown,
  Check, Copy, X, TrendingUp, Eye, Share2, Send, Mail, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import api from '../../../services/api';
import { reportService } from '../../../services/reportService';

// ─── mock data ───────────────────────────────────────────────────────────────
const LEADS_TREND = [
  { day: '1 Jun', leads: 120, conversion: 22 }, { day: '10 Jun', leads: 240, conversion: 54 },
  { day: '20 Jun', leads: 180, conversion: 48 }, { day: '30 Jun', leads: 310, conversion: 82 },
];
const LEADS_BY_SOURCE = [
  { name: 'Google Ads', value: 45 }, { name: 'LinkedIn', value: 28 }, { name: 'Email', value: 18 },
  { name: 'WhatsApp', value: 14 }, { name: 'Direct', value: 10 },
];
const TICKET_TREND = [
  { day: '1 Jun', open: 42, resolved: 38 }, { day: '10 Jun', open: 58, resolved: 52 },
  { day: '20 Jun', open: 35, resolved: 34 }, { day: '30 Jun', open: 48, resolved: 45 },
];
const REVENUE_TREND = [
  { month: 'Jan', revenue: 4.2, expenses: 2.1 }, { month: 'Feb', revenue: 5.1, expenses: 2.4 },
  { month: 'Mar', revenue: 6.8, expenses: 2.9 }, { month: 'Apr', revenue: 5.9, expenses: 2.5 },
  { month: 'May', revenue: 7.4, expenses: 3.1 }, { month: 'Jun', revenue: 8.2, expenses: 3.4 },
];
const CAMPAIGN_ROI = [
  { name: 'Q2 Launch', roi: 3.4, spend: 2.1 }, { name: 'LinkedIn Ad', roi: 2.8, spend: 1.4 },
  { name: 'Email v4', roi: 1.9, spend: 0.8 }, { name: 'WhatsApp', roi: 4.2, spend: 0.5 },
];
const PAYMENT_PIE = [
  { name: 'Paid', value: 65, color: '#10B981' }, { name: 'Pending', value: 25, color: '#F59E0B' },
  { name: 'Overdue', value: 10, color: '#EF4444' },
];
const TOP_PERFORMERS = [
  { rank: 1, name: 'Rahul Sharma', role: 'Sales Executive', leads: 142, score: '94%', bar: 94 },
  { rank: 2, name: 'Neha Verma', role: 'Marketing Manager', leads: 98, score: '88%', bar: 88 },
  { rank: 3, name: 'Kavitha Pillai', role: 'Support Agent', leads: 0, score: '85%', bar: 85 },
  { rank: 4, name: 'Priya Singh', role: 'Finance Exec', leads: 45, score: '72%', bar: 72 },
  { rank: 5, name: 'Mohan Das', role: 'Support Agent', leads: 0, score: '68%', bar: 68 },
];
const SCHEDULED = [
  { name: 'Daily Sales Report', freq: 'Daily at 09:00 AM', lastRun: 'Today 09:00' },
  { name: 'Weekly Campaign Report', freq: 'Every Monday 09:00 AM', lastRun: '22 Jun' },
  { name: 'Monthly Finance Report', freq: '1st of every month', lastRun: '01 Jun' },
  { name: 'SLA Performance Report', freq: 'Every Friday 09:00 AM', lastRun: '20 Jun' },
];
const AI_INSIGHTS = [
  { title: 'Sales conversion rate improved by 18%', type: 'positive', tag: 'Sales' },
  { title: 'Campaign "Summer Sale" ROI is high — scale budget', type: 'positive', tag: 'Marketing' },
  { title: 'Ticket backlog increased by 12% — review support capacity', type: 'warning', tag: 'Support' },
  { title: 'Payment overdue increased by 8% — follow up now', type: 'warning', tag: 'Finance' },
];
const BUILDER_MODULES: Record<string, string[]> = {
  Sales: ['Lead Source', 'Conversion Rate', 'Pipeline Stage', 'Revenue', 'Agent Performance'],
  Marketing: ['Campaign Name', 'ROI', 'Leads Generated', 'Cost Per Lead', 'Channel'],
  Support: ['Ticket Status', 'Resolution Time', 'SLA Rate', 'Agent', 'Category'],
  Finance: ['Invoice Status', 'Payment Method', 'Revenue', 'Expenses', 'Overdue Amount'],
  Users: ['Role', 'Department', 'Login Days', 'Actions Performed', 'Status'],
};
const REPORT_TABS = ['Sales', 'Marketing', 'Support', 'Finance', 'UserPerformance', 'Custom'] as const;
type ReportTab = typeof REPORT_TABS[number];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Sales');
  const [dateRange, setDateRange] = useState('01 Jun 2025 – 30 Jun 2025');
  const [loading, setLoading] = useState(false);
  const [kpiCards, setKpiCards] = useState([
    { label: 'Total Leads', value: '3,754', trend: '↑ 18%', up: true },
    { label: 'Converted Leads', value: '671', trend: '↑ 12%', up: true },
    { label: 'Total Tickets', value: '1,264', trend: '↑ 5%', up: false },
    { label: 'Revenue (CRM)', value: '₹24.58L', trend: '↑ 14%', up: true },
    { label: 'Total Campaigns', value: '38', trend: '↑ 6%', up: true },
    { label: 'Active Users', value: '168', trend: '↑ 8%', up: true },
  ]);
  const [leadsData, setLeadsData] = useState(LEADS_TREND);
  const [copied, setCopied] = useState(false);
  // Custom builder
  const [builderModule, setBuilderModule] = useState('Sales');
  const [builderFields, setBuilderFields] = useState<string[]>([]);
  const [builderFilter, setBuilderFilter] = useState('All Status');
  const [builderStep, setBuilderStep] = useState(1);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, leadsRes, campsRes] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/marketing/leads'),
        api.get('/marketing/campaigns'),
      ]);
      const users = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.users ?? []) : [];
      const leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.data?.data?.leads ?? leadsRes.value.data?.data ?? []) : [];
      const camps = campsRes.status === 'fulfilled' ? (campsRes.value.data?.data?.campaigns ?? campsRes.value.data?.data ?? []) : [];
      if (Array.isArray(leads) && leads.length > 0) {
        setKpiCards(prev => prev.map(k => {
          if (k.label === 'Total Leads') return { ...k, value: leads.length.toLocaleString() };
          if (k.label === 'Total Campaigns') return { ...k, value: String(Array.isArray(camps) ? camps.length : k.value) };
          if (k.label === 'Active Users') return { ...k, value: String(users.filter((u: any) => u.status === 'Active').length || k.value) };
          return k;
        }));
      }
    } catch { /* use mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleExport(format: 'PDF' | 'Excel' | 'CSV') {
    try {
      showToast(`Exporting as ${format}…`);
      if (format === 'CSV') {
        const res = await api.get('/reports/export?format=csv', { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a'); a.href = url; a.download = `report.csv`; a.click();
      }
      showToast(`${format} export ready!`);
    } catch { showToast(`${format} export ready (mock)`); }
  }

  async function handleGenerateReport() {
    if (!builderFields.length) { showToast('Select at least one field'); return; }
    setGeneratingReport(true);
    try {
      await api.post('/reports/custom', { module: builderModule, fields: builderFields, filter: builderFilter });
      showToast('Custom report generated!');
    } catch { showToast('Custom report ready (mock mode)!'); }
    finally { setGeneratingReport(false); }
  }

  const SALES_OVERVIEW = [
    { label: 'Total Leads', val: '3,754' }, { label: 'New Leads', val: '812' },
    { label: 'Converted', val: '671' }, { label: 'Conversion Rate', val: '17.89%' },
    { label: 'Lost Leads', val: '245' },
  ];
  const MARKETING_OVERVIEW = [
    { label: 'Active Campaigns', val: '18' }, { label: 'Leads Generated', val: '812' },
    { label: 'Campaign ROI', val: '215%' }, { label: 'Cost', val: '₹4.25L' }, { label: 'Revenue', val: '₹12.85L' },
  ];
  const SUPPORT_OVERVIEW = [
    { label: 'Total Tickets', val: '1,264' }, { label: 'Open', val: '342' },
    { label: 'In Progress', val: '312' }, { label: 'Resolved', val: '610' }, { label: 'SLA Rate', val: '92%' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-lg text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />{toast}
        </motion.div>
      )}</AnimatePresence>

      {/* ── Banner ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-extrabold">Reports & Analytics</h1>
            <p className="text-blue-200 text-xs mt-1">Analyze CRM data, track performance and generate actionable insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchData()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-white/70" />
              <span className="text-white text-xs">{dateRange}</span>
            </div>
            <div className="flex gap-1">
              {(['PDF', 'Excel', 'CSV'] as const).map(f => (
                <button key={f} onClick={() => handleExport(f)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-semibold transition">{f}</button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map(k => (
          <motion.div key={k.label} whileHover={{ y: -2 }} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4 hover:shadow-md transition-shadow">
            <span className={`text-[10px] font-bold flex items-center gap-0.5 mb-2 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{k.trend}
            </span>
            <p className="text-xl font-bold text-[#0F172A] dark:text-white">{k.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── AI Insights ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AI_INSIGHTS.map((ins, i) => (
            <div key={i} className={`p-3 rounded-xl border text-[11px] leading-snug ${ins.type === 'positive' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mr-1 ${ins.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ins.tag}</span>
              {ins.title}
            </div>
          ))}
        </div>
      </div>

      {/* ── Report Type Tabs ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden">
        <div className="flex overflow-x-auto gap-1 p-3 border-b border-slate-100 dark:border-[#1f1f1f]">
          {REPORT_TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${activeTab === t ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]'}`}>
              {t === 'UserPerformance' ? 'User Performance' : t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-5">

            {/* SALES */}
            {activeTab === 'Sales' && (
              <div className="space-y-5">
                <div className="grid grid-cols-5 gap-3">
                  {SALES_OVERVIEW.map(s => (
                    <div key={s.label} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl text-center">
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">{s.val}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Leads Trend</h4>
                    <div className="h-44" style={{ minHeight: 176 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={LEADS_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="leads" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} strokeWidth={2} name="Leads" /><Area type="monotone" dataKey="conversion" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Converted" /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Leads by Source</h4>
                    <div className="h-44" style={{ minHeight: 176 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart data={LEADS_BY_SOURCE} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={72} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} fillOpacity={0.8} /></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MARKETING */}
            {activeTab === 'Marketing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-5 gap-3">
                  {MARKETING_OVERVIEW.map(s => (
                    <div key={s.label} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl text-center">
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">{s.val}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="h-44" style={{ minHeight: 176 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={CAMPAIGN_ROI}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="roi" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="ROI (×)" /><Bar dataKey="spend" fill="#DDD6FE" radius={[4, 4, 0, 0]} name="Spend (₹L)" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* SUPPORT */}
            {activeTab === 'Support' && (
              <div className="space-y-5">
                <div className="grid grid-cols-5 gap-3">
                  {SUPPORT_OVERVIEW.map(s => (
                    <div key={s.label} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl text-center">
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">{s.val}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="h-44" style={{ minHeight: 176 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={TICKET_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Bar dataKey="open" fill="#EF4444" radius={[4, 4, 0, 0]} name="Open" /><Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} name="Resolved" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* FINANCE */}
            {activeTab === 'Finance' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Revenue vs Expenses (₹L)</h4>
                    <div className="h-44" style={{ minHeight: 176 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={REVENUE_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Revenue" /><Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} name="Expenses" /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Payment Status</h4>
                    <div className="h-36" style={{ minHeight: 144 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <PieChart><Pie data={PAYMENT_PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={3}>{PAYMENT_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /></PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-1">{PAYMENT_PIE.map(d => <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.value}%)</div>)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* USER PERFORMANCE */}
            {activeTab === 'UserPerformance' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Top Performers</h4>
                <div className="space-y-3">
                  {TOP_PERFORMERS.map(p => (
                    <div key={p.name} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${p.rank === 1 ? 'bg-amber-100 text-amber-700' : p.rank === 2 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>{p.rank}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{p.name} <span className="text-[10px] text-slate-400 font-normal">· {p.role}</span></p>
                        <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-1.5 bg-slate-200 dark:bg-[#222] rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.bar}%` }} /></div><span className="text-[10px] font-bold text-slate-500">{p.score}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM BUILDER */}
            {activeTab === 'Custom' && (
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Custom Report Builder</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Step 1: Module */}
                  <div className={`p-4 rounded-xl border ${builderStep >= 1 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-[#2563EB] mb-2">STEP 1 — Select Module</p>
                    <div className="space-y-1.5">
                      {Object.keys(BUILDER_MODULES).map(m => (
                        <button key={m} onClick={() => { setBuilderModule(m); setBuilderFields([]); setBuilderStep(Math.max(builderStep, 2)); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${builderModule === m ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-600 hover:bg-slate-200'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  {/* Step 2: Fields */}
                  <div className={`p-4 rounded-xl border ${builderStep >= 2 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-[#2563EB] mb-2">STEP 2 — Select Fields</p>
                    <div className="space-y-1.5">
                      {(BUILDER_MODULES[builderModule] || []).map(f => (
                        <label key={f} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={builderFields.includes(f)}
                            onChange={e => { if (e.target.checked) setBuilderFields(p => [...p, f]); else setBuilderFields(p => p.filter(x => x !== f)); setBuilderStep(Math.max(builderStep, 3)); }}
                            className="rounded" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Step 3: Filter + Generate */}
                  <div className={`p-4 rounded-xl border ${builderStep >= 3 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-[#2563EB] mb-2">STEP 3 — Apply Filters</p>
                    <div className="space-y-3">
                      <select value={builderFilter} onChange={e => setBuilderFilter(e.target.value)}
                        className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                        <option>All Status</option><option>Active</option><option>Inactive</option><option>This Month</option><option>Last 30 Days</option>
                      </select>
                      {builderFields.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {builderFields.map(f => <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">{f}</span>)}
                        </div>
                      )}
                      <button onClick={handleGenerateReport} disabled={generatingReport || !builderFields.length}
                        className="w-full py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {generatingReport ? <><RefreshCw className="w-3 h-3 animate-spin" />Generating…</> : 'Generate Report'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Row: Scheduled + Top Performers + Export ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scheduled Reports */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-[#2563EB]" />Scheduled Reports</h3>
          <div className="space-y-3">
            {SCHEDULED.map(s => (
              <div key={s.name} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.freq}</p>
                  <p className="text-[10px] text-slate-400">Last run: {s.lastRun}</p>
                </div>
                <button className="p-1.5 hover:bg-blue-50 rounded-lg transition text-slate-400 hover:text-blue-600"><Eye className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers Compact */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" />Top Performers</h3>
          <div className="space-y-2.5">
            {TOP_PERFORMERS.slice(0, 4).map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${p.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{p.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.role}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export & Share */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-emerald-500" />Export & Share</h3>
          <div className="space-y-2">
            {[
              { label: 'Export as PDF', icon: FileText, color: 'bg-red-50 text-red-600 border-red-100', action: () => handleExport('PDF') },
              { label: 'Export as Excel', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', action: () => handleExport('Excel') },
              { label: 'Export as CSV', icon: Download, color: 'bg-blue-50 text-blue-600 border-blue-100', action: () => handleExport('CSV') },
              { label: 'Share via Email', icon: Mail, color: 'bg-violet-50 text-violet-600 border-violet-100', action: () => showToast('Share link copied!') },
            ].map(e => (
              <button key={e.label} onClick={e.action} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold transition hover:shadow-sm ${e.color}`}>
                <e.icon className="w-4 h-4" />{e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
