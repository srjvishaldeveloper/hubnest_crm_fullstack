'use client';

import { useParams, useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Pencil, Ban, KeyRound, Trash2, Mail, Phone,
  Building2, Calendar, Clock, Users, FileText, CheckCircle2, XCircle,
  Activity,
} from 'lucide-react';
import { useTenantStore } from '../../../../store/tenantStore';

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { admins, blockAdmin, deleteAdmin } = useTenantStore();
  const admin = admins.find(a => a.id === id);

  async function handleBlock() {
    if (!admin) return;
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

  async function handleDelete() {
    if (!admin) return;
    if (!confirm(`Are you sure you want to permanently delete tenant workspace for ${admin.company}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.post('/auth/delete-tenant-admin', {
        adminId: admin.adminId,
      });
      deleteAdmin(admin.id);
      router.push('/super-admin/admins');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete workspace');
    }
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-slate-500 text-sm">Admin not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#F59E0B] hover:underline">Go back</button>
      </div>
    );
  }

  const permEntries = [
    { key: 'canManageUsers', label: 'Manage Users' },
    { key: 'canManageLeads', label: 'Manage Leads' },
    { key: 'canManageCampaigns', label: 'Manage Campaigns' },
    { key: 'canManageTickets', label: 'Manage Tickets' },
    { key: 'canViewReports', label: 'View Reports' },
    { key: 'canManageFinance', label: 'Manage Finance' },
  ];

  const statusColor = admin.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    admin.status === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#F59E0B] transition group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Admins
      </button>

      {/* Profile + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-card rounded-2xl border border-slate-200/60 p-6"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-amber-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-500/20">
              {admin.avatar}
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">{admin.name}</h2>
            <span className="mt-1 font-mono text-xs text-slate-500">{admin.adminId}</span>
            <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-500' : admin.status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {admin.status}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />{admin.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />{admin.phone}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />{admin.company}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-lg">{admin.plan} Plan</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />Joined {admin.joinedDate}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />Last login {admin.lastLogin}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => router.push(`/super-admin/tenants/${admin.id}?edit=true`)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleBlock} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition">
              <Ban className="w-3.5 h-3.5" /> Block
            </button>
            <button onClick={() => router.push(`/super-admin/tenants/${admin.id}?edit=true`)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-[#F59E0B] hover:bg-amber-50 transition">
              <KeyRound className="w-3.5 h-3.5" /> Reset Pwd
            </button>
            <button onClick={handleDelete} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permissions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border border-slate-200/60 p-6"
          >
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Permissions Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {permEntries.map(({ key, label }) => {
                const has = admin.permissions[key as keyof typeof admin.permissions];
                return (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border ${has ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50'}`}>
                    {has ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                    <span className={`text-sm ${has ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Performance */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-slate-200/60 p-6"
          >
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <Users className="w-5 h-5 text-[#F59E0B] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{admin.performance.usersManaged}</p>
                <p className="text-xs text-slate-500 mt-0.5">Users Managed</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-xl text-center">
                <FileText className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{admin.performance.reportsGenerated}</p>
                <p className="text-xs text-slate-500 mt-0.5">Reports Generated</p>
              </div>
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-slate-200/60 p-6"
          >
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F59E0B]" /> Activity Log
            </h3>
            <div className="space-y-3">
              {admin.activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-300 group-hover:bg-amber-500 transition shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-slate-700">{log.action}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap ml-3">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
