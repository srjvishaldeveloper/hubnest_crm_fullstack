'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { User, Mail, ShieldAlert, KeyRound, Building2, LogOut, Eye, EyeOff } from 'lucide-react';

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Super Admin Profile</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Manage credentials, view authorization levels, and control active workspace logins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
            {user?.name?.[0] || 'S'}
          </div>
          <h2 className="mt-4 text-base font-bold text-[#0F172A]">{user?.name || 'Super Admin'}</h2>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 mt-2">Platform Owner</span>

          <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-center gap-3 text-xs text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {user?.email || 'superadmin@jobnest.com'}</div>
            <div className="flex items-center gap-3 text-xs text-slate-600"><Building2 className="w-4 h-4 text-slate-400" /> Platform Owner</div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-blue-500" /> Security Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div />
              <div>
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button className="py-2.5 px-4 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition">Update Credentials</button>
          </div>
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Session Management</h4>
          <p className="text-xs text-slate-400">Ready to leave? Make sure you save any unsaved work before logging out.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 transition-colors w-full sm:w-auto shrink-0"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout from System
        </button>
      </div>

    </div>
  );
}
