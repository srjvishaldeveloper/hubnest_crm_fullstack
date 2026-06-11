'use client';

import { motion } from 'framer-motion';
import { Settings, Globe, Mail } from 'lucide-react';

export default function GlobalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Global Settings</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Manage platform branding, email gateways, and compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-slate-200/60 p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-[#F59E0B]" /> Platform Branding</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" defaultValue="Job Nest CRM" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Support Email</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" defaultValue="support@jobnest.com" />
            </div>
            <button className="px-4 py-2 bg-[#F59E0B] text-white text-xs font-bold rounded-lg hover:bg-amber-600">Save Branding</button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-slate-200/60 p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-500" /> SMTP Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">SMTP Host</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 dark:bg-[#161616]" defaultValue="smtp.gmail.com" disabled />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">SMTP Port</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 dark:bg-[#161616]" defaultValue="587" disabled />
            </div>
            <p className="text-xs text-slate-500">Edit SMTP settings in the server environment variables.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
