'use client';

import { Plug, CheckCircle, XCircle } from 'lucide-react';

export default function SuperAdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#ededed]">Global Integrations</h1>
        <p className="text-xs text-[#64748B] dark:text-[#a3a3a3] mt-0.5">Control global communication APIs and payment systems activated for client workspaces</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'SMTP Email Gateway', desc: 'AWS SES integration for transactional messaging', active: true },
          { name: 'Twilio SMS API', desc: 'Send alerts and OTP messages via Twilio servers', active: true },
        ].map(i => (
          <div key={i.name} className="bg-card dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Plug className="w-5 h-5 text-[#F59E0B]" />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${i.active ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'}`}>{i.active ? 'Operational' : 'Disabled'}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#ededed]">{i.name}</span>
              <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{i.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
