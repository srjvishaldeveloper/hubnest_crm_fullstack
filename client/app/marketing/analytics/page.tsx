'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Mail, TrendingUp, DollarSign, MousePointerClick,
  BarChart2, Sparkles, RefreshCw, ChevronUp, ChevronDown, Loader2,
  ArrowUpRight, ArrowDownRight, Clock, Users, Target, Filter, Download, X,
  Eye, Star, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import api from '../../../services/api';

// ─── Types ───────────────────────────────────────────────────────
interface DashboardData {
  totalCampaigns?: number;
  activeCampaigns?: number;
  emailsSent?: number;
  openRate?: number;
  conversionRate?: number;
  totalRevenue?: number;
  totalSpent?: number;
  avgROI?: number;
  totalLeads?: number;
  dailyStats?: { date: string; sends: number; opens: number; clicks: number }[];
  campaignTypeDistribution?: { name: string; value: number; color: string }[];
}

interface Campaign {
  id: number | string;
  name: string;
  type?: string;
  platform?: string;
  sent?: number;
  opens?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  leads_count?: number;
  roi?: number;
  status: string;
}

type SortKey = keyof Campaign | 'ctr' | 'cvr';
type SortDir = 'asc' | 'desc';
type ChartMode = 'composed' | 'area' | 'bar';
type QualityRange = 'all' | 'high' | 'medium' | 'low';

// ─── Fallback Data ───────────────────────────────────────────────
const FALLBACK_DAILY = [
  { date: 'Mon', sends: 420, opens: 180, clicks: 64 },
  { date: 'Tue', sends: 610, opens: 265, clicks: 92 },
  { date: 'Wed', sends: 380, opens: 145, clicks: 53 },
  { date: 'Thu', sends: 720, opens: 310, clicks: 112 },
  { date: 'Fri', sends: 890, opens: 398, clicks: 145 },
  { date: 'Sat', sends: 540, opens: 230, clicks: 78 },
  { date: 'Sun', sends: 310, opens: 112, clicks: 38 },
];

const FALLBACK_TYPES = [
  { name: 'Email',    value: 42, color: '#4F46E5' },
  { name: 'WhatsApp', value: 28, color: '#16A34A' },
  { name: 'SMS',      value: 18, color: '#F59E0B' },
  { name: 'Meta',     value: 12, color: '#2563EB' },
];

const QUALITY_DATA = [
  { range: 'High (80-100)',   count: 1367, pct: 42, color: '#16A34A' },
  { range: 'Medium (50-79)', count: 1237, pct: 38, color: '#2563EB' },
  { range: 'Low (20-49)',     count: 489,  pct: 15, color: '#F59E0B' },
  { range: 'Spam (<20)',      count: 163,  pct: 5,  color: '#EF4444' },
];

const CHANNEL_DATA = [
  { channel: 'Facebook', leads: 1120, cost: 85000, roi: 245, cpl: 76 },
  { channel: 'Google',   leads: 780,  cost: 62000, roi: 210, cpl: 80 },
  { channel: 'Instagram',leads: 490,  cost: 48000, roi: 160, cpl: 98 },
  { channel: 'Email',    leads: 350,  cost: 22000, roi: 310, cpl: 63 },
  { channel: 'LinkedIn', leads: 180,  cost: 28000, roi: 140, cpl: 156 },
  { channel: 'YouTube',  leads: 336,  cost: 0,     roi: 80,  cpl: 0  },
];

const RADAR_DATA = [
  { metric: 'Reach',      facebook: 92, google: 78, instagram: 85 },
  { metric: 'Engagement', facebook: 75, google: 62, instagram: 90 },
  { metric: 'Conversion', facebook: 82, google: 88, instagram: 68 },
  { metric: 'CPL',        facebook: 78, google: 72, instagram: 65 },
  { metric: 'Quality',    facebook: 85, google: 82, instagram: 70 },
  { metric: 'ROI',        facebook: 88, google: 84, instagram: 72 },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',    Active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',    Paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-100 text-slate-600', Completed: 'bg-slate-100 text-slate-600',
  draft: 'bg-slate-100 text-slate-500',
};

const TYPE_COLORS: Record<string, string> = {
  Email: 'bg-indigo-100 text-indigo-700',     email: 'bg-indigo-100 text-indigo-700',
  WhatsApp: 'bg-green-100 text-green-700',    whatsapp: 'bg-green-100 text-green-700',
  SMS: 'bg-amber-100 text-amber-700',         sms: 'bg-amber-100 text-amber-700',
  Meta: 'bg-blue-100 text-blue-700',          meta: 'bg-blue-100 text-blue-700',
};

