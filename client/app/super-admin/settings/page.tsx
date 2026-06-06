'use client';

import { Settings, Globe, Shield, CreditCard } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">System Settings</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Control global multi-tenant general parameters, billing configurations, and system domains</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase flex items-center gap-1.5"><Settings className="w-4 h-4 text-blue-500" /> Platform Configurations</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Instance Base Domain</label>
            <input type="text" defaultValue="jobnestcrm.com" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#0F172A] mb-1.5 block">Fallback Contact Email</label>
            <input type="email" defaultValue="support@jobnestcrm.com" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button className="py-2.5 px-4 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition">Save Configurations</button>
        </div>
      </div>
    </div>
  );
}
