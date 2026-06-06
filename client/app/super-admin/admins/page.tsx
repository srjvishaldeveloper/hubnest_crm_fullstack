'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { exportToCSV } from '../../../services/csvExport';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, Eye, Pencil, Ban, Trash2,
  Users, UserCheck, UserX, ShieldOff, ChevronDown, Shield, Building2
} from 'lucide-react';
import { useSuperAdminUIStore } from '../../../store/uiStore';
import { useTenantStore } from '../../../store/tenantStore';
import { type AdminStatus } from '../../../store/mockData';

/* ── Stat Card ─────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
        <p className="text-xs text-[#64748B] font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Status Badge ──────────────────────────────── */
function StatusBadge({ status }: { status: AdminStatus }) {
  const map: Record<AdminStatus, string> = {
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

/* ── Main Page ─────────────────────────────────── */
export default function AdminsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatus | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Connect stores
  const { setShowAddTenantModal } = useSuperAdminUIStore();
  const { admins, blockAdmin, deleteAdmin, setAdmins } = useTenantStore();

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const response = await api.get('/auth/tenant-admins');
        if (response.data?.data?.admins) {
          setAdmins(response.data.data.admins);
        }
      } catch (err) {
        console.error('Failed to fetch admins from database', err);
      }
    }
    fetchAdmins();
  }, [setAdmins]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedAndFiltered.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  async function handleBlock(admin: any) {
    const targetStatus = admin.status === 'Blocked' ? 'Active' : 'Blocked';
    if (!confirm(`Are you sure you want to change status of ${admin.name} to ${targetStatus}?`)) {
      return;
    }
    try {
      await api.post('/auth/block-tenant-admin', {
        adminId: admin.adminId,
        status: targetStatus,
      });
      blockAdmin(admin.id);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }

  async function handleDelete(admin: any) {
    if (!confirm(`Are you sure you want to permanently delete tenant workspace for ${admin.company}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.post('/auth/delete-tenant-admin', {
        adminId: admin.adminId,
      });
      deleteAdmin(admin.id);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete workspace');
    }
  }

  const stats = useMemo(() => {
    const total = admins.length;
    const active = admins.filter(a => a.status === 'Active').length;
    const inactive = admins.filter(a => a.status === 'Inactive').length;
    const blocked = admins.filter(a => a.status === 'Blocked').length;
    return { total, active, inactive, blocked };
  }, [admins]);

  const sortedAndFiltered = useMemo(() => {
    const res = admins.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.adminId.toLowerCase().includes(search.toLowerCase()) ||
        a.company.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return [...res].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-newest') return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      if (sortBy === 'date-oldest') return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
      return 0;
    });
  }, [search, statusFilter, admins, sortBy]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Admins" value={stats.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active" value={stats.active} icon={UserCheck} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Inactive" value={stats.inactive} icon={UserX} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Blocked" value={stats.blocked} icon={ShieldOff} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Header + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#0F172A]">Admins</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#2563EB] text-xs font-bold rounded-full">{sortedAndFiltered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowAddTenantModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">
              <Plus className="w-4 h-4" /> Add Admin
            </button>
            
            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 transition outline-none text-slate-700"
              >
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="date-newest">Sort: Date (Newest)</option>
                <option value="date-oldest">Sort: Date (Oldest)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as AdminStatus | 'All')}
                className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:border-slate-300 transition outline-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                const dataToExport = selectedIds.length > 0
                  ? admins.filter(a => selectedIds.includes(a.id))
                  : sortedAndFiltered;
                exportToCSV(dataToExport, 'admins_list');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium hover:bg-slate-50 transition text-slate-600 bg-white"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 max-w-md hover:border-blue-300 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, company, or admin ID..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox"
                    checked={sortedAndFiltered.length > 0 && selectedIds.length === sortedAndFiltered.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                  />
                </th>
                {['Name', 'Admin ID', 'Company', 'Email', 'Phone', 'Plan', 'Status', 'Joined Date', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAndFiltered.map((admin, i) => (
                <motion.tr
                  key={admin.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(admin.id)}
                      onChange={e => handleSelectOne(admin.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {admin.avatar}
                      </div>
                      <span className="text-sm font-medium text-[#0F172A] whitespace-nowrap">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 font-mono">{admin.adminId}</td>
                  <td className="px-5 py-3 text-xs text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{admin.company}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{admin.email}</td>
                  <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">{admin.phone}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg">{admin.plan}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={admin.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{admin.joinedDate}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{admin.lastLogin}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/super-admin/admins/${admin.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => router.push(`/super-admin/tenants/${admin.id}?edit=true`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleBlock(admin)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition" title="Block">
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(admin)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {sortedAndFiltered.length === 0 && (
            <div className="py-16 text-center">
              <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No admins found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
