'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  Megaphone, Users, TrendingUp, DollarSign, Bell, ArrowUpRight, ArrowDownRight,
  BarChart3, Target, Zap, FileText, Plus, AlertTriangle,
  CheckCircle2, Sparkles, ChevronRight, Activity, Loader2,
  Eye, MousePointerClick, Filter, Download, RefreshCw,
  Mail, Phone, Globe,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart,
  AreaChart, Area, BarChart, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────
interface DashboardData {
  totalCampaigns?: number;
  activeCampaigns?: number;
  totalLeads?: number;
  leadsThisMonth?: number;
  totalSpent?: number;
  avgROI?: number;
  conversionRate?: number;
  leadsToday?: number;
  conversionsToday?: number;
  costToday?: number;
  leadsBySource?: { name: string; value: number; color: string }[];
  trendDaily?: { name: string; leads: number; cost: number }[];
  trendWeekly?: { name: string; leads: number; cost: number }[];
  trendMonthly?: { name: string; leads: number; cost: number }[];
}

interface Campaign {
  id: number;
  name: string;
  platform: string;
  budget: number;
  leads_count?: number;
  cost_per_lead?: number;
  roi?: number;
  status: string;
}

interface ROIData {
  week?: string; date?: string; name?: string;
  profit: number; cost: number; roi: number;
}




