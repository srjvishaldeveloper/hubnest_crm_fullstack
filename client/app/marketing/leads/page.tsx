'use client';

import { useState } from 'react';
import {
  Search, Filter, Download, Users, TrendingUp, CheckCircle2,
  MoreVertical, Mail, Phone, Star, Sparkles, AlertTriangle,
  ChevronDown, ArrowUpRight, UserPlus, Upload, FileText,
  BarChart3, ChevronRight, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Mock data ───────────────────────────────────────────────

const statsCards = [
  { label: 'Total Leads', value: '3,256', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'New Today', value: '48', icon: UserPlus, color: 'text-violet-600 bg-violet-50' },
  { label: 'Converted', value: '456', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { label: 'Conversion Rate', value: '14.02%', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Avg Quality', value: '72%', icon: Star, color: 'text-amber-600 bg-amber-50' },
];

const leadsData = [
  { id: 1, name: 'Arjun Mehta', email: 'arjun@example.com', phone: '+91 98765 43210', source: 'Facebook', campaign: 'Summer Sale', platform: 'Facebook', date: '2024-06-01', status: 'New', quality: 88 },
  { id: 2, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109', source: 'Google', campaign: 'Brand Awareness', platform: 'Google', date: '2024-06-01', status: 'Qualified', quality: 92 },
  { id: 3, name: 'Rahul Singh', email: 'rahul@example.com', phone: '+91 76543 21098', source: 'Instagram', campaign: 'Insta Story', platform: 'Instagram', date: '2024-05-31', status: 'Converted', quality: 95 },
  { id: 4, name: 'Kavitha Nair', email: 'kavitha@example.com', phone: '+91 65432 10987', source: 'Website', campaign: 'Retargeting', platform: 'Website', date: '2024-05-31', status: 'Not Interested', quality: 35 },
  { id: 5, name: 'Mohammed Ali', email: 'mali@example.com', phone: '+91 54321 09876', source: 'Facebook', campaign: 'Summer Sale', platform: 'Facebook', date: '2024-05-30', status: 'Follow-up', quality: 75 },
  { id: 6, name: 'Deepa Krishnan', email: 'deepa@example.com', phone: '+91 43210 98765', source: 'LinkedIn', campaign: 'B2B Leads', platform: 'LinkedIn', date: '2024-05-30', status: 'New', quality: 82 },
  { id: 7, name: 'Sanjay Patel', email: 'sanjay@example.com', phone: '+91 32109 87654', source: 'Google', campaign: 'Brand Awareness', platform: 'Google', date: '2024-05-29', status: 'Qualified', quality: 78 },
  { id: 8, name: 'Anitha Reddy', email: 'anitha@example.com', phone: '+91 21098 76543', source: 'Instagram', campaign: 'Insta Story', platform: 'Instagram', date: '2024-05-29', status: 'Spam', quality: 10 },
  { id: 9, name: 'Vikram Nambiar', email: 'vikram@example.com', phone: '+91 10987 65432', source: 'Facebook', campaign: 'Summer Sale', platform: 'Facebook', date: '2024-05-28', status: 'Converted', quality: 90 },
  { id: 10, name: 'Shreya Joshi', email: 'shreya@example.com', phone: '+91 09876 54321', source: 'Website', campaign: 'SEO Landing', platform: 'Website', date: '2024-05-28', status: 'New', quality: 68 },
];

const qualityData = [
  { name: 'High', value: 42, color: '#16A34A' },
  { name: 'Medium', value: 38, color: '#2563EB' },
  { name: 'Low', value: 15, color: '#D97706' },
  { name: 'Spam', value: 5, color: '#DC2626' },
];

const sourceData = [
  { name: 'Facebook', value: 45, leads: 1465, color: '#4F46E5' },
  { name: 'Google', value: 25, leads: 814, color: '#2563EB' },
  { name: 'Instagram', value: 15, leads: 488, color: '#7C3AED' },
  { name: 'Website', value: 10, leads: 326, color: '#0891B2' },
  { name: 'Others', value: 5, leads: 163, color: '#64748B' },
];

const conversionFunnel = [
  { stage: 'Impressions', count: 125600, pct: 100 },
  { stage: 'Clicks', count: 24350, pct: 19.4 },
  { stage: 'Leads', count: 3256, pct: 13.56 },
  { stage: 'Conversions', count: 456, pct: 14.02 },
];

const leadStatusData = [
  { name: 'New', value: 30, color: '#4F46E5' },
  { name: 'Qualified', value: 25, color: '#2563EB' },
  { name: 'Follow-up', value: 20, color: '#D97706' },
  { name: 'Converted', value: 14, color: '#16A34A' },
  { name: 'Not Interested', value: 8, color: '#DC2626' },
  { name: 'Spam', value: 3, color: '#64748B' },
];

const trendData = [
  { day: 'Mon', leads: 38 }, { day: 'Tue', leads: 52 }, { day: 'Wed', leads: 45 },
  { day: 'Thu', leads: 61 }, { day: 'Fri', leads: 78 }, { day: 'Sat', leads: 34 }, { day: 'Sun', leads: 28 },
];

const topCampaignsForLeads = [
  { name: 'Summer Sale 2024', platform: 'Facebook', leads: 312, quality: 88 },
  { name: 'Google Brand Awareness', platform: 'Google', leads: 198, quality: 76 },
  { name: 'Insta Story Leads', platform: 'Instagram', leads: 154, quality: 82 },
];

const aiInsights = [
  { title: 'High-Value Leads Waiting', desc: '87 high-quality leads not contacted in 48h. Assign now.', action: 'Assign Leads', color: 'border-violet-200 bg-violet-50/50' },
  { title: 'Facebook Lead Quality', desc: 'Facebook leads have 88% quality score — highest source.', action: 'Scale FB', color: 'border-blue-200 bg-blue-50/50' },
  { title: 'Spam Filter', desc: '163 leads flagged as spam. Review to improve accuracy.', action: 'Review', color: 'border-red-200 bg-red-50/50' },
  { title: 'Conversion Tip', desc: 'Leads contacted within 1h convert 7× more. Speed up follow-up.', action: 'Set Alert', color: 'border-green-200 bg-green-50/50' },
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
    New: 'bg-blue-100 text-blue-700',
    Qualified: 'bg-violet-100 text-violet-700',
    Converted: 'bg-green-100 text-green-700',
    'Follow-up': 'bg-amber-100 text-amber-700',
    'Not Interested': 'bg-red-100 text-red-700',
    Spam: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function QualityBadge({ score }: { score: number }) {
  const level = score >= 80 ? { label: 'High', cls: 'text-green-700 bg-green-50' }
    : score >= 60 ? { label: 'Medium', cls: 'text-blue-700 bg-blue-50' }
    : score >= 30 ? { label: 'Low', cls: 'text-amber-700 bg-amber-50' }
    : { label: 'Spam', cls: 'text-red-700 bg-red-50' };
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-extrabold text-[#0F172A]">{score}</span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${level.cls}`}>{level.label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const filtered = leadsData.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase())
      || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total: 3,256 leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-48 focus-within:border-[#4F46E5] transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <Filter className="w-4 h-4 text-slate-500" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── Two-column: Leads List + Right Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leads Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 flex-wrap">
            {['All Status', 'New', 'Qualified', 'Follow-up', 'Converted', 'Not Interested'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${
                  statusFilter === s
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['Lead', 'Source/Campaign', 'Platform', 'Date', 'Status', 'Quality', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {l.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F172A]">{l.name}</p>
                          <p className="text-[10px] text-slate-400">{l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0F172A]">{l.source}</p>
                      <p className="text-[10px] text-slate-400">{l.campaign}</p>
                    </td>
                    <td className="px-4 py-3"><PlatformBadge platform={l.platform} /></td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{l.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3"><QualityBadge score={l.quality} /></td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 transition"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <AnimatePresence>
                          {menuOpen === l.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-6 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                              >
                                {['View Details', 'Edit Lead', 'Assign To', 'Mark Converted', 'Delete'].map(a => (
                                  <button key={a} onClick={() => setMenuOpen(null)} className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">
                                    {a}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Quality Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Lead Quality Overview</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={qualityData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={3}>
                      {qualityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm font-extrabold text-[#0F172A]">72%</p>
                  <p className="text-[9px] text-slate-400">Avg Score</p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {qualityData.map(q => (
                  <div key={q.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                      <span className="text-slate-600">{q.name}</span>
                    </div>
                    <span className="font-bold text-[#0F172A]">{q.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-50 rounded-xl text-center">
              <p className="text-xs font-bold text-green-700">High Quality Leads: <span className="text-[#0F172A]">1,367</span></p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Assign Leads', icon: UserPlus, color: 'text-violet-600 bg-violet-50' },
                { label: 'Bulk Assign', icon: Layers, color: 'text-blue-600 bg-blue-50' },
                { label: 'Import Leads', icon: Upload, color: 'text-green-600 bg-green-50' },
                { label: 'Export Leads', icon: Download, color: 'text-amber-600 bg-amber-50' },
                { label: 'Create Segment', icon: Filter, color: 'text-pink-600 bg-pink-50' },
                { label: 'Lead Reports', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
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

          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-[13px] font-bold text-[#0F172A]">AI Insights</h3>
            </div>
            <div className="space-y-2.5">
              {aiInsights.slice(0, 3).map((ins) => (
                <div key={ins.title} className={`p-3 rounded-xl border ${ins.color}`}>
                  <p className="text-xs font-bold text-[#0F172A]">{ins.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ins.desc}</p>
                  <button className="mt-1.5 text-[10px] font-bold text-[#4F46E5] hover:underline">{ins.action} →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Sections ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Leads by Source</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="value" paddingAngle={3}>
                  {sourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#0F172A]">{s.leads}</span>
                    <span className="text-slate-400 ml-1">({s.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Tracking */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Conversion Tracking</h3>
          <div className="space-y-3">
            {conversionFunnel.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#0F172A]">{stage.stage}</span>
                  <div className="text-right">
                    <span className="font-bold text-[#0F172A]">{stage.count.toLocaleString()}</span>
                    <span className="text-slate-400 ml-1">({stage.pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stage.pct}%`,
                      background: ['#4F46E5', '#2563EB', '#7C3AED', '#16A34A'][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <p className="text-xs font-bold text-green-700">Conversion Rate: 14.02% <span className="text-slate-500 font-normal">↑3.6% this month</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lead Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Lead Status Overview</h3>
          <div className="flex justify-center mb-3">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={2}>
                  {leadStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {leadStatusData.map(s => (
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

        {/* Top Campaigns */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Top Lead Campaigns</h3>
          <div className="space-y-3">
            {topCampaignsForLeads.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.platform} · Quality {c.quality}%</p>
                </div>
                <span className="text-xs font-extrabold text-[#4F46E5]">{c.leads}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leads Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Leads Trend (7 days)</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Line type="monotone" dataKey="leads" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 3 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
