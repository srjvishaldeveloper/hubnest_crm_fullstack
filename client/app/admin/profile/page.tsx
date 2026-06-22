'use client';

import { useState } from 'react';
import {
  User, Shield, Activity, Settings, HelpCircle, Mail, Phone, Building2,
  Calendar, ShieldAlert, Award, FileText, CheckCircle2, Monitor, MapPin,
  Key, Laptop, LifeBuoy, ArrowRight, UserCircle, Check, Copy, AlertTriangle,
  Lock, RefreshCw, Smartphone, Eye, EyeOff, ShieldCheck, Download, Trash2, Webhook, BellRing, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [webhookSync, setWebhookSync] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden relative">
        {/* Banner Gradient */}
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600 relative" />
        
        <div className="px-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-3xl font-extrabold">
                RK
              </div>
            </div>
            {/* User Metadata */}
            <div className="text-center sm:text-left pb-1">
              <h2 className="text-lg font-black text-[#0F172A] dark:text-[#F9FAFB]">Rajesh Kumar</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ADM-1000 • Tenant Administrator</p>
              <div className="flex gap-1.5 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
                  Owner
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wide">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completeness Circular Indicator */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f] p-3 rounded-xl shrink-0 self-center md:self-end">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#2563EB]"
                  strokeDasharray="92, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">92%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Profile Completed</p>
              <p className="text-[9px] text-slate-500">Add phone fallback for 100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Sub-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Column 1: Personal Info & Checklists */}
        <div className="space-y-6">
          {/* Personal Info Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Personal Info</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                <input type="text" defaultValue="Rajesh Kumar" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 dark:bg-[#161616] font-semibold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                <input type="email" defaultValue="rajesh.kumar@jobnest.com" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 dark:bg-[#161616] font-semibold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Contact</label>
                <input type="text" defaultValue="+91 98765 43210" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 dark:bg-[#161616] font-semibold outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Permissions Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">System Access Checklist</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Sales & Lead Pipeline', level: 'Full Access' },
                { label: 'Marketing Campaign ROI', level: 'Full Access' },
                { label: 'Support Queue & SLAs', level: 'Full Access' },
                { label: 'System Configuration', level: 'Admin Only' },
                { label: 'Audit Timeline Log', level: 'Read Only' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">{item.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-50 text-blue-600">
                    {item.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Analytics Dashboard & Metrics */}
        <div className="space-y-6">
          {/* Performance Dashboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Performance Metrics</h3>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-bold">Target Resolution Speed</span>
                  <span className="font-extrabold text-[#16A34A]">94%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-bold">Workload Distribution</span>
                  <span className="font-extrabold text-[#2563EB]">12 / 15 Cases</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Approval Activity Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider self-start mb-4">Approval Activities</h3>
            <div className="w-24 h-24 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approved', value: 16 },
                      { name: 'Pending', value: 8 }
                    ]}
                    innerRadius={24}
                    outerRadius={36}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-[10px] font-bold text-slate-500">24 Total</span>
            </div>
            <div className="flex gap-3 mt-3 text-[10px] font-semibold text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Approved (16)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Pending (8)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Activity Log & Timeline */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Activity Log</h3>
            <div className="space-y-3.5 border-l border-slate-100 dark:border-[#1f1f1f] pl-3.5 ml-1">
              {[
                { action: 'Auto lead assignment strategy modified', time: '14:20 PM' },
                { action: 'Added user Arun Menon to team Alpha', time: '11:05 AM' },
                { action: 'Generated quarterly performance reports', time: 'Yesterday' }
              ].map((log, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <span className="absolute -left-[18.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span className="text-[9px] text-slate-400 font-bold block">{log.time}</span>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">{log.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button onClick={() => alert('OTP token reset.')} className="p-2 border border-slate-100 dark:border-[#1f1f1f] hover:bg-blue-50/20 hover:border-blue-200 rounded-xl transition text-[10px] font-bold text-slate-600 uppercase">
                Reset OTP
              </button>
              <button onClick={() => alert('Log exported.')} className="p-2 border border-slate-100 dark:border-[#1f1f1f] hover:bg-blue-50/20 hover:border-blue-200 rounded-xl transition text-[10px] font-bold text-slate-600 uppercase">
                Export Log
              </button>
              <button onClick={() => alert('Cache cleared.')} className="p-2 border border-slate-100 dark:border-[#1f1f1f] hover:bg-blue-50/20 hover:border-blue-200 rounded-xl transition text-[10px] font-bold text-slate-600 uppercase">
                Clear Cache
              </button>
              <button onClick={() => alert('Synced.')} className="p-2 border border-slate-100 dark:border-[#1f1f1f] hover:bg-blue-50/20 hover:border-blue-200 rounded-xl transition text-[10px] font-bold text-slate-600 uppercase">
                Sync DB
              </button>
            </div>
          </div>
        </div>

        {/* Column 4: Security, Sessions & Settings */}
        <div className="space-y-6">
          {/* Security & Sessions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Security Control</h3>
            
            {/* 2FA Toggle */}
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
              <div>
                <span className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">OTP 2FA Verification</span>
                <p className="text-[9px] text-slate-400">Require code at system login</p>
              </div>
              <input 
                type="checkbox" 
                checked={twoFactor}
                onChange={() => setTwoFactor(!twoFactor)}
                className="w-8 h-4 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4" 
              />
            </div>

            {/* Sessions node */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Active Nodes</p>
              <div className="p-2 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50 flex justify-between items-center text-xs">
                <div className="truncate">
                  <p className="font-semibold text-slate-700 truncate">Mumbai Node (Chrome)</p>
                  <p className="text-[10px] text-slate-400">Current Session</p>
                </div>
                <button onClick={() => alert('Logged out.')} className="text-[9px] font-extrabold text-[#DC2626] uppercase pl-1">
                  Revoke
                </button>
              </div>
            </div>
          </div>

          {/* System settings toggles */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">System Toggles</h3>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Email Alerts</span>
              <input 
                type="checkbox" 
                checked={emailNotif}
                onChange={() => setEmailNotif(!emailNotif)}
                className="w-8 h-4 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4" 
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Webhook Synchronization</span>
              <input 
                type="checkbox" 
                checked={webhookSync}
                onChange={() => setWebhookSync(!webhookSync)}
                className="w-8 h-4 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4" 
              />
            </div>
          </div>

          {/* Documents Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Documents</h3>
            {[
              { name: 'Admin Contract Agreement.pdf', size: '1.2 MB' },
              { name: 'Verification ID Document.png', size: '2.4 MB' }
            ].map((doc, idx) => (
              <div key={idx} className="p-2 border border-slate-100 dark:border-[#1f1f1f] rounded-xl flex items-center justify-between bg-slate-50 dark:bg-[#161616]/50">
                <div className="truncate pr-1">
                  <p className="text-xs text-slate-700 font-semibold truncate">{doc.name}</p>
                  <p className="text-[9px] text-slate-400">{doc.size}</p>
                </div>
                <button onClick={() => alert('Downloading file...')} className="p-1 text-slate-400 hover:text-blue-600 transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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
