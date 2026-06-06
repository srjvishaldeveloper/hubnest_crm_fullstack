'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, TrendingDown, Users, Briefcase, Star, AlertCircle,
  CheckCircle, Phone, Mail, Calendar, Zap, ArrowUpRight, ArrowRight,
  Sparkles, Plus, RefreshCw, Eye, BarChart3, UserCheck, Activity,
  Bell, MessageCircle, ChevronRight,
} from 'lucide-react';
import { smGetDashboard } from '../../../services/salesManagerService';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: string | number;
  trend: number;
  prefix?: string;
  suffix?: string;
}

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
  bg: string;
  textColor: string;
  max?: number;
}

interface TeamMember {
  id: string;
  name: string;
  target: number;
  achieved: number;
  conversionRate: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar?: string;
}

interface Task {
  id: string;
  type: 'Call' | 'Email' | 'Meeting';
  leadName: string;
  assignedExec: string;
  time: string;
  priority?: 'High' | 'Medium' | 'Low';
}

interface HotLead {
  id: string;
  name: string;
  company?: string;
  probability: number;
  assignedExec: string;
  value?: string;
}

interface ActivityOverview {
  calls: number;
  emails: number;
  meetings: number;
}

interface AIInsight {
  text: string;
  type: 'info' | 'warning' | 'success';
}

