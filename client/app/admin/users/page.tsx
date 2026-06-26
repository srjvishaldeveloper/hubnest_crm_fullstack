'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { exportToCSV } from '../../../services/csvExport';
import { z } from 'zod';
import {
  Search, Plus, Filter, Download, Eye, Pencil, Trash2,
  Users, UserCheck, UserX, ChevronDown, X, Copy, Check,
  ShieldAlert, Sparkles, TrendingUp, Activity, Mail, Phone,
  Calendar, AlertTriangle, RotateCcw, Ban, Shield, Key,
  BarChart3, ArrowUpRight, ArrowDownRight, SortAsc, SortDesc,
  RefreshCw, CheckCircle2, UserPlus, ChevronRight, Lock,
  Unlock, Clock, FileText, Settings
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar
} from 'recharts';

const DEPT_ROLES: Record<string, string[]> = {
  Sales: ['Sales Executive', 'Sales Manager'],
  Marketing: ['Marketing Executive'],
  Support: ['Support Agent', 'Support Manager'],
  Finance: ['Finance Executive'],
};

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .transform(val => val.replace(/[\s\-()]/g, ''))
    .refine(val => {
      if (!val) return true;
      if (val.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(val);
      if (/^[6-9]\d{9}$/.test(val)) return true;
      return false;
    }, 'Invalid phone. Use +919876543210 or 9876543210')
    .optional().or(z.literal('')),
});

interface UserRecord {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  lastLogin: string;
  phone: string;
  joinedDate: string;
  avatar: string;
  leadsHandled: number;
  loginDays: number;
  actionsPerformed: number;
  conversionRate: string;
  dealsClosed: number;
  revenueGenerated: string;
}

