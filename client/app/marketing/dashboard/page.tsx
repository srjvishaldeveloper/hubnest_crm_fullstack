'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import {
  Megaphone, Users, TrendingUp, DollarSign, Bell, ArrowUpRight, ArrowDownRight,
  BarChart3, Target, Zap, FileText, Plus, AlertTriangle,
  CheckCircle2, Sparkles, ChevronRight, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart,
} from 'recharts';
import { motion } from 'framer-motion';

// ─── Mock data ───────────────────────────────────────────────

const kpis = [
  { title: 'Total Campaigns (Active)', value: '18', change: '+20%', up: true, icon: Megaphone, bg: 'bg-violet-100', iconColor: 'text-violet-600', borderColor: 'border-violet-200' },
  { title: 'Leads Generated (Month)', value: '1,256', change: '+25.6%', up: true, icon: Users, bg: 'bg-blue-100', iconColor: 'text-blue-600', borderColor: 'border-blue-200' },
  { title: 'Cost Spent', value: '₹1,45,600', change: '+12.4%', up: false, icon: DollarSign, bg: 'bg-amber-100', iconColor: 'text-amber-600', borderColor: 'border-amber-200' },
  { title: 'ROI', value: '214%', change: '+18.7%', up: true, icon: TrendingUp, bg: 'bg-green-100', iconColor: 'text-green-600', borderColor: 'border-green-200' },
];

const campaignTableData = [
  { name: 'Summer Sale 2024', platform: 'Facebook', budget: '₹35,000', leads: 312, cpl: '₹112', roi: 245, status: 'Active', top: true },
  { name: 'Google Brand Awareness', platform: 'Google', budget: '₹28,000', leads: 198, cpl: '₹141', roi: 189, status: 'Active', top: false },
  { name: 'Insta Story Leads', platform: 'Instagram', budget: '₹18,500', leads: 154, cpl: '₹120', roi: 210, status: 'Active', top: false },
  { name: 'Website Retargeting', platform: 'Website', budget: '₹22,000', leads: 89, cpl: '₹247', roi: 98, status: 'Paused', top: false },
  { name: 'LinkedIn B2B', platform: 'LinkedIn', budget: '₹15,000', leads: 67, cpl: '₹224', roi: 145, status: 'Active', top: false },
];

const leadSourceData = [
  { name: 'Facebook', value: 45, color: '#4F46E5' },
  { name: 'Google', value: 25, color: '#2563EB' },
  { name: 'Instagram', value: 15, color: '#7C3AED' },
  { name: 'Website', value: 10, color: '#0891B2' },
  { name: 'Others', value: 5, color: '#64748B' },
];

const roiChartData = [
  { week: 'W1', profit: 42000, cost: 28000, roi: 150 },
  { week: 'W2', profit: 68000, cost: 35000, roi: 194 },
  { week: 'W3', profit: 85000, cost: 40000, roi: 212 },
  { week: 'W4', profit: 117200, cost: 42600, roi: 275 },
];

const topPerformers = [
  { rank: 1, name: 'Summer Sale 2024', platform: 'Facebook', leads: 312, roi: 245 },
  { rank: 2, name: 'Insta Story Leads', platform: 'Instagram', leads: 154, roi: 210 },
  { rank: 3, name: 'Google Brand', platform: 'Google', leads: 198, roi: 189 },
];

const lowPerformers = [
  { name: 'Website Retargeting', platform: 'Website', leads: 89, roi: 98, status: 'Needs Attention' },
  { name: 'LinkedIn B2B', platform: 'LinkedIn', leads: 67, roi: 145, status: 'Below Target' },
  { name: 'Email Drip', platform: 'Email', leads: 42, roi: 88, status: 'Poor' },
];

