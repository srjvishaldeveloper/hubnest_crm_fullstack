'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { exportToCSV } from '../../../services/csvExport';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, Eye, Pencil, Ban, Trash2,
  Users, UserCheck, UserX, ShieldOff, ChevronDown, UserCircle,
  Loader2
} from 'lucide-react';
import api from '../../../services/api';
import { z } from 'zod';

const editFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .transform(val => val.replace(/\s+/g, '').replace(/-/g, ''))
    .refine(val => !val || /^\+?[0-9]\d{6,14}$/.test(val), "Invalid phone number format (e.g., +919599476483)"),
  status: z.enum(["Active", "Inactive", "Blocked"])
});

type UserStatus = 'Active' | 'Inactive' | 'Blocked';
type UserRole = string;

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
}

function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    Blocked: 'bg-red-50 text-red-700 border-red-200',
  };
  const colorClass = map[status] || map.Inactive;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    'Sales Manager': 'bg-amber-50 text-amber-700',
    'Sales Executive': 'bg-sky-50 text-sky-700',
    'Marketing Head': 'bg-violet-50 text-violet-700',
    'Marketing Executive': 'bg-purple-50 text-purple-700',
    'Support Manager': 'bg-teal-50 text-teal-700',
    'Support Agent': 'bg-cyan-50 text-cyan-700',
    'Finance Executive': 'bg-amber-50 text-amber-700',
    'Admin': 'bg-indigo-50 text-indigo-700',
    'Super Admin': 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${colors[role] || 'bg-slate-100 text-slate-600'}`}>{role}</span>
  );
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get('/super-admin/users');
        if (res.data?.success) {
          setUsers(res.data.data.users);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Need to filter first before selecting all? Or just map filtered.
      setSelectedIds(filtered.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;
    try {
      const res = await api.post('/super-admin/users/bulk-delete', { userIds: selectedIds });
      if (res.data?.success) {
        setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
        setSelectedIds([]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete users');
    }
  };

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', status: '' as UserStatus });

  useEffect(() => {
    if (selectedUser) {
      setEditForm({ name: selectedUser.name, email: selectedUser.email, phone: selectedUser.phone || '', status: selectedUser.status });
    }
  }, [selectedUser]);

  const handleSingleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await api.post('/super-admin/users/bulk-delete', { userIds: [id] });
      if (res.data?.success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    if (!confirm(`Are you sure you want to change status to ${nextStatus}?`)) return;
    try {
      const res = await api.patch(`/super-admin/admins/${id}`, { status: nextStatus });
      if (res.data?.success) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const validatedData = editFormSchema.parse(editForm);
      const res = await api.patch(`/super-admin/admins/${selectedUser.id}`, {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        status: validatedData.status,
      });
      if (res.data?.success) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm, phone: validatedData.phone } : u));
        setSelectedUser(null);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        alert(err.issues[0].message);
        return;
      }
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const stats = useMemo(() => {
    let active = 0, inactive = 0, blocked = 0;
    users.forEach(u => {
      if (u.status === 'Active') active++;
      else if (u.status === 'Blocked') blocked++;
      else inactive++;
    });
    return { total: users.length, active, inactive, blocked };
  }, [users]);

  const uniqueRoles = useMemo(() => Array.from(new Set(users.map(u => u.role))).sort(), [users]);
  const uniqueCompanies = useMemo(() => Array.from(new Set(users.map(u => u.company))).sort(), [users]);
  const uniqueDepartments = useMemo(() => Array.from(new Set(users.map(u => u.department))).sort(), [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.employeeId.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchCompany = companyFilter === 'All' || u.company === companyFilter;
      const matchDepartment = departmentFilter === 'All' || u.department === departmentFilter;
      return matchSearch && matchStatus && matchRole && matchCompany && matchDepartment;
    });
  }, [search, statusFilter, roleFilter, companyFilter, departmentFilter, users]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Loading user directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-[#F59E0B]', bg: 'bg-amber-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Blocked', value: stats.blocked, icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.value}</p>
              <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] font-medium">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#ededed]">Users</h1>
            <span className="px-2.5 py-0.5 bg-amber-50 text-[#F59E0B] text-xs font-bold rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company filter */}
            <div className="relative">
              <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] text-xs font-medium bg-card text-slate-700 dark:text-[#ededed] hover:border-slate-300 dark:hover:border-[#333] transition outline-none">
                <option value="All">All Companies</option>
                {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Department filter */}
            <div className="relative">
              <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] text-xs font-medium bg-card text-slate-700 dark:text-[#ededed] hover:border-slate-300 dark:hover:border-[#333] transition outline-none">
                <option value="All">All Departments</option>
                {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Role filter */}
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] text-xs font-medium bg-card text-slate-700 dark:text-[#ededed] hover:border-slate-300 dark:hover:border-[#333] transition outline-none">
                <option value="All">All Roles</option>
                {uniqueRoles.map(r =>
                  <option key={r} value={r}>{r}</option>
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Status filter */}
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as UserStatus | 'All')}
                className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] text-xs font-medium bg-card text-slate-700 dark:text-[#ededed] hover:border-slate-300 dark:hover:border-[#333] transition outline-none">
                <option value="All">All Status</option>
                <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Blocked">Blocked</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-medium hover:bg-red-100 transition">
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
              </button>
            )}
            <button onClick={() => exportToCSV(filtered, 'super_users_list')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] text-xs font-medium hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#161616] text-slate-600 dark:text-[#ededed] transition bg-white dark:bg-[#111111]">
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl px-3 py-2 max-w-md hover:border-amber-300 dark:hover:border-amber-500/50 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              className="bg-transparent text-sm outline-none w-full text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#6B7280]" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#F59E0B] focus:ring-amber-100" 
                  />
                </th>
                {['Name','Employee ID','Company','Role','Department','Status','Last Login','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-50 dark:border-[#1f1f1f]/50 hover:bg-slate-50 dark:bg-[#161616]/50 dark:hover:bg-[#161616] transition-colors">
                  <td className="px-5 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={e => handleSelectOne(u.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#F59E0B] focus:ring-amber-100" 
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.avatar}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#0F172A] dark:text-[#ededed] whitespace-nowrap">{u.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#a3a3a3]">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-[#a3a3a3] font-mono">{u.employeeId}</td>
                  <td className="px-5 py-3 text-xs text-slate-700 dark:text-[#ededed] font-semibold">{u.company}</td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-[#161616] text-slate-600 dark:text-[#ededed] text-[11px] font-medium rounded-lg">{u.department}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500 dark:text-[#6B7280] whitespace-nowrap">{u.lastLogin}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedUser(u); setModalMode('view'); }} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-[#161616] text-slate-400 hover:text-[#F59E0B] transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedUser(u); setModalMode('edit'); }} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-[#161616] text-slate-400 hover:text-[#F59E0B] transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleToggleBlock(u.id, u.status)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-[#161616] text-slate-400 hover:text-amber-600 transition" title="Block/Unblock"><Ban className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleSingleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center">
              <UserCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-[#1f1f1f]">
            <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
              <h3 className="font-bold text-[#0F172A] dark:text-[#ededed]">
                {modalMode === 'edit' ? 'Edit User' : 'User Details'}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 transition">
                <Users className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.avatar}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#0F172A] dark:text-[#ededed]">{selectedUser.name}</h4>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              {modalMode === 'view' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-[#ededed]">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Company</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-[#ededed]">{selectedUser.company}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Employee ID</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-[#ededed]">{selectedUser.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                    <RoleBadge role={selectedUser.role} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Email</label>
                    <input 
                      type="email" 
                      value={editForm.email} 
                      onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Phone Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] outline-none focus:border-amber-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end gap-3 bg-slate-50 dark:bg-[#161616]/50 dark:bg-[#0a0a0a]/50">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition"
              >
                Close
              </button>
              {modalMode === 'edit' && (
                <button 
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#F59E0B] hover:bg-amber-600 transition shadow-sm shadow-amber-500/20"
                >
                  Save Changes
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
