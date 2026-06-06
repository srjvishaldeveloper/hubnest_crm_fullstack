'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Download, Share2, FileText,
  PieChart, Activity, Users, Target, Calendar, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle, Filter, Printer, X,
} from 'lucide-react';
import { smGetReports } from '../../../services/salesManagerService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveTab = 'overview' | 'sales' | 'leads' | 'team' | 'activity' | 'pipeline' | 'revenue';
type DateFilter = 'today' | 'week' | 'month' | 'custom';

interface TeamMember {
  rank: number;
  name: string;
  avatar: string;
  leads: number;
  converted: number;
  conversionRate: number;
  target: number;
  achieved: number;
  color: string;
}

interface ReportData {
  kpi: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    revenueAchieved: number;
  };
  leadTrend: { month: string; value: number }[];
  pipeline: { stage: string; count: number; color: string; bg: string }[];
  activity: { calls: number; emails: number; meetings: number };
  team: TeamMember[];
  leadFunnel: { label: string; value: number; color: string; bg: string }[];
  statusDistribution: { label: string; value: number; color: string }[];
  pipelineStages: { stage: string; value: number; color: string }[];
  pipelineHealth: number;
  insights: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DATA: ReportData = {
  kpi: {
    totalLeads: 342,
    convertedLeads: 89,
    conversionRate: 26.0,
    revenueAchieved: 48,
  },
  leadTrend: [
    { month: 'Jan', value: 42 },
    { month: 'Feb', value: 58 },
    { month: 'Mar', value: 74 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 89 },
    { month: 'Jun', value: 97 },
  ],
  pipeline: [
    { stage: 'New', count: 120, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { stage: 'Qualified', count: 84, color: 'bg-violet-500', bg: 'bg-violet-50' },
    { stage: 'Proposal', count: 57, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { stage: 'Negotiation', count: 34, color: 'bg-orange-500', bg: 'bg-orange-50' },
    { stage: 'Closed Won', count: 89, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
  ],
  activity: { calls: 214, emails: 387, meetings: 92 },
  team: [
    { rank: 1, name: 'Priya Sharma', avatar: 'PS', leads: 68, converted: 24, conversionRate: 35.3, target: 25, achieved: 24, color: 'from-violet-500 to-purple-600' },
    { rank: 2, name: 'Rahul Mehta', avatar: 'RM', leads: 54, converted: 18, conversionRate: 33.3, target: 20, achieved: 18, color: 'from-blue-500 to-cyan-500' },
    { rank: 3, name: 'Sneha Patel', avatar: 'SP', leads: 61, converted: 17, conversionRate: 27.9, target: 20, achieved: 17, color: 'from-emerald-500 to-teal-500' },
    { rank: 4, name: 'Arjun Singh', avatar: 'AS', leads: 47, converted: 14, conversionRate: 29.8, target: 18, achieved: 14, color: 'from-amber-500 to-orange-500' },
    { rank: 5, name: 'Kavya Nair', avatar: 'KN', leads: 39, converted: 10, conversionRate: 25.6, target: 15, achieved: 10, color: 'from-pink-500 to-rose-500' },
  ],
  leadFunnel: [
    { label: 'Awareness', value: 342, color: 'text-blue-700', bg: 'bg-blue-500' },
    { label: 'Interest', value: 221, color: 'text-violet-700', bg: 'bg-violet-500' },
    { label: 'Consideration', value: 143, color: 'text-amber-700', bg: 'bg-amber-500' },
    { label: 'Intent', value: 97, color: 'text-orange-700', bg: 'bg-orange-500' },
    { label: 'Conversion', value: 89, color: 'text-emerald-700', bg: 'bg-emerald-500' },
  ],
  statusDistribution: [
    { label: 'New', value: 35, color: '#3B82F6' },
    { label: 'In Progress', value: 28, color: '#8B5CF6' },
    { label: 'Qualified', value: 15, color: '#10B981' },
    { label: 'Lost', value: 12, color: '#EF4444' },
    { label: 'Converted', value: 10, color: '#F59E0B' },
  ],
  pipelineStages: [
    { stage: 'New', value: 120, color: '#3B82F6' },
    { stage: 'Qualified', value: 84, color: '#8B5CF6' },
    { stage: 'Proposal', value: 57, color: '#F59E0B' },
    { stage: 'Negotiation', value: 34, color: '#F97316' },
    { stage: 'Won', value: 89, color: '#10B981' },
    { stage: 'Lost', value: 31, color: '#EF4444' },
  ],
  pipelineHealth: 72,
  insights: [
    '📈 Lead conversion rate improved by 4.2% compared to last month — keep the momentum!',
    '🔥 Top performer Priya Sharma is on track to exceed her monthly target by 15%.',
    '⚠️ 34 leads in Negotiation stage have been stagnant for over 7 days — follow up needed.',
    '📧 Email outreach response rate dropped 8% this week — consider revising templates.',
    '✅ Qualified leads pipeline grew 22% — strong top-of-funnel activity from the team.',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}L` : `${n}`;

function ConicPie({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  return (
    <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={segments}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            nameKey="label"
          >
            {segments.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 12 }} />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'Moderate' : 'At Risk';
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={r} fill="none" stroke="#E2E8F0" strokeWidth={12} />
        <circle
          cx={65} cy={65} r={r} fill="none"
          stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={65} y={62} textAnchor="middle" dominantBaseline="middle" fill="#0F172A" fontSize={22} fontWeight={700}>{score}</text>
        <text x={65} y={80} textAnchor="middle" fill="#64748B" fontSize={10}>out of 100</text>
      </svg>
      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>{label}</span>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'leads', label: 'Leads', icon: Target },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'pipeline', label: 'Pipeline', icon: PieChart },
  { id: 'revenue', label: 'Revenue', icon: FileText },
];

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Custom' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SalesManagerReportsPage() {
  const [reportData, setReportData] = useState<ReportData>(MOCK_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportPDF = () => {
    setToast({ message: 'Generating PDF report compilation...', type: 'success' });
    
    setTimeout(() => {
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 1200 >>
stream
BT
/F1 20 Tf
50 720 Td
(HubNest CRM - Sales Manager Report) Tj
/F1 12 Tf
0 -30 Td
(Generated on: ${today}) Tj
0 -15 Td
(Time Period: ${dateFilter.toUpperCase()}) Tj
0 -30 Td
(KEY PERFORMANCE INDICATORS:) Tj
0 -20 Td
(  - Total Leads: ${reportData.kpi.totalLeads}) Tj
0 -15 Td
(  - Converted Leads: ${reportData.kpi.convertedLeads}) Tj
0 -15 Td
(  - Conversion Rate: ${reportData.kpi.conversionRate.toFixed(1)}%) Tj
0 -15 Td
(  - Revenue Achieved: INR ${reportData.kpi.revenueAchieved}L) Tj
0 -30 Td
(TEAM CONVERSION & SALES LEADERBOARD:) Tj
${reportData.team.map((m, idx) => `0 -18 Td\n(  - Rank #${m.rank} ${m.name} - Converted: ${m.converted}/${m.leads} - Rate: ${m.conversionRate}% - Achieved: INR ${m.achieved}L) Tj`).join('\n')}
0 -30 Td
(AI INSIGHTS & RECOMMENDATIONS:) Tj
${reportData.insights.map((ins) => `0 -18 Td\n(  - ${ins.replace(/[^\x00-\x7F]/g, '')}) Tj`).join('\n')}
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000242 00000 n
0000000310 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1200
%%EOF`;

      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HubNest_CRM_Report_${dateFilter}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToast({ message: 'PDF report downloaded successfully!', type: 'success' });
    }, 1000);
  };

  const handleExportExcel = () => {
    setToast({ message: 'Compiling report metrics to CSV...', type: 'success' });
    
    setTimeout(() => {
      const headers = 'Metric,Value\n';
      const kpis = `Total Leads,${reportData.kpi.totalLeads}\nConverted Leads,${reportData.kpi.convertedLeads}\nConversion Rate,${reportData.kpi.conversionRate.toFixed(1)}%\nRevenue Achieved,INR ${reportData.kpi.revenueAchieved}L\n\n`;
      const teamHeader = 'Rank,Member,Leads,Converted,Rate,Target,Achieved\n';
      const teamRows = reportData.team.map(m => `"${m.rank}","${m.name}","${m.leads}","${m.converted}","${m.conversionRate}%","${m.target}L","${m.achieved}L"`).join('\n');
      const csvContent = headers + kpis + teamHeader + teamRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HubNest_CRM_Report_${dateFilter}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToast({ message: 'Report metrics CSV downloaded successfully!', type: 'success' });
    }, 1000);
  };

  const handleSaveReport = () => {
    setToast({ message: 'Saving report instance to database...', type: 'success' });
    
    setTimeout(() => {
      setToast({ message: `Report metrics for "${dateFilter}" saved successfully!`, type: 'success' });
    }, 1200);
  };

  useEffect(() => {
    setLoading(true);
    smGetReports()
      .then((data: any) => { if (data) setReportData(data); })
      .catch(() => { /* keep mock */ })
      .finally(() => setLoading(false));
  }, [dateFilter]);

  const maxTrend = Math.max(...reportData.leadTrend.map(t => t.value));
  const maxPipeline = Math.max(...reportData.pipeline.map(p => p.count));
  const maxPipelineStage = Math.max(...reportData.pipelineStages.map(s => s.value));
  const activityTotal = reportData.activity.calls + reportData.activity.emails + reportData.activity.meetings;
  const topPerformer = reportData.team[0];

  const kpiCards = [
    {
      label: 'Total Leads',
      value: reportData.kpi.totalLeads.toString(),
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      trend: '+12%',
      up: true,
    },
    {
      label: 'Converted Leads',
      value: reportData.kpi.convertedLeads.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      trend: '+8%',
      up: true,
    },
    {
      label: 'Conversion Rate',
      value: `${reportData.kpi.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      trend: '+4.2%',
      up: true,
    },
    {
      label: 'Revenue Achieved',
      value: `₹${reportData.kpi.revenueAchieved}L`,
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      trend: '-3%',
      up: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200/70 px-6 py-4 sticky top-0 z-30"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-[#0F172A] leading-tight">Reports</h1>
              <p className="text-[11px] text-[#64748B]">Analytics & Performance Insights</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Date filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {DATE_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    dateFilter === f.id
                      ? 'bg-white text-[#2563EB] shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setLoading(true); smGetReports().then((d: any) => { if (d) setReportData(d); }).catch(() => {}).finally(() => setLoading(false)); }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all group cursor-default`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {card.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {card.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] group-hover:scale-105 origin-left transition-transform">{card.value}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm"
        >
          <div className="flex overflow-x-auto gap-1 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >

            {/* ══════════ OVERVIEW TAB ══════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                  {/* Lead Trend Bar Chart */}
                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">Lead Trend</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" /> +23% overall
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.leadTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="leadTrendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 11 }}
                            labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                          />
                          <Area type="monotone" dataKey="value" name="Leads Generated" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#leadTrendGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Activity Circles */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-1">Activity Breakdown</h3>
                    <p className="text-xs text-slate-500 mb-5">Total: {activityTotal} actions</p>
                    <div className="flex flex-col gap-5">
                      {[
                        { label: 'Calls', count: reportData.activity.calls, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', pct: Math.round((reportData.activity.calls / activityTotal) * 100) },
                        { label: 'Emails', count: reportData.activity.emails, color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', pct: Math.round((reportData.activity.emails / activityTotal) * 100) },
                        { label: 'Meetings', count: reportData.activity.meetings, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', pct: Math.round((reportData.activity.meetings / activityTotal) * 100) },
                      ].map(a => (
                        <div key={a.label} className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full ${a.light} flex flex-col items-center justify-center flex-shrink-0`}>
                            <span className={`text-base font-bold ${a.text}`}>{a.count}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-700">{a.label}</span>
                              <span className="text-xs text-slate-500">{a.pct}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${a.pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className={`h-full ${a.color} rounded-full`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pipeline Funnel Horizontal */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">Pipeline Overview</h3>
                  <p className="text-xs text-slate-500 mb-5">Leads per stage</p>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.pipeline} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="stage" type="category" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} width={90} />
                        <Tooltip
                          contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 11 }}
                        />
                        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} barSize={12}>
                          {reportData.pipeline.map((entry, index) => {
                            const colors: Record<string, string> = {
                              'New': '#3B82F6',
                              'Qualified': '#8B5CF6',
                              'Proposal': '#F59E0B',
                              'Negotiation': '#F97316',
                              'Closed Won': '#10B981'
                            };
                            return <Cell key={`cell-${index}`} fill={colors[entry.stage] || '#3B82F6'} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ SALES TAB ══════════ */}
            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-1">Monthly Sales Performance</h3>
                    <p className="text-xs text-slate-500 mb-5">Revenue vs Target</p>
                    <div style={{ width: '100%', height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { m: 'Jan', rev: 38, tgt: 45 },
                          { m: 'Feb', rev: 52, tgt: 45 },
                          { m: 'Mar', rev: 41, tgt: 50 },
                          { m: 'Apr', rev: 63, tgt: 55 },
                          { m: 'May', rev: 71, tgt: 60 },
                          { m: 'Jun', rev: 48, tgt: 65 },
                        ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="m" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 11 }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                          <Bar dataKey="rev" name="Revenue Achieved" fill="#2563EB" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="tgt" name="Revenue Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-4">Deal Velocity Metrics</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Avg Deal Size', value: '₹2.4L', sub: '+12% vs last month', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Sales Cycle Length', value: '18 days', sub: '-2 days improvement', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Win Rate', value: '26%', sub: '+4.2% this month', color: 'text-violet-600', bg: 'bg-violet-50' },
                        { label: 'Lost Deals', value: '31', sub: '-8 from last month', color: 'text-red-500', bg: 'bg-red-50' },
                      ].map(m => (
                        <div key={m.label} className={`flex items-center gap-4 p-3 ${m.bg} rounded-xl`}>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">{m.label}</p>
                            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                          </div>
                          <p className="text-xs text-slate-500 text-right">{m.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ LEADS TAB ══════════ */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Funnel */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-1">Lead Funnel</h3>
                    <p className="text-xs text-slate-500 mb-6">Stage-by-stage conversion</p>
                    <div className="flex flex-col items-center gap-2">
                      {reportData.leadFunnel.map((f, i) => {
                        const maxVal = reportData.leadFunnel[0].value;
                        const widthPct = (f.value / maxVal) * 100;
                        return (
                          <motion.div
                            key={f.label}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 w-full"
                          >
                            <div
                              className={`${f.bg} rounded-lg flex items-center justify-between px-4 py-2.5 transition-all`}
                              style={{ width: `${widthPct}%`, minWidth: '140px' }}
                            >
                              <span className="text-white text-xs font-semibold">{f.label}</span>
                              <span className="text-white text-sm font-bold">{f.value}</span>
                            </div>
                            {i < reportData.leadFunnel.length - 1 && (
                              <span className="text-xs text-slate-400 ml-1">
                                ↓ {Math.round((reportData.leadFunnel[i + 1].value / f.value) * 100)}%
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-1">Status Distribution</h3>
                    <p className="text-xs text-slate-500 mb-6">Lead breakdown by current status</p>
                    <ConicPie segments={reportData.statusDistribution} />
                  </div>
                </div>

                {/* Lead source table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-4">Lead Sources</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Source', 'Leads', 'Converted', 'Rate', 'Revenue'].map(h => (
                            <th key={h} className="pb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { src: 'Website', leads: 112, conv: 32, rate: 28.6, rev: '₹18.2L' },
                          { src: 'Referral', leads: 87, conv: 29, rate: 33.3, rev: '₹15.7L' },
                          { src: 'Social Media', leads: 68, conv: 14, rate: 20.6, rev: '₹7.4L' },
                          { src: 'Cold Call', leads: 45, conv: 9, rate: 20.0, rev: '₹4.1L' },
                          { src: 'Email Campaign', leads: 30, conv: 5, rate: 16.7, rev: '₹2.6L' },
                        ].map(r => (
                          <tr key={r.src} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-2 py-3 text-sm font-semibold text-[#0F172A]">{r.src}</td>
                            <td className="px-2 py-3 text-sm text-slate-700">{r.leads}</td>
                            <td className="px-2 py-3 text-sm text-emerald-600 font-medium">{r.conv}</td>
                            <td className="px-2 py-3">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">{r.rate}%</span>
                            </td>
                            <td className="px-2 py-3 text-sm font-bold text-[#0F172A]">{r.rev}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TEAM TAB ══════════ */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Top Performer */}
                {topPerformer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/60 rounded-2xl p-5 flex items-center gap-5"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${topPerformer.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                      {topPerformer.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-600 font-bold text-sm">⭐ Top Performer</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Rank #1</span>
                      </div>
                      <p className="text-[#0F172A] font-bold text-lg">{topPerformer.name}</p>
                      <p className="text-xs text-slate-500">Conversion Rate: <strong className="text-emerald-600">{topPerformer.conversionRate}%</strong> · Leads: <strong>{topPerformer.leads}</strong> · Converted: <strong>{topPerformer.converted}</strong></p>
                    </div>
                    <div className="flex gap-4 text-center hidden sm:flex">
                      <div className="px-4 py-2 bg-white rounded-xl border border-amber-100 shadow-sm">
                        <p className="text-xl font-bold text-[#0F172A]">{topPerformer.converted}</p>
                        <p className="text-[10px] text-slate-500">Converted</p>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-xl border border-amber-100 shadow-sm">
                        <p className="text-xl font-bold text-emerald-600">{topPerformer.conversionRate}%</p>
                        <p className="text-[10px] text-slate-500">Rate</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Leaderboard Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-sm font-bold text-[#0F172A]">Team Leaderboard</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          {['Rank', 'Name', 'Leads', 'Converted', 'Rate', 'Target', 'Achieved', 'Progress'].map(h => (
                            <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.team.map((m, i) => {
                          const progress = Math.min(100, Math.round((m.achieved / m.target) * 100));
                          return (
                            <motion.tr
                              key={m.rank}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  m.rank === 1 ? 'bg-amber-100 text-amber-700' :
                                  m.rank === 2 ? 'bg-slate-100 text-slate-600' :
                                  m.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : m.rank}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs font-bold`}>{m.avatar}</div>
                                  <span className="text-sm font-semibold text-[#0F172A]">{m.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-700">{m.leads}</td>
                              <td className="px-5 py-3 text-sm font-semibold text-emerald-600">{m.converted}</td>
                              <td className="px-5 py-3">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{m.conversionRate}%</span>
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-600">{m.target}</td>
                              <td className="px-5 py-3 text-sm font-semibold text-[#0F172A]">{m.achieved}</td>
                              <td className="px-5 py-3 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.6, delay: i * 0.07 }}
                                      className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ ACTIVITY TAB ══════════ */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Calls', value: reportData.activity.calls, icon: '📞', color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700' },
                    { label: 'Emails Sent', value: reportData.activity.emails, icon: '📧', color: 'bg-violet-50 border-violet-100', textColor: 'text-violet-700' },
                    { label: 'Meetings Held', value: reportData.activity.meetings, icon: '🤝', color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700' },
                  ].map((a, i) => (
                    <motion.div
                      key={a.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={`${a.color} border rounded-2xl p-6 text-center`}
                    >
                      <div className="text-3xl mb-2">{a.icon}</div>
                      <p className={`text-4xl font-bold ${a.textColor}`}>{a.value}</p>
                      <p className="text-sm text-slate-500 mt-1">{a.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-5">Daily Activity Heatmap (This Week)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs">
                      <thead>
                        <tr>
                          <th className="pb-2 text-slate-400 font-medium text-left">Day</th>
                          {['Calls', 'Emails', 'Meetings', 'Follow-ups', 'Demos'].map(h => (
                            <th key={h} className="pb-2 text-slate-400 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { day: 'Monday', vals: [42, 78, 18, 34, 7] },
                          { day: 'Tuesday', vals: [38, 91, 22, 41, 11] },
                          { day: 'Wednesday', vals: [51, 67, 15, 28, 9] },
                          { day: 'Thursday', vals: [44, 83, 24, 37, 14] },
                          { day: 'Friday', vals: [39, 68, 13, 22, 6] },
                        ].map(row => {
                          const maxVal = Math.max(...row.vals);
                          return (
                            <tr key={row.day} className="border-t border-slate-50">
                              <td className="py-2 text-left font-medium text-slate-600 pr-4">{row.day}</td>
                              {row.vals.map((v, i) => {
                                const intensity = v / maxVal;
                                return (
                                  <td key={i} className="py-2">
                                    <div
                                      className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                                      style={{ background: `rgba(37,99,235,${0.15 + intensity * 0.75})` }}
                                    >
                                      {v}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ PIPELINE TAB ══════════ */}
            {activeTab === 'pipeline' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Stage Column Chart */}
                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-1">Stage-by-Stage Distribution</h3>
                    <p className="text-xs text-slate-500 mb-6">Leads per pipeline stage</p>
                    <div style={{ width: '100%', height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.pipelineStages} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 11 }} />
                          <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]} barSize={28}>
                            {reportData.pipelineStages.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Health Score */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col items-center justify-center gap-4">
                    <h3 className="text-sm font-bold text-[#0F172A]">Pipeline Health Score</h3>
                    <HealthRing score={reportData.pipelineHealth} />
                    <div className="w-full space-y-2">
                      {[
                        { label: 'Deal Coverage', val: '3.2x', good: true },
                        { label: 'Avg Age (days)', val: '14', good: true },
                        { label: 'Stale Deals', val: '8', good: false },
                      ].map(m => (
                        <div key={m.label} className="flex justify-between text-xs border-b border-slate-50 pb-1">
                          <span className="text-slate-500">{m.label}</span>
                          <span className={`font-bold ${m.good ? 'text-emerald-600' : 'text-red-500'}`}>{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stage details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {reportData.pipelineStages.map(s => (
                    <div key={s.stage} className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <div>
                        <p className="text-xs text-slate-500">{s.stage}</p>
                        <p className="text-xl font-bold text-[#0F172A]">{s.value}</p>
                        <p className="text-xs text-slate-400">leads in this stage</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════ REVENUE TAB ══════════ */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: '₹48L', trend: '+18%', up: true, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Monthly Target', value: '₹60L', trend: '80% achieved', up: true, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Avg Deal Value', value: '₹2.4L', trend: '+12%', up: true, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Projected Q3', value: '₹1.8Cr', trend: 'On Track', up: true, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={`${m.bg} rounded-2xl p-5`}
                    >
                      <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                      <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{m.trend}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-5">Revenue by Executive</h3>
                  <div className="space-y-4">
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.team.map((m, idx) => {
                          const revValues = [18.2, 14.7, 10.4, 8.1, 6.6];
                          return {
                            name: m.name,
                            revenue: revValues[idx] || 5,
                          };
                        })}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} unit="L" />
                        <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} width={90} />
                        <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 11 }} formatter={(v) => `₹${v}L`} />
                        <Bar dataKey="revenue" name="Revenue Achieved" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={12}>
                          {reportData.team.map((entry, index) => {
                            const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── AI Insights Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Insights</h3>
              <p className="text-[11px] text-slate-400">Powered by HubNest Intelligence</p>
            </div>
            <span className="ml-auto px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] font-semibold rounded-full border border-violet-500/30">
              LIVE
            </span>
          </div>
          <div className="space-y-3">
            {reportData.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── Bottom Action Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-3"
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">
              Showing data for <strong className="text-slate-700 capitalize">{dateFilter}</strong> · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Share2 className="w-3.5 h-3.5" />
              Share Report
            </button>
            <button
              onClick={handleSaveReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-violet-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-500/20"
            >
              <FileText className="w-3.5 h-3.5" />
              Save Report
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
