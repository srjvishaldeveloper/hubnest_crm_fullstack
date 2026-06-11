'use client';

import { motion } from 'framer-motion';
import { Database, Activity, Cpu } from 'lucide-react';

export default function DatabaseMetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Database Metrics</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Real-time health and performance of the data layer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">PostgreSQL</h3>
              <p className="text-[10px] text-emerald-500 font-semibold">Healthy</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Connections</span><span className="font-bold">24 / 100</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DB Size</span><span className="font-bold">4.2 GB</span></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Redis Cache</h3>
              <p className="text-[10px] text-emerald-500 font-semibold">Healthy</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Hit Rate</span><span className="font-bold text-emerald-600">98.4%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Memory</span><span className="font-bold">214 MB</span></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Storage IO</h3>
              <p className="text-[10px] text-amber-500 font-semibold">Moderate</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Read</span><span className="font-bold">12 MB/s</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Write</span><span className="font-bold">4 MB/s</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
