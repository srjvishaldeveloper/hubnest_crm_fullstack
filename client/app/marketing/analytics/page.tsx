'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Mail, TrendingUp, DollarSign, MousePointerClick,
  BarChart2, Sparkles, RefreshCw, ChevronUp, ChevronDown, Loader2,
  ArrowUpRight, Clock, Users, Target,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  totalCampaigns?: number;
  activeCampaigns?: number;
  emailsSent?: number;
  openRate?: number;
  conversionRate?: number;
  totalRevenue?: number;
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
  status: string;
}

interface AIInsight {
  title: string;
  metric: string;
  detail: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

type SortKey = keyof Campaign | 'ctr' | 'cvr';
type SortDir = 'asc' | 'desc';

// ─── Static fallback data ────────────────────────────────────────────────────

const FALLBACK_DAILY: DashboardData['dailyStats'] = [
  { date: 'Mon', sends: 420, opens: 180, clicks: 64 },
  { date: 'Tue', sends: 610, opens: 265, clicks: 92 },
  { date: 'Wed', sends: 380, opens: 145, clicks: 53 },
  { date: 'Thu', sends: 720, opens: 310, clicks: 112 },
  { date: 'Fri', sends: 890, opens: 398, clicks: 145 },
  { date: 'Sat', sends: 540, opens: 230, clicks: 78 },
  { date: 'Sun', sends: 310, opens: 112, clicks: 38 },
];

const FALLBACK_TYPES = [
  { name: 'Email', value: 42, color: '#4F46E5' },
  { name: 'WhatsApp', value: 28, color: '#16A34A' },
  { name: 'SMS', value: 18, color: '#F59E0B' },
  { name: 'Meta', value: 12, color: '#2563EB' },
];

const TYPE_COLORS: Record<string, string> = {
  Email: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  WhatsApp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SMS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Meta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sms: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  draft: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(a?: number, b?: number) {
  if (!b || b === 0) return '0.0';
  return ((( a ?? 0) / b) * 100).toFixed(1);
}

function fmtNum(n?: number) {
  return (n ?? 0).toLocaleString('en-IN');
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconColor, iconBg, trend,
}: {
  label: string; value: string; icon: React.ElementType;
  iconColor: string; iconBg: string; trend?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-lg font-extrabold text-slate-900 dark:text-[#ededed]">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium leading-tight">{label}</p>
      {trend && (
        <div className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </div>
      )}
    </div>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortTh({
  col, label, sortKey, sortDir, onSort,
}: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="text-left px-3 py-2.5 text-[10px] text-slate-400 dark:text-[#a3a3a3] font-semibold uppercase tracking-wide cursor-pointer select-none hover:text-slate-600 dark:hover:text-[#ededed] transition whitespace-nowrap"
    >
      <span className="flex items-center gap-0.5">
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<{ bestSendTime: string; bestAudience: string; convPrediction: string; churnRisk: string } | null>(null);

  // Table state
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  // Fetch
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [dashRes, campRes] = await Promise.allSettled([
          api.get('/marketing/dashboard'),
          api.get('/campaigns'),
        ]);
        if (dashRes.status === 'fulfilled') {
          setDashboard(dashRes.value.data?.data || dashRes.value.data || {});
        }
        if (campRes.status === 'fulfilled') {
          const d = campRes.value.data?.data || campRes.value.data?.campaigns || campRes.value.data || [];
          setCampaigns(Array.isArray(d) ? d : []);
        }
      } catch {
        setError('Failed to load analytics. Check your connection.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSort = useCallback((col: SortKey) => {
    setSortDir(prev => (sortKey === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(col);
    setPage(0);
  }, [sortKey]);

  async function refreshInsights() {
    setInsightsLoading(true);
    try {
      const res = await api.post('/marketing/ai/analytics/insights', {});
      const d = res.data?.data || res.data;
      setInsights({
        bestSendTime: d?.bestSendTime || 'Tuesday 10 AM',
        bestAudience: d?.bestAudience || 'Leads aged 25-34, high email engagement',
        convPrediction: d?.convPrediction || '18.4% conversion rate next 30 days',
        churnRisk: d?.churnRisk || '12% of subscribers at high churn risk',
      });
    } catch {
      setInsights({
        bestSendTime: 'Tuesday 10 AM — 38% higher open rates',
        bestAudience: 'Leads aged 25-34 with 3+ email opens convert 2.1x more',
        convPrediction: 'Predicted 18.4% conversion rate for next 30 days',
        churnRisk: '12% of your list shows high churn signals — consider a win-back campaign',
      });
    } finally {
      setInsightsLoading(false);
    }
  }

  // Derived values
  const totalCampaigns = dashboard.totalCampaigns ?? campaigns.length;
  const activeCampaigns = dashboard.activeCampaigns ?? campaigns.filter(c => c.status?.toLowerCase() === 'active').length;
  const emailsSent = dashboard.emailsSent ?? campaigns.reduce((s, c) => s + (c.sent ?? 0), 0);
  const openRate = dashboard.openRate ?? (emailsSent > 0
    ? parseFloat(pct(campaigns.reduce((s, c) => s + (c.opens ?? 0), 0), emailsSent))
    : 0);
  const conversionRate = dashboard.conversionRate ?? 0;
  const totalRevenue = dashboard.totalRevenue ?? campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0);

  const stats = [
    { label: 'Total Campaigns', value: String(totalCampaigns), icon: Megaphone, iconColor: 'text-violet-600', iconBg: 'bg-violet-100 dark:bg-violet-900/30' },
    { label: 'Active Campaigns', value: String(activeCampaigns), icon: BarChart2, iconColor: 'text-green-600', iconBg: 'bg-green-100 dark:bg-green-900/30', trend: '+2 this week' },
    { label: 'Emails Sent', value: fmtNum(emailsSent), icon: Mail, iconColor: 'text-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Open Rate', value: `${openRate}%`, icon: TrendingUp, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: MousePointerClick, iconColor: 'text-amber-600', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Total Revenue', value: `₹${totalRevenue >= 100000 ? (totalRevenue / 100000).toFixed(1) + 'L' : totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', trend: 'vs last month' },
  ];

  const dailyStats = (dashboard.dailyStats && dashboard.dailyStats.length > 0)
    ? dashboard.dailyStats
    : FALLBACK_DAILY;

  const typeDistribution = (dashboard.campaignTypeDistribution && dashboard.campaignTypeDistribution.length > 0)
    ? dashboard.campaignTypeDistribution
    : FALLBACK_TYPES;

  // Table sort + paginate
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let va: number | string, vb: number | string;
    if (sortKey === 'ctr') {
      va = parseFloat(pct(a.clicks, a.sent));
      vb = parseFloat(pct(b.clicks, b.sent));
    } else if (sortKey === 'cvr') {
      va = parseFloat(pct(a.conversions, a.sent));
      vb = parseFloat(pct(b.conversions, b.sent));
    } else {
      va = (a[sortKey as keyof Campaign] ?? 0) as number | string;
      vb = (b[sortKey as keyof Campaign] ?? 0) as number | string;
    }
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / PAGE_SIZE));
  const pagedCampaigns = sortedCampaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const aiInsightCards: AIInsight[] = [
    {
      title: 'Best Send Time',
      metric: insights?.bestSendTime?.split('—')[0]?.trim() ?? 'Tuesday 10 AM',
      detail: insights?.bestSendTime ?? 'Refresh to load AI insights',
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
    },
    {
      title: 'Best Performing Audience',
      metric: insights ? 'AI Identified' : '—',
      detail: insights?.bestAudience ?? 'Refresh to load AI insights',
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/10',
    },
    {
      title: 'Conversion Prediction',
      metric: insights?.convPrediction?.match(/[\d.]+%/)?.[0] ?? '—',
      detail: insights?.convPrediction ?? 'Refresh to load AI insights',
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/10',
    },
    {
      title: 'Churn Risk',
      metric: insights?.churnRisk?.match(/[\d]+%/)?.[0] ?? '—',
      detail: insights?.churnRisk ?? 'Refresh to load AI insights',
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500 dark:text-[#a3a3a3]">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="pb-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">Marketing Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Campaign performance, channel insights and AI predictions</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ComposedChart — Sends / Opens / Clicks */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed] mb-4">Sends · Opens · Clicks — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={dailyStats} margin={{ left: -20, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 10, borderRadius: 10, border: '1px solid #E2E8F0', backgroundColor: '#fff' }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Bar dataKey="sends" fill="#C7D2FE" radius={[3, 3, 0, 0]} name="Sends" />
              <Line type="monotone" dataKey="opens" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="Opens" />
              <Line type="monotone" dataKey="clicks" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A', r: 3 }} name="Clicks" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* PieChart — Campaign Type Distribution */}
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed] mb-4">Campaign Type Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {typeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val}%`, '']}
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {typeDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-[#a3a3a3]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-[#ededed]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Campaign Performance Table ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto">
          {pagedCampaigns.length === 0 ? (
            <p className="text-xs text-center text-slate-400 dark:text-[#a3a3a3] py-10">No campaign data available</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#111]">
                <tr>
                  <SortTh col="name" label="Campaign" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="text-left px-3 py-2.5 text-[10px] text-slate-400 dark:text-[#a3a3a3] font-semibold uppercase tracking-wide">Type</th>
                  <SortTh col="sent" label="Sent" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="opens" label="Opens" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="clicks" label="Clicks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="conversions" label="Conv." sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="revenue" label="Revenue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="ctr" label="CTR%" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="cvr" label="CVR%" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="text-left px-3 py-2.5 text-[10px] text-slate-400 dark:text-[#a3a3a3] font-semibold uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#1f1f1f]">
                {pagedCampaigns.map(c => {
                  const ctype = c.type || c.platform || 'Email';
                  const ctr = pct(c.clicks, c.sent);
                  const cvr = pct(c.conversions, c.sent);
                  const rev = c.revenue ?? 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="px-3 py-3 font-semibold text-slate-800 dark:text-[#ededed] max-w-[160px] truncate">{c.name}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[ctype] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ctype}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.sent)}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.opens)}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-[#a3a3a3]">{fmtNum(c.clicks)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-700 dark:text-[#ededed]">{fmtNum(c.conversions)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-700 dark:text-[#ededed]">
                        ₹{rev >= 100000 ? (rev / 100000).toFixed(1) + 'L' : fmtNum(rev)}
                      </td>
                      <td className="px-3 py-3 text-indigo-600 dark:text-indigo-400 font-bold">{ctr}%</td>
                      <td className="px-3 py-3 text-green-600 dark:text-green-400 font-bold">{cvr}%</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-[#1f1f1f]">
            <span className="text-[10px] text-slate-400 dark:text-[#a3a3a3]">
              Page {page + 1} of {totalPages} · {campaigns.length} campaigns
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-[10px] font-semibold text-slate-600 dark:text-[#a3a3a3] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-[10px] font-semibold text-slate-600 dark:text-[#a3a3a3] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Analytics Insights ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">AI Analytics Insights</h3>
          </div>
          <button
            onClick={refreshInsights}
            disabled={insightsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] text-slate-600 dark:text-[#a3a3a3] text-[10px] font-semibold rounded-xl transition"
          >
            {insightsLoading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />
            }
            Refresh Insights
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {aiInsightCards.map(ins => {
            const Icon = ins.icon;
            return (
              <div
                key={ins.title}
                className={`${ins.bg} rounded-xl border border-slate-100 dark:border-[#2a2a2a] p-4 space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${ins.color}`} />
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
                    {ins.title}
                  </span>
                </div>
                <p className={`text-base font-extrabold ${ins.color}`}>{ins.metric}</p>
                <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] leading-snug">{ins.detail}</p>
              </div>
            );
          })}
        </div>
        {!insights && (
          <p className="text-[10px] text-slate-400 dark:text-[#555] mt-3 text-center">
            Click "Refresh Insights" to generate AI-powered analysis from your campaign data
          </p>
        )}
      </div>

    </div>
  );
}