const quickActions = [
  { label: 'Create Campaign', href: '/marketing/campaigns', icon: Plus, color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { label: 'View Leads', href: '/marketing/leads', icon: Users, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'View Analytics', href: '/marketing/analytics', icon: BarChart3, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { label: 'Manage Budget', href: '/marketing/campaigns', icon: DollarSign, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Add New Ad', href: '/marketing/campaigns', icon: Megaphone, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { label: 'Reports', href: '/marketing/analytics', icon: FileText, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
];

const perfChartData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  leads: Math.floor(30 + Math.random() * 60),
  cost: Math.floor(3000 + Math.random() * 4000),
}));

const alerts = [
  { icon: AlertTriangle, color: 'text-red-500 bg-red-50', title: 'Budget Alert', msg: 'Facebook campaign budget is 80% exhausted.', time: '5 min ago' },
  { icon: TrendingUp, color: 'text-green-500 bg-green-50', title: 'ROI Spike', msg: 'Summer Sale ROI jumped to 245% today.', time: '1 hr ago' },
  { icon: Users, color: 'text-blue-500 bg-blue-50', title: 'Leads Milestone', msg: 'Crossed 1,200 leads for the month.', time: '3 hrs ago' },
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Low Performance', msg: 'Website Retargeting ROI dropped below 100%.', time: '6 hrs ago' },
];

