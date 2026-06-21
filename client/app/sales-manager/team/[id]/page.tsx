'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, Target, TrendingUp, TrendingDown,
  CheckCircle, Clock, AlertCircle, BarChart3, Activity, Users, Award,
  Edit2, Save, X, Calendar, ChevronRight, Zap, Star,
} from 'lucide-react';
import { smGetMember, smUpdateMemberTarget } from '../../../../services/salesManagerService';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'overview' | 'leads' | 'tasks' | 'activity';

interface Member {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  joinedDate: string;
  avatar?: string;
  performance: {
    leadsTotal: number;
    converted: number;
    lost: number;
    conversionRate: number;
    pendingTasks: number;
    calls: number;
    emails: number;
    meetings: number;
    revenueAchieved: number;
    revenueTarget: number;
    leadsConverted: number;
    leadsTarget: number;
    aiScore: number;
  };
  leads?: LeadItem[];
  tasks?: TaskItem[];
  activities?: ActivityItem[];
}

interface LeadItem {
  id: string;
  name: string;
  company: string;
  status: string;
  priority: string;
  value: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  relatedLead?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface TargetForm {
  revenueTarget: string;
  leadsTarget: string;
}

// ─── Mock fallback data generator ────────────────────────────────────────────
function generateMockMember(id: string): Member {
  const names = [
    'Arun Menon', 'Deepa Krishnan', 'Farhan Ali', 'Geeta Rao', 'Harish Bhatt',
    'Isha Kapoor', 'Jayant Tiwari', 'Kavitha Pillai',
  ];
  const idx = parseInt(id.replace(/\D/g, '') || '1', 10) % names.length;
  const name = names[idx];
  const initials = name.split(' ').map(n => n[0]).join('');

  return {
    id,
    name,
    employeeId: `EMP-${2000 + idx}`,
    email: name.toLowerCase().replace(' ', '.') + '@hubnest.com',
    phone: `+91 ${9000000000 + idx * 111111111}`,
    role: 'Sales Executive',
    status: idx % 4 === 3 ? 'Inactive' : 'Active',
    joinedDate: '14 Mar 2025',
    avatar: initials,
    performance: {
      leadsTotal: 68 + idx * 7,
      converted: 23 + idx * 3,
      lost: 11 + idx,
      conversionRate: 34 + idx * 2,
      pendingTasks: 5 + idx,
      calls: 128 + idx * 12,
      emails: 245 + idx * 18,
      meetings: 42 + idx * 5,
      revenueAchieved: 8.4 + idx * 0.8,
      revenueTarget: 15,
      leadsConverted: 23 + idx * 3,
      leadsTarget: 40,
      aiScore: 72 + idx * 2,
    },
    leads: [
      { id: 'l1', name: 'Suresh Patel', company: 'TechVista Corp', status: 'Qualified', priority: 'High', value: '₹4.2L', createdAt: '02 Jun 2026' },
      { id: 'l2', name: 'Meena Joshi', company: 'CloudBridge Inc', status: 'New', priority: 'Medium', value: '₹1.8L', createdAt: '28 May 2026' },
      { id: 'l3', name: 'Rajiv Bose', company: 'DataForge Labs', status: 'Proposal', priority: 'High', value: '₹7.5L', createdAt: '20 May 2026' },
      { id: 'l4', name: 'Anita Singh', company: 'NovaStar Ltd', status: 'Closed Won', priority: 'Low', value: '₹2.1L', createdAt: '12 May 2026' },
      { id: 'l5', name: 'Vikram Das', company: 'PureHealth Inc', status: 'Closed Lost', priority: 'Medium', value: '₹3.3L', createdAt: '05 May 2026' },
    ],
    tasks: [
      { id: 't1', title: 'Follow up with TechVista Corp', status: 'Pending', priority: 'High', dueDate: '08 Jun 2026', relatedLead: 'Suresh Patel' },
      { id: 't2', title: 'Send proposal to DataForge Labs', status: 'In Progress', priority: 'High', dueDate: '07 Jun 2026', relatedLead: 'Rajiv Bose' },
      { id: 't3', title: 'Schedule demo call', status: 'Completed', priority: 'Medium', dueDate: '05 Jun 2026', relatedLead: 'Meena Joshi' },
      { id: 't4', title: 'Update CRM notes', status: 'Pending', priority: 'Low', dueDate: '10 Jun 2026' },
      { id: 't5', title: 'Quarterly performance review', status: 'Pending', priority: 'Medium', dueDate: '15 Jun 2026' },
    ],
    activities: [
      { id: 'a1', type: 'Call', description: 'Called Suresh Patel at TechVista Corp — discussed pricing', timestamp: '06 Jun 2026, 11:30', icon: 'phone' },
      { id: 'a2', type: 'Email', description: 'Sent proposal email to DataForge Labs', timestamp: '06 Jun 2026, 09:15', icon: 'mail' },
      { id: 'a3', type: 'Meeting', description: 'Video call with CloudBridge Inc — product demo', timestamp: '05 Jun 2026, 15:00', icon: 'video' },
      { id: 'a4', type: 'Note', description: 'Updated lead status for NovaStar Ltd to Closed Won', timestamp: '05 Jun 2026, 12:45', icon: 'note' },
      { id: 'a5', type: 'Task', description: 'Completed follow-up task for Meena Joshi', timestamp: '04 Jun 2026, 17:00', icon: 'check' },
      { id: 'a6', type: 'Call', description: 'Cold call to 8 new prospects from LinkedIn list', timestamp: '04 Jun 2026, 10:00', icon: 'phone' },
    ],
  };
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
const statusColour = (s: string) => {
  const m: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    Blocked: 'bg-red-50 text-red-700 border-red-200',
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Qualified: 'bg-violet-50 text-violet-700 border-violet-200',
    Proposal: 'bg-amber-50 text-amber-700 border-amber-200',
    'Closed Won': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Closed Lost': 'bg-red-50 text-red-700 border-red-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return m[s] ?? 'bg-slate-50 dark:bg-[#161616] text-slate-600 border-slate-200';
};

const priorityColour = (p: string) => {
  const m: Record<string, string> = {
    High: 'bg-red-50 text-red-600',
    Medium: 'bg-amber-50 text-amber-600',
    Low: 'bg-slate-100 text-slate-500',
  };
  return m[p] ?? 'bg-slate-100 text-slate-500';
};

const avatarGradient = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

// ─── Animated Progress Bar ───────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── AI Score Ring ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width={128} height={128} className="-rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#E2E8F0" strokeWidth={10} />
        <motion.circle
          cx={64} cy={64} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{score}</span>
        <span className="text-[10px] text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── Week Bar Chart ───────────────────────────────────────────────────────────
const WEEKS = [
  { label: 'Wk 1', leads: 14, deals: 5 },
  { label: 'Wk 2', leads: 18, deals: 7 },
  { label: 'Wk 3', leads: 11, deals: 4 },
  { label: 'Wk 4', leads: 22, deals: 9 },
];

function BarChart() {
  const max = Math.max(...WEEKS.map(w => w.leads));
  return (
    <div className="flex items-end gap-4 h-28 mt-2">
      {WEEKS.map((w, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex gap-1 items-end justify-center h-20">
            {/* Leads bar */}
            <motion.div
              className="flex-1 rounded-t-lg bg-blue-400"
              initial={{ height: 0 }}
              animate={{ height: `${(w.leads / max) * 100}%` }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: 'easeOut' }}
              title={`Leads: ${w.leads}`}
            />
            {/* Deals bar */}
            <motion.div
              className="flex-1 rounded-t-lg bg-emerald-400"
              initial={{ height: 0 }}
              animate={{ height: `${(w.deals / max) * 100}%` }}
              transition={{ delay: i * 0.12 + 0.1, duration: 0.7, ease: 'easeOut' }}
              title={`Deals: ${w.deals}`}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState<TargetForm>({ revenueTarget: '', leadsTarget: '' });
  const [savingTarget, setSavingTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      setLoading(true);
      try {
        const raw = await smGetMember(id);
        if (!raw) throw new Error('Not found');
        // Normalize flat backend shape → Member shape
        const act = raw.activitySummary || {};
        const tgt = raw.target || {};
        const leads = (raw.leads || []).map((l: any) => ({
          id: l.id, name: l.name || 'Unknown', company: l.company || '—',
          status: l.status || 'New', priority: l.priority || 'Medium',
          value: l.budget ? `₹${l.budget}` : '—',
          createdAt: l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—',
        }));
        const tasks = (raw.tasks || []).map((t: any) => ({
          id: t.id, title: t.title || t.task_name || 'Task',
          status: t.status || 'Pending', priority: t.priority || 'Medium',
          dueDate: t.scheduled_at || t.due_date ? new Date(t.scheduled_at || t.due_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—',
          relatedLead: t.lead_name || undefined,
        }));
        const activities = (raw.recentActivities || []).map((a: any) => ({
          id: a.id, type: a.type || 'Activity',
          description: a.description || a.notes || `${a.type} activity`,
          timestamp: a.created_at ? new Date(a.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
          icon: (a.type || '').toLowerCase().includes('call') ? 'phone' : (a.type || '').toLowerCase().includes('email') ? 'mail' : (a.type || '').toLowerCase().includes('meet') ? 'video' : 'note',
        }));
        const normalized: Member = {
          id: raw.id, name: raw.name || 'Member', employeeId: raw.employeeId || raw.admin_id || '—',
          email: raw.email || '—', phone: raw.phone || raw.mobile,
          role: raw.role_name || 'Sales Executive',
          status: raw.status === 'Active' ? 'Active' : raw.status === 'Blocked' ? 'Blocked' : 'Inactive',
          joinedDate: raw.created_at ? new Date(raw.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—',
          avatar: (raw.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2),
          performance: {
            leadsTotal: raw.leadsTotal || leads.length,
            converted: raw.leadsConverted || 0,
            lost: raw.leadsLost || 0,
            conversionRate: raw.leadsTotal > 0 ? Math.round(((raw.leadsConverted || 0) / raw.leadsTotal) * 100) : 0,
            pendingTasks: raw.tasksPending || 0,
            calls: act.Call || 0, emails: act.Email || 0, meetings: act.Meeting || 0,
            revenueAchieved: parseFloat(tgt.achieved_amount || tgt.revenueAchieved || 0),
            revenueTarget: parseFloat(tgt.target_amount || tgt.revenueTarget || 15),
            leadsConverted: raw.leadsConverted || 0,
            leadsTarget: parseInt(tgt.target_leads || tgt.leadsTarget || 40),
            aiScore: Math.min(100, Math.round(((raw.leadsConverted || 0) / Math.max(raw.leadsTotal || 1, 1)) * 100 * 1.5 + (act.Call || 0) * 0.1)),
          },
          leads, tasks, activities,
        };
        setMember(normalized);
        setTargetForm({ revenueTarget: String(normalized.performance.revenueTarget), leadsTarget: String(normalized.performance.leadsTarget) });
      } catch {
        const mock = generateMockMember(id);
        setMember(mock);
        setTargetForm({ revenueTarget: String(mock.performance.revenueTarget), leadsTarget: String(mock.performance.leadsTarget) });
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  const handleSaveTarget = async () => {
    if (!member) return;
    setSavingTarget(true);
    try {
      await smUpdateMemberTarget(member.id, {
        targetAmount: parseFloat(targetForm.revenueTarget),
        targetLeads: parseInt(targetForm.leadsTarget, 10),
      });
      setMember(prev => prev ? {
        ...prev,
        performance: {
          ...prev.performance,
          revenueTarget: parseFloat(targetForm.revenueTarget),
          leadsTarget: parseInt(targetForm.leadsTarget, 10),
        },
      } : prev);
    } catch {
      // silently update local state even if API fails
      setMember(prev => prev ? {
        ...prev,
        performance: {
          ...prev.performance,
          revenueTarget: parseFloat(targetForm.revenueTarget),
          leadsTarget: parseInt(targetForm.leadsTarget, 10),
        },
      } : prev);
    } finally {
      setSavingTarget(false);
      setShowTargetModal(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-52 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600 font-medium">Member not found</p>
        <button onClick={() => router.back()} className="text-[#2563EB] text-sm font-semibold hover:underline">← Go Back</button>
      </div>
    );
  }

  const gradClass = avatarGradient[parseInt(member.id.replace(/\D/g, '') || '0', 10) % avatarGradient.length];
  const p = member.performance;
  const revenueBarPct = Math.min(100, Math.round((p.revenueAchieved / p.revenueTarget) * 100));
  const leadsBarPct = Math.min(100, Math.round((p.leadsConverted / p.leadsTarget) * 100));

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Back + Breadcrumb ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-[#161616] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span className="font-medium text-slate-700 hover:text-[#2563EB] cursor-pointer" onClick={() => router.back()}>Team</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{member.name}</span>
        </div>
      </motion.div>

      {/* ── 2. Member Header Card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] opacity-100" />
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${gradClass} flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/20`}>
            {member.avatar || <User className="w-8 h-8" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{member.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${member.status === 'Active' ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' : 'bg-amber-400/20 text-amber-200 border-amber-400/30'}`}>
                {member.status}
              </span>
            </div>
            <p className="text-blue-200 text-sm font-medium mb-3">{member.role} · {member.employeeId}</p>
            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-xs">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />{member.email}
              </span>
              {member.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />{member.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />Joined {member.joinedDate}
              </span>
            </div>
          </div>

          {/* Set Target Button */}
          <button
            onClick={() => setShowTargetModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-[#2563EB] text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Target className="w-4 h-4" />
            Set Target
          </button>
        </div>
      </motion.div>

      {/* ── 3. Performance Summary Row (5 cards) ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Leads', value: p.leadsTotal, icon: Users, bg: 'bg-blue-50', ic: 'text-blue-600', trend: null },
          { label: 'Converted', value: p.converted, icon: TrendingUp, bg: 'bg-emerald-50', ic: 'text-emerald-600', trend: 'up' },
          { label: 'Lost', value: p.lost, icon: TrendingDown, bg: 'bg-red-50', ic: 'text-red-500', trend: 'down' },
          { label: 'Conversion %', value: `${p.conversionRate}%`, icon: Award, bg: 'bg-violet-50', ic: 'text-violet-600', trend: null },
          { label: 'Pending Tasks', value: p.pendingTasks, icon: Clock, bg: 'bg-amber-50', ic: 'text-amber-600', trend: null },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200"
          >
            <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{card.value}</p>
              <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF] font-medium leading-tight">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 4. Target Progress Section ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Target Progress</h3>
          <button
            onClick={() => setShowTargetModal(true)}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-800 transition-colors"
          >
            <Edit2 className="w-3 h-3" />Edit Targets
          </button>
        </div>

        <div className="space-y-5">
          {/* Revenue Target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">Revenue Target</p>
                <p className="text-xs text-slate-500 mt-0.5">₹{Number(p.revenueAchieved || 0).toFixed(1).replace(/\.0$/, '')}L achieved of ₹{p.revenueTarget}L</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${revenueBarPct >= 80 ? 'text-emerald-600' : revenueBarPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                  {revenueBarPct}%
                </span>
                <p className="text-[10px] text-slate-400">of target</p>
              </div>
            </div>
            <ProgressBar
              value={p.revenueAchieved}
              max={p.revenueTarget}
              color={revenueBarPct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : revenueBarPct >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'}
            />
          </div>

          {/* Leads Target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">Leads Converted</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.leadsConverted} converted of {p.leadsTarget} target</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${leadsBarPct >= 80 ? 'text-emerald-600' : leadsBarPct >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {leadsBarPct}%
                </span>
                <p className="text-[10px] text-slate-400">of target</p>
              </div>
            </div>
            <ProgressBar
              value={p.leadsConverted}
              max={p.leadsTarget}
              color={leadsBarPct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}
            />
          </div>
        </div>
      </motion.div>

      {/* ── 5. Tabs ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        {/* Tab Bar */}
        <div className="flex border-b border-slate-100 dark:border-[#1f1f1f] overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-[#2563EB] border-[#2563EB] bg-blue-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:bg-[#161616]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Activity Summary */}
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Activity Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Calls Made', value: p.calls, icon: Phone, bg: 'from-blue-50 to-blue-100', ic: 'text-blue-600', num: 'text-blue-700' },
                      { label: 'Emails Sent', value: p.emails, icon: Mail, bg: 'from-violet-50 to-violet-100', ic: 'text-violet-600', num: 'text-violet-700' },
                      { label: 'Meetings', value: p.meetings, icon: Users, bg: 'from-emerald-50 to-emerald-100', ic: 'text-emerald-600', num: 'text-emerald-700' },
                    ].map(a => (
                      <div key={a.label} className={`bg-gradient-to-br ${a.bg} rounded-2xl p-5 flex items-center gap-4`}>
                        <a.icon className={`w-8 h-8 ${a.ic} flex-shrink-0`} />
                        <div>
                          <p className={`text-3xl font-bold ${a.num}`}>{a.value}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{a.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance chart + AI Score */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bar chart — last 4 weeks */}
                  <div className="lg:col-span-2 border border-slate-100 dark:border-[#1f1f1f] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                        Performance — Last 4 Weeks
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />Leads</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Deals</span>
                      </div>
                    </div>
                    <BarChart />
                    <div className="flex gap-4 mt-3 text-[11px] text-slate-400">
                      {WEEKS.map((w, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="font-medium text-slate-600">{w.leads}</span> leads / <span className="font-medium text-emerald-600">{w.deals}</span> deals
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Score */}
                  <div className="border border-slate-100 dark:border-[#1f1f1f] rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2 self-start">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">AI Performance Score</h4>
                    </div>
                    <ScoreRing score={p.aiScore} />
                    <div className="text-center">
                      <p className={`text-sm font-bold ${p.aiScore >= 80 ? 'text-emerald-600' : p.aiScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                        {p.aiScore >= 80 ? '🔥 Excellent' : p.aiScore >= 60 ? '⚡ Good' : '⚠️ Needs Improvement'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Based on activity & conversions</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEADS TAB ─────────────────────────────────────────────────── */}
            {activeTab === 'leads' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/60">
                      {['Contact', 'Company', 'Status', 'Priority', 'Value', 'Created'].map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(member.leads ?? []).map((lead, i) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-slate-50 hover:bg-slate-50 dark:bg-[#161616]/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{lead.company}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColour(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${priorityColour(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{lead.value}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{lead.createdAt}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {(member.leads ?? []).length === 0 && (
                  <div className="py-14 text-center text-slate-400 text-sm">No leads assigned yet.</div>
                )}
              </div>
            )}

            {/* ── TASKS TAB ─────────────────────────────────────────────────── */}
            {activeTab === 'tasks' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/60">
                      {['Task', 'Status', 'Priority', 'Due Date', 'Related Lead'].map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(member.tasks ?? []).map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-slate-50 hover:bg-slate-50 dark:bg-[#161616]/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {task.status === 'Completed'
                              ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              : task.status === 'In Progress'
                              ? <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                            <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-[#0F172A] dark:text-[#F9FAFB]'}`}>
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColour(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${priorityColour(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {task.dueDate}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{task.relatedLead ?? '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {(member.tasks ?? []).length === 0 && (
                  <div className="py-14 text-center text-slate-400 text-sm">No tasks found.</div>
                )}
              </div>
            )}

            {/* ── ACTIVITY TAB ──────────────────────────────────────────────── */}
            {activeTab === 'activity' && (
              <div className="p-6">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />

                  <div className="space-y-5">
                    {(member.activities ?? []).map((act, i) => {
                      const iconBg: Record<string, string> = {
                        phone: 'bg-blue-100 text-blue-600',
                        mail: 'bg-violet-100 text-violet-600',
                        video: 'bg-emerald-100 text-emerald-600',
                        note: 'bg-amber-100 text-amber-600',
                        check: 'bg-emerald-100 text-emerald-600',
                      };
                      const IconComponent: Record<string, React.ReactNode> = {
                        phone: <Phone className="w-3.5 h-3.5" />,
                        mail: <Mail className="w-3.5 h-3.5" />,
                        video: <Users className="w-3.5 h-3.5" />,
                        note: <Edit2 className="w-3.5 h-3.5" />,
                        check: <CheckCircle className="w-3.5 h-3.5" />,
                      };
                      return (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-4 pl-1"
                        >
                          {/* Icon dot */}
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg[act.icon] ?? 'bg-slate-100 text-slate-500'}`}>
                            {IconComponent[act.icon] ?? <Activity className="w-3.5 h-3.5" />}
                          </div>
                          {/* Content */}
                          <div className="flex-1 bg-slate-50 dark:bg-[#161616] rounded-xl p-3.5 hover:bg-slate-100/70 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wide">{act.type}</span>
                                <p className="text-sm text-[#0F172A] dark:text-[#F9FAFB] mt-0.5">{act.description}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium flex-shrink-0 mt-0.5">{act.timestamp}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {(member.activities ?? []).length === 0 && (
                    <div className="py-14 text-center text-slate-400 text-sm">No recent activity.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── 10. Set Target Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTargetModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowTargetModal(false)}
            />
            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Set Member Target</h3>
                      <p className="text-xs text-slate-500">{member.name} · {member.employeeId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTargetModal(false)}
                    className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 dark:bg-[#161616] transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 space-y-4">
                  {/* Revenue Target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Revenue Target (₹ in Lakhs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 15"
                        value={targetForm.revenueTarget}
                        onChange={e => setTargetForm(f => ({ ...f, revenueTarget: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] dark:text-[#F9FAFB] font-medium outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Current: ₹{Number(p.revenueAchieved || 0).toFixed(1).replace(/\.0$/, '')}L achieved</p>
                  </div>

                  {/* Leads Target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Leads Target (number)
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 40"
                        value={targetForm.leadsTarget}
                        onChange={e => setTargetForm(f => ({ ...f, leadsTarget: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] dark:text-[#F9FAFB] font-medium outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Current: {p.leadsConverted} converted</p>
                  </div>

                  {/* Progress previews */}
                  <div className="bg-slate-50 dark:bg-[#161616] rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Preview</p>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>Revenue</span>
                        <span>{Math.min(100, Math.round((p.revenueAchieved / (parseFloat(targetForm.revenueTarget) || 1)) * 100))}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((p.revenueAchieved / (parseFloat(targetForm.revenueTarget) || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>Leads</span>
                        <span>{Math.min(100, Math.round((p.leadsConverted / (parseInt(targetForm.leadsTarget, 10) || 1)) * 100))}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((p.leadsConverted / (parseInt(targetForm.leadsTarget, 10) || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowTargetModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTarget}
                    disabled={savingTarget || !targetForm.revenueTarget || !targetForm.leadsTarget}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20"
                  >
                    {savingTarget ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Target
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
