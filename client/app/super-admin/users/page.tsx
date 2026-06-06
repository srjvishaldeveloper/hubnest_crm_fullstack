'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { exportToCSV } from '../../../services/csvExport';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, Eye, Pencil, Ban, Trash2,
  Users, UserCheck, UserX, ShieldOff, ChevronDown, UserCircle,
} from 'lucide-react';
import { MOCK_USERS, getUserStats, type UserRecord, type UserStatus, type UserRole } from '../../../store/mockData';

function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    Blocked: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<string, string> = {
    'Sales Manager': 'bg-blue-50 text-blue-700',
    'Sales Executive': 'bg-sky-50 text-sky-700',
    'Marketing Head': 'bg-violet-50 text-violet-700',
    'Marketing Executive': 'bg-purple-50 text-purple-700',
    'Support Manager': 'bg-teal-50 text-teal-700',
    'Support Agent': 'bg-cyan-50 text-cyan-700',
    'Finance Executive': 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${colors[role] || 'bg-slate-100 text-slate-600'}`}>{role}</span>
  );
}

export default function SuperAdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const stats = getUserStats();

  const filtered = useMemo(() => {
    return MOCK_USERS.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.employeeId.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [search, statusFilter, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Blocked', value: stats.blocked, icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
              <p className="text-xs text-[#64748B] font-medium">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#0F172A]">Users</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#2563EB] text-xs font-bold rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role filter */}
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'All')}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:border-slate-300 transition outline-none">
                <option value="All">All Roles</option>
                {(['Sales Manager','Sales Executive','Marketing Head','Marketing Executive','Support Manager','Support Agent','Finance Executive'] as UserRole[]).map(r =>
                  <option key={r} value={r}>{r}</option>
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Status filter */}
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as UserStatus | 'All')}
                className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:border-slate-300 transition outline-none">
                <option value="All">All Status</option>
                <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Blocked">Blocked</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => exportToCSV(filtered, 'super_users_list')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium hover:bg-slate-50 transition">
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 max-w-md hover:border-blue-300 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Name','Employee ID','Role','Department','Status','Last Login','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.avatar}</div>
                      <span className="text-sm font-medium text-[#0F172A] whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 font-mono">{u.employeeId}</td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-lg">{u.department}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{u.lastLogin}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/super-admin/users/${u.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="View"><Eye className="w-3.5 h-3.5" /></Link>
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition" title="Block"><Ban className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <UserCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