const MOCK_USERS: UserRecord[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@crm.com', employeeId: 'EMP001', role: 'Sales Executive', department: 'Sales', status: 'Active', lastLogin: '16 May 10:30 AM', phone: '+91 98765 43210', joinedDate: '2024-01-15', avatar: 'RS', leadsHandled: 89, loginDays: 22, actionsPerformed: 156, conversionRate: '24.5%', dealsClosed: 23, revenueGenerated: '₹12.45L' },
  { id: '2', name: 'Neha Verma', email: 'neha@crm.com', employeeId: 'EMP002', role: 'Marketing Manager', department: 'Marketing', status: 'Active', lastLogin: '16 May 09:15 AM', phone: '+91 97654 32109', joinedDate: '2024-02-10', avatar: 'NV', leadsHandled: 45, loginDays: 20, actionsPerformed: 112, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
  { id: '3', name: 'Amit Patel', email: 'amit@crm.com', employeeId: 'EMP003', role: 'Support Agent', department: 'Support', status: 'Active', lastLogin: '16 May 11:20 AM', phone: '+91 96543 21098', joinedDate: '2024-01-20', avatar: 'AP', leadsHandled: 0, loginDays: 25, actionsPerformed: 204, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
  { id: '4', name: 'Priya Singh', email: 'priya@crm.com', employeeId: 'EMP004', role: 'Finance Executive', department: 'Finance', status: 'Inactive', lastLogin: '15 May 04:45 PM', phone: '+91 95432 10987', joinedDate: '2024-03-01', avatar: 'PS', leadsHandled: 0, loginDays: 8, actionsPerformed: 34, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
  { id: '5', name: 'Vikram Joshi', email: 'vikram@crm.com', employeeId: 'EMP005', role: 'Admin', department: 'Administration', status: 'Active', lastLogin: '16 May 08:30 AM', phone: '+91 94321 09876', joinedDate: '2024-01-01', avatar: 'VJ', leadsHandled: 0, loginDays: 30, actionsPerformed: 420, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
  { id: '6', name: 'Sanjana Reddy', email: 'sanjana@crm.com', employeeId: 'EMP006', role: 'Sales Executive', department: 'Sales', status: 'Active', lastLogin: '12 May 03:20 PM', phone: '+91 93210 98765', joinedDate: '2024-02-15', avatar: 'SR', leadsHandled: 60, loginDays: 18, actionsPerformed: 98, conversionRate: '18.3%', dealsClosed: 11, revenueGenerated: '₹5.2L' },
  { id: '7', name: 'Karan Mehta', email: 'karan@crm.com', employeeId: 'EMP007', role: 'Marketing Executive', department: 'Marketing', status: 'Inactive', lastLogin: '10 May 02:10 PM', phone: '+91 92109 87654', joinedDate: '2024-04-01', avatar: 'KM', leadsHandled: 28, loginDays: 5, actionsPerformed: 22, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
  { id: '8', name: 'Pooja Gupta', email: 'pooja@crm.com', employeeId: 'EMP008', role: 'Support Agent', department: 'Support', status: 'Blocked', lastLogin: '08 May 11:30 AM', phone: '+91 91098 76543', joinedDate: '2024-03-15', avatar: 'PG', leadsHandled: 0, loginDays: 2, actionsPerformed: 8, conversionRate: '—', dealsClosed: 0, revenueGenerated: '—' },
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', actions: 120 }, { day: 'Tue', actions: 240 }, { day: 'Wed', actions: 180 },
  { day: 'Thu', actions: 310 }, { day: 'Fri', actions: 280 }, { day: 'Sat', actions: 90 }, { day: 'Sun', actions: 40 }
];

const AI_INSIGHTS = [
  { text: '12 inactive users — review and deactivate if needed', badge: 'Audit', color: 'bg-amber-50 border-amber-200 text-amber-800', badge_color: 'bg-amber-100 text-amber-700' },
  { text: '3 users need role reassignment based on activity patterns', badge: 'Roles', color: 'bg-blue-50 border-blue-200 text-blue-800', badge_color: 'bg-blue-100 text-blue-700' },
  { text: '5 high performers deserve recognition — promote or reward', badge: 'HR', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', badge_color: 'bg-emerald-100 text-emerald-700' },
  { text: '2 security alerts require immediate attention', badge: 'Security', color: 'bg-red-50 border-red-200 text-red-800', badge_color: 'bg-red-100 text-red-700' },
];

function Toast({ msg, type, onClose }: { msg: string; type: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'Blocked'>('All');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'>('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'Overview' | 'Permissions' | 'Activity' | 'Performance' | 'Security'>('Overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingUser, setEditingUser] = useState(false);

  // Add user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newRole, setNewRole] = useState('Sales Executive');
  const [newDept, setNewDept] = useState('Sales');
  const [newPassword] = useState('Tenant@123!');
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [sendCreds, setSendCreds] = useState(true);
  const [emailErr, setEmailErr] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailCode, setEmailCode] = useState<string | null>(null);
  const [archivedId, setArchivedId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data?.success && res.data.data.users) {
        setUsers(res.data.data.users);
      } else {
        setUsers(MOCK_USERS);
      }
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') setShowAddModal(true);
  }, [searchParams]);

  useEffect(() => {
    if (showAddModal) {
      setNewName(''); setNewEmail(''); setNewPhone('');
      setNewEmployeeId(`EMP-${Math.floor(3100 + Math.random() * 6800)}`);
      setEmailErr(''); setEmailAvailable(null); setCheckingEmail(false);
      setEmailCode(null); setArchivedId(null); setFormErrors({});
    }
  }, [showAddModal]);

  async function handleEmailBlur() {
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      setEmailAvailable(null); setEmailErr(trimmed ? 'Invalid email address' : '');
      return;
    }
    setCheckingEmail(true); setEmailErr(''); setEmailCode(null); setArchivedId(null);
    try {
      const res = await api.get(`/auth/check-email?email=${encodeURIComponent(trimmed)}&_t=${Date.now()}`);
      const d = res.data?.data;
      setEmailAvailable(d?.available);
      setEmailCode(d?.code || null);
      if (!d?.available) {
        if (d?.code === 'USER_ARCHIVED') { setArchivedId(d?.userId); setEmailErr('Email belongs to an archived user.'); }
        else if (d?.code === 'OTHER_TENANT') setEmailErr('Email registered with another company.');
        else setEmailErr('Email already in use. Try a different one.');
      }
    } catch { /* silent */ }
    finally { setCheckingEmail(false); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createUserSchema.safeParse({ name: newName, email: newEmail, phone: newPhone });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { errs[String(issue.path[0])] = issue.message; });
      setFormErrors(errs); return;
    }
    if (emailAvailable === false && emailCode !== 'USER_ARCHIVED') {
      setEmailErr('This email is already in use.'); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/create-user', {
        name: newName, email: newEmail, phone: newPhone,
        employeeId: newEmployeeId, role: newRole, department: newDept,
        password: newPassword, sendCreds,
      });
      if (res.data?.success) {
        const u: UserRecord = {
          id: res.data.data.id || String(Date.now()),
          name: newName, email: newEmail, employeeId: newEmployeeId,
          role: newRole, department: newDept, status: 'Active',
          lastLogin: 'Never', phone: newPhone || '', joinedDate: new Date().toISOString().split('T')[0],
          avatar: newName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          leadsHandled: 0, loginDays: 0, actionsPerformed: 0, conversionRate: '0%', dealsClosed: 0, revenueGenerated: '₹0',
        };
        setUsers(prev => [u, ...prev]);
        setShowAddModal(false);
        showToast('User created successfully!');
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'USER_ARCHIVED') { setArchivedId(err.response?.data?.userId); setEmailCode('USER_ARCHIVED'); setEmailErr('Email belongs to archived user. Restore below.'); }
      else showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally { setSubmitting(false); }
  }

  async function handleRestoreUser() {
    if (!archivedId) return;
    try {
      await api.post(`/auth/users/${archivedId}/restore`);
      await fetchUsers();
      setShowAddModal(false);
      showToast('User restored successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to restore', 'error');
    }
  }

  async function handleStatusChange(user: UserRecord, newStatus: 'Active' | 'Inactive' | 'Blocked') {
    try {
      await api.patch(`/auth/users/${user.id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, status: newStatus } : prev);
      showToast(`User ${newStatus === 'Blocked' ? 'blocked' : newStatus === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  }

  async function handleResetPassword(user: UserRecord) {
    try {
      await api.post(`/auth/users/${user.id}/reset-password`);
      showToast(`Password reset email sent to ${user.email}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  }

  async function handleDeleteUser(user: UserRecord) {
    if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast('User deleted');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  }

  async function handleBulkAction(action: string) {
    if (!selectedIds.length) return;
    try {
      await api.post('/auth/users/bulk', { ids: selectedIds, action });
      await fetchUsers();
      setSelectedIds([]);
      showToast(`Bulk ${action} applied to ${selectedIds.length} users`);
    } catch {
      showToast('Bulk action failed', 'error');
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    blocked: users.filter(u => u.status === 'Blocked').length,
    newMonth: users.filter(u => {
      const d = new Date(u.joinedDate); const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length,
  }), [users]);

  const rolePieData = useMemo(() => {
    const COLORS = { Sales: '#2563EB', Marketing: '#8B5CF6', Support: '#06B6D4', Finance: '#F59E0B', Administration: '#EF4444' };
    const groups: Record<string, number> = {};
    users.forEach(u => { groups[u.department] = (groups[u.department] || 0) + 1; });
    return Object.entries(groups).map(([name, value]) => ({ name, value, color: (COLORS as any)[name] || '#94A3B8' }));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const s = search.toLowerCase();
      return (
        (u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.employeeId.toLowerCase().includes(s)) &&
        (activeTab === 'All' || u.status === activeTab) &&
        (selectedRole === 'All' || u.role === selectedRole) &&
        (selectedDept === 'All' || u.department === selectedDept)
      );
    }).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-desc') return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      if (sortBy === 'date-asc') return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
      return 0;
    });
  }, [users, search, activeTab, selectedRole, selectedDept, sortBy]);

  const allRoles = useMemo(() => ['All', ...Array.from(new Set(users.map(u => u.role)))], [users]);
  const allDepts = useMemo(() => ['All', ...Array.from(new Set(users.map(u => u.department)))], [users]);

  const statusColor = (s: string) =>
    s === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── Banner ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-extrabold">User Management</h1>
            <p className="text-blue-200 text-xs mt-1">Manage and control all CRM users, roles, permissions and activities</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchUsers()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => exportToCSV(filtered, 'users')} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#2563EB] rounded-xl text-sm font-bold hover:bg-blue-50 transition">
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', val: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'All' as const },
          { label: 'Active', val: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'Active' as const },
          { label: 'Inactive', val: stats.inactive, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'Inactive' as const },
          { label: 'Blocked', val: stats.blocked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50', tab: 'Blocked' as const },
          { label: 'New This Month', val: stats.newMonth, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', tab: 'All' as const },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }} onClick={() => setActiveTab(s.tab)}
            className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-[#0F172A] dark:text-white">{s.val}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Analytics Panel Toggle ── */}
      <div>
        <button onClick={() => setShowAnalytics(p => !p)} className="flex items-center gap-2 text-xs text-slate-500 font-semibold hover:text-[#2563EB] transition mb-3">
          <BarChart3 className="w-4 h-4" />{showAnalytics ? 'Hide' : 'Show'} Analytics
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Role pie */}
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Department Breakdown</h3>
                <div className="h-32" style={{ minHeight: 128 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <PieChart><Pie data={rolePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" paddingAngle={3}>
                      {rolePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {rolePieData.map(d => <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.value})</div>)}
                </div>
              </div>
              {/* Weekly activity */}
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">User Activity (This Week)</h3>
                <div className="h-40" style={{ minHeight: 160 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <LineChart data={WEEKLY_ACTIVITY}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                      <Line type="monotone" dataKey="actions" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* AI Insights */}
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-500" />AI Recommendations</h3>
                <div className="space-y-2">
                  {AI_INSIGHTS.map((ins, i) => (
                    <div key={i} className={`p-2.5 rounded-xl border text-[11px] leading-snug ${ins.color}`}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mr-1 ${ins.badge_color}`}>{ins.badge}</span>
                      {ins.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs + Search + Filters ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f]">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-slate-100 dark:border-[#1f1f1f] flex-wrap">
          {(['All', 'Active', 'Inactive', 'Blocked'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === t ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t} {t === 'All' ? `(${stats.total})` : t === 'Active' ? `(${stats.active})` : t === 'Inactive' ? `(${stats.inactive})` : `(${stats.blocked})`}
            </button>
          ))}
          <div className="flex-1" />
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
              <button onClick={() => handleBulkAction('activate')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition">Activate</button>
              <button onClick={() => handleBulkAction('deactivate')} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition">Deactivate</button>
              <button onClick={() => handleBulkAction('block')} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition">Block</button>
            </div>
          )}
        </div>
        {/* Search + Filter Row */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-[#1f1f1f] flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none" />
          </div>
          <button onClick={() => setShowFilters(p => !p)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button onClick={() => setSortBy(s => s === 'name-asc' ? 'name-desc' : 'name-asc')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition">
            {sortBy.endsWith('asc') ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />} Sort
          </button>
        </div>
        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 flex flex-wrap gap-3 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                  className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                  {allRoles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Department</label>
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                  className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                  {allDepts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table / Detail Split ── */}
        <div className={`grid ${selectedUser ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} gap-0`}>
          {/* Table */}
          <div className={selectedUser ? 'lg:col-span-7' : ''}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                      <th className="px-4 py-3 w-8"><input type="checkbox" className="rounded" onChange={e => { if (e.target.checked) setSelectedIds(filtered.map(u => u.id)); else setSelectedIds([]); }} checked={selectedIds.length === filtered.length && filtered.length > 0} /></th>
                      {['User', 'Emp ID', 'Role', 'Status', 'Last Login', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }}
                        className={`border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer ${selectedUser?.id === u.id ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rounded" checked={selectedIds.includes(u.id)} onChange={e => { if (e.target.checked) setSelectedIds(p => [...p, u.id]); else setSelectedIds(p => p.filter(x => x !== u.id)); }} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.status === 'Blocked' ? 'bg-red-400' : 'bg-gradient-to-br from-violet-500 to-blue-500'}`}>{u.avatar}</div>
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{u.employeeId}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-lg">{u.role}</span></td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(u.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : u.status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />{u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{u.lastLogin}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }} className="p-1.5 hover:bg-blue-50 rounded-lg transition text-slate-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleResetPassword(u)} className="p-1.5 hover:bg-amber-50 rounded-lg transition text-slate-400 hover:text-amber-600"><Key className="w-3.5 h-3.5" /></button>
                            {u.status !== 'Blocked' ? <button onClick={() => handleStatusChange(u, 'Blocked')} className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600"><Ban className="w-3.5 h-3.5" /></button>
                              : <button onClick={() => handleStatusChange(u, 'Active')} className="p-1.5 hover:bg-emerald-50 rounded-lg transition text-slate-400 hover:text-emerald-600"><Unlock className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => handleDeleteUser(u)} className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-[#1f1f1f]">
                  Showing {filtered.length} of {users.length} users
                </div>
              </div>
            )}
          </div>

          {/* Detail Drawer */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-5 border-l border-slate-100 dark:border-[#1f1f1f]">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">User Detail</h3>
                    <button onClick={() => setSelectedUser(null)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold ${selectedUser.status === 'Blocked' ? 'bg-red-400' : 'bg-gradient-to-br from-violet-500 to-blue-500'}`}>{selectedUser.avatar}</div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">{selectedUser.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(selectedUser.status)}`}>{selectedUser.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{selectedUser.employeeId}</span>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleResetPassword(selectedUser)} className="flex-1 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 transition"><Key className="w-3 h-3" />Reset Pwd</button>
                    {selectedUser.status !== 'Blocked'
                      ? <button onClick={() => handleStatusChange(selectedUser, 'Blocked')} className="flex-1 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition"><Ban className="w-3 h-3" />Block</button>
                      : <button onClick={() => handleStatusChange(selectedUser, 'Active')} className="flex-1 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 transition"><Unlock className="w-3 h-3" />Activate</button>}
                    {selectedUser.status === 'Active'
                      ? <button onClick={() => handleStatusChange(selectedUser, 'Inactive')} className="flex-1 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-1 transition"><UserX className="w-3 h-3" />Deactivate</button>
                      : <button onClick={() => handleStatusChange(selectedUser, 'Active')} className="flex-1 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 transition"><UserCheck className="w-3 h-3" />Activate</button>}
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100 dark:border-[#1f1f1f]">
                  {(['Overview', 'Permissions', 'Activity', 'Performance', 'Security'] as const).map(t => (
                    <button key={t} onClick={() => setDrawerTab(t)}
                      className={`px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition ${drawerTab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
                  ))}
                </div>
                {/* Tab Content */}
                <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {drawerTab === 'Overview' && (
                      <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        {[{ icon: Mail, label: 'Email', val: selectedUser.email }, { icon: Phone, label: 'Phone', val: selectedUser.phone }, { icon: Calendar, label: 'Joined', val: selectedUser.joinedDate }, { icon: Shield, label: 'Role', val: selectedUser.role }, { icon: Activity, label: 'Department', val: selectedUser.department }].map(f => (
                          <div key={f.label} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-[#222] rounded-xl flex items-center justify-center"><f.icon className="w-3.5 h-3.5 text-slate-500" /></div>
                            <div><p className="text-[10px] text-slate-400">{f.label}</p><p className="text-xs font-semibold text-[#0F172A] dark:text-white">{f.val}</p></div>
                          </div>
                        ))}
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                          <p className="text-[10px] font-bold text-blue-700 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Insight</p>
                          <p className="text-[11px] text-blue-600 mt-1">
                            {selectedUser.loginDays > 20 ? 'Highly active user — consider for promotion or recognition.' : selectedUser.status === 'Inactive' ? 'User has been inactive. Consider follow-up or deactivation.' : 'Performing within expected range.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {drawerTab === 'Activity' && (
                      <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[{ label: 'Login Days', val: selectedUser.loginDays }, { label: 'Actions', val: selectedUser.actionsPerformed }, { label: 'Leads', val: selectedUser.leadsHandled }].map(s => (
                            <div key={s.label} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl text-center">
                              <p className="text-base font-bold text-[#0F172A] dark:text-white">{s.val}</p>
                              <p className="text-[10px] text-slate-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">Recent Activity</p>
                          {['Logged in', 'Updated lead L-1256', 'Closed ticket T-4587'].map((a, i) => (
                            <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 dark:border-[#1f1f1f]">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">{a}</p>
                              <span className="ml-auto text-[10px] text-slate-400">{i === 0 ? '2h ago' : i === 1 ? '5h ago' : '1d ago'}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {drawerTab === 'Performance' && (
                      <motion.div key="perf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {[
                          { label: 'Conversion Rate', val: selectedUser.conversionRate, pct: parseInt(selectedUser.conversionRate) || 0, color: 'bg-blue-500' },
                          { label: 'Deals Closed', val: String(selectedUser.dealsClosed), pct: Math.min(100, selectedUser.dealsClosed * 3), color: 'bg-emerald-500' },
                          { label: 'Revenue Generated', val: selectedUser.revenueGenerated, pct: 75, color: 'bg-violet-500' },
                          { label: 'Target Achievement', val: '78%', pct: 78, color: 'bg-amber-500' },
                        ].map(m => (
                          <div key={m.label}>
                            <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-500">{m.label}</span><span className="font-bold text-[#0F172A] dark:text-white">{m.val}</span></div>
                            <div className="h-1.5 bg-slate-100 dark:bg-[#222] rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.6 }} className={`h-full ${m.color} rounded-full`} />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {drawerTab === 'Permissions' && (
                      <motion.div key="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        <p className="text-[11px] text-slate-500">Current role: <span className="font-bold text-[#0F172A] dark:text-white">{selectedUser.role}</span></p>
                        {[{ module: 'Leads', read: true, write: selectedUser.department === 'Sales', del: false },
                          { module: 'Campaigns', read: true, write: selectedUser.department === 'Marketing', del: false },
                          { module: 'Tickets', read: true, write: selectedUser.department === 'Support', del: false },
                          { module: 'Reports', read: true, write: false, del: false },
                          { module: 'Users', read: false, write: false, del: false },
                        ].map(p => (
                          <div key={p.module} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-[#1f1f1f]">
                            <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{p.module}</span>
                            <div className="flex items-center gap-2">
                              {[{ label: 'R', val: p.read }, { label: 'W', val: p.write }, { label: 'D', val: p.del }].map(f => (
                                <span key={f.label} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${f.val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{f.label}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {drawerTab === 'Security' && (
                      <motion.div key="sec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {[{ label: '2FA Enabled', val: true }, { label: 'Email Verified', val: true }, { label: 'Account Locked', val: selectedUser.status === 'Blocked' }].map(s => (
                          <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                            <span className="text-xs text-slate-600 dark:text-slate-400">{s.label}</span>
                            {s.val ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-300" />}
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleResetPassword(selectedUser)} className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 flex items-center justify-center gap-1 hover:bg-amber-100 transition"><Key className="w-3 h-3" />Reset Password</button>
                          <button onClick={() => handleDeleteUser(selectedUser)} className="flex-1 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center justify-center gap-1 hover:bg-red-100 transition"><Trash2 className="w-3 h-3" />Delete User</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Add New User</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" required
                    className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none" />
                  {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                  <div className="relative">
                    <input value={newEmail} onChange={e => { setNewEmail(e.target.value); setEmailAvailable(null); setEmailErr(''); }}
                      onBlur={handleEmailBlur} placeholder="name@company.com" type="email" required
                      className={`w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 outline-none pr-8 ${emailErr ? 'border-red-300 focus:ring-red-200' : emailAvailable ? 'border-emerald-300 focus:ring-emerald-200' : 'border-slate-200 dark:border-[#2a2a2a] focus:ring-blue-300'}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" /> : emailAvailable === true ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : emailAvailable === false ? <X className="w-3.5 h-3.5 text-red-500" /> : null}
                    </span>
                  </div>
                  {emailErr && <p className="text-[11px] text-red-500 mt-1">{emailErr}</p>}
                  {emailCode === 'USER_ARCHIVED' && archivedId && (
                    <button type="button" onClick={handleRestoreUser} className="mt-2 w-full py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition flex items-center justify-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Restore archived user
                    </button>
                  )}
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                  <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 98765 43210" type="tel"
                    className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none" />
                  {formErrors.phone && <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>}
                </div>
                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Employee ID</label>
                  <input value={newEmployeeId} onChange={e => setNewEmployeeId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
                {/* Department + Role */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Department</label>
                    <select value={newDept} onChange={e => { setNewDept(e.target.value); setNewRole(DEPT_ROLES[e.target.value]?.[0] || 'Sales Executive'); }}
                      className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                      {Object.keys(DEPT_ROLES).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)}
                      className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-blue-300 outline-none">
                      {(DEPT_ROLES[newDept] || []).map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <input value={newPassword} readOnly className="flex-1 border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-[#111] dark:text-white font-mono" />
                    <button type="button" onClick={() => { navigator.clipboard.writeText(newPassword); setCopiedPwd(true); setTimeout(() => setCopiedPwd(false), 2000); }}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-500">
                      {copiedPwd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Send Creds */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendCreds} onChange={e => setSendCreds(e.target.checked)} className="rounded" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Send credentials to user's email</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating…</> : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>}><AdminUsersContent /></Suspense>;
}
