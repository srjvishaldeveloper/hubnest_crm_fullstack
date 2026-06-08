'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, History, Search } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Audit Logs</h1>
        <p className="text-xs text-[#64748B] mt-0.5">System-wide event tracking and security history</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search event logs..." className="bg-transparent text-sm outline-none w-full" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No recent logs found</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Audit logging is currently monitoring system events. Events will appear here shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
