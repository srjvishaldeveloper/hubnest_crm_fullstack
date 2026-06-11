'use client';

import { ShieldCheck, ShieldAlert, KeyRound, Monitor } from 'lucide-react';

export default function SuperAdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Platform Security Control</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Control global multi-tenant access firewalls, login rate limits, and 2FA policies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Platform Shield Policy</h3>
            {[
              { label: 'Global Session Timeout', desc: 'Auto log-out administrative users after 2 hours inactivity', val: '2 hours' },
              { label: 'Login Attempt Lockout Threshold', desc: 'Temporarily block IP addresses after 5 consecutive failures', val: '5 attempts' },
              { label: 'Enforce MFA across Admins', desc: 'Require two-factor verification on tenant login sessions', val: 'Required' },
            ].map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 border border-slate-100 dark:border-[#1f1f1f] rounded-xl">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{p.label}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                </div>
                <span className="text-xs font-bold text-[#F59E0B] bg-amber-50 px-2.5 py-1 rounded-xl">{p.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-slate-200/60 p-5 space-y-4">
          <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-rose-500" /> Security Logs</h3>
          <div className="space-y-3">
            {[
              { msg: 'Super Admin login from IP 103.5.42.18', date: 'Just now' },
              { msg: 'Failed tenant login from user@techvista.com', date: '12 mins ago' },
              { msg: 'API key generated for GreenEdge client', date: '1 hour ago' },
            ].map((log, idx) => (
              <div key={idx} className="text-xs border-b border-slate-50 pb-2">
                <p className="font-medium text-[#0F172A] dark:text-[#F9FAFB]">{log.msg}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{log.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
