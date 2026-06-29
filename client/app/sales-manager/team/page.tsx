'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, UserCheck, Star, TrendingUp, Target, BarChart3,
  Phone, Mail, Eye, Award, Zap, ChevronRight, X, Check, Copy,
  RefreshCw, Shield, Activity,
} from 'lucide-react';
import {
  smGetTeam,
  smAddExecutive,
  smUpdateMemberTarget,
  smUpdateTargets,
  smUpdateMemberStatus,
  smBroadcast,
  smApprove,
  smRemoveMember,
} from '../../../services/salesManagerService';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeamMember {
  _id: string;
  id?: string;
  name: string;
  email: string;
  employeeId: string;
  mobile?: string;
  status: string;
  targetAmount: number;
  achievedAmount: number;
  targetLeads: number;
  leadsHandled: number;
  converted: number;
  conversionRate: number;
  callsToday: number;
  emailsToday: number;
  joinedDate?: string;
  lastActive?: string;
}

interface AddFormState {
  name: string;
  email: string;
  employeeId: string;
  mobile: string;
  password: string;
  autoGenPassword: boolean;
  sendCredentials: boolean;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_MEMBERS: TeamMember[] = [
  { _id: 'u1', name: 'Arun Menon', email: 'arun.menon@jobnest.com', employeeId: 'EMP-2000', mobile: '+91 9876543210', status: 'Active', targetAmount: 500000, achievedAmount: 378000, targetLeads: 80, leadsHandled: 62, converted: 38, conversionRate: 61, callsToday: 14, emailsToday: 7, joinedDate: '12 Jan 2025', lastActive: '2 min ago' },
  { _id: 'u2', name: 'Deepa Krishnan', email: 'deepa.krishnan@jobnest.com', employeeId: 'EMP-2001', mobile: '+91 9765432109', status: 'Active', targetAmount: 450000, achievedAmount: 432000, targetLeads: 75, leadsHandled: 71, converted: 52, conversionRate: 73, callsToday: 18, emailsToday: 11, joinedDate: '05 Feb 2025', lastActive: '15 min ago' },
  { _id: 'u3', name: 'Farhan Ali', email: 'farhan.ali@jobnest.com', employeeId: 'EMP-2002', mobile: '+91 9654321098', status: 'Active', targetAmount: 400000, achievedAmount: 285000, targetLeads: 70, leadsHandled: 45, converted: 27, conversionRate: 60, callsToday: 9, emailsToday: 4, joinedDate: '20 Mar 2025', lastActive: '1 hr ago' },
  { _id: 'u4', name: 'Geeta Rao', email: 'geeta.rao@jobnest.com', employeeId: 'EMP-2003', mobile: '+91 9543210987', status: 'Inactive', targetAmount: 350000, achievedAmount: 121000, targetLeads: 60, leadsHandled: 22, converted: 10, conversionRate: 45, callsToday: 0, emailsToday: 0, joinedDate: '08 Apr 2025', lastActive: '3 days ago' },
  { _id: 'u5', name: 'Harish Bhatt', email: 'harish.bhatt@jobnest.com', employeeId: 'EMP-2004', mobile: '+91 9432109876', status: 'Active', targetAmount: 420000, achievedAmount: 396000, targetLeads: 72, leadsHandled: 68, converted: 55, conversionRate: 81, callsToday: 22, emailsToday: 9, joinedDate: '15 Jan 2025', lastActive: 'Just now' },
  { _id: 'u6', name: 'Isha Kapoor', email: 'isha.kapoor@jobnest.com', employeeId: 'EMP-2005', mobile: '+91 9321098765', status: 'Active', targetAmount: 380000, achievedAmount: 249000, targetLeads: 65, leadsHandled: 48, converted: 31, conversionRate: 65, callsToday: 11, emailsToday: 6, joinedDate: '01 May 2025', lastActive: '30 min ago' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function fmtINR(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}
function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-cyan-500 to-teal-500',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const st = status || 'Active';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
      st === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {st}
    </span>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
        {type === 'success' ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
      </div>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, index, router, onToggleStatus, onRemove }: { member: TeamMember; index: number; router: ReturnType<typeof useRouter>; onToggleStatus: (id: string, st: string) => void; onRemove: (id: string) => void }) {
  const pct = Math.min(100, member.targetAmount > 0 ? Math.round((member.achievedAmount / member.targetAmount) * 100) : 0);
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const progressColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 flex flex-col gap-4 relative overflow-hidden group transition-shadow"
    >
      {/* Decorative top gradient strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-70`} />

      {/* Header */}
      <div className="flex items-start gap-3 pt-1">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0`}>
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate">{member.name}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{member.employeeId}</p>
        </div>
        <StatusBadge status={member.status} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Revenue Target</span>
          <span className={`text-[11px] font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>{pct}%</span>
        </div>
        <ProgressBar value={member.achievedAmount} max={member.targetAmount} color={progressColor} />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-500">{fmtINR(member.achievedAmount)} achieved</span>
          <span className="text-[10px] text-slate-400">/ {fmtINR(member.targetAmount)}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Leads', value: member.leadsHandled, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Converted', value: member.converted, bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Conv%', value: `${member.conversionRate}%`, bg: 'bg-violet-50', text: 'text-violet-700' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
            <p className={`text-sm font-bold ${s.text}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chips */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f] rounded-full px-3 py-1">
          <Phone className="w-3 h-3 text-blue-500" />
          <span className="text-[11px] font-semibold text-slate-600">{member.callsToday} calls</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f] rounded-full px-3 py-1">
          <Mail className="w-3 h-3 text-violet-500" />
          <span className="text-[11px] font-semibold text-slate-600">{member.emailsToday} emails</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/sales-manager/team/${member._id}`)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] hover:text-blue-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </button>
          <button
            onClick={() => router.push(`/sales-manager/team/${member._id}?tab=target`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Target className="w-3 h-3" />
            Set Target
          </button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-[#1f1f1f]">
          <button
            onClick={() => onToggleStatus(member._id, member.status === 'Active' ? 'Inactive' : 'Active')}
            className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            Toggle Status
          </button>
          <button
            onClick={() => onRemove(member._id)}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Remove Member
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SalesManagerTeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addParam = searchParams.get('add');

  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [managerTarget, setManagerTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManagerTargetModal, setShowManagerTargetModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPrio, setBroadcastPrio] = useState('Normal');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalsList, setApprovalsList] = useState([
    { id: 'app-1', title: 'Leave Request — Arjun Mehta', type: 'Leave', status: 'Pending', date: '2026-06-28' },
    { id: 'app-2', title: 'Special Discount 15% — Sunita Sharma', type: 'Discount', status: 'Pending', date: '2026-06-29' }
  ]);

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      await smUpdateMemberStatus(id, newStatus);
      setMembers(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
      setToast({ message: `Member status updated to ${newStatus}`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to update member status', type: 'error' });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
    try {
      await smRemoveMember(id);
      setMembers(prev => prev.filter(m => m._id !== id));
      setToast({ message: 'Member removed successfully', type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to remove member', type: 'error' });
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    try {
      await smBroadcast({ message: broadcastMsg, priority: broadcastPrio });
      setToast({ message: 'Broadcast message sent to entire team!', type: 'success' });
      setShowBroadcastModal(false);
      setBroadcastMsg('');
    } catch (e) {
      setToast({ message: 'Failed to send broadcast', type: 'error' });
    }
  };

  const handleApproveRequest = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await smApprove({ requestId: id, type: 'general', decision });
      setApprovalsList(prev => prev.map(a => a.id === id ? { ...a, status: decision === 'approved' ? 'Approved' : 'Rejected' } : a));
      setToast({ message: `Request ${decision} successfully`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to process approval', type: 'error' });
    }
  };

  // Email validation checking states
  const [emailCheckErr, setEmailCheckErr] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (addParam === 'true') {
      setShowAddModal(true);
      router.replace('/sales-manager/team');
    }
  }, [addParam, router]);

  useEffect(() => {
    if (showAddModal) {
      setAddForm({
        name: '',
        email: '',
        employeeId: '',
        mobile: '',
        password: generatePassword(),
        autoGenPassword: true,
        sendCredentials: true,
      });
      setEmailCheckErr('');
      setEmailAvailable(null);
      setCheckingEmail(false);
    }
  }, [showAddModal]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [addForm, setAddForm] = useState<AddFormState>({
    name: '',
    email: '',
    employeeId: '',
    mobile: '',
    password: '',
    autoGenPassword: false,
    sendCredentials: true,
  });

  const handleEmailBlur = useCallback(async () => {
    const trimmed = addForm.email.trim();
    if (!trimmed) {
      setEmailAvailable(null);
      setEmailCheckErr('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailAvailable(false);
      setEmailCheckErr('Please enter a valid email address.');
      return;
    }

    setCheckingEmail(true);
    setEmailCheckErr('');
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
      const available = response.data?.data?.available;
      setEmailAvailable(available);
      if (!available) {
        setEmailCheckErr('This email is already in use. Try a different one.');
      } else {
        setEmailCheckErr('');
      }
    } catch (err: any) {
      console.error('Email check failed:', err);
    } finally {
      setCheckingEmail(false);
    }
  }, [addForm.email]);

  // Load team
  useEffect(() => {
    async function load() {
      try {
        const data = await smGetTeam();
        const fetchedMembers = Array.isArray(data?.members) ? data.members : (Array.isArray(data) ? data : []);
        if (fetchedMembers.length > 0) {
          const mapped = fetchedMembers.map((m: any) => ({
            ...m,
            _id: m.id || m._id,
            leadsHandled: m.leadsTotal || 0,
            converted: m.leadsConverted || 0,
          }));
          setMembers(mapped);
          if (data?.target) {
            setManagerTarget(data.target);
          }
        } else {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-generate password toggle
  useEffect(() => {
    if (addForm.autoGenPassword) {
      setAddForm(f => ({ ...f, password: generatePassword() }));
    }
  }, [addForm.autoGenPassword]);

  // Derived stats
  const activeCount = members.filter(m => m.status === 'Active').length;
  const avgConversion = members.length
    ? Math.round(members.reduce((s, m) => s + (m.conversionRate || 0), 0) / members.length)
    : 0;
  const topPerformer = members.length
    ? members.reduce((a, b) => (a.achievedAmount > b.achievedAmount ? a : b), members[0])
    : null;

  // Leaderboard top 5
  const leaderboard = [...members]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  // Performance comparison (top 6 by leads)
  const perfChart = [...members]
    .sort((a, b) => b.leadsHandled - a.leadsHandled)
    .slice(0, 6);
  const maxLeads = perfChart.length ? Math.max(...perfChart.map(m => m.leadsHandled), 1) : 1;

  // Filtered members
  const filtered = members.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Form handlers
  const handleAddChange = useCallback(
    (key: keyof AddFormState, value: string | boolean) => {
      setAddForm(f => ({ ...f, [key]: value }));
    },
    []
  );

  const handleCopyPassword = useCallback(() => {
    navigator.clipboard.writeText(addForm.password).then(() => {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    });
  }, [addForm.password]);

  const handleSubmit = async () => {
    if (!addForm.name || !addForm.email || !addForm.employeeId) {
      setToast({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    if (emailAvailable === false) {
      setEmailCheckErr('This email is already in use. Try a different one.');
      setToast({ message: 'This email is already in use. Try a different one.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await smAddExecutive({
        name: addForm.name,
        email: addForm.email,
        employeeId: addForm.employeeId,
        mobile: addForm.mobile || undefined,
        password: addForm.password || undefined,
      });
      setToast({ message: `${addForm.name} added successfully!`, type: 'success' });
      setShowAddModal(false);
      setAddForm({ name: '', email: '', employeeId: '', mobile: '', password: '', autoGenPassword: false, sendCredentials: true });
      // Refresh team
      const data = await smGetTeam();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setEmailCheckErr('This email is already in use. Try a different one.');
        setEmailAvailable(false);
        setToast({ message: 'This email is already in use. Try a different one.', type: 'error' });
        return;
      }
      setToast({ message: err.response?.data?.message || 'Failed to add executive. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Team</h1>
            <p className="text-xs text-slate-500 mt-0.5">Sales Executives</p>
          </div>
          <span className="ml-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
            {members.length} Members
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1">
            {(['All', 'Active', 'Inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === s
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search member..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all w-48"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/25"
          >
            <UserPlus className="w-4 h-4" />
            Add Executive
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/25"
          >
            <Mail className="w-4 h-4" />
            Broadcast
          </button>
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#059669] text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/25"
          >
            <Shield className="w-4 h-4" />
            Approvals
          </button>
        </div>
      </motion.div>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Members',
            value: members.length,
            icon: Users,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trend: '+2 this month',
            trendUp: true,
          },
          {
            label: 'Active',
            value: activeCount,
            icon: UserCheck,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            trend: `${members.length - activeCount} inactive`,
            trendUp: false,
          },
          {
            label: 'Avg Conversion',
            value: `${avgConversion}%`,
            icon: TrendingUp,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            trend: '+4% vs last month',
            trendUp: true,
          },
          {
            label: 'Top Performer',
            value: topPerformer ? topPerformer.name.split(' ')[0] : '—',
            icon: Star,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            trend: topPerformer ? `${topPerformer.conversionRate}% conv rate` : '',
            trendUp: true,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate">{s.value}</p>
              <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              {s.trend && (
                <p className={`text-[10px] font-semibold mt-0.5 ${s.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {s.trend}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid: Cards + Sidebar ─────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* Team Cards Grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No members found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
              {filtered.map((member, i) => (
                <MemberCard key={member._id} member={member} index={i} router={router} onToggleStatus={handleToggleStatus} onRemove={handleRemove} />
              ))}
            </div>
          )}

          {/* ── Performance Comparison Chart ──────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-white rounded-2xl border border-slate-200/60 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Performance Comparison</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Leads Handled</span>
            </div>
            <div className="space-y-3">
              {perfChart.map((m, i) => {
                const pct = maxLeads > 0 ? Math.round((m.leadsHandled / maxLeads) * 100) : 0;
                const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
                return (
                  <div key={m._id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                      {getInitials(m.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-700">{m.name.split(' ')[0]}</span>
                        <span className="text-[11px] font-bold text-slate-600">{m.leadsHandled}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${grad}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Leaderboard Sidebar (xl+) ──────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0"
        >
          {/* Leaderboard card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Leaderboard</h3>
              <span className="ml-auto text-[10px] text-slate-400 font-medium">By Conversion</span>
            </div>
            <div className="space-y-3">
              {leaderboard.map((m, i) => {
                const rankColors = [
                  'bg-amber-400 text-white',
                  'bg-slate-400 text-white',
                  'bg-orange-400 text-white',
                  'bg-blue-100 text-blue-700',
                  'bg-slate-100 text-slate-600',
                ];
                const grad = AVATAR_GRADIENTS[
                  members.findIndex(x => x._id === m._id) % AVATAR_GRADIENTS.length
                ];
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition-colors cursor-pointer group"
                    onClick={() => router.push(`/sales-manager/team/${m._id}`)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${rankColors[i]}`}>
                      {i + 1}
                    </span>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                      {getInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate">{m.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-500">{m.conversionRate}% conv</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Activity pulse card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Today's Activity</h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: Phone, label: 'Total Calls', value: members.reduce((s, m) => s + m.callsToday, 0), color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Mail, label: 'Emails Sent', value: members.reduce((s, m) => s + m.emailsToday, 0), color: 'text-violet-600', bg: 'bg-violet-50' },
                { icon: Zap, label: 'Active Now', value: members.filter(m => m.status === 'Active').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                { icon: Shield, label: 'On Target', value: members.filter(m => m.achievedAmount / m.targetAmount >= 0.7).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-600 flex-1">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick target update hint */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <Target className="w-7 h-7 mb-3 opacity-80" />
            <p className="text-sm font-bold mb-1">Set Monthly Targets</p>
            <p className="text-[11px] opacity-75 mb-3">Assign revenue & lead targets to keep your team focused.</p>
            <button
              onClick={() => setShowManagerTargetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-[11px] font-semibold transition-colors"
            >
              Manage Targets <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.aside>
      </div>

      {/* ── Add Executive Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Add Sales Executive</h2>
                  <p className="text-[11px] text-slate-500">Fill in the details to onboard a new team member</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="ml-auto w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={addForm.name}
                    onChange={e => handleAddChange('name', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={e => {
                        handleAddChange('email', e.target.value);
                        setEmailAvailable(null);
                        setEmailCheckErr('');
                      }}
                      onBlur={handleEmailBlur}
                      placeholder="priya.sharma@jobnest.com"
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#161616] border rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                        emailCheckErr ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                      }`}
                    />
                    {checkingEmail && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    {!checkingEmail && emailAvailable === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm" title="Email available">✓</span>
                    )}
                    {!checkingEmail && emailAvailable === false && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm" title="Email already in use">✗</span>
                    )}
                  </div>
                  {emailCheckErr && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">{emailCheckErr}</p>
                  )}
                </div>

                {/* Employee ID + Mobile row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={addForm.employeeId}
                      onChange={e => handleAddChange('employeeId', e.target.value)}
                      placeholder="EMP-2050"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">Mobile</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={addForm.mobile}
                        onChange={e => handleAddChange('mobile', e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Password</label>
                    <button
                      type="button"
                      onClick={() => handleAddChange('autoGenPassword', !addForm.autoGenPassword)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        addForm.autoGenPassword
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Auto-generate
                    </button>
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={addForm.password}
                      onChange={e => handleAddChange('password', e.target.value)}
                      readOnly={addForm.autoGenPassword}
                      placeholder="Enter password or auto-generate"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all ${
                        addForm.autoGenPassword ? 'bg-blue-50 border-blue-200 font-mono tracking-wider' : 'bg-slate-50 dark:bg-[#161616] border-slate-200'
                      }`}
                    />
                    {addForm.password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy password"
                      >
                        {copiedPassword ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Send credentials */}
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <div
                    onClick={() => handleAddChange('sendCredentials', !addForm.sendCredentials)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      addForm.sendCredentials ? 'bg-[#2563EB] border-blue-600' : 'bg-white border-slate-300'
                    }`}
                  >
                    {addForm.sendCredentials && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">Send Login Credentials</p>
                    <p className="text-[11px] text-slate-500">Email login details to the executive</p>
                  </div>
                  <Mail className="w-4 h-4 text-slate-400 ml-auto" />
                </label>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || checkingEmail || emailAvailable === false}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-500/25"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Executive
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manager Targets Modal ───────────────────────────── */}
      <AnimatePresence>
        {showManagerTargetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowManagerTargetModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Set Monthly Target</h2>
                  <p className="text-[11px] text-slate-500">Define your team's overall goals</p>
                </div>
                <button
                  onClick={() => setShowManagerTargetModal(false)}
                  className="ml-auto w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form 
                className="p-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  try {
                    await smUpdateTargets({
                      revenueTarget: parseFloat(fd.get('revenueTarget') as string),
                      leadsTarget: parseInt(fd.get('leadsTarget') as string, 10),
                    });
                    setToast({ message: 'Targets updated successfully', type: 'success' });
                    setShowManagerTargetModal(false);
                    const data = await smGetTeam();
                    if (data?.target) setManagerTarget(data.target);
                  } catch (err: any) {
                    setToast({ message: 'Failed to update targets', type: 'error' });
                  }
                }}
              >
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Revenue Target (₹)
                  </label>
                  <input
                    name="revenueTarget"
                    type="number"
                    defaultValue={managerTarget?.revenue_target || 0}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Leads Target
                  </label>
                  <input
                    name="leadsTarget"
                    type="number"
                    defaultValue={managerTarget?.leads_target || 0}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2563EB] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                  >
                    Save Targets
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Broadcast Modal ── */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowBroadcastModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Broadcast Message</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Send instant alert to entire team</p>
                  </div>
                </div>
                <button onClick={() => setShowBroadcastModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>
              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Priority Level</label>
                  <select value={broadcastPrio} onChange={e => setBroadcastPrio(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent / Immediate</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message Content</label>
                  <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} required rows={4} placeholder="Enter your announcement here..."
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
                </div>
                <button type="submit"
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                  Send Broadcast
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Approvals Modal ── */}
      <AnimatePresence>
        {showApproveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowApproveModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Pending Approvals</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Review requests from team executives</p>
                  </div>
                </div>
                <button onClick={() => setShowApproveModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {approvalsList.map(item => (
                  <div key={item.id} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>{item.type}</span>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{item.date}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: item.status === 'Approved' ? '#059669' : item.status === 'Rejected' ? '#DC2626' : '#F59E0B', fontWeight: 600, marginTop: 4 }}>
                        Status: {item.status}
                      </div>
                    </div>
                    {item.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApproveRequest(item.id, 'approved')}
                          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Approve
                        </button>
                        <button onClick={() => handleApproveRequest(item.id, 'rejected')}
                          style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #DC2626', background: 'transparent', color: '#DC2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function SalesManagerTeamPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SalesManagerTeamPageContent />
    </Suspense>
  );
}