const PAGE_SIZE = 8;

// ─── Helpers ─────────────────────────────────────────────────────
function pct(a?: number, b?: number) {
  if (!b || b === 0) return '0.0';
  return (((a ?? 0) / b) * 100).toFixed(1);
}
function fmtNum(n?: number) { return (n ?? 0).toLocaleString('en-IN'); }
function fmt(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)   return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

function SortTh({ col, label, sortKey, sortDir, onSort }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th onClick={() => onSort(col)}
      className="text-left px-3 py-2.5 text-[10px] text-slate-400 dark:text-[#a3a3a3] font-semibold uppercase tracking-wide cursor-pointer select-none hover:text-slate-600 dark:hover:text-[#ededed] transition whitespace-nowrap">
      <span className="flex items-center gap-0.5">
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<{ bestSendTime: string; bestAudience: string; convPrediction: string; churnRisk: string } | null>(null);

  // Filters
  const [dateRange, setDateRange]     = useState('30d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [searchQ, setSearchQ]         = useState('');
  const [chartMode, setChartMode]     = useState<ChartMode>('composed');
  const [qualityFilter, setQualityFilter] = useState<QualityRange>('all');
  const [activeTab, setActiveTab]     = useState<'performance'|'quality'|'channel'|'comparison'>('performance');

  // Table
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage]       = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, campRes] = await Promise.allSettled([
        api.get(`/marketing/dashboard?range=${dateRange}`),
        api.get(`/campaigns?range=${dateRange}`),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data?.data || dashRes.value.data || {});
      if (campRes.status === 'fulfilled') {
        const d = campRes.value.data?.data || campRes.value.data?.campaigns || campRes.value.data || [];
        setCampaigns(Array.isArray(d) ? d : []);
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, [dateRange]);

  useEffect(() => { load(); }, [load]);

  const handleSort = useCallback((col: SortKey) => {
    setSortDir(prev => sortKey === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortKey(col);
    setPage(0);
  }, [sortKey]);

  async function refreshInsights() {
    setInsightsLoading(true);
    try {
      const res = await api.post('/marketing/ai/analytics/insights', {});
      const d = res.data?.data || res.data;
      setInsights({
        bestSendTime: d?.bestSendTime || 'Tuesday 10 AM — 38% higher open rates',
        bestAudience: d?.bestAudience || 'Leads aged 25-34 with 3+ email opens convert 2.1× more',
        convPrediction: d?.convPrediction || 'Predicted 18.4% conversion rate for next 30 days',
        churnRisk: d?.churnRisk || '12% of your list shows high churn signals',
      });
    } catch {
      setInsights({
        bestSendTime: 'Tuesday 10 AM — 38% higher open rates',
        bestAudience: 'Leads aged 25-34 with 3+ email opens convert 2.1× more',
        convPrediction: 'Predicted 18.4% conversion rate for next 30 days',
        churnRisk: '12% of your list shows high churn signals — consider a win-back campaign',
      });
    } finally { setInsightsLoading(false); }
  }

  function exportCsv() {
    const headers = ['Name','Type','Sent','Opens','Clicks','Conv.','Revenue','CTR%','CVR%','ROI%','Status'];
    const rows = sortedCampaigns.map(c => [
      c.name, c.type||c.platform||'', c.sent??0, c.opens??0, c.clicks??0,
      c.conversions??0, c.revenue??0, pct(c.clicks,c.sent), pct(c.conversions,c.sent),
      c.roi??0, c.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analytics-campaigns.csv'; a.click();
  }

  // Derived
  const totalCampaigns    = dashboard.totalCampaigns ?? campaigns.length;
  const activeCampaigns   = dashboard.activeCampaigns ?? campaigns.filter(c => c.status?.toLowerCase() === 'active').length;
  const emailsSent        = dashboard.emailsSent ?? campaigns.reduce((s, c) => s + (c.sent ?? 0), 0);
  const totalLeads        = dashboard.totalLeads ?? campaigns.reduce((s, c) => s + (c.leads_count ?? 0), 0);
  const totalSpent        = dashboard.totalSpent ?? 0;
  const avgROI            = dashboard.avgROI ?? 0;
  const conversionRate    = dashboard.conversionRate ?? 0;
  const totalRevenue      = dashboard.totalRevenue ?? campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const openRate          = dashboard.openRate ?? (emailsSent > 0 ? parseFloat(pct(campaigns.reduce((s, c) => s + (c.opens ?? 0), 0), emailsSent)) : 0);

  const dailyStats     = (dashboard.dailyStats && dashboard.dailyStats.length > 0) ? dashboard.dailyStats : FALLBACK_DAILY;
  const typeDistrib    = (dashboard.campaignTypeDistribution && dashboard.campaignTypeDistribution.length > 0) ? dashboard.campaignTypeDistribution : FALLBACK_TYPES;

  // Filter + Sort + Paginate
  const filteredCampaigns = campaigns.filter(c => {
    const ms = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter;
    const mt = typeFilter === 'all' || (c.type || c.platform || '').toLowerCase() === typeFilter;
    const mq = qualityFilter === 'all'
      || (qualityFilter === 'high' && (c.roi ?? 0) >= 200)
      || (qualityFilter === 'medium' && (c.roi ?? 0) >= 100 && (c.roi ?? 0) < 200)
      || (qualityFilter === 'low' && (c.roi ?? 0) < 100);
    const msq = !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase());
    return ms && mt && mq && msq;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let va: number | string, vb: number | string;
    if (sortKey === 'ctr') { va = parseFloat(pct(a.clicks, a.sent)); vb = parseFloat(pct(b.clicks, b.sent)); }
    else if (sortKey === 'cvr') { va = parseFloat(pct(a.conversions, a.sent)); vb = parseFloat(pct(b.conversions, b.sent)); }
    else { va = (a[sortKey as keyof Campaign] ?? 0) as number | string; vb = (b[sortKey as keyof Campaign] ?? 0) as number | string; }
    if (typeof va === 'string' && typeof vb === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const totalPages      = Math.max(1, Math.ceil(sortedCampaigns.length / PAGE_SIZE));
  const pagedCampaigns  = sortedCampaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = [
    { label: 'Total Campaigns', value: String(totalCampaigns), icon: Megaphone, iconColor: 'text-violet-600', iconBg: 'bg-violet-100 dark:bg-violet-900/30', trend: `${activeCampaigns} active`, trendUp: true },
    { label: 'Total Leads', value: fmtNum(totalLeads), icon: Users, iconColor: 'text-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-900/30', trend: '+28.4%', trendUp: true },
    { label: 'Total Spent', value: fmt(totalSpent), icon: DollarSign, iconColor: 'text-amber-600', iconBg: 'bg-amber-100 dark:bg-amber-900/30', trend: '+12.4%', trendUp: false },
    { label: 'Avg ROI', value: `${avgROI}%`, icon: TrendingUp, iconColor: 'text-green-600', iconBg: 'bg-green-100 dark:bg-green-900/30', trend: '+18.7%', trendUp: true },
    { label: 'Open Rate', value: `${openRate}%`, icon: Mail, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', trend: '+5.2%', trendUp: true },
    { label: 'Conv. Rate', value: `${conversionRate}%`, icon: MousePointerClick, iconColor: 'text-pink-600', iconBg: 'bg-pink-100 dark:bg-pink-900/30', trend: '+3.6%', trendUp: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="pb-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">Marketing Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Campaign performance, channel insights and AI predictions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={dateRange} onChange={e => { setDateRange(e.target.value); setPage(0); }}
            className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">This Year</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none">
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="meta">Meta</option>
          </select>
          <button onClick={load} className="p-2 border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={exportCsv} className="p-2 border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-[#ededed]">{s.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium">{s.label}</p>
              <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${s.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                {s.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Chart + Type Distribution ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">Sends · Opens · Clicks</h3>
            <div className="flex gap-1">
              {(['composed', 'area', 'bar'] as ChartMode[]).map(t => (
                <button key={t} onClick={() => setChartMode(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${chartMode === t ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                  {t === 'composed' ? 'Bar+Line' : t === 'area' ? 'Area' : 'Bar'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bar' ? (
                <BarChart data={dailyStats} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="sends" fill="#C7D2FE" radius={[3,3,0,0]} name="Sends" />
                  <Bar dataKey="opens" fill="#4F46E5" radius={[3,3,0,0]} name="Opens" />
                  <Bar dataKey="clicks" fill="#16A34A" radius={[3,3,0,0]} name="Clicks" />
                </BarChart>
              ) : chartMode === 'area' ? (
                <AreaChart data={dailyStats} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="aG1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} /><stop offset="95%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="aG2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
                    <linearGradient id="aG3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C7D2FE" stopOpacity={0.3} /><stop offset="95%" stopColor="#C7D2FE" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="sends" stroke="#C7D2FE" fill="url(#aG3)" strokeWidth={2} name="Sends" />
                  <Area type="monotone" dataKey="opens" stroke="#4F46E5" fill="url(#aG1)" strokeWidth={2} name="Opens" />
                  <Area type="monotone" dataKey="clicks" stroke="#16A34A" fill="url(#aG2)" strokeWidth={2} name="Clicks" />
                </AreaChart>
              ) : (
                <ComposedChart data={dailyStats} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="sends" fill="#C7D2FE" radius={[3,3,0,0]} name="Sends" />
                  <Line type="monotone" dataKey="opens" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="Opens" />
                  <Line type="monotone" dataKey="clicks" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A', r: 3 }} name="Clicks" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type Distribution Pie */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed] mb-4">Campaign Type Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={typeDistrib} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                {typeDistrib.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val}%`, '']} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {typeDistrib.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-[#a3a3a3]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-slate-100 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-[#ededed] w-8 text-right">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Analytics Tabs ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 dark:border-[#1f1f1f] overflow-x-auto">
          {([
            { id: 'performance', label: 'Campaign Performance' },
            { id: 'quality',     label: 'Lead Quality' },
            { id: 'channel',     label: 'Channel Analytics' },
            { id: 'comparison',  label: 'Platform Comparison' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-3 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">
                Campaign Performance <span className="text-slate-400 font-normal ml-1">({filteredCampaigns.length})</span>
              </span>
              <div className="ml-auto flex items-center gap-2">
                <select value={qualityFilter} onChange={e => { setQualityFilter(e.target.value as QualityRange); setPage(0); }}
                  className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-2 py-1.5 text-[10px] dark:bg-[#111] dark:text-white outline-none">
                  <option value="all">All ROI</option>
                  <option value="high">High (&gt;200%)</option>
                  <option value="medium">Medium (100-200%)</option>
                  <option value="low">Low (&lt;100%)</option>
                </select>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }} placeholder="Search campaigns…"
                    className="pl-7 pr-7 py-1.5 border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none w-40" />
                  {searchQ && <button onClick={() => setSearchQ('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-slate-400" /></button>}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {pagedCampaigns.length === 0
                ? <p className="text-xs text-center text-slate-400 py-10">No campaign data found</p>
                : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-[#111]">
                      <tr>
                        <SortTh col="name"        label="Campaign"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <th className="text-left px-3 py-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Type</th>
                        <SortTh col="sent"        label="Sent"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="opens"       label="Opens"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="clicks"      label="Clicks"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="conversions" label="Conv."     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="revenue"     label="Revenue"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="ctr"         label="CTR%"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="cvr"         label="CVR%"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="roi"         label="ROI%"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <th className="text-left px-3 py-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-[#1f1f1f]">
                      {pagedCampaigns.map(c => {
                        const ctype = c.type || c.platform || 'Email';
                        const ctr   = pct(c.clicks, c.sent);
                        const cvr   = pct(c.conversions, c.sent);
                        const rev   = c.revenue ?? 0;
                        const roi   = c.roi ?? 0;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                            <td className="px-3 py-3 font-semibold text-slate-800 dark:text-[#ededed] max-w-[150px] truncate">{c.name}</td>
                            <td className="px-3 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[ctype] ?? 'bg-slate-100 text-slate-600'}`}>{ctype}</span></td>
                            <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.sent)}</td>
                            <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.opens)}</td>
                            <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.clicks)}</td>
                            <td className="px-3 py-3 font-semibold text-slate-700 dark:text-[#ededed]">{fmtNum(c.conversions)}</td>
                            <td className="px-3 py-3 font-semibold">₹{rev >= 100000 ? (rev/100000).toFixed(1)+'L' : fmtNum(rev)}</td>
                            <td className="px-3 py-3 text-indigo-600 dark:text-indigo-400 font-bold">{ctr}%</td>
                            <td className="px-3 py-3 text-green-600 dark:text-green-400 font-bold">{cvr}%</td>
                            <td className="px-3 py-3">
                              <span className={`font-bold ${roi >= 200 ? 'text-green-600' : roi >= 100 ? 'text-amber-600' : 'text-red-500'}`}>{roi}%</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-[#1f1f1f]">
                <span className="text-[10px] text-slate-400">Page {page + 1} of {totalPages} · {filteredCampaigns.length} results</span>
                <div className="flex gap-1.5">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-[10px] font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">Prev</button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-[10px] font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lead Quality Tab */}
        {activeTab === 'quality' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {QUALITY_DATA.map(q => (
                <div key={q.range} className="bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl p-4 border border-slate-100 dark:border-[#1f1f1f]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3]">{q.range}</span>
                    <span className="text-[10px] font-extrabold" style={{ color: q.color }}>{q.pct}%</span>
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">{q.count.toLocaleString()}</p>
                  <div className="mt-2 h-1.5 bg-slate-200 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${q.pct}%`, backgroundColor: q.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-[#ededed] mb-3">Quality Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={QUALITY_DATA} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                      {QUALITY_DATA.map((q, i) => <Cell key={i} fill={q.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Leads']} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-[#ededed] mb-3">Quality by Count</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={QUALITY_DATA} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="range" type="category" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Leads">
                      {QUALITY_DATA.map((q, i) => <Cell key={i} fill={q.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Channel Analytics Tab */}
        {activeTab === 'channel' && (
          <div className="p-5 space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-[#0d0d0d]">
                  <tr>
                    {['Channel','Leads','Cost','ROI%','CPL','Performance'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#1f1f1f]">
                  {[...CHANNEL_DATA].sort((a,b) => b.roi - a.roi).map(c => (
                    <tr key={c.channel} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="px-3 py-3 font-semibold text-slate-800 dark:text-[#ededed]">{c.channel}</td>
                      <td className="px-3 py-3 font-bold text-blue-600">{c.leads.toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{c.cost > 0 ? fmt(c.cost) : '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`font-bold ${c.roi >= 200 ? 'text-green-600' : c.roi >= 100 ? 'text-amber-600' : 'text-red-500'}`}>{c.roi}%</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{c.cpl > 0 ? `₹${c.cpl}` : '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min((c.roi/350)*100, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500">{c.roi >= 200 ? 'Excellent' : c.roi >= 100 ? 'Good' : 'Low'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-[#ededed] mb-3">Channel ROI Comparison</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={CHANNEL_DATA} margin={{ left: -10, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="channel" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                  <Bar dataKey="roi" name="ROI %" radius={[4, 4, 0, 0]}>
                    {CHANNEL_DATA.map((c, i) => <Cell key={i} fill={c.roi >= 200 ? '#16A34A' : c.roi >= 100 ? '#F59E0B' : '#EF4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Platform Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="p-5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-[#ededed] mb-4">Platform Multi-Metric Comparison (Radar)</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Radar name="Facebook" dataKey="facebook" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} />
                <Radar name="Google" dataKey="google" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                <Radar name="Instagram" dataKey="instagram" stroke="#EC4899" fill="#EC4899" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── AI Insights ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">AI Analytics Insights</h3>
          </div>
          <button onClick={refreshInsights} disabled={insightsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] text-slate-600 dark:text-[#a3a3a3] text-[10px] font-semibold rounded-xl transition">
            {insightsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh Insights
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { title: 'Best Send Time', metric: insights?.bestSendTime?.split('—')[0]?.trim() ?? 'Tuesday 10 AM', detail: insights?.bestSendTime ?? 'Click Refresh to load AI insights', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
            { title: 'Best Audience', metric: insights ? 'AI Identified' : '—', detail: insights?.bestAudience ?? 'Click Refresh to load AI insights', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10' },
            { title: 'Conversion Prediction', metric: insights?.convPrediction?.match(/[\d.]+%/)?.[0] ?? '—', detail: insights?.convPrediction ?? 'Click Refresh to load AI insights', icon: Target, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
            { title: 'Churn Risk', metric: insights?.churnRisk?.match(/[\d]+%/)?.[0] ?? '—', detail: insights?.churnRisk ?? 'Click Refresh to load AI insights', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          ].map(ins => {
            const Icon = ins.icon;
            return (
              <div key={ins.title} className={`${ins.bg} rounded-xl border border-slate-100 dark:border-[#2a2a2a] p-4 space-y-2`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${ins.color}`} />
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">{ins.title}</span>
                </div>
                <p className={`text-base font-extrabold ${ins.color}`}>{ins.metric}</p>
                <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] leading-snug">{ins.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