const aiInsights = [
  { title: 'Boost Facebook Budget', desc: 'Facebook leads are converting 2.3× better. Increasing budget by 15% could add 80+ leads.', action: 'Optimize Now', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Pause Underperformers', desc: 'Email Drip has ROI < 90%. Pausing it could save ₹8,200/month.', action: 'Take Action', color: 'border-amber-200 bg-amber-50/50' },
  { title: 'Instagram Opportunity', desc: 'Instagram Story Ads showing 30% higher engagement this week.', action: 'Scale Up', color: 'border-pink-200 bg-pink-50/50' },
  { title: 'Lead Quality Drop', desc: 'Lead quality score dipped 5% from last week. Review targeting settings.', action: 'Review Now', color: 'border-blue-200 bg-blue-50/50' },
];

const todaySummary = [
  { label: 'Leads Today', value: '48', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Cost Today', value: '₹4,850', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  { label: 'Conversions', value: '7', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { label: 'Revenue Today', value: '₹18,200', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
  { label: 'ROI Today', value: '275%', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
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
  const p = map[platform] ?? { label: platform.slice(0, 2), cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.cls}`}>{p.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Paused: 'bg-amber-100 text-amber-700',
    Draft: 'bg-slate-100 text-slate-600',
    Ended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function SectionHeader({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A]">{title}</h2>
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

// ─── Main Page ────────────────────────────────────────────────

export default function MarketingDashboard() {
  const user = useAuthStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 pb-4">

      {/* ── Section 1: Greeting Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-start gap-4"
      >
        {/* Greeting */}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {greeting}, {user?.name?.split(' ')[0] || 'Priya'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here&apos;s your marketing performance overview for today.</p>
        </div>

        {/* AI Insight Card */}
        <div className="lg:max-w-xs w-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-2xl p-4 shadow-md shadow-indigo-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-200">AI Insight</span>
          </div>
          <p className="text-sm font-medium leading-relaxed">Facebook leads converting 2.3× better today. Consider increasing budget by 15%.</p>
        </div>

        {/* Bell */}
        <div className="relative self-start">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full ring-1 ring-white" />
          </button>
        </div>
      </motion.div>

      {/* ── Section 2: KPI Cards ── */}
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
                <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full
                  ${k.up ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                  {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#0F172A]">{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{k.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Section 3: Campaign Performance Table + Leads Summary ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Campaign Table */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Campaign Performance" sub="Top 5 campaigns this month" link="/marketing/campaigns" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Campaign', 'Platform', 'Budget', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                    <th key={h} className="text-left py-2 pr-3 text-slate-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaignTableData.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[#0F172A] truncate max-w-[120px]">{row.name}</p>
                        {row.top && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Top</span>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><PlatformBadge platform={row.platform} /></td>
                    <td className="py-2.5 pr-3 text-slate-600">{row.budget}</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#0F172A]">{row.leads}</td>
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
                <p className="text-xl font-extrabold text-[#0F172A]">1,256</p>
                <p className="text-[10px] text-slate-400 font-medium">Total Leads</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-1">
            {leadSourceData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-bold text-[#0F172A]">{s.value}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between p-2.5 bg-green-50 rounded-xl">
            <div>
              <p className="text-[10px] text-green-600 font-bold">Best Source</p>
              <p className="text-xs font-extrabold text-[#0F172A]">Facebook</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">Quality Score</p>
              <p className="text-sm font-extrabold text-green-600">82% Good</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Cost & Budget + ROI Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cost & Budget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Cost & Budget Tracking" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Daily Spend', value: '₹4,850', color: 'text-amber-600' },
              { label: 'Monthly Budget', value: '₹2,50,000', color: 'text-blue-600' },
              { label: 'Remaining', value: '₹1,04,400', color: 'text-green-600' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-500">Budget Used</span>
            <span className="font-bold text-[#0F172A]">58.24%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full" style={{ width: '58.24%' }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">41.76% remaining — ₹1,04,400</p>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-xs text-green-700 font-semibold">Budget pacing is normal — on track for month-end.</p>
          </div>
        </div>

        {/* ROI Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="ROI Analytics" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-extrabold text-[#4F46E5]">214%</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold text-green-600">+18.7% vs last month</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div><p className="text-[10px] text-slate-500">Profit</p><p className="text-sm font-extrabold text-green-600">₹3,12,000</p></div>
              <div><p className="text-[10px] text-slate-500">Cost</p><p className="text-sm font-extrabold text-slate-700">₹1,45,600</p></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={roiChartData}>
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Line type="monotone" dataKey="roi" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="ROI %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-2.5 bg-indigo-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">AI Prediction</p>
              <p className="text-xs font-bold text-[#0F172A]">ROI Next Month: <span className="text-green-600">245%</span></p>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">High</span>
          </div>
        </div>
      </div>

      {/* ── Section 5: Top / Low Performing ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Top Performing Campaigns" sub="Ranked by ROI this month" />
          <div className="space-y-3">
            {topPerformers.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-green-50/50 transition">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {c.rank}
                </span>
                <PlatformBadge platform={c.platform} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-500">{c.leads} leads</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-green-600">{c.roi}%</p>
                  <p className="text-[10px] text-slate-400">ROI</p>
                </div>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(c.roi / 300) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Performers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SectionHeader title="Low Performing Campaigns" sub="Needs attention" />
          <div className="space-y-3">
            {lowPerformers.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-red-50/50 transition">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <PlatformBadge platform={c.platform} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">{c.name}</p>
                  <span className="text-[10px] font-bold text-red-600">{c.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-red-500">{c.roi}%</p>
                  <p className="text-[10px] text-slate-400">ROI</p>
                </div>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${(c.roi / 300) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 6: Quick Actions ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 transition text-center ${a.color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Section 7: Campaign Performance Chart ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Campaign Performance (30 Days)" sub="Daily leads vs cost" />
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={perfChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #E2E8F0' }} />
            <Bar yAxisId="left" dataKey="leads" fill="#4F46E5" opacity={0.85} radius={[3, 3, 0, 0]} name="Leads" />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={2} dot={false} name="Cost (₹)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Section 8: Alerts & Notifications ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Alerts & Notifications" />
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0F172A]">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.msg}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 9: AI Insights ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="AI Insights" sub="Smart recommendations for your campaigns" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                <p className="text-xs font-bold text-[#0F172A]">{ins.title}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ins.desc}</p>
              <button className="mt-3 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 10: Today's Summary ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SectionHeader title="Today's Summary" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {todaySummary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-lg font-extrabold text-[#0F172A]">{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
