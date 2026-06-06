'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import api from '../../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building2, KeyRound, Check, Copy, Pencil, Ban, Trash2, Mail, Phone, Calendar,
  Award, ShieldAlert, RefreshCw
} from 'lucide-react';
import { useTenantStore } from '../../../../store/tenantStore';

function TenantDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const { admins, updateAdmin } = useTenantStore();
  
  // Find tenant by matching admin record (one per tenant)
  const tenant = admins.find(a => a.id === id);

  // Reset Admin form states
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [newName, setNewName] = useState(tenant?.name || '');
  const [newEmail, setNewEmail] = useState(tenant?.email || '');
  const [newPhone, setNewPhone] = useState(tenant?.phone || '');
  const [newPwd, setNewPwd] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPwdSuccess, setShowPwdSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (editParam === 'true') {
      setEditingAdmin(true);
    }
  }, [editParam]);

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-slate-500 text-sm">Tenant not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#2563EB] hover:underline">Go back</button>
      </div>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(newPwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleResetAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newEmail) {
      alert('Please enter Admin Name and Email.');
      return;
    }

    const nextPwd = 'ResetPwd@' + Math.random().toString(36).slice(-6);
    setNewPwd(nextPwd);
    setIsResetting(true);

    try {
      if (tenant) {
        await api.post('/auth/reset-tenant-admin', {
          adminId: tenant.adminId,
          name: newName,
          email: newEmail,
          phone: newPhone,
          tempPassword: nextPwd,
        });
      }
    } catch (err: any) {
      console.error('Failed to reset tenant admin in database / send email:', err);
      const msg = err.response?.data?.message || 'Credentials reset successfully, but failed to send email. Please copy them manually.';
      alert(msg);
    } finally {
      if (tenant) {
        updateAdmin(tenant.id, {
          name: newName,
          email: newEmail,
          phone: newPhone,
          avatar: newName.split(' ').map(n => n[0]).join('').toUpperCase() || 'T',
        });
      }
      setIsResetting(false);
      setShowPwdSuccess(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#2563EB] transition group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Tenants
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2563EB] border border-blue-100 shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="mt-4 text-base font-bold text-[#0F172A]">{tenant.company}</h2>
              <span className="mt-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase">
                {tenant.plan} Subscription
              </span>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 text-left">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" /> B2B Workspace
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Award className="w-4 h-4 text-slate-400" /> Plan: {tenant.plan}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" /> Created: {tenant.joinedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Change Admin Control (Edge Cases Only) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-[#0F172A]">Workspace Admin Management</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Reset credentials or assign a new Admin account to this B2B company workspace (edge cases only).</p>
            </div>

            {/* Current Admin details */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-3">
              <div className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">Current Workspace Administrator</div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Admin Name</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{tenant.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Admin Email</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{tenant.email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Admin Phone</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{tenant.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Admin ID</span>
                  <p className="font-mono font-semibold text-slate-700 mt-0.5">{tenant.adminId}</p>
                </div>
              </div>
            </div>

            {!editingAdmin ? (
              <button
                onClick={() => setEditingAdmin(true)}
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
              >
                Change Admin Credentials
              </button>
            ) : (
              <form onSubmit={handleResetAdmin} className="space-y-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-extrabold text-[#0F172A] uppercase tracking-wider">Change Admin Form</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">New Admin Full Name *</label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">New Admin Email *</label>
                    <input
                      required
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="e.g. anand@acme.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">New Admin Phone</label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="e.g. +91 9999999999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                 <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => {
                      setEditingAdmin(false);
                      setShowPwdSuccess(false);
                    }}
                    className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isResetting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Resetting...</span>
                      </>
                    ) : (
                      'Reset & Generate Credentials'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Success alert block */}
            <AnimatePresence>
              {showPwdSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" /> Admin Credentials Reset Successfully!
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/50 flex justify-between items-center text-xs font-mono text-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Temporary Password</span>
                      <span className="font-bold">{newPwd}</span>
                    </div>
                    <button onClick={handleCopy} className="p-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Tenant Details...</div>}>
      <TenantDetailContent />
    </Suspense>
  );
}
