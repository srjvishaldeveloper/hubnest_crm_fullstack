'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const DAILY_DATA = [
  { name: 'Mon', leads: 120, converted: 45 },
  { name: 'Tue', leads: 150, converted: 62 },
  { name: 'Wed', leads: 180, converted: 78 },
  { name: 'Thu', leads: 140, converted: 55 },
  { name: 'Fri', leads: 210, converted: 95 },
  { name: 'Sat', leads: 90, converted: 32 },
  { name: 'Sun', leads: 60, converted: 20 },
];

const WEEKLY_DATA = [
  { name: 'Wk 1', leads: 680, converted: 290 },
  { name: 'Wk 2', leads: 750, converted: 320 },
  { name: 'Wk 3', leads: 820, converted: 380 },
  { name: 'Wk 4', leads: 900, converted: 420 },
];

const MONTHLY_DATA = [
  { name: 'Jan', leads: 2800, converted: 1200 },
  { name: 'Feb', leads: 3100, converted: 1350 },
  { name: 'Mar', leads: 2600, converted: 1100 },
  { name: 'Apr', leads: 3400, converted: 1600 },
  { name: 'May', leads: 3800, converted: 1800 },
  { name: 'Jun', leads: 4200, converted: 2100 },
];

const DATA_MAP: Record<string, typeof DAILY_DATA> = {
  Daily: DAILY_DATA,
  Weekly: WEEKLY_DATA,
  Monthly: MONTHLY_DATA,
};

const TABS = ['Daily', 'Weekly', 'Monthly'];

export default function SalesOverview() {
  const [activeTab, setActiveTab] = useState('Daily');
  const data = DATA_MAP[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            Sales Performance
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Leads & conversions overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggles */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> +18%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="convertGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Area type="monotone" dataKey="leads" stroke="#2563EB" fill="url(#leadGrad)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="converted" stroke="#10B981" fill="url(#convertGrad)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-[#2563EB]" />
          <span className="text-xs text-[#64748B]">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#64748B]">Converted</span>
        </div>
      </div>
    </motion.div>
  );
}
