'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, Megaphone, Users, DollarSign, TrendingUp, BarChart3,
  MoreVertical, Edit2, Pause, Copy, Trash2, AlertTriangle, ChevronDown,
  Sparkles, CheckCircle2, FileText, Settings, Zap, Target, Activity,
  ArrowUpRight, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Mock data ───────────────────────────────────────────────

const statsCards = [
  { label: 'Active Campaigns', value: '18', icon: Megaphone, color: 'text-violet-600 bg-violet-50' },
  { label: 'Leads Generated', value: '3,256', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Cost Spent', value: '₹1,45,600', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  { label: 'Avg CPL', value: '₹115', icon: Target, color: 'text-pink-600 bg-pink-50' },
  { label: 'ROI This Month', value: '214%', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
];

const campaigns = [
  { id: 1, name: 'Summer Sale 2024', type: 'Lead Gen', platform: 'Facebook', budget: '₹35,000', leads: 312, cpl: '₹112', roi: 245, status: 'Active', badge: 'top' },
  { id: 2, name: 'Google Brand Awareness', type: 'Awareness', platform: 'Google', budget: '₹28,000', leads: 198, cpl: '₹141', roi: 189, status: 'Active', badge: null },
  { id: 3, name: 'Insta Story Leads', type: 'Lead Gen', platform: 'Instagram', budget: '₹18,500', leads: 154, cpl: '₹120', roi: 210, status: 'Active', badge: null },
  { id: 4, name: 'Website Retargeting', type: 'Retargeting', platform: 'Website', budget: '₹22,000', leads: 89, cpl: '₹247', roi: 98, status: 'Paused', badge: 'low' },
  { id: 5, name: 'LinkedIn B2B', type: 'B2B', platform: 'LinkedIn', budget: '₹15,000', leads: 67, cpl: '₹224', roi: 145, status: 'Active', badge: null },
  { id: 6, name: 'Email Drip Q2', type: 'Email', platform: 'Email', budget: '₹8,000', leads: 42, cpl: '₹190', roi: 88, status: 'Active', badge: 'low' },
  { id: 7, name: 'YouTube Video Ads', type: 'Video', platform: 'YouTube', budget: '₹12,000', leads: 95, cpl: '₹126', roi: 175, status: 'Active', badge: null },
  { id: 8, name: 'Twitter Promo', type: 'Awareness', platform: 'Twitter', budget: '₹6,500', leads: 38, cpl: '₹171', roi: 120, status: 'Draft', badge: null },
];

const leadSourceData = [
  { name: 'Facebook', value: 45, color: '#4F46E5' },
  { name: 'Google', value: 25, color: '#2563EB' },
  { name: 'Instagram', value: 15, color: '#7C3AED' },
  { name: 'Website', value: 10, color: '#0891B2' },
  { name: 'Others', value: 5, color: '#64748B' },
];

const perfChartData = [
  { day: '1', leads: 42, cost: 4200 }, { day: '5', leads: 58, cost: 5100 },
  { day: '10', leads: 71, cost: 6800 }, { day: '15', leads: 63, cost: 5900 },
  { day: '20', leads: 89, cost: 7200 }, { day: '25', leads: 76, cost: 6500 },
  { day: '30', leads: 94, cost: 8100 },
];

const aiInsights = [
  { title: 'Scale Facebook', desc: 'Facebook ROI 245% — increase budget for 40+ extra leads.', action: 'Scale Up', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Pause Email Drip', desc: 'Email ROI 88% — below target. Pause to save ₹8K.', action: 'Pause Now', color: 'border-red-200 bg-red-50/50' },
  { title: 'A/B Test Instagram', desc: 'Test 2 creatives on Instagram to find top performer.', action: 'Create Test', color: 'border-pink-200 bg-pink-50/50' },
  { title: 'LinkedIn Opportunity', desc: 'B2B leads from LinkedIn have highest LTV. Increase budget.', action: 'Boost Budget', color: 'border-sky-200 bg-sky-50/50' },
  { title: 'Retargeting Fix', desc: 'Website retargeting CPL too high. Adjust audience segments.', action: 'Fix Now', color: 'border-amber-200 bg-amber-50/50' },
];

const alertItems = [
  { icon: AlertTriangle, color: 'text-red-500 bg-red-50', msg: 'Facebook budget 80% exhausted — add funds.', time: '5m ago' },
  { icon: TrendingUp, color: 'text-green-500 bg-green-50', msg: 'Summer Sale ROI hit 245% — best campaign.', time: '1h ago' },
  { icon: Users, color: 'text-blue-500 bg-blue-50', msg: 'Monthly leads target 80% achieved (1,005/1,256).', time: '3h ago' },
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', msg: 'Email Drip ROI below threshold (88%).', time: '5h ago' },
];

const topCampaigns = campaigns.filter(c => c.roi >= 189).slice(0, 3);
const lowCampaigns = campaigns.filter(c => c.roi < 150).slice(0, 3);

const featureCards = [
  { title: 'A/B Testing', desc: '3 active tests', icon: Activity, color: 'bg-violet-50 border-violet-100 text-violet-600' },
  { title: 'Automation', desc: '5 rules running', icon: Zap, color: 'bg-blue-50 border-blue-100 text-blue-600' },
  { title: 'Budget Manager', desc: '₹2.5L allocated', icon: DollarSign, color: 'bg-amber-50 border-amber-100 text-amber-600' },
  { title: 'Lead Management', desc: '3,256 leads total', icon: Users, color: 'bg-green-50 border-green-100 text-green-600' },
  { title: 'Reports', desc: 'Export anytime', icon: FileText, color: 'bg-pink-50 border-pink-100 text-pink-600' },
  { title: 'AI Optimiser', desc: 'Smart bidding on', icon: Sparkles, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
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
    YouTube: { label: 'YT', cls: 'bg-red-100 text-red-600' },
    Twitter: { label: 'TW', cls: 'bg-sky-100 text-sky-600' },
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

// ─── Main Page ────────────────────────────────────────────────

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Campaigns</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total: {campaigns.length} campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-52 focus-within:border-[#4F46E5] transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <Filter className="w-4 h-4 text-slate-500" />
          </button>
          <Link
            href="/marketing/campaigns"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#4F46E5] hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {statsCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-lg font-extrabold text-[#0F172A]">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Two-column: Campaign List + Right Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Campaign List */}
        <div className="xl:col-span-2 space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{c.name}</p>
                      {c.badge === 'top' && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Top Performer</span>}
                      {c.badge === 'low' && <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">Needs Attention</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <PlatformBadge platform={c.platform} />
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{c.type}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                </div>
                {/* 3-dot menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {menuOpen === c.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                        >
                          {[
                            { label: 'Edit', icon: Edit2, color: 'text-slate-700' },
                            { label: 'Pause', icon: Pause, color: 'text-amber-600' },
                            { label: 'Duplicate', icon: Copy, color: 'text-blue-600' },
                            { label: 'Delete', icon: Trash2, color: 'text-red-500' },
                          ].map(item => {
                            const Icon = item.icon;
                            return (
                              <button key={item.label} onClick={() => setMenuOpen(null)} className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 ${item.color}`}>
                                <Icon className="w-3.5 h-3.5" /> {item.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
                {[
                  { label: 'Budget', val: c.budget },
                  { label: 'Leads', val: c.leads },
                  { label: 'CPL', val: c.cpl },
                  { label: 'ROI', val: `${c.roi}%` },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={`text-sm font-extrabold ${item.label === 'ROI' ? (c.roi >= 180 ? 'text-green-600' : c.roi >= 130 ? 'text-blue-600' : 'text-red-500') : 'text-[#0F172A]'}`}>
                      {item.val}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {visibleCount < campaigns.length && (
            <button
              onClick={() => setVisibleCount(v => v + 3)}
              className="w-full py-2.5 text-xs font-semibold text-[#4F46E5] bg-white border border-[#4F46E5]/30 rounded-xl hover:bg-violet-50 transition"
            >
              Load More ({campaigns.length - visibleCount} remaining)
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create Campaign', icon: Plus, color: 'text-violet-600 bg-violet-50' },
                { label: 'View Leads', icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: 'A/B Testing', icon: Activity, color: 'text-pink-600 bg-pink-50' },
                { label: 'Automation', icon: Zap, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Budget Manager', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
                { label: 'Reports', icon: FileText, color: 'text-green-600 bg-green-50' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-left">
                    <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-[13px] font-bold text-[#0F172A]">AI Insights</h3>
            </div>
            <div className="space-y-3">
              {aiInsights.slice(0, 3).map((ins) => (
                <div key={ins.title} className={`p-3 rounded-xl border ${ins.color}`}>
                  <p className="text-xs font-bold text-[#0F172A]">{ins.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ins.desc}</p>
                  <button className="mt-1.5 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Alerts</h3>
            <div className="space-y-2.5">
              {alertItems.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-lg ${a.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-700">{a.msg}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Sections ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Leads Summary */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Leads Summary</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" paddingAngle={3}>
                    {leadSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-base font-extrabold text-[#0F172A]">3,256</p>
                <p className="text-[9px] text-slate-400">Total</p>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {leadSourceData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 p-2 bg-violet-50 rounded-xl text-center">
            <p className="text-xs font-bold text-violet-700">Lead Quality Score: <span className="text-[#4F46E5]">82% Good</span></p>
          </div>
        </div>

        {/* Cost & Budget */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Cost & Budget Overview</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Spent', value: '₹1,45,600', pct: '58.24%', color: 'text-amber-600' },
              { label: 'Total Budget', value: '₹2,50,000', pct: '100%', color: 'text-blue-600' },
              { label: 'Remaining', value: '₹1,04,400', pct: '41.76%', color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-400">{item.label}</p>
                <p className="text-[10px] font-bold text-slate-600 mt-0.5">{item.pct}</p>
              </div>
            ))}
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full" style={{ width: '58.24%' }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Daily spend trend (last 7 days)</p>
          <ResponsiveContainer width="100%" height={60}>
            <ComposedChart data={perfChartData.slice(-7)}>
              <Bar dataKey="cost" fill="#4F46E5" opacity={0.7} radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top + Low Performing */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Top Performing</h3>
          <div className="space-y-2.5">
            {topCampaigns.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 bg-green-50/50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <PlatformBadge platform={c.platform} />
                <p className="flex-1 text-xs font-semibold text-[#0F172A] truncate">{c.name}</p>
                <span className="text-xs font-extrabold text-green-600">{c.roi}% ROI</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Low Performing</h3>
          <div className="space-y-2.5">
            {lowCampaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <PlatformBadge platform={c.platform} />
                <p className="flex-1 text-xs font-semibold text-[#0F172A] truncate">{c.name}</p>
                <span className="text-xs font-extrabold text-red-500">{c.roi}% ROI</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Campaign Performance Chart</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={perfChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            <Bar yAxisId="l" dataKey="leads" fill="#4F46E5" opacity={0.85} radius={[3, 3, 0, 0]} name="Leads" />
            <Line yAxisId="r" type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={2} dot={false} name="Cost" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Campaign Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {featureCards.map((f) => {
            const Icon = f.icon;
            return (
              <button key={f.title} className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${f.color} transition hover:shadow-sm`}>
                <Icon className="w-5 h-5" />
                <p className="text-xs font-bold">{f.title}</p>
                <p className="text-[10px] text-slate-500">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-[13px] font-bold text-[#0F172A]">AI Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
              <p className="text-xs font-bold text-[#0F172A]">{ins.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ins.desc}</p>
              <button className="mt-2 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
