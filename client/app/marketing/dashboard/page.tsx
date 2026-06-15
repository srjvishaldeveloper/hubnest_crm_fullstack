'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  Megaphone, Users, TrendingUp, DollarSign, Bell, ArrowUpRight, ArrowDownRight,
  BarChart3, Target, Zap, FileText, Plus, AlertTriangle,
  CheckCircle2, Sparkles, ChevronRight, Activity, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// ─── Types ───────────────────────────────────────────────────

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
  week?: string;
  date?: string;
  profit: number;
  cost: number;
  roi: number;
}

// ─── Static data (non-API) ────────────────────────────────────

const quickActions = [
  { label: 'Create Campaign', href: '/marketing/campaigns', icon: Plus, color: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/20' },
  { label: 'View Leads', href: '/marketing/leads', icon: Users, color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20' },
  { label: 'View Analytics', href: '/marketing/analytics', icon: BarChart3, color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/20' },
  { label: 'Manage Budget', href: '/marketing/campaigns', icon: DollarSign, color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20' },
  { label: 'Add New Ad', href: '/marketing/campaigns', icon: Megaphone, color: 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/20' },
  { label: 'Reports', href: '/marketing/reports', icon: FileText, color: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/20' },
];

const aiInsights = [
  { title: 'Boost Facebook Budget', desc: 'Facebook leads are converting 2.3× better. Increasing budget by 15% could add 80+ leads.', action: 'Optimize Now', color: 'border-violet-200 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-950/10' },
  { title: 'Pause Underperformers', desc: 'Email Drip has ROI < 90%. Pausing it could save ₹8,200/month.', action: 'Take Action', color: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10' },
  { title: 'Instagram Opportunity', desc: 'Instagram Story Ads showing 30% higher engagement this week.', action: 'Scale Up', color: 'border-pink-200 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-950/10' },
  { title: 'Lead Quality Drop', desc: 'Lead quality score dipped 5% from last week. Review targeting settings.', action: 'Review Now', color: 'border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10' },
];

// ─── Sub-components ───────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Facebook: { label: 'FB', cls: 'bg-blue-100 text-blue-700' },
    Google: { label: 'GG', cls: 'bg-red-100 text-red-700' },
    Instagram: { label: 'IG', cls: 'bg-pink-100 text-pink-700' },
    Website: { label: 'WEB', cls: 'bg-slate-100 text-slate-600' },
    LinkedIn: { label: 'LI', cls: 'bg-sky-100 text-sky-700' },
    Email: { label: 'EM', cls: 'bg-green-100 text-green-700' },
  };
  const p = map[platform] ?? { label: platform?.slice(0, 2) || '??', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.cls}`}>{p.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    Draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    Ended: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    ended: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
      {status}
    </span>
  );
}

function SectionHeader({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">{title}</h2>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {link && (
        <Link href={link} className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      <span className="ml-3 text-sm text-slate-500 font-medium">Loading dashboard...</span>
    </div>
  );
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

// ─── Main Page ────────────────────────────────────────────────

export default function MarketingDashboard() {
  const user = useAuthStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [roiChartData, setRoiChartData] = useState<ROIData[]>([]);
  const [error, setError] = useState('');

  // Dashboard Sections Order
  const [sectionsOrder, setSectionsOrder] = useState([
    'header', 'kpis', 'performance', 'roi', 'top_low', 'quick_actions', 'ai_insights', 'today_summary'
  ]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        const [dashRes, campRes, roiRes] = await Promise.allSettled([
          api.get('/marketing/dashboard'),
          api.get('/marketing/campaigns'),
          api.get('/marketing/roi'),
        ]);

        if (dashRes.status === 'fulfilled') {
          setDashboardData(dashRes.value.data?.data || dashRes.value.data || {});
        }
        if (campRes.status === 'fulfilled') {
          const campData = campRes.value.data?.data?.campaigns || campRes.value.data?.campaigns || campRes.value.data?.data || campRes.value.data || [];
          setCampaigns(Array.isArray(campData) ? campData : []);
        }
        if (roiRes.status === 'fulfilled') {
          const roi = roiRes.value.data?.data || roiRes.value.data || [];
          setRoiChartData(Array.isArray(roi) ? roi : []);
        }
      } catch (err: any) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Compute KPIs from API data
  // Use campaigns array length as source of truth (API returns actual campaign list)
  const totalCampaignsCount = campaigns.length || dashboardData.totalCampaigns || 0;
  const activeCampaignsCount = campaigns.filter(c => c.status === 'active' || c.status === 'Active').length || dashboardData.activeCampaigns || 0;

  const kpis = [
    {
      title: `Total Campaigns`,
      value: `${totalCampaignsCount} (${activeCampaignsCount} active)`,
      change: '',
      up: true,
      icon: Megaphone,
      bg: 'bg-violet-100 dark:bg-violet-950/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      borderColor: 'border-violet-200 dark:border-violet-900/40',
    },
    {
      title: 'Leads Generated (Month)',
      value: (dashboardData.leadsThisMonth ?? dashboardData.totalLeads ?? 0).toLocaleString(),
      change: '',
      up: true,
      icon: Users,
      bg: 'bg-blue-100 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900/40',
    },
    {
      title: 'Cost Spent',
      value: formatCurrency(dashboardData.totalSpent ?? 0),
      change: '',
      up: false,
      icon: DollarSign,
      bg: 'bg-amber-100 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900/40',
    },
    {
      title: 'ROI',
      value: `${dashboardData.avgROI ?? 0}%`,
      change: '',
      up: true,
      icon: TrendingUp,
      bg: 'bg-green-100 dark:bg-green-950/30',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-900/40',
    },
  ];

  // Lead source data from API or fallback
  const leadSourceData = dashboardData.leadsBySource && dashboardData.leadsBySource.length > 0
    ? dashboardData.leadsBySource
    : [
        { name: 'Direct', value: 100, color: '#4F46E5' },
      ];

  const totalLeadSourceValue = leadSourceData.reduce((a, b) => a + b.value, 0);

  // Campaign table (top 5)
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

  // Top and low performers
  const sortedByRoi = [...campaigns].sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));
  const topPerformers = sortedByRoi.slice(0, 3).map((c, i) => ({
    rank: i + 1,
    name: c.name,
    platform: c.platform || 'N/A',
    leads: c.leads_count ?? 0,
    roi: c.roi ?? 0,
  }));
  const lowPerformers = sortedByRoi.slice(-3).reverse().filter(c => (c.roi ?? 0) < 200).map(c => ({
    name: c.name,
    platform: c.platform || 'N/A',
    leads: c.leads_count ?? 0,
    roi: c.roi ?? 0,
    status: (c.roi ?? 0) < 100 ? 'Needs Attention' : 'Below Target',
  }));

  // Today summary from API data
  const todaySummary = [
    { label: 'Leads Today', value: String(dashboardData.leadsToday ?? 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Cost Today', value: formatCurrency(dashboardData.costToday ?? 0), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
    { label: 'Conversions', value: String(dashboardData.conversionsToday ?? 0), icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Total Leads', value: (dashboardData.totalLeads ?? 0).toLocaleString(), icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
    { label: 'ROI', value: `${dashboardData.avgROI ?? 0}%`, icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
  ];

  // ROI headline values
  const totalCost = roiChartData.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalProfit = roiChartData.reduce((sum, r) => sum + (r.profit || 0), 0);
  const avgRoi = roiChartData.length > 0 ? Math.round(roiChartData.reduce((sum, r) => sum + (r.roi || 0), 0) / roiChartData.length) : (dashboardData.avgROI ?? 0);

  if (loading) return <LoadingSpinner />;

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sectionsOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSectionsOrder(items);
  };

  const renderSection = (id: string, provided?: any, snapshot?: any) => {
    const isDragging = snapshot?.isDragging;
    const dragProps = provided ? {
      ref: provided.innerRef,
      ...provided.draggableProps,
      ...provided.dragHandleProps,
      style: {
        ...provided.draggableProps.style,
        opacity: isDragging ? 0.8 : 1,
      }
    } : {};

    const DragHandle = () => (
      <div className="flex justify-center -mt-2 mb-2 opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    );

    switch (id) {
      case 'header':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row lg:items-start gap-4"
            >
        {/* Greeting */}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">
            {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here&apos;s your marketing performance overview for today.</p>
        </div>

        {/* AI Insight Card */}
        <div className="lg:max-w-xs w-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-2xl p-4 shadow-md shadow-indigo-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-200">AI Insight</span>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            {totalCampaignsCount > 0
              ? `You have ${totalCampaignsCount} campaign${totalCampaignsCount !== 1 ? 's' : ''}, ${activeCampaignsCount} active.`
              : 'Create your first campaign to start generating leads.'}
          </p>
        </div>

        {/* Bell */}
        <div className="relative self-start">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition shadow-sm relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full ring-1 ring-white" />
          </button>
        </div>
      </motion.div>
      </div>
        );
      case 'kpis':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-2xl border ${k.borderColor} p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{k.title}</p>
            </motion.div>
          );
        })}
      </div>
      </div>
        );
      case 'performance':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Campaign Table */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Campaign Performance" sub={`Top ${campaignTableData.length} campaigns`} link="/marketing/campaigns" />
          {campaignTableData.length === 0 ? (
            <div className="text-center py-10">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No campaigns found</p>
              <p className="text-xs text-slate-400 mt-1">Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                    {['Campaign', 'Platform', 'Budget', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 pr-3 text-slate-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaignTableData.map((row, ri) => (
                    <tr key={`${row.name}-${ri}`} className="hover:bg-slate-50 dark:bg-[#161616]/50 transition">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate max-w-[120px]">{row.name}</p>
                          {row.top && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Top</span>}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3"><PlatformBadge platform={row.platform} /></td>
                      <td className="py-2.5 pr-3 text-slate-600">{row.budget}</td>
                      <td className="py-2.5 pr-3 font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{row.leads}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{row.cpl}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`font-bold ${row.roi >= 200 ? 'text-green-600' : row.roi >= 150 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {row.roi}%
                        </span>
                      </td>
                      <td className="py-2.5"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leads Summary */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Leads Generated" sub="By source this month" />
          <div className="flex justify-center mb-2">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {leadSourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{(dashboardData.totalLeads ?? totalLeadSourceValue).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium">Total Leads</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-1">
            {leadSourceData.map((s) => (
              <div key={s.name + s.value} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{totalLeadSourceValue > 0 ? Math.round((s.value / totalLeadSourceValue) * 100) : 0}%</span>
              </div>
            ))}
          </div>
          {leadSourceData.length > 0 && (
            <div className="mt-3 flex items-center justify-between p-2.5 bg-green-50 rounded-xl">
              <div>
                <p className="text-[10px] text-green-600 font-bold">Best Source</p>
                <p className="text-xs font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{leadSourceData[0]?.name || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">Total</p>
                <p className="text-sm font-extrabold text-green-600">{leadSourceData[0]?.value || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
        );
      case 'roi':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cost & Budget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Cost & Budget Tracking" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total Spent', value: formatCurrency(dashboardData.totalSpent ?? totalCost), color: 'text-amber-600' },
              { label: 'Total Campaigns', value: String(dashboardData.totalCampaigns ?? campaigns.length), color: 'text-blue-600' },
              { label: 'Active', value: String(dashboardData.activeCampaigns ?? campaigns.filter(c => c.status === 'active' || c.status === 'Active').length), color: 'text-green-600' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-xs text-green-700 font-semibold">
              {campaigns.length > 0 ? `${campaigns.length} campaigns tracked` : 'No campaigns to track yet.'}
            </p>
          </div>
        </div>

        {/* ROI Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="ROI Analytics" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-extrabold text-[#4F46E5]">{avgRoi}%</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold text-green-600">Average ROI</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div><p className="text-[10px] text-slate-500">Total Revenue</p><p className="text-sm font-extrabold text-green-600">{formatCurrency(totalProfit)}</p></div>
              <div><p className="text-[10px] text-slate-500">Total Cost</p><p className="text-sm font-extrabold text-slate-700">{formatCurrency(totalCost)}</p></div>
            </div>
          </div>
          {roiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={roiChartData}>
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="roi" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="ROI %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">No ROI data available yet</div>
          )}
        </div>
      </div>
      </div>
        );
      case 'top_low':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Top Performing Campaigns" sub="Ranked by ROI" />
          {topPerformers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No campaign data available</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((c, ci) => (
                <div key={`${c.name}-${ci}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#161616] hover:bg-green-50/50 transition">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {c.rank}
                  </span>
                  <PlatformBadge platform={c.platform} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.leads} leads</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-green-600">{c.roi}%</p>
                    <p className="text-[10px] text-slate-400">ROI</p>
                  </div>
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((c.roi / 300) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Performers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Low Performing Campaigns" sub="Needs attention" />
          {lowPerformers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">All campaigns performing well! 🎉</p>
          ) : (
            <div className="space-y-3">
              {lowPerformers.map((c, ci) => (
                <div key={`${c.name}-low-${ci}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#161616] hover:bg-red-50/50 transition">
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
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((c.roi / 300) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
        );
      case 'quick_actions':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-[#1f1f1f] transition text-center ${a.color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
        );
      case 'ai_insights':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="AI Insights" sub="Smart recommendations for your campaigns" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{ins.title}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ins.desc}</p>
              <button className="mt-3 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>
      </div>
        );
      case 'today_summary':
        return (
          <div {...dragProps} className={isDragging ? 'shadow-2xl rounded-2xl bg-slate-50 dark:bg-[#0d0d0d] p-4 ring-2 ring-indigo-500' : ''}>
            <DragHandle />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Today's Summary" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {todaySummary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f]">
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
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              {sectionsOrder.map((sectionId, index) => (
                <Draggable key={sectionId} draggableId={sectionId} index={index}>
                  {(provided, snapshot) => renderSection(sectionId, provided, snapshot)}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