const quickActions = [
  { label: 'Create Campaign', href: '/marketing/campaigns/create', icon: Plus, color: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/20' },
  { label: 'View Leads', href: '/marketing/leads', icon: Users, color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20' },
  { label: 'View Analytics', href: '/marketing/analytics', icon: BarChart3, color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/20' },
  { label: 'Manage Budget', href: '/marketing/campaigns/budget', icon: DollarSign, color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20' },
  { label: 'Add New Ad', href: '/marketing/campaigns', icon: Megaphone, color: 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/20' },
  { label: 'Reports', href: '/marketing/reports', icon: FileText, color: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/20' },
];

const aiInsights = [
  { title: 'Boost Facebook Budget', desc: 'Facebook leads converting 2.3× better. +15% budget = 80+ more leads.', action: 'Optimize Now', color: 'border-violet-200 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-950/10' },
  { title: 'Pause Underperformers', desc: 'Email Drip ROI < 90%. Pausing saves ₹8,200/month.', action: 'Take Action', color: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10' },
  { title: 'Instagram Opportunity', desc: 'Instagram Story Ads showing 30% higher engagement this week.', action: 'Scale Up', color: 'border-pink-200 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-950/10' },
  { title: 'Lead Quality Drop', desc: 'Lead quality score dipped 5% from last week. Review targeting.', action: 'Review Now', color: 'border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10' },
];

// ─── Helpers ─────────────────────────────────────────────────────
function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)   return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Facebook: { label: 'FB', cls: 'bg-blue-100 text-blue-700' },
    Google:   { label: 'GG', cls: 'bg-red-100 text-red-700' },
    Instagram:{ label: 'IG', cls: 'bg-pink-100 text-pink-700' },
    Website:  { label: 'WEB', cls: 'bg-slate-100 text-slate-600' },
    LinkedIn: { label: 'LI', cls: 'bg-sky-100 text-sky-700' },
    Email:    { label: 'EM', cls: 'bg-green-100 text-green-700' },
    YouTube:  { label: 'YT', cls: 'bg-red-100 text-red-600' },
    Twitter:  { label: 'TW', cls: 'bg-sky-100 text-sky-600' },
  };
  const p = map[platform] ?? { label: platform?.slice(0, 2) || '??', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.cls}`}>{p.label}</span>;
}

type Period = 'today' | 'weekly' | 'monthly';
type CostPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// ─── Main Page ───────────────────────────────────────────────────
export default function MarketingDashboard() {
  const user = useAuthStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [roiChartData, setRoiChartData] = useState<ROIData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<ROIData[]>([]);
  const [error, setError]         = useState('');

  // period toggles
  const [period, setPeriod]           = useState<Period>('monthly');
  const [costPeriod, setCostPeriod]   = useState<CostPeriod>('monthly');
  const [roiPeriod, setRoiPeriod]     = useState<'weekly'|'monthly'>('weekly');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null);

  const fetchRoi = async (p: string) => {
    try {
      const res = await api.get(`/marketing/roi?period=${p}`);
      const d = res.data?.data || res.data || [];
      setRoiChartData(Array.isArray(d) ? d : []);
    } catch { setRoiChartData([]); }
  };

  const fetchAnalytics = async (p: string) => {
    try {
      const res = await api.get(`/marketing/analytics?period=${p}`);
      const d = res.data?.data || res.data || [];
      setAnalyticsData(Array.isArray(d) ? d : []);
    } catch { setAnalyticsData([]); }
  };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true); setError('');
      try {
        const [dashRes, campRes] = await Promise.allSettled([
          api.get('/marketing/dashboard'),
          api.get('/marketing/campaigns'),
        ]);
        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value.data?.data || dashRes.value.data || {});
        if (campRes.status === 'fulfilled') {
          const d = campRes.value.data?.data?.campaigns || campRes.value.data?.campaigns || campRes.value.data?.data || campRes.value.data || [];
          setCampaigns(Array.isArray(d) ? d : []);
        }
        await Promise.all([fetchRoi('monthly'), fetchAnalytics('monthly')]);
      } catch { setError('Failed to load dashboard data'); }
      finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  // Re-fetch ROI when roiPeriod changes
  useEffect(() => { fetchRoi(roiPeriod); }, [roiPeriod]);

  // Re-fetch cost analytics when costPeriod changes
  useEffect(() => { fetchAnalytics(costPeriod); }, [costPeriod]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const totalCampaignsCount  = campaigns.length || dashboardData.totalCampaigns || 0;
  const activeCampaignsCount = campaigns.filter(c => c.status === 'active' || c.status === 'Active').length || dashboardData.activeCampaigns || 0;
  const totalLeads            = dashboardData.leadsThisMonth ?? dashboardData.totalLeads ?? 0;
  const totalSpent            = dashboardData.totalSpent ?? 0;
  const avgROI                = dashboardData.avgROI ?? 0;

  // lead trend data based on period
  const trendData = period === 'today' ? (dashboardData?.trendDaily || []) : period === 'weekly' ? (dashboardData?.trendWeekly || []) : (dashboardData?.trendMonthly || []);

  // cost data: derived from real analytics API, mapped to { d, v } shape for bar chart
  const costData = analyticsData.map(r => ({ d: r.name, v: r.cost }));

  // roi data — from real API only
  const roiData = roiChartData;
  const roiLabeled = roiData.map((r, i) => ({
    name: r.name || r.week || r.date || `P${i + 1}`,
    roi: r.roi, cost: r.cost, profit: r.profit,
  }));

  const totalCost   = roiData.reduce((s, r) => s + (r.cost ?? 0), 0);
  const totalProfit = roiData.reduce((s, r) => s + (r.profit ?? 0), 0);
  const avgRoiCalc  = roiData.length > 0
    ? Math.round(roiData.reduce((s, r) => s + (r.roi ?? 0), 0) / roiData.length)
    : avgROI;

  // lead source data
  const rawLeadSource = dashboardData.leadsBySource && dashboardData.leadsBySource.length > 0
    ? dashboardData.leadsBySource
    : [
        { name: 'Facebook', value: 45, color: '#4F46E5' },
        { name: 'Google',   value: 25, color: '#2563EB' },
        { name: 'Instagram',value: 15, color: '#EC4899' },
        { name: 'Website',  value: 10, color: '#16A34A' },
        { name: 'Other',    value: 5,  color: '#F59E0B' },
      ];

  const filteredLeadSource = sourceFilter === 'all' ? rawLeadSource
    : rawLeadSource.filter(s => s.name.toLowerCase() === sourceFilter);
  const totalLeadSourceValue = filteredLeadSource.reduce((a, b) => a + b.value, 0);

  // sorted campaign performers
  const sortedByRoi    = [...campaigns].sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
  const topPerformers  = sortedByRoi.slice(0, 3).map((c, i) => ({ rank: i + 1, name: c.name, platform: c.platform || 'N/A', leads: c.leads_count ?? 0, roi: c.roi ?? 0 }));
  const lowPerformers  = sortedByRoi.slice(-3).reverse().filter(c => (c.roi ?? 0) < 200).map(c => ({ name: c.name, platform: c.platform || 'N/A', leads: c.leads_count ?? 0, roi: c.roi ?? 0, status: (c.roi ?? 0) < 100 ? 'Needs Attention' : 'Below Target' }));

  const campaignTableData = campaigns.slice(0, 5).map(c => ({
    name: c.name,
    platform: c.platform || 'N/A',
    budget: formatCurrency(c.budget || 0),
    leads: c.leads_count ?? 0,
    cpl: c.cost_per_lead ? formatCurrency(c.cost_per_lead) : '—',
    roi: c.roi ?? 0,
    status: c.status,
    top: (c.roi ?? 0) >= 200,
  }));

  // KPI cards with click-to-expand graph
  const kpis = [
    {
      id: 'campaigns',
      title: 'Total Campaigns',
      value: `${totalCampaignsCount}`,
      sub: `${activeCampaignsCount} active`,
      icon: Megaphone,
      bg: 'bg-violet-100 dark:bg-violet-950/30',
      iconColor: 'text-violet-600',
      borderColor: 'border-violet-200 dark:border-violet-900/40',
      trend: '+2 this week', trendUp: true,
      link: '/marketing/campaigns',
    },
    {
      id: 'leads',
      title: 'Leads Generated',
      value: totalLeads.toLocaleString(),
      sub: 'This month',
      icon: Users,
      bg: 'bg-blue-100 dark:bg-blue-950/30',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-900/40',
      trend: '+28.4%', trendUp: true,
      link: '/marketing/leads',
    },
    {
      id: 'cost',
      title: 'Cost Spent',
      value: formatCurrency(totalSpent),
      sub: 'This month',
      icon: DollarSign,
      bg: 'bg-amber-100 dark:bg-amber-950/30',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200 dark:border-amber-900/40',
      trend: '+12.4%', trendUp: false,
      link: '/marketing/campaigns/budget',
    },
    {
      id: 'roi',
      title: 'ROI',
      value: `${avgRoiCalc}%`,
      sub: 'Average',
      icon: TrendingUp,
      bg: 'bg-green-100 dark:bg-green-950/30',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200 dark:border-green-900/40',
      trend: '+18.7%', trendUp: true,
      link: '/marketing/analytics/roi',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        <span className="ml-3 text-sm text-slate-500 font-medium">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>}

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">
            {greeting}, {user?.name?.split(' ')[0] || 'Marketer'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here&apos;s what&apos;s happening with your marketing today.</p>
        </div>
        <div className="lg:max-w-xs w-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-2xl p-4 shadow-md shadow-indigo-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-200">AI Insight</span>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            {totalCampaignsCount > 0
              ? `${activeCampaignsCount} active campaigns generating ${totalLeads.toLocaleString()} leads. ROI at ${avgRoiCalc}%.`
              : 'Create your first campaign to start generating leads.'}
          </p>
        </div>
        <div className="relative self-start">
          <button onClick={() => setShowNotif(!showNotif)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition shadow-sm relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full ring-1 ring-white" />
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-12 w-72 bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl shadow-xl z-50 p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-[#ededed] mb-2">Notifications</p>
                {[
                  { icon: AlertTriangle, color: 'text-amber-500', msg: 'Budget alert: Lead Gen campaign 80% spent' },
                  { icon: TrendingUp, color: 'text-red-500', msg: 'ROI dropped for Website Traffic Boost' },
                  { icon: CheckCircle2, color: 'text-green-500', msg: 'Daily leads target achieved! 🎉' },
                ].map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${n.color}`} />
                      <p className="text-[11px] text-slate-600 dark:text-[#a3a3a3]">{n.msg}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Clickable KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const isExpanded = expandedKPI === k.id;
          return (
            <motion.div key={k.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`bg-white dark:bg-[#161616] rounded-2xl border ${k.borderColor} p-4 shadow-sm cursor-pointer transition hover:shadow-md`}
              onClick={() => setExpandedKPI(isExpanded ? null : k.id)}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${k.iconColor}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${k.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  {k.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.trend}
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 80, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                    <ResponsiveContainer width="100%" height={70}>
                      <AreaChart data={trendData} margin={{ left: -30, right: 0, top: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${k.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9, borderRadius: 6 }} />
                        <Area type="monotone" dataKey="leads" stroke="#4F46E5" fill={`url(#grad-${k.id})`} strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <Link href={k.link} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 mt-1">
                      View Details <ChevronRight className="w-3 h-3" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── Campaign Performance + Leads Summary ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Campaign Table */}
        <div className="xl:col-span-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Campaign Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Top {campaignTableData.length} campaigns</p>
            </div>
            <Link href="/marketing/campaigns" className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {campaignTableData.length === 0 ? (
            <div className="text-center py-10">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No campaigns yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                    {['Campaign', 'Platform', 'Budget', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 pr-3 text-slate-400 dark:text-[#a3a3a3] font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#1f1f1f]">
                  {campaignTableData.map((row, ri) => (
                    <tr key={`${row.name}-${ri}`} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate max-w-[120px]">{row.name}</p>
                          {row.top && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Top</span>}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3"><PlatformBadge platform={row.platform} /></td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-[#a3a3a3]">{row.budget}</td>
                      <td className="py-2.5 pr-3 font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{row.leads}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-[#a3a3a3]">{row.cpl}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`font-bold ${row.roi >= 200 ? 'text-green-600' : row.roi >= 150 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {row.roi}%
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          row.status === 'active' || row.status === 'Active' ? 'bg-green-100 text-green-700' :
                          row.status === 'paused' || row.status === 'Paused' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leads by Source */}
        <div className="xl:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Leads by Source</h2>
              <p className="text-xs text-slate-500 mt-0.5">This month</p>
            </div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="text-[10px] border border-slate-200 dark:border-[#2a2a2a] rounded-lg px-2 py-1 bg-white dark:bg-[#0d0d0d] text-slate-600 dark:text-[#a3a3a3] outline-none">
              <option value="all">All Sources</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="instagram">Instagram</option>
              <option value="website">Website</option>
            </select>
          </div>
          <div className="flex justify-center mb-2">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={filteredLeadSource} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {filteredLeadSource.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ fontSize: 9, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{(dashboardData.totalLeads ?? totalLeadSourceValue).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium">Total Leads</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {filteredLeadSource.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-600 dark:text-[#a3a3a3]">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB] w-8 text-right">{s.value}%</span>
                </div>
              </div>
            ))}
          </div>
          {filteredLeadSource.length > 0 && (
            <div className="mt-3 flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <div>
                <p className="text-[10px] text-green-600 font-bold">Best Source</p>
                <p className="text-xs font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{filteredLeadSource[0]?.name || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">Share</p>
                <p className="text-sm font-extrabold text-green-600">{filteredLeadSource[0]?.value || 0}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lead Trend + Cost & Budget ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Lead Trend Graph */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Lead Generation Trend</h2>
              <p className="text-xs text-slate-500">Leads over time</p>
            </div>
            <div className="flex gap-1">
              {(['today', 'weekly', 'monthly'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${period === p ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                  {p === 'today' ? 'Today' : p === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={trendData} margin={{ left: -20, right: 4 }}>
              <defs>
                <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
              <Bar dataKey="leads" fill="#C7D2FE" radius={[3, 3, 0, 0]} name="Leads" />
              <Line type="monotone" dataKey="leads" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="Trend" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cost & Budget Tracking */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Cost & Budget Tracking</h2>
              <p className="text-xs text-slate-500">Spend over time</p>
            </div>
            <select value={costPeriod} onChange={e => setCostPeriod(e.target.value as CostPeriod)}
              className="text-[10px] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-2 py-1.5 bg-white dark:bg-[#0d0d0d] text-slate-600 dark:text-[#a3a3a3] outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total Spent', value: formatCurrency(totalSpent || totalCost), color: 'text-amber-600' },
              { label: 'Campaigns', value: String(totalCampaignsCount), color: 'text-blue-600' },
              { label: 'Active', value: String(activeCampaignsCount), color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="text-center p-2.5 bg-slate-50 dark:bg-[#0d0d0d] rounded-xl">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={costData} margin={{ left: -20, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Cost']} contentStyle={{ fontSize: 10, borderRadius: 10 }} />
              <Bar dataKey="v" fill="#FDE68A" radius={[3, 3, 0, 0]} name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROI Analytics ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">ROI Analytics</h2>
            <p className="text-xs text-slate-500">Return on Investment over time</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['weekly', 'monthly'] as const).map(p => (
                <button key={p} onClick={() => setRoiPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${roiPeriod === p ? 'bg-green-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <Link href="/marketing/analytics/roi" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
              View Full <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={roiLabeled} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                <Bar yAxisId="left" dataKey="profit" fill="#D1FAE5" radius={[3, 3, 0, 0]} name="Revenue" />
                <Bar yAxisId="left" dataKey="cost" fill="#FEE2E2" radius={[3, 3, 0, 0]} name="Cost" />
                <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 3 }} name="ROI %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {[
              { label: 'Average ROI', value: `${avgRoiCalc}%`, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
              { label: 'Total Revenue', value: formatCurrency(totalProfit), color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
              { label: 'Total Cost', value: formatCurrency(totalCost), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
              { label: 'Profit', value: formatCurrency(totalProfit - totalCost), color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10' },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between p-2.5 ${item.bg} rounded-xl`}>
                <span className="text-[11px] text-slate-600 dark:text-[#a3a3a3]">{item.label}</span>
                <span className={`text-sm font-extrabold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top & Low Performers ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Top Performing Campaigns</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by ROI</p>
            </div>
            <Link href="/marketing/campaigns" className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {topPerformers.length === 0
            ? <p className="text-xs text-slate-400 text-center py-6">No campaign data available</p>
            : (
              <div className="space-y-3">
                {topPerformers.map((c, ci) => (
                  <div key={`${c.name}-${ci}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0d0d0d] hover:bg-green-50/50 dark:hover:bg-green-900/10 transition">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-extrabold text-xs flex items-center justify-center shrink-0">{c.rank}</span>
                    <PlatformBadge platform={c.platform} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.leads} leads</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-green-600">{c.roi}%</p>
                      <p className="text-[10px] text-slate-400">ROI</p>
                    </div>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((c.roi / 300) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Low Performing Campaigns</h2>
              <p className="text-xs text-slate-500 mt-0.5">Needs attention</p>
            </div>
            <Link href="/marketing/campaigns" className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {lowPerformers.length === 0
            ? <p className="text-xs text-slate-400 text-center py-6">All campaigns performing well! 🎉</p>
            : (
              <div className="space-y-3">
                {lowPerformers.map((c, ci) => (
                  <div key={`${c.name}-low-${ci}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0d0d0d] hover:bg-red-50/50 dark:hover:bg-red-900/10 transition">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <PlatformBadge platform={c.platform} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                      <span className="text-[10px] font-bold text-red-600">{c.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-red-500">{c.roi}%</p>
                      <p className="text-[10px] text-slate-400">ROI</p>
                    </div>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((c.roi / 300) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-[#1f1f1f] transition text-center ${a.color}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── AI Insights ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">AI Insights</h2>
          <span className="text-xs text-slate-500 ml-1">Smart recommendations for your campaigns</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] leading-relaxed">{ins.desc}</p>
              <button className="mt-3 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Today's Summary ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-5">
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Today&apos;s Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Leads Today', value: String(dashboardData.leadsToday ?? 0), icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10' },
            { label: 'Cost Today', value: formatCurrency(dashboardData.costToday ?? 0), icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10' },
            { label: 'Conversions', value: String(dashboardData.conversionsToday ?? 0), icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/10' },
            { label: 'Total Leads', value: (dashboardData.totalLeads ?? 0).toLocaleString(), icon: TrendingUp, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/10' },
            { label: 'ROI', value: `${avgRoiCalc}%`, icon: BarChart3, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-[#0d0d0d] border border-slate-100 dark:border-[#1f1f1f]">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-lg font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