interface DashboardData {
  kpis?: {
    totalLeads?: number;
    revenueGenerated?: number;
    conversionRate?: number;
    activeDeals?: number;
    leadsTrend?: number;
    revenueTrend?: number;
    conversionTrend?: number;
    dealsTrend?: number;
  };
  pipeline?: Array<{ stage: string; count: number }>;
  teamPerformance?: TeamMember[];
  todayTasks?: Task[];
  hotLeads?: HotLead[];
  activity?: ActivityOverview;
  aiInsights?: AIInsight[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DATA: DashboardData = {
  kpis: {
    totalLeads: 348,
    revenueGenerated: 4287500,
    conversionRate: 31.4,
    activeDeals: 57,
    leadsTrend: 12.5,
    revenueTrend: 8.3,
    conversionTrend: -2.1,
    dealsTrend: 5.7,
  },
  pipeline: [
    { stage: 'New', count: 82 },
    { stage: 'Contacted', count: 67 },
    { stage: 'Interested', count: 54 },
    { stage: 'Negotiation', count: 38 },
    { stage: 'Converted', count: 71 },
    { stage: 'Lost', count: 36 },
  ],
  teamPerformance: [
    { id: '1', name: 'Arjun Mehta',     target: 2000000, achieved: 1840000, conversionRate: 38, status: 'Active' },
    { id: '2', name: 'Priya Sharma',    target: 1800000, achieved: 1920000, conversionRate: 44, status: 'Active' },
    { id: '3', name: 'Rahul Verma',     target: 1500000, achieved: 1100000, conversionRate: 28, status: 'Active' },
    { id: '4', name: 'Sneha Patil',     target: 2000000, achieved: 1650000, conversionRate: 35, status: 'On Leave' },
    { id: '5', name: 'Vikram Nair',     target: 1600000, achieved: 1750000, conversionRate: 41, status: 'Active' },
  ],
  todayTasks: [
    { id: 't1', type: 'Call',    leadName: 'Ravi Industries',    assignedExec: 'Arjun Mehta',  time: '10:30 AM', priority: 'High' },
    { id: 't2', type: 'Email',   leadName: 'Apex Solutions',     assignedExec: 'Priya Sharma', time: '11:00 AM', priority: 'Medium' },
    { id: 't3', type: 'Meeting', leadName: 'TechCorp Pvt Ltd',  assignedExec: 'Vikram Nair',  time: '02:00 PM', priority: 'High' },
    { id: 't4', type: 'Call',    leadName: 'GreenField Exports', assignedExec: 'Rahul Verma',  time: '03:30 PM', priority: 'Low' },
    { id: 't5', type: 'Email',   leadName: 'Nova Fintech',       assignedExec: 'Sneha Patil',  time: '05:00 PM', priority: 'Medium' },
  ],
  hotLeads: [
    { id: 'h1', name: 'Synergy Tech', company: 'Synergy Tech Pvt Ltd', probability: 92, assignedExec: 'Priya Sharma', value: '₹8,50,000' },
    { id: 'h2', name: 'Metro Infra',  company: 'Metro Infrastructure',  probability: 85, assignedExec: 'Arjun Mehta',  value: '₹6,20,000' },
    { id: 'h3', name: 'CloudNova',    company: 'CloudNova Systems',     probability: 78, assignedExec: 'Vikram Nair',  value: '₹4,75,000' },
    { id: 'h4', name: 'FutureMeds',   company: 'FutureMeds Healthcare', probability: 71, assignedExec: 'Rahul Verma',  value: '₹3,90,000' },
    { id: 'h5', name: 'GreenBuild',   company: 'GreenBuild Constructs', probability: 65, assignedExec: 'Sneha Patil',  value: '₹2,80,000' },
  ],
  activity: { calls: 143, emails: 89, meetings: 31 },
  aiInsights: [
    { text: 'Conversion rate dropped 2.1% this week. Follow up on 18 stalled "Interested" leads before Friday.', type: 'warning' },
    { text: 'Priya Sharma exceeded her monthly target by ₹1.2L. Consider assigning premium leads to her pipeline.', type: 'success' },
    { text: '8 hot leads in Negotiation stage are idle for >5 days. Escalate or reassign to prevent churn.', type: 'info' },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatRupees(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Pipeline config ──────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { color: string; bg: string; text: string; bar: string }> = {
  'New':          { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  text: '#1D4ED8', bar: '#3B82F6' },
  'Contacted':    { color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)',  text: '#0369A1', bar: '#0EA5E9' },
  'Interested':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', text: '#B45309', bar: '#F59E0B' },
  'Negotiation':  { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  text: '#B91C1C', bar: '#EF4444' },
  'Converted':    { color: '#10B981', bg: 'rgba(16,185,129,0.10)', text: '#047857', bar: '#10B981' },
  'Lost':         { color: '#6B7280', bg: 'rgba(107,114,128,0.10)',text: '#374151', bar: '#6B7280' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBlock({ w = '100%', h = 20, rounded = 8 }: { w?: string | number; h?: number; rounded?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: rounded,
      background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200/60">
          <div className="space-y-2">
            <SkeletonBlock w={220} h={28} />
            <SkeletonBlock w={140} h={16} />
          </div>
          <div className="flex gap-3">
            {[1,2,3].map(i => <SkeletonBlock key={i} w={40} h={40} rounded={12} />)}
          </div>
        </div>
        {/* KPI skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
              <SkeletonBlock w={48} h={48} rounded={12} />
              <SkeletonBlock w="60%" h={32} />
              <SkeletonBlock w="80%" h={14} />
            </div>
          ))}
        </div>
        {/* Pipeline skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
          <SkeletonBlock w={160} h={20} />
          <div className="flex gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 space-y-2"><SkeletonBlock h={80} rounded={12} /><SkeletonBlock h={14} /></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

function KPICard({ label, value, trend, icon: Icon, iconBg, iconColor, delay }: {
  label: string; value: string; trend: number;
  icon: React.ElementType; iconBg: string; iconColor: string; delay: number;
}) {
  const up = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div style={{ background: iconBg }} className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-[#0F172A] mb-1 group-hover:text-[#2563EB] transition-colors">{value}</p>
      <p className="text-xs text-[#64748B] font-medium">{label}</p>
    </motion.div>
  );
}

function TaskTypeBadge({ type }: { type: Task['type'] }) {
  const cfg = {
    Call:    { bg: 'rgba(59,130,246,0.10)', color: '#1D4ED8', icon: Phone },
    Email:   { bg: 'rgba(245,158,11,0.10)', color: '#B45309', icon: Mail },
    Meeting: { bg: 'rgba(16,185,129,0.10)', color: '#047857', icon: Calendar },
  }[type];
  const I = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <I className="w-3 h-3" />{type}
    </span>
  );
}

function PriorityDot({ priority }: { priority?: Task['priority'] }) {
  if (!priority) return null;
  const color = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' }[priority];
  return <span style={{ background: color }} className="w-2 h-2 rounded-full inline-block" />;
}

function StatusBadge({ status }: { status: TeamMember['status'] }) {
  const cfg = {
    Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive:  'bg-red-50 text-red-700 border-red-200',
    'On Leave':'bg-amber-50 text-amber-700 border-amber-200',
  }[status];
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg}`}>{status}</span>;
}

function ProbabilityBadge({ prob }: { prob: number }) {
  const color = prob >= 80 ? '#10B981' : prob >= 60 ? '#F59E0B' : '#EF4444';
  const bg = prob >= 80 ? 'rgba(16,185,129,0.1)' : prob >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: bg, color }}>
      {prob}%
    </span>
  );
}

function AvatarCircle({ name, size = 32, gradient = 'from-blue-500 to-cyan-500' }: { name: string; size?: number; gradient?: string }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesManagerDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const managerName = user?.name ?? 'Sales Manager';

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await smGetDashboard();
      setData(res ?? MOCK_DATA);
    } catch {
      setData(MOCK_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const d = data ?? MOCK_DATA;
  const kpis = d.kpis ?? MOCK_DATA.kpis!;
  const pipeline = d.pipeline ?? MOCK_DATA.pipeline!;
  const team = d.teamPerformance ?? MOCK_DATA.teamPerformance!;
  const tasks = d.todayTasks ?? MOCK_DATA.todayTasks!;
  const hotLeads = d.hotLeads ?? MOCK_DATA.hotLeads!;
  const activity = d.activity ?? MOCK_DATA.activity!;
  const insights = d.aiInsights ?? MOCK_DATA.aiInsights!;

  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <style>{`
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.15)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .float-anim{animation:float 3s ease-in-out infinite}
        .progress-fill{transition:width 1.2s cubic-bezier(0.4,0,0.2,1)}
        .card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(15,23,42,0.08)}
        .card-hover{transition:all 0.25s ease}
        .glass-dark{background:linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.96));backdrop-filter:blur(20px)}
      `}</style>

      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm"
        style={{ background: 'linear-gradient(135deg,#1e40af 0%,#2563EB 45%,#4f46e5 100%)' }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(-30%,40%)' }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-200 text-sm font-medium">{getGreeting()},</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-blue-200 text-xs">Online</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{managerName} 👋</h1>
            <p className="text-blue-200 text-sm mt-0.5">Sales Manager · HubNest CRM</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-all relative">
              <MessageCircle className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white" />
            </button>
            <AvatarCircle name={managerName} size={42} gradient="from-amber-400 to-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* ── 2. KPI CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Leads"           value={String(kpis.totalLeads ?? 0)}           trend={kpis.leadsTrend ?? 0}      icon={Target}    iconBg="rgba(37,99,235,0.10)"  iconColor="#2563EB" delay={0} />
        <KPICard label="Revenue Generated"     value={formatRupees(kpis.revenueGenerated ?? 0)} trend={kpis.revenueTrend ?? 0}   icon={TrendingUp} iconBg="rgba(16,185,129,0.10)" iconColor="#059669" delay={0.05} />
        <KPICard label="Conversion Rate"       value={`${kpis.conversionRate ?? 0}%`}          trend={kpis.conversionTrend ?? 0} icon={BarChart3}  iconBg="rgba(245,158,11,0.10)" iconColor="#D97706" delay={0.10} />
        <KPICard label="Active Deals"          value={String(kpis.activeDeals ?? 0)}            trend={kpis.dealsTrend ?? 0}      icon={Briefcase}  iconBg="rgba(6,182,212,0.10)"  iconColor="#0891B2" delay={0.15} />
      </div>

      {/* ── 3. SALES PIPELINE ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" /> Sales Pipeline
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">{pipeline.reduce((s, p) => s + p.count, 0)} total leads tracked across all stages</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {pipeline.map((stage, i) => {
            const cfg = STAGE_CONFIG[stage.stage] ?? { color: '#64748B', bg: 'rgba(100,116,139,0.10)', text: '#334155', bar: '#64748B' };
            const pct = Math.round((stage.count / maxPipeline) * 100);
            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="card-hover rounded-xl p-3 text-center border"
                style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
              >
                <p className="text-2xl font-bold mb-1" style={{ color: cfg.text }}>{stage.count}</p>
                <p className="text-[11px] font-semibold mb-2" style={{ color: cfg.text }}>{stage.stage}</p>
                {/* mini progress bar */}
                <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: cfg.bar }}
                  />
                </div>
                <p className="text-[10px] mt-1 font-medium" style={{ color: cfg.text, opacity: 0.7 }}>{pct}% of peak</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── 4. TEAM PERFORMANCE TABLE ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" /> Team Performance
          </h2>
          <button className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
            Full Report <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Executive', 'Target', 'Achieved', 'Conversion %', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((m, i) => {
                const pct = Math.min(Math.round((m.achieved / m.target) * 100), 100);
                const exceeded = m.achieved > m.target;
                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarCircle name={m.name} size={34} gradient={
                          ['from-blue-500 to-cyan-400','from-amber-500 to-orange-400','from-emerald-500 to-teal-400','from-sky-500 to-blue-600','from-rose-500 to-pink-400'][i % 5]
                        } />
                        <span className="text-sm font-semibold text-[#0F172A]">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#64748B] font-medium">{formatRupees(m.target)}</td>
                    <td className="px-5 py-3.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.5 + i * 0.09, duration: 0.9, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: exceeded ? '#10B981' : '#2563EB' }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${exceeded ? 'text-emerald-600' : 'text-[#2563EB]'}`}>
                          {formatRupees(m.achieved)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${m.conversionRate >= 40 ? 'text-emerald-600' : m.conversionRate >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                        {m.conversionRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── 5 + 6. TASKS & HOT LEADS (two-col) ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Today Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Today's Tasks & Follow-ups
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{tasks.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors group"
              >
                <TaskTypeBadge type={task.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">{task.leadName}</p>
                  <p className="text-xs text-[#64748B] truncate">{task.assignedExec}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-[#64748B]">{task.time}</span>
                  <div className="flex items-center gap-1">
                    <PriorityDot priority={task.priority} />
                    <span className="text-[10px] text-[#64748B]">{task.priority}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Priority Hot Leads */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Priority Hot Leads
            </h2>
            <button className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
              All Leads <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {hotLeads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors group"
              >
                <AvatarCircle name={lead.name} size={36} gradient={
                  ['from-rose-500 to-pink-400','from-orange-500 to-amber-400','from-teal-500 to-cyan-400','from-sky-500 to-blue-400','from-emerald-500 to-teal-400'][i % 5]
                } />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{lead.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-medium text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">{lead.assignedExec.split(' ')[0]}</span>
                    {lead.value && <span className="text-[11px] font-semibold text-emerald-600">{lead.value}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <ProbabilityBadge prob={lead.probability} />
                  <button className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Reassign <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── 7. ACTIVITY OVERVIEW ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6"
      >
        <h2 className="text-sm font-bold text-[#0F172A] mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#2563EB]" /> Activity Overview
          <span className="ml-2 text-xs font-normal text-[#64748B]">· This Week</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Calls Made',      value: activity.calls,    icon: Phone,    bg: 'rgba(37,99,235,0.08)',   color: '#2563EB', border: 'rgba(37,99,235,0.2)' },
            { label: 'Emails Sent',     value: activity.emails,   icon: Mail,     bg: 'rgba(245,158,11,0.08)',  color: '#D97706', border: 'rgba(245,158,11,0.2)' },
            { label: 'Meetings Held',   value: activity.meetings, icon: Calendar, bg: 'rgba(16,185,129,0.08)',  color: '#059669', border: 'rgba(16,185,129,0.2)' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              className="card-hover rounded-2xl p-5 flex flex-col items-center text-center border"
              style={{ background: item.bg, borderColor: item.border }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 float-anim" style={{ animationDelay: `${i * 0.5}s` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <p className="text-3xl font-bold text-[#0F172A]" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs font-semibold text-[#64748B] mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 8 + 9. AI INSIGHTS + QUICK ACTIONS (two-col) ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="xl:col-span-3 glass-dark rounded-2xl p-6 border border-slate-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0284C7,#06B6D4)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Insights</h2>
              <p className="text-xs text-slate-400">Powered by HubNest Intelligence</p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="space-y-3">
            {insights.map((ins, i) => {
              const cfg = {
                warning: { border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)', icon: AlertCircle, color: '#FBBF24' },
                success: { border: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.08)', icon: CheckCircle, color: '#34D399' },
                info:    { border: 'rgba(99,102,241,0.4)',  bg: 'rgba(99,102,241,0.08)', icon: Star,         color: '#818CF8' },
              }[ins.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex gap-3 p-3.5 rounded-xl border"
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <p className="text-sm text-slate-200 leading-relaxed">{ins.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col"
        >
          <h2 className="text-sm font-bold text-[#0F172A] mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" /> Quick Actions
          </h2>
          <div className="flex flex-col gap-3 flex-1">
            {[
              {
                label: 'Assign Lead',
                desc: 'Distribute leads to executives',
                icon: UserCheck,
                gradient: 'linear-gradient(135deg,#1D4ED8,#2563EB)',
                shadow: 'rgba(37,99,235,0.35)',
                delay: 0.55,
              },
              {
                label: 'Create Task',
                desc: 'Schedule follow-up or reminder',
                icon: Plus,
                gradient: 'linear-gradient(135deg,#EA580C,#F97316)',
                shadow: 'rgba(249,115,22,0.35)',
                delay: 0.6,
              },
              {
                label: 'View Reports',
                desc: 'Analytics & performance reports',
                icon: Eye,
                gradient: 'linear-gradient(135deg,#047857,#059669)',
                shadow: 'rgba(5,150,105,0.35)',
                delay: 0.65,
              },
            ].map((action) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: action.delay }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3.5 p-4 rounded-xl text-white font-semibold text-sm text-left w-full shadow-lg transition-all"
                style={{ background: action.gradient, boxShadow: `0 4px 20px ${action.shadow}` }}
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{action.label}</p>
                  <p className="text-[11px] font-normal opacity-80">{action.desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Error toast (non-blocking) */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 text-sm font-medium"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
