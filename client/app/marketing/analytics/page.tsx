'use client';

import { useState } from 'react';
import {
  Download, TrendingUp, Users, DollarSign, BarChart3,
  Megaphone, Sparkles, ArrowUpRight, ChevronDown, Trophy,
  Target, Activity, Filter,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ComposedChart, Area, AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';

// ─── Mock data ───────────────────────────────────────────────

const kpis = [
  { label: 'Total Campaigns', value: '24', icon: Megaphone, color: 'text-violet-600 bg-violet-50' },
  { label: 'Leads Generated', value: '3,256', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Conversion Rate', value: '14.02%', icon: Target, color: 'text-green-600 bg-green-50' },
  { label: 'Total Spent', value: '₹1,45,600', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  { label: 'ROI', value: '214%', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
];

const aiInsights = [
  { title: 'Peak Performance Day', desc: 'Fridays generate 40% more leads than average.', action: 'Schedule Ads', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Channel Optimisation', desc: 'Facebook CPL decreased 8% this week.', action: 'View FB', color: 'border-blue-200 bg-blue-50/50' },
  { title: 'ROI Forecast', desc: 'Projected ROI for next month: 245% High confidence.', action: 'See Forecast', color: 'border-green-200 bg-green-50/50' },
];

const perfChartData = [
  { date: 'Jun 1', impressions: 18400, clicks: 3200, leads: 480, cost: 21000 },
  { date: 'Jun 2', impressions: 21200, clicks: 3800, leads: 520, cost: 24000 },
  { date: 'Jun 3', impressions: 19800, clicks: 3500, leads: 490, cost: 22500 },
  { date: 'Jun 4', impressions: 24600, clicks: 4100, leads: 580, cost: 26800 },
  { date: 'Jun 5', impressions: 22300, clicks: 3900, leads: 560, cost: 25200 },
  { date: 'Jun 6', impressions: 17800, clicks: 3100, leads: 440, cost: 20000 },
  { date: 'Jun 7', impressions: 25100, clicks: 4400, leads: 610, cost: 28500 },
];

const campaignPerfTable = [
  { name: 'Summer Sale 2024', impressions: 42300, clicks: 8200, leads: 312, cpl: '₹112', roi: 245, status: 'Active' },
  { name: 'Google Brand Awareness', impressions: 31200, clicks: 5800, leads: 198, cpl: '₹141', roi: 189, status: 'Active' },
  { name: 'Insta Story Leads', impressions: 24600, clicks: 4500, leads: 154, cpl: '₹120', roi: 210, status: 'Active' },
  { name: 'Website Retargeting', impressions: 18400, clicks: 2800, leads: 89, cpl: '₹247', roi: 98, status: 'Paused' },
  { name: 'LinkedIn B2B', impressions: 9100, clicks: 1500, leads: 67, cpl: '₹224', roi: 145, status: 'Active' },
];

const leadSourceData = [
  { name: 'Facebook', value: 45, color: '#4F46E5' },
  { name: 'Google', value: 25, color: '#2563EB' },
  { name: 'Instagram', value: 15, color: '#7C3AED' },
  { name: 'Website', value: 10, color: '#0891B2' },
  { name: 'Others', value: 5, color: '#64748B' },
];

const conversionFunnel = [
  { stage: 'Impressions', count: 125600, pct: 100, color: '#4F46E5' },
  { stage: 'Clicks', count: 24350, pct: 19.4, color: '#2563EB' },
  { stage: 'Leads', count: 3256, pct: 13.56, color: '#7C3AED' },
  { stage: 'Conversions', count: 456, pct: 14.02, color: '#16A34A' },
];

const roiData = [
  { date: 'Jun 1', cost: 21000, profit: 38000, roi: 181 },
  { date: 'Jun 2', cost: 24000, profit: 46000, roi: 192 },
  { date: 'Jun 3', cost: 22500, profit: 41000, roi: 182 },
  { date: 'Jun 4', cost: 26800, profit: 56000, roi: 209 },
  { date: 'Jun 5', cost: 25200, profit: 54000, roi: 214 },
  { date: 'Jun 6', cost: 20000, profit: 42000, roi: 210 },
  { date: 'Jun 7', cost: 28500, profit: 68000, roi: 239 },
];

const ageGroups = [
  { group: '18-24', pct: 22 }, { group: '25-34', pct: 38 },
  { group: '35-44', pct: 25 }, { group: '45-54', pct: 11 }, { group: '55+', pct: 4 },
];

const topLocations = [
  { city: 'Mumbai', pct: 28 }, { city: 'Bengaluru', pct: 22 },
  { city: 'Delhi NCR', pct: 18 }, { city: 'Hyderabad', pct: 15 }, { city: 'Pune', pct: 10 },
];

const topInterests = [
  { cat: 'Technology', pct: 42 }, { cat: 'Finance', pct: 35 },
  { cat: 'Real Estate', pct: 28 }, { cat: 'Education', pct: 22 }, { cat: 'Healthcare', pct: 18 },
];

const channelPerf = [
  { channel: 'Facebook', impressions: 52800, clicks: 10200, leads: 1465, cpl: '₹99', roi: 245, status: 'Active' },
  { channel: 'Google', impressions: 38400, clicks: 7100, leads: 814, cpl: '₹127', roi: 189, status: 'Active' },
  { channel: 'Instagram', impressions: 24600, clicks: 4500, leads: 488, cpl: '₹112', roi: 210, status: 'Active' },
  { channel: 'Website', impressions: 18400, clicks: 2800, leads: 326, cpl: '₹181', roi: 98, status: 'Low' },
  { channel: 'LinkedIn', impressions: 9100, clicks: 1500, leads: 163, cpl: '₹245', roi: 145, status: 'Active' },
];

const abTests = [
  { name: 'FB Creative Test', varA: 'Image Ad (ROI 210%)', varB: 'Video Ad (ROI 245%)', winner: 'B' },
  { name: 'CTA Button Test', varA: '"Learn More" (8.2% CTR)', varB: '"Get Quote" (11.4% CTR)', winner: 'B' },
  { name: 'Audience Test', varA: 'Broad (CPL ₹145)', varB: 'Lookalike (CPL ₹112)', winner: 'B' },
];

const qualityBreakdown = [
  { tier: 'High (80-100)', count: 1367, pct: 42, color: '#16A34A' },
  { tier: 'Medium (60-79)', count: 1237, pct: 38, color: '#2563EB' },
  { tier: 'Low (30-59)', count: 489, pct: 15, color: '#D97706' },
  { tier: 'Spam (0-29)', count: 163, pct: 5, color: '#DC2626' },
];

const trendData = [
  { day: 'Jun 1', leads: 480, conversions: 62, roi: 181 },
  { day: 'Jun 2', leads: 520, conversions: 71, roi: 192 },
  { day: 'Jun 3', leads: 490, conversions: 65, roi: 182 },
  { day: 'Jun 4', leads: 580, conversions: 82, roi: 209 },
  { day: 'Jun 5', leads: 560, conversions: 78, roi: 214 },
  { day: 'Jun 6', leads: 440, conversions: 58, roi: 210 },
  { day: 'Jun 7', leads: 610, conversions: 89, roi: 239 },
];

const alertItems = [
  { msg: 'Facebook budget 80% exhausted. Refill to maintain reach.', time: '5m ago', color: 'text-red-500 bg-red-50' },
  { msg: 'ROI crossed 200% milestone for Summer Sale.', time: '1h ago', color: 'text-green-500 bg-green-50' },
  { msg: 'New leads from Google up 15% this week.', time: '3h ago', color: 'text-blue-500 bg-blue-50' },
  { msg: 'LinkedIn CPL is 2× industry average. Review targeting.', time: '6h ago', color: 'text-amber-500 bg-amber-50' },
];

const aiRecommendations = [
  { title: 'Scale Facebook Budget', desc: 'ROI 245% — highest channel. Increase by ₹10,000/day.', action: 'Scale Up', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Fix Website Retargeting', desc: 'CPL ₹247 — 2× target. Narrow audience or pause.', action: 'Fix Now', color: 'border-red-200 bg-red-50/50' },
  { title: 'Launch A/B Test', desc: 'Test 2 ad creatives on Instagram to increase leads 25%.', action: 'Start Test', color: 'border-pink-200 bg-pink-50/50' },
  { title: 'Optimise for Mobile', desc: '78% of leads come from mobile. Create mobile-first ads.', action: 'Optimise', color: 'border-blue-200 bg-blue-50/50' },
  { title: 'Focus on 25-34 Age Group', desc: '38% of audience is 25-34 — highest converting segment.', action: 'Refine Target', color: 'border-green-200 bg-green-50/50' },
];

// ─── Sub-components ───────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Paused: 'bg-amber-100 text-amber-700',
    Low: 'bg-red-100 text-red-600',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

const DATE_TABS = ['Today', 'Week', 'Month', 'Custom'];

// ─── Main Page ────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateTab, setDateTab] = useState('Month');
  const [reportType, setReportType] = useState('');

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Deep insights into campaign performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            {DATE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setDateTab(tab)}
                className={`px-3 py-2 text-xs font-semibold transition ${
                  dateTab === tab ? 'bg-[#4F46E5] text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards + AI Insights ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-lg font-extrabold text-[#0F172A]">{k.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{k.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="text-[13px] font-bold text-[#0F172A]">AI Insights</h3>
          </div>
          <div className="space-y-2.5">
            {aiInsights.map((ins) => (
              <div key={ins.title} className={`p-3 rounded-xl border ${ins.color}`}>
                <p className="text-xs font-bold text-[#0F172A]">{ins.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ins.desc}</p>
                <button className="mt-1 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Campaign Performance Overview Chart ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Campaign Performance Overview (7 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={perfChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="impressions" stroke="#4F46E5" strokeWidth={2} dot={false} name="Impressions" />
            <Line type="monotone" dataKey="clicks" stroke="#2563EB" strokeWidth={2} dot={false} name="Clicks" />
            <Line type="monotone" dataKey="leads" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
            <Line type="monotone" dataKey="cost" stroke="#D97706" strokeWidth={2} dot={false} name="Cost" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Campaign Performance Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Campaign Performance Table</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {['Campaign', 'Impressions', 'Clicks', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {campaignPerfTable.map(c => (
              <tr key={c.name} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-semibold text-[#0F172A]">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{c.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-[#0F172A]">{c.leads}</td>
                <td className="px-4 py-3 text-slate-600">{c.cpl}</td>
                <td className="px-4 py-3">
                  <span className={`font-extrabold ${c.roi >= 200 ? 'text-green-600' : c.roi >= 150 ? 'text-blue-600' : 'text-red-500'}`}>{c.roi}%</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Leads Analytics + Conversion Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Leads Analytics</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="value" paddingAngle={3}>
                    {leadSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-sm font-extrabold text-[#0F172A]">3,256</p>
                <p className="text-[9px] text-slate-400">Total</p>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {leadSourceData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded-xl text-center">
            <p className="text-xs font-bold text-blue-700">Lead Quality Score: <span className="text-[#0F172A]">72% Good</span></p>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Conversion Analytics</h3>
          <div className="space-y-3">
            {conversionFunnel.map((stage) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#0F172A]">{stage.stage}</span>
                  <span className="font-bold text-[#0F172A]">{stage.count.toLocaleString()} <span className="text-slate-400 font-normal">({stage.pct}%)</span></span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${stage.pct}%`, background: stage.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <p className="text-xs font-bold text-green-700">Conversion Rate: <span className="text-[#0F172A]">14.02%</span> <span className="text-slate-500 font-normal">↑3.6% this month</span></p>
          </div>
        </div>
      </div>

      {/* ── ROI Analytics ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">ROI Analytics</h3>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'ROI', value: '214%', color: 'text-[#4F46E5]' },
              { label: 'Total Spent', value: '₹1,45,600', color: 'text-amber-600' },
              { label: 'Revenue', value: '₹4,57,600', color: 'text-blue-600' },
              { label: 'Profit', value: '₹3,12,000', color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            <Bar yAxisId="l" dataKey="profit" fill="#16A34A" opacity={0.7} radius={[3, 3, 0, 0]} name="Profit" />
            <Bar yAxisId="l" dataKey="cost" fill="#DC2626" opacity={0.5} radius={[3, 3, 0, 0]} name="Cost" />
            <Line yAxisId="r" type="monotone" dataKey="roi" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 3 }} name="ROI %" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-3 p-2.5 bg-indigo-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">AI Prediction</p>
            <p className="text-xs font-bold text-[#0F172A]">ROI Next Week: <span className="text-green-600">235%</span></p>
          </div>
          <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">High</span>
        </div>
      </div>

      {/* ── Audience Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Age Groups */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Age Group Distribution</h3>
          <div className="space-y-2.5">
            {ageGroups.map(a => (
              <div key={a.group}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{a.group}</span>
                  <span className="font-bold text-[#0F172A]">{a.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Top Locations</h3>
          <div className="space-y-2.5">
            {topLocations.map((l, i) => (
              <div key={l.city} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium text-slate-700">{l.city}</span>
                    <span className="font-bold text-[#0F172A]">{l.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${l.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Interests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Top Interests</h3>
          <div className="space-y-2.5">
            {topInterests.map(item => (
              <div key={item.cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{item.cat}</span>
                  <span className="font-bold text-[#0F172A]">{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Channel Performance Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Channel Performance</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {['Platform', 'Impressions', 'Clicks', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {channelPerf.map(c => (
              <tr key={c.channel} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-bold text-[#0F172A]">{c.channel}</td>
                <td className="px-4 py-3 text-slate-600">{c.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{c.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-[#0F172A]">{c.leads.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{c.cpl}</td>
                <td className="px-4 py-3">
                  <span className={`font-extrabold ${c.roi >= 200 ? 'text-green-600' : c.roi >= 150 ? 'text-blue-600' : 'text-red-500'}`}>{c.roi}%</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Trend Analysis ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="leads" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
            <Line type="monotone" dataKey="conversions" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} name="Conversions" />
            <Line type="monotone" dataKey="roi" stroke="#D97706" strokeWidth={2} dot={{ r: 2 }} name="ROI %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── A/B Test Analytics ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">A/B Test Analytics</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {['Test Name', 'Variant A', 'Variant B', 'Winner'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {abTests.map(t => (
              <tr key={t.name} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-semibold text-[#0F172A]">{t.name}</td>
                <td className="px-4 py-3 text-slate-600">{t.varA}</td>
                <td className="px-4 py-3 text-slate-600">{t.varB}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Trophy className="w-3.5 h-3.5" /> Variant {t.winner}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Lead Quality Analysis ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Lead Quality Analysis</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={qualityBreakdown} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="pct" paddingAngle={3}>
                  {qualityBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {qualityBreakdown.map(q => (
                <div key={q.tier} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                    <span className="text-slate-600">{q.tier}</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{q.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Analytics Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Custom Analytics Builder</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Report Type</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4F46E5]"
              >
                <option value="">Select report type...</option>
                <option>Campaign Performance</option>
                <option>Lead Analysis</option>
                <option>ROI Report</option>
                <option>Channel Comparison</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Select Metrics</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {['Impressions', 'Clicks', 'Leads', 'Conversions', 'CPL', 'ROI', 'Revenue'].map(m => (
                  <button key={m} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-[#4F46E5] hover:text-white transition">
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Dimension</label>
              <select className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#4F46E5]">
                <option>Campaign</option>
                <option>Platform</option>
                <option>Date</option>
                <option>Source</option>
              </select>
            </div>
            <button className="w-full py-2.5 bg-[#4F46E5] hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition shadow-sm">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerts + AI Recommendations ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Alerts & Notifications</h3>
          <div className="space-y-3">
            {alertItems.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-lg ${a.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Activity className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-700">{a.msg}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="text-[13px] font-bold text-[#0F172A]">AI Recommendations</h3>
          </div>
          <div className="space-y-2.5">
            {aiRecommendations.slice(0, 4).map((r) => (
              <div key={r.title} className={`p-3 rounded-xl border ${r.color}`}>
                <p className="text-xs font-bold text-[#0F172A]">{r.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                <button className="mt-1 text-[10px] font-bold text-[#4F46E5] hover:underline">{r.action} →</button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
