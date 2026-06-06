'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Megaphone, Ticket, DollarSign, SlidersHorizontal, Settings, Plug, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SuperAdminCRMPage() {
  const [globalSettings, setGlobalSettings] = useState({
    maintenanceMode: false,
    restrictNewRegistrations: false,
    enableSuperInsights: true,
    autoPurgeLogs: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">CRM Control Settings</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Super Admin global CRM instance control and system-wide configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Toggles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" /> Global Environment Flags
            </h3>

            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Lock the entire platform for system updates' },
              { key: 'restrictNewRegistrations', label: 'Restrict New Signups', desc: 'Disable new B2B registration and sandbox creations' },
              { key: 'enableSuperInsights', label: 'AI Super Insights Engine', desc: 'Activate machine learning recommendation cards across all client workspaces' },
              { key: 'autoPurgeLogs', label: 'Auto Purge Database Logs', desc: 'Periodically clear audit logs older than 90 days' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/20">
                <div>
                  <span className="text-xs font-bold text-[#0F172A]">{f.label}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${globalSettings[f.key as keyof typeof globalSettings] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {globalSettings[f.key as keyof typeof globalSettings] ? 'Active' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={globalSettings[f.key as keyof typeof globalSettings]}
                    onChange={() => setGlobalSettings(p => ({ ...p, [f.key]: !p[f.key as keyof typeof p] }))}
                    className="w-10 h-5 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-5"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Database & Storage */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">System Storage & Database</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">DB Clusters</span>
                <p className="text-lg font-bold text-[#0F172A] mt-1">2 Active</p>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-500 w-4/5" /></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Storage</span>
                <p className="text-lg font-bold text-[#0F172A] mt-1">1.84 TB</p>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 w-1/2" /></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Redis Cache Hit</span>
                <p className="text-lg font-bold text-[#0F172A] mt-1">98.2 %</p>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden"><div className="h-full bg-indigo-500 w-11/12" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Server Alarms */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-500" /> Active System Alarms</h3>
            {[
              { title: 'Server Node #3 CPU load high', desc: 'Utilization exceeded 92% for 15 minutes', date: '5 mins ago' },
              { title: 'WhatsApp Webhook timeout', desc: '3 consecutive delivery attempts failed', date: '30 mins ago' },
            ].map((al, idx) => (
              <div key={idx} className="p-3.5 bg-rose-50/20 border-l-2 border-rose-500 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-900">{al.title}</span>
                <p className="text-[10px] text-rose-700">{al.desc}</p>
                <span className="text-[9px] text-rose-400 block mt-1 font-semibold">{al.date}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Health Checks</h3>
            <div className="space-y-3">
              {[
                { name: 'Gateway Proxy Router', status: 'Healthy' },
                { name: 'Postgres SQL Database', status: 'Healthy' },
                { name: 'RabbitMQ Event Broker', status: 'Healthy' },
                { name: 'S3 Asset Buckets', status: 'Healthy' },
              ].map(hc => (
                <div key={hc.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{hc.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{hc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
