'use client';

import { useState } from 'react';
import { Settings, Globe, MessageSquare, BarChart2 } from 'lucide-react';
import SmsSettingsPanel from '../../../components/super-admin/SmsSettingsPanel';
import SmsLogsTable from '../../../components/super-admin/SmsLogsTable';

type Tab = 'platform' | 'sms' | 'sms-logs';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'platform', label: 'Platform',    icon: Globe },
  { id: 'sms',      label: 'SMS Config',  icon: MessageSquare },
  { id: 'sms-logs', label: 'SMS Logs',    icon: BarChart2 },
];

export default function SuperAdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('platform');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">System Settings</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">
          Platform configuration, SMS provider settings, and delivery logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616] p-1 w-full sm:w-fit overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
              tab === id
                ? 'bg-white dark:bg-[#1a1a1a] text-[#0F172A] dark:text-[#F9FAFB] shadow-sm border border-slate-200 dark:border-[#2a2a2a]'
                : 'text-[#64748B] dark:text-[#9CA3AF] hover:text-[#0F172A] dark:text-[#F9FAFB] dark:hover:text-[#F9FAFB]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${tab === id ? 'text-[#F59E0B]' : ''}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Platform settings tab */}
      {tab === 'platform' && (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] p-6 space-y-6">
          <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-[#F59E0B]" /> Platform Configurations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Instance Base Domain</label>
              <input
                type="text"
                defaultValue="hubnestcrm.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Fallback Contact Email</label>
              <input
                type="email"
                defaultValue="support@hubnestcrm.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-6 flex justify-end">
            <button className="py-2.5 px-5 bg-[#F59E0B] text-white text-xs font-semibold rounded-xl hover:bg-amber-500 transition">
              Save Configurations
            </button>
          </div>
        </div>
      )}

      {/* SMS Config tab */}
      {tab === 'sms' && <SmsSettingsPanel />}

      {/* SMS Logs tab */}
      {tab === 'sms-logs' && <SmsLogsTable />}
    </div>
  );
}
