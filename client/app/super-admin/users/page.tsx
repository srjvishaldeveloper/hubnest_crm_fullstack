'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { exportToCSV } from '../../../services/csvExport';
import api from '../../../services/api';
import { z } from 'zod';
import {
  Search, Plus, Filter, Download, Eye, Pencil, Ban, Trash2,
  Users, UserCheck, UserX, ChevronDown, X, Check, Key,
  RefreshCw, Sparkles, TrendingUp, BarChart3, AlertTriangle,
  CheckCircle2, SortAsc, SortDesc, Shield, Mail, Phone,
  Calendar, Activity, UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar
} from 'recharts';

type UserStatus = 'Active' | 'Inactive' | 'Blocked';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  company: string;
  status: UserStatus;
  lastLogin: string;
  avatar: string;
  phone?: string;
  joinedDate?: string;
  leadsHandled?: number;
  actionsPerformed?: number;
}

const MOCK_USERS: UserRecord[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@crm.com', employeeId: 'EMP001', role: 'Sales Executive', department: 'Sales', company: 'HubNest Ltd', status: 'Active', lastLogin: '16 May 10:30 AM', avatar: 'RS', phone: '+91 98765 43210', joinedDate: '2024-01-15', leadsHandled: 89, actionsPerformed: 156 },
  { id: '2', name: 'Neha Verma', email: 'neha@crm.com', employeeId: 'EMP002', role: 'Marketing Manager', department: 'Marketing', company: 'HubNest Ltd', status: 'Active', lastLogin: '16 May 09:15 AM', avatar: 'NV', phone: '+91 97654 32109', joinedDate: '2024-02-10', leadsHandled: 45, actionsPerformed: 112 },
  { id: '3', name: 'Amit Patel', email: 'amit@crm.com', employeeId: 'EMP003', role: 'Support Agent', department: 'Support', company: 'DataFirm Pvt', status: 'Active', lastLogin: '16 May 11:20 AM', avatar: 'AP', phone: '+91 96543 21098', joinedDate: '2024-01-20', leadsHandled: 0, actionsPerformed: 204 },
  { id: '4', name: 'Priya Singh', email: 'priya@crm.com', employeeId: 'EMP004', role: 'Finance Executive', department: 'Finance', company: 'TechBase Corp', status: 'Inactive', lastLogin: '15 May 04:45 PM', avatar: 'PS', phone: '+91 95432 10987', joinedDate: '2024-03-01', leadsHandled: 0, actionsPerformed: 34 },
  { id: '5', name: 'Vikram Joshi', email: 'vikram@crm.com', employeeId: 'EMP005', role: 'Admin', department: 'Administration', company: 'HubNest Ltd', status: 'Active', lastLogin: '16 May 08:30 AM', avatar: 'VJ', phone: '+91 94321 09876', joinedDate: '2024-01-01', leadsHandled: 0, actionsPerformed: 420 },
  { id: '6', name: 'Sanjana Reddy', email: 'sanjana@crm.com', employeeId: 'EMP006', role: 'Sales Executive', department: 'Sales', company: 'DataFirm Pvt', status: 'Active', lastLogin: '12 May 03:20 PM', avatar: 'SR', phone: '+91 93210 98765', joinedDate: '2024-02-15', leadsHandled: 60, actionsPerformed: 98 },
  { id: '7', name: 'Karan Mehta', email: 'karan@crm.com', employeeId: 'EMP007', role: 'Marketing Executive', department: 'Marketing', company: 'TechBase Corp', status: 'Inactive', lastLogin: '10 May 02:10 PM', avatar: 'KM', phone: '+91 92109 87654', joinedDate: '2024-04-01', leadsHandled: 28, actionsPerformed: 22 },
  { id: '8', name: 'Pooja Gupta', email: 'pooja@crm.com', employeeId: 'EMP008', role: 'Support Agent', department: 'Support', company: 'HubNest Ltd', status: 'Blocked', lastLogin: '08 May 11:30 AM', avatar: 'PG', phone: '+91 91098 76543', joinedDate: '2024-03-15', leadsHandled: 0, actionsPerformed: 8 },
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', actions: 120 }, { day: 'Tue', actions: 240 }, { day: 'Wed', actions: 180 },
  { day: 'Thu', actions: 310 }, { day: 'Fri', actions: 280 }, { day: 'Sat', actions: 90 }, { day: 'Sun', actions: 40 }
];
const AI_INSIGHTS = [
  { text: '12 inactive users — review and deactivate if needed', badge: 'Audit', color: 'bg-amber-50 border-amber-200 text-amber-800', bcolor: 'bg-amber-100 text-amber-700' },
  { text: '3 users need role reassignment based on activity', badge: 'Roles', color: 'bg-blue-50 border-blue-200 text-blue-800', bcolor: 'bg-blue-100 text-blue-700' },
  { text: '5 high performers deserve recognition', badge: 'HR', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', bcolor: 'bg-emerald-100 text-emerald-700' },
  { text: '2 security alerts require immediate attention', badge: 'Security', color: 'bg-red-50 border-red-200 text-red-800', bcolor: 'bg-red-100 text-red-700' },
];

function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<string, string> = { Active: 'bg-emerald-50 text-emerald-700 border-emerald-200', Inactive: 'bg-amber-50 text-amber-700 border-amber-200', Blocked: 'bg-red-50 text-red-700 border-red-200' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[status]}`}><span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />{status}</span>;
}

function Toast({ msg, type, onClose }: { msg: string; type: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}<button onClick={onClose}><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'Blocked'>('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'Overview' | 'Activity' | 'Permissions' | 'Security'>('Overview');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Sales Executive');
  const [newDept, setNewDept] = useState('Sales');
  const [newCompany, setNewCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data?.success && res.data.data.users?.length) setUsers(res.data.data.users);
      else setUsers(MOCK_USERS);
    } catch { setUsers(MOCK_USERS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleStatusChange(user: UserRecord, status: UserStatus) {
    try {
      await api.patch(`/auth/users/${user.id}/status`, { status });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, status } : prev);
      showToast(`User ${status === 'Blocked' ? 'blocked' : status === 'Active' ? 'activated' : 'deactivated'}`);
    } catch { showToast('Failed to update status', 'error'); }
  }

  async function handleResetPassword(user: UserRecord) {
    try {
      await api.post(`/auth/users/${user.id}/reset-password`);
      showToast(`Password reset email sent to ${user.email}`);
    } catch { showToast('Password reset failed', 'error'); }
  }

  async function handleDelete(user: UserRecord) {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await api.delete(`/auth/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast('User deleted');
    } catch { showToast('Delete failed', 'error'); }
  }

  async function handleBulkAction(action: string) {
    if (!selectedIds.length) return;
    try {
      await api.post('/auth/users/bulk', { ids: selectedIds, action });
      await fetchUsers();
      setSelectedIds([]);
      showToast(`Bulk ${action} applied to ${selectedIds.length} users`);
    } catch { showToast('Bulk action failed', 'error'); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/create-user', { name: newName, email: newEmail, role: newRole, department: newDept });
      const u: UserRecord = {
        id: res.data?.data?.id || String(Date.now()), name: newName, email: newEmail,
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: newRole, department: newDept, company: newCompany || 'HubNest Ltd',
        status: 'Active', lastLogin: 'Never', avatar: newName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      };
      setUsers(prev => [u, ...prev]);
      setShowAddModal(false);
      setNewName(''); setNewEmail('');
      showToast('User created successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally { setSubmitting(false); }
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    blocked: users.filter(u => u.status === 'Blocked').length,
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
        (u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.employeeId?.toLowerCase().includes(s)) &&
        (activeTab === 'All' || u.status === activeTab) &&
        (selectedRole === 'All' || u.role === selectedRole) &&
        (selectedCompany === 'All' || u.company === selectedCompany)
      );
    }).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-desc') return new Date(b.joinedDate || '').getTime() - new Date(a.joinedDate || '').getTime();
      return new Date(a.joinedDate || '').getTime() - new Date(b.joinedDate || '').getTime();
    });
  }, [users, search, activeTab, selectedRole, selectedCompany, sortBy]);

  const allRoles = useMemo(() => ['All', ...Array.from(new Set(users.map(u => u.role)))], [users]);
  const allCompanies = useMemo(() => ['All', ...Array.from(new Set(users.map(u => u.company).filter(Boolean)))], [users]);

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#78350f,#F59E0B 45%,#d97706)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-extrabold">Platform Users</h1>
            <p className="text-amber-200 text-xs mt-1">Manage all users across every tenant and module</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchUsers()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => exportToCSV(filtered, 'platform-users')} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"><Download className="w-4 h-4" /></button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 transition">
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', val: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'All' as const },
          { label: 'Active', val: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'Active' as const },
          { label: 'Inactive', val: stats.inactive, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'Inactive' as const },
          { label: 'Blocked', val: stats.blocked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50', tab: 'Blocked' as const },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }} onClick={() => setActiveTab(s.tab)}
            className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
            <p className="text-xl font-bold text-[#0F172A] dark:text-white">{s.val}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Analytics Toggle */}
      <div>
        <button onClick={() => setShowAnalytics(p => !p)} className="flex items-center gap-2 text-xs text-slate-500 font-semibold hover:text-[#F59E0B] transition mb-3">
          <BarChart3 className="w-4 h-4" />{showAnalytics ? 'Hide' : 'Show'} Analytics
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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
                  {rolePieData.map(d => <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</div>)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Weekly Activity</h3>
                <div className="h-40" style={{ minHeight: 160 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <LineChart data={WEEKLY_ACTIVITY}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /><Line type="monotone" dataKey="actions" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-500" />AI Recommendations</h3>
                <div className="space-y-2">
                  {AI_INSIGHTS.map((ins, i) => (
                    <div key={i} className={`p-2.5 rounded-xl border text-[11px] leading-snug ${ins.color}`}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mr-1 ${ins.bcolor}`}>{ins.badge}</span>{ins.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f]">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-slate-100 dark:border-[#1f1f1f] flex-wrap">
          {(['All', 'Active', 'Inactive', 'Blocked'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === t ? 'bg-[#F59E0B] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t} ({t === 'All' ? stats.total : t === 'Active' ? stats.active : t === 'Inactive' ? stats.inactive : stats.blocked})
            </button>
          ))}
          <div className="flex-1" />
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
              <button onClick={() => handleBulkAction('activate')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition">Activate</button>
              <button onClick={() => handleBulkAction('block')} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition">Block</button>
            </div>
          )}
        </div>
        {/* Search + Filter */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-[#1f1f1f] flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none" />
          </div>
          <button onClick={() => setShowFilters(p => !p)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${showFilters ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 flex flex-wrap gap-3 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none">
                  {allRoles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Company</label>
                <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none">
                  {allCompanies.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Sort</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none">
                  <option value="name-asc">Name A→Z</option><option value="name-desc">Name Z→A</option>
                  <option value="date-desc">Newest First</option><option value="date-asc">Oldest First</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table + Drawer */}
        <div className={`grid ${selectedUser ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} gap-0`}>
          <div className={selectedUser ? 'lg:col-span-7' : ''}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                    <th className="px-4 py-3 w-8"><input type="checkbox" className="rounded" onChange={e => { if (e.target.checked) setSelectedIds(filtered.map(u => u.id)); else setSelectedIds([]); }} checked={selectedIds.length === filtered.length && filtered.length > 0} /></th>
                    {['User', 'Emp ID', 'Company', 'Role', 'Status', 'Last Login', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }}
                        className={`border-b border-slate-50 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition cursor-pointer ${selectedUser?.id === u.id ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rounded" checked={selectedIds.includes(u.id)} onChange={e => { if (e.target.checked) setSelectedIds(p => [...p, u.id]); else setSelectedIds(p => p.filter(x => x !== u.id)); }} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.status === 'Blocked' ? 'bg-red-400' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>{u.avatar}</div>
                            <div><p className="text-sm font-semibold text-[#0F172A] dark:text-white">{u.name}</p><p className="text-[10px] text-slate-400">{u.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{u.employeeId}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{u.company}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-medium rounded-lg">{u.role}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{u.lastLogin}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }} className="p-1.5 hover:bg-blue-50 rounded-lg transition text-slate-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleResetPassword(u)} className="p-1.5 hover:bg-amber-50 rounded-lg transition text-slate-400 hover:text-amber-600"><Key className="w-3.5 h-3.5" /></button>
                            {u.status !== 'Blocked' ? <button onClick={() => handleStatusChange(u, 'Blocked')} className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600"><Ban className="w-3.5 h-3.5" /></button>
                              : <button onClick={() => handleStatusChange(u, 'Active')} className="p-1.5 hover:bg-emerald-50 rounded-lg transition text-slate-400 hover:text-emerald-600"><Unlock className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => handleDelete(u)} className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-[#1f1f1f]">Showing {filtered.length} of {users.length} users</div>
              </div>
            )}
          </div>

          {/* Drawer */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-5 border-l border-slate-100 dark:border-[#1f1f1f]">
                <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">User Detail</h3>
                    <button onClick={() => setSelectedUser(null)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${selectedUser.status === 'Blocked' ? 'bg-red-400' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>{selectedUser.avatar}</div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">{selectedUser.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1"><StatusBadge status={selectedUser.status} /><span className="text-[10px] text-slate-400 font-mono">{selectedUser.employeeId}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleResetPassword(selectedUser)} className="flex-1 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 transition"><Key className="w-3 h-3" />Reset Pwd</button>
                    {selectedUser.status !== 'Blocked' ? <button onClick={() => handleStatusChange(selectedUser, 'Blocked')} className="flex-1 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition"><Ban className="w-3 h-3" />Block</button>
                      : <button onClick={() => handleStatusChange(selectedUser, 'Active')} className="flex-1 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 transition"><Unlock className="w-3 h-3" />Activate</button>}
                    <button onClick={() => handleDelete(selectedUser)} className="flex-1 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition"><Trash2 className="w-3 h-3" />Delete</button>
                  </div>
                </div>
                <div className="flex border-b border-slate-100 dark:border-[#1f1f1f]">
                  {(['Overview', 'Activity', 'Permissions', 'Security'] as const).map(t => (
                    <button key={t} onClick={() => setDrawerTab(t)} className={`flex-1 py-2.5 text-[11px] font-semibold transition border-b-2 ${drawerTab === t ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
                  ))}
                </div>
                <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {drawerTab === 'Overview' && (
                      <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {[
                          { icon: Mail, label: 'Email', val: selectedUser.email },
                          { icon: Phone, label: 'Phone', val: selectedUser.phone || 'N/A' },
                          { icon: Calendar, label: 'Joined', val: selectedUser.joinedDate || 'N/A' },
                          { icon: Shield, label: 'Role', val: selectedUser.role },
                          { icon: Activity, label: 'Department', val: selectedUser.department },
                          { icon: Building2, label: 'Company', val: selectedUser.company },
                        ].map(f => (
                          <div key={f.label} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-[#222] rounded-xl flex items-center justify-center"><f.icon className="w-3.5 h-3.5 text-slate-500" /></div>
                            <div><p className="text-[10px] text-slate-400">{f.label}</p><p className="text-xs font-semibold text-[#0F172A] dark:text-white">{f.val}</p></div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {drawerTab === 'Activity' && (
                      <motion.div key="act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[{ label: 'Actions', val: selectedUser.actionsPerformed || 0 }, { label: 'Leads', val: selectedUser.leadsHandled || 0 }].map(s => (
                            <div key={s.label} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl text-center">
                              <p className="text-base font-bold text-[#0F172A] dark:text-white">{s.val}</p>
                              <p className="text-[10px] text-slate-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Insight</p>
                          <p className="text-[11px] text-amber-600 mt-1">{(selectedUser.actionsPerformed || 0) > 100 ? 'High activity user — consider for promotion.' : 'Below average activity — may need support.'}</p>
                        </div>
                      </motion.div>
                    )}
                    {drawerTab === 'Permissions' && (
                      <motion.div key="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        {['Leads', 'Campaigns', 'Tickets', 'Reports', 'Users'].map(mod => (
                          <div key={mod} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#111] rounded-xl">
                            <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{mod}</span>
                            <div className="flex gap-1.5">
                              {['R', 'W', 'D'].map((p, pi) => <span key={p} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${pi === 0 ? 'bg-emerald-100 text-emerald-700' : pi === 1 && selectedUser.department !== 'Administration' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>{p}</span>)}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Add New User</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {[{ label: 'Full Name', val: newName, set: setNewName, type: 'text', placeholder: 'Full Name' }, { label: 'Email', val: newEmail, set: setNewEmail, type: 'email', placeholder: 'email@company.com' }, { label: 'Company', val: newCompany, set: setNewCompany, type: 'text', placeholder: 'Company Name' }].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} type={f.type} placeholder={f.placeholder} required={f.label !== 'Company'}
                      className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                    <select value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none">
                      {['Sales', 'Marketing', 'Support', 'Finance', 'Administration'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-sm dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-amber-300 outline-none">
                      {['Sales Executive', 'Marketing Executive', 'Support Agent', 'Finance Executive', 'Admin'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" />Creating…</> : 'Create User'}
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

// Local icon
function Building2({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function Unlock({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 019.9-1" /></svg>;
}
