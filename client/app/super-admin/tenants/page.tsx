'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { exportToCSV } from '../../../services/csvExport';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, Pencil, Ban, Trash2,
  Building2, ChevronDown, Award, Eye
} from 'lucide-react';
import { useSuperAdminUIStore } from '../../../store/uiStore';
import { useTenantStore } from '../../../store/tenantStore';
import { type AdminStatus } from '../../../store/mockData';

export default function TenantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatus | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('company-asc');
  
  // Connect to global stores
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
      setSelectedIds(sortedAndFiltered.map(t => t.id));
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

  async function handleBlock(tenant: any) {
    const targetStatus = tenant.status === 'Blocked' ? 'Active' : 'Blocked';
    if (!confirm(`Are you sure you want to change status of tenant ${tenant.company} to ${targetStatus}?`)) {
      return;
    }
    try {
      await api.post('/auth/block-tenant-admin', {
        adminId: tenant.adminId,
        status: targetStatus,
      });
      blockAdmin(tenant.id);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }

  async function handleDelete(tenant: any) {
    if (!confirm(`Are you sure you want to permanently delete tenant workspace ${tenant.company}? This action is irreversible.`)) {
      return;
    }
    try {
      await api.post('/auth/delete-tenant-admin', {
        adminId: tenant.adminId,
      });
      deleteAdmin(tenant.id);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete tenant');
    }
  }

  const sortedAndFiltered = useMemo(() => {
    const res = admins.filter(t => {
      const matchSearch = t.company.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return [...res].sort((a, b) => {
      if (sortBy === 'company-asc') return a.company.localeCompare(b.company);
      if (sortBy === 'company-desc') return b.company.localeCompare(a.company);
      if (sortBy === 'date-newest') return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      if (sortBy === 'date-oldest') return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
      return 0;
    });
  }, [search, statusFilter, admins, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Tenants</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Manage B2B company workspaces and subscriptions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAddTenantModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
          
          {/* Sort selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 transition outline-none text-slate-700"
            >
              <option value="company-asc">Sort: Company (A-Z)</option>
              <option value="company-desc">Sort: Company (Z-A)</option>
              <option value="date-newest">Sort: Date (Newest)</option>
              <option value="date-oldest">Sort: Date (Oldest)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as AdminStatus | 'All')}
              className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none"
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
                ? admins.filter(t => selectedIds.includes(t.id))
                : sortedAndFiltered;
              exportToCSV(dataToExport, 'tenants_list');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium hover:bg-slate-50 transition text-slate-600 bg-white"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Table & Control */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2 bg-white border border-slate-200/60 rounded-xl px-3 py-2 max-w-md hover:border-blue-300 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company or admin name..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox"
                    checked={sortedAndFiltered.length > 0 && selectedIds.length === sortedAndFiltered.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                  />
                </th>
                {['Company Name', 'Plan', 'Admin Email', 'Status', 'Created Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAndFiltered.map((tenant, i) => (
                <motion.tr
                  key={tenant.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(tenant.id)}
                      onChange={e => handleSelectOne(tenant.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                    />
                  </td>
                  {/* Company Name */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] shrink-0 border border-blue-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#0F172A]">{tenant.company}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tenant.name} · Admin</p>
                      </div>
                    </div>
                  </td>
                  {/* Plan */}
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">
                      <Award className="w-3 h-3 text-blue-500" />
                      {tenant.plan}
                    </span>
                  </td>
                  {/* Admin Email */}
                  <td className="px-5 py-3 text-xs text-slate-600">{tenant.email}</td>
                  {/* Status */}
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : tenant.status === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-emerald-500' : tenant.status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      {tenant.status}
                    </span>
                  </td>
                  {/* Created Date */}
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{tenant.joinedDate}</td>
                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/super-admin/tenants/${tenant.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="View Workspace">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => router.push(`/super-admin/tenants/${tenant.id}?edit=true`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="Edit Tenant">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleBlock(tenant)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition" title="Block Tenant">
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(tenant)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition" title="Delete Tenant">
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
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No tenants found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
