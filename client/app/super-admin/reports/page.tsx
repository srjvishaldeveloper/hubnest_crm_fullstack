'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV } from '../../../services/csvExport';
import api from '../../../services/api';
import {
  BarChart3, TrendingUp, FileText, Download, RefreshCw,
  Sparkles, AlertTriangle, CheckCircle2, X, Filter,
  Calendar, Clock, Users, DollarSign, Target, Activity,
  ChevronDown, Send, Settings, PieChart as PieIcon, Table2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const REVENUE_DATA = MONTHS.map((m, i) => ({ month: m, revenue: 420000 + i * 38000 + Math.sin(i) * 25000, target: 450000 + i * 30000 }));
const LEAD_DATA = MONTHS.map((m, i) => ({ month: m, leads: 320 + i * 22, converted: 180 + i * 14 }));
const TICKET_DATA = MONTHS.map((m, i) => ({ month: m, opened: 120 + i * 5, resolved: 105 + i * 6 }));
const TENANT_DATA = [
  { name: 'HubNest Ltd', revenue: 520000, users: 24 },
  { name: 'DataFirm Pvt', revenue: 310000, users: 12 },
  { name: 'TechBase Corp', revenue: 410000, users: 18 },
  { name: 'CloudCo Inc', revenue: 280000, users: 8 },
];
const USER_PERF_DATA = [
  { name: 'Rahul', leads: 89, actions: 156, score: 94 },
  { name: 'Neha', leads: 45, actions: 112, score: 88 },
  { name: 'Sanjana', leads: 60, actions: 98, score: 82 },
  { name: 'Vikram', leads: 0, actions: 420, score: 91 },
  { name: 'Amit', leads: 0, actions: 204, score: 85 },
];
const PIE_DATA = [
  { name: 'Sales', value: 35, color: '#F59E0B' },
  { name: 'Marketing', value: 28, color: '#2563EB' },
  { name: 'Support', value: 22, color: '#06B6D4' },
  { name: 'Finance', value: 15, color: '#10B981' },
];
const AI_INSIGHTS = [
  { text: 'Revenue grew 28% MoM — highest since Q2 2024', badge: 'Revenue', positive: true },
  { text: '3 tenants underperforming — schedule review', badge: 'Tenants', positive: false },
  { text: 'Ticket resolution rate at 94% — above SLA', badge: 'Support', positive: true },
  { text: 'Lead conversion dropped 6% this month', badge: 'Sales', positive: false },
];
const SCHEDULED = [
  { name: 'Monthly Revenue', freq: 'Monthly', next: '01 Jul 2025', email: 'admin@crm.com' },
  { name: 'Tenant Overview', freq: 'Weekly', next: '29 Jun 2025', email: 'ceo@crm.com' },
];

type ReportTab = 'Platform' | 'Tenants' | 'Sales' | 'Support' | 'Finance' | 'Performance' | 'Custom';
const TABS: ReportTab[] = ['Platform', 'Tenants', 'Sales', 'Support', 'Finance', 'Performance', 'Custom'];

type Toast = { msg: string; type: 'success' | 'error' };
function ToastMsg({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {toast.msg}<button onClick={onClose}><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

export default function SuperAdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Platform');
  const [dateRange, setDateRange] = useState('last30');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [kpis, setKpis] = useState({ totalRevenue: 3840000, tenantCount: 4, totalLeads: 2840, ticketsSolved: 1420 });

  const [customStep, setCustomStep] = useState(1);
  const [customModule, setCustomModule] = useState('');
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [customFilter, setCustomFilter] = useState('');
  const [customResult, setCustomResult] = useState<any[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const [, leadsRes] = await Promise.allSettled([
        api.get('/auth/users'), api.get('/marketing/leads'), api.get('/marketing/campaigns')
      ]);
      if (leadsRes.status === 'fulfilled' && leadsRes.value.data?.data?.total)
        setKpis(k => ({ ...k, totalLeads: leadsRes.value.data.data.total }));
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  async function handleExportCSV() {
    try {
      const res = await api.get('/reports/export?format=csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `platform-report-${Date.now()}.csv`; a.click();
      showToast('CSV downloaded');
    } catch {
      exportToCSV(TENANT_DATA, `platform-report-${Date.now()}`);
      showToast('CSV downloaded');
    }
  }

  async function handleGenerateCustom() {
    if (!customModule || !customFields.length) { showToast('Select module and fields', 'error'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/reports/custom', { module: customModule, fields: customFields, filter: customFilter });
      setCustomResult(res.data?.data || TENANT_DATA);
      setCustomStep(3);
      showToast('Custom report generated');
    } catch {
      setCustomResult(TENANT_DATA);
      setCustomStep(3);
      showToast('Report generated (sample data)');
    } finally { setGenerating(false); }
  }

  const CUSTOM_MODULES: Record<string, string[]> = {
    Users: ['Name', 'Email', 'Role', 'Department', 'Company', 'Status', 'Last Login'],
    Leads: ['Title', 'Source', 'Stage', 'Assigned To', 'Value', 'Created Date'],
    Tenants: ['Company', 'Plan', 'Revenue', 'Users Count', 'Created Date'],
    Tickets: ['Title', 'Priority', 'Status', 'Assigned To', 'Created Date', 'Resolved Date'],
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <ToastMsg toast={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#78350f,#F59E0B 45%,#d97706)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-extrabold flex items-center gap-2"><BarChart3 className="w-6 h-6" />Platform Reports</h1>
            <p className="text-amber-200 text-xs mt-1">Unified analytics across all tenants, modules, and metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-white/10 border border-white/20 text-white text-xs rounded-xl px-3 py-2 outline-none">
              <option value="last7">Last 7 days</option><option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option><option value="year">This Year</option>
            </select>
            <button onClick={fetchKpis} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 transition"><Download className="w-4 h-4" />Export</button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Platform Revenue', val: `₹${(kpis.totalRevenue / 100000).toFixed(1)}L`, trend: '+28%', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Tenants', val: kpis.tenantCount, trend: '+2', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Leads', val: kpis.totalLeads.toLocaleString(), trend: '+340', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tickets Resolved', val: kpis.ticketsSolved.toLocaleString(), trend: '94%', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <motion.div key={k.label} whileHover={{ y: -2 }} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">{k.trend} <TrendingUp className="inline w-2.5 h-2.5" /></span>
            </div>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{k.val}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {AI_INSIGHTS.map((ins, i) => (
          <div key={i} className={`p-3.5 rounded-xl border text-[11px] leading-relaxed ${ins.positive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3" />
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ins.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ins.badge}</span>
            </div>
            {ins.text}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f]">
        <div className="flex border-b border-slate-100 dark:border-[#1f1f1f] overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-shrink-0 px-4 py-3.5 text-xs font-semibold transition border-b-2 ${activeTab === t ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="p-6">

            {activeTab === 'Platform' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">Revenue vs Target</h3>
                    <div className="h-60" style={{ minHeight: 240 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={REVENUE_DATA}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`₹${(Number(v) / 1000).toFixed(0)}k`, '']} />
                          <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                          <Area type="monotone" dataKey="target" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Target" />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">Module Usage Distribution</h3>
                    <div className="h-60" style={{ minHeight: 240 }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <PieChart>
                          <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                            {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Tenants' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Tenant Performance</h3>
                <div className="h-64" style={{ minHeight: 256 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={TENANT_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any, n: any) => [n === 'revenue' ? `₹${(Number(v) / 1000).toFixed(0)}k` : v, n]} />
                      <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Revenue" />
                      <Bar dataKey="users" fill="#2563EB" radius={[4, 4, 0, 0]} name="Users" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                      {['Tenant', 'Revenue', 'Users', 'Status'].map(h => <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>{TENANT_DATA.map(t => (
                      <tr key={t.name} className="border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">
                        <td className="px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-white">{t.name}</td>
                        <td className="px-4 py-3 text-sm text-[#0F172A] dark:text-white">₹{(t.revenue / 1000).toFixed(0)}k</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{t.users}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full">Active</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Sales' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Lead Pipeline</h3>
                <div className="h-64" style={{ minHeight: 256 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <AreaChart data={LEAD_DATA}>
                      <defs>
                        <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                        <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="leads" stroke="#F59E0B" strokeWidth={2} fill="url(#leadsGrad)" name="Total Leads" />
                      <Area type="monotone" dataKey="converted" stroke="#10B981" strokeWidth={2} fill="url(#convGrad)" name="Converted" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'Support' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Ticket Trends</h3>
                <div className="h-64" style={{ minHeight: 256 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={TICKET_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="opened" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Opened" />
                      <Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} name="Resolved" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'Finance' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Revenue by Month</h3>
                <div className="h-64" style={{ minHeight: 256 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <LineChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`₹${(Number(v) / 1000).toFixed(0)}k`, '']} />
                      <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue" />
                      <Line type="monotone" dataKey="target" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="4 4" name="Target" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'Performance' && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Top Performers</h3>
                <div className="h-64" style={{ minHeight: 256 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={USER_PERF_DATA} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="score" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Score" />
                      <Bar dataKey="actions" fill="#2563EB" radius={[0, 4, 4, 0]} name="Actions" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                      {['Name', 'Leads', 'Actions', 'Score'].map(h => <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>{[...USER_PERF_DATA].sort((a, b) => b.score - a.score).map((u, i) => (
                      <tr key={u.name} className="border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">
                        <td className="px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-white">#{i + 1} {u.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{u.leads}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{u.actions}</td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-amber-400" style={{ width: `${u.score}%` }} /></div><span className="text-xs font-bold text-amber-600">{u.score}</span></div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Custom' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Custom Report Builder</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${customStep >= s ? 'bg-[#F59E0B] text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
                      {s < 3 && <div className={`h-0.5 w-12 ${customStep > s ? 'bg-amber-400' : 'bg-slate-200'}`} />}
                    </div>
                  ))}
                  <div className="ml-2 flex gap-4 text-[10px] text-slate-500 font-semibold">
                    {['Module', 'Fields', 'Result'].map((label, i) => (
                      <span key={label} className={customStep >= i + 1 ? 'text-amber-600' : ''}>{label}</span>
                    ))}
                  </div>
                </div>

                {customStep === 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.keys(CUSTOM_MODULES).map(mod => (
                      <button key={mod} onClick={() => { setCustomModule(mod); setCustomFields([]); setCustomStep(2); }}
                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition text-center ${customModule === mod ? 'border-[#F59E0B] bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50'}`}>
                        {mod}
                      </button>
                    ))}
                  </div>
                )}

                {customStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 mb-3">Select Fields — {customModule}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(CUSTOM_MODULES[customModule] || []).map(f => (
                          <label key={f} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded accent-amber-400" checked={customFields.includes(f)} onChange={e => { if (e.target.checked) setCustomFields(p => [...p, f]); else setCustomFields(p => p.filter(x => x !== f)); }} />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{f}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 mb-1.5">Filter / Condition</h4>
                      <input value={customFilter} onChange={e => setCustomFilter(e.target.value)} placeholder="e.g., Status=Active, Department=Sales"
                        className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setCustomStep(1)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Back</button>
                      <button onClick={handleGenerateCustom} disabled={generating} className="px-5 py-2 rounded-xl bg-[#F59E0B] text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-60 flex items-center gap-2">
                        {generating ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</> : <><Send className="w-4 h-4" />Generate Report</>}
                      </button>
                    </div>
                  </div>
                )}

                {customStep === 3 && customResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{customResult.length} records generated</p>
                      <div className="flex gap-2">
                        <button onClick={() => exportToCSV(customResult, `custom-${customModule}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition"><Download className="w-3.5 h-3.5" />CSV</button>
                        <button onClick={() => { setCustomStep(1); setCustomResult(null); setCustomModule(''); setCustomFields([]); }} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">New Report</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                          {Object.keys(customResult[0] || {}).map(k => <th key={k} className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">{k}</th>)}
                        </tr></thead>
                        <tbody>{customResult.map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">
                            {Object.values(row).map((v: any, j) => <td key={j} className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{String(v)}</td>)}
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Scheduled Reports</h3>
        <div className="space-y-3">
          {SCHEDULED.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111] rounded-xl">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{r.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{r.freq} · Next: {r.next} · To: {r.email}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-amber-50 rounded-lg transition"><Settings className="w-3.5 h-3.5 text-slate-400 hover:text-amber-600" /></button>
                <button className="p-1.5 hover:bg-red-50 rounded-lg transition"><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
