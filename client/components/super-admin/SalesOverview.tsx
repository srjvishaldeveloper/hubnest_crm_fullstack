'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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

const TABS = ['Daily', 'Weekly', 'Monthly'];

export default function SalesOverview({ data }: { data?: any[] }) {
  const [activeTab, setActiveTab] = useState('Daily');

  const formattedDailyData = data?.map(item => ({
    name: item.day,
    leads: item.leads,
    converted: item.converted,
  })) || [];

  const DATA_MAP: Record<string, any[]> = {
    Daily: formattedDailyData.length ? formattedDailyData : [],
    Weekly: WEEKLY_DATA,
    Monthly: MONTHLY_DATA,
  };

  const chartData = DATA_MAP[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 sm:p-6 shadow-sm hover:shadow-xl dark:hover:border-amber-500/60 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-base flex items-center gap-2">
            Sales Performance
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Leads & conversions overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-[#0a0a0a] rounded-xl p-0.5 border border-slate-200/50 dark:border-[#1f1f1f]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white dark:bg-[#161616] text-[#F59E0B] dark:text-[#F59E0B] shadow-sm'
                    : 'text-[#64748B] dark:text-[#9CA3AF] hover:text-[#0F172A] dark:text-[#F9FAFB] dark:hover:text-[#F9FAFB]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> +18%
          </span>
        </div>
      </div>
 
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-blue)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-blue)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="convertGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-green)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              color: 'var(--color-foreground)',
            }}
          />
          <Area type="monotone" dataKey="leads" stroke="var(--chart-blue)" fill="url(#leadGrad)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="converted" stroke="var(--chart-green)" fill="url(#convertGrad)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
 
      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100 dark:border-[#252B36]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-[#F59E0B] dark:bg-[#F59E0B]" />
          <span className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-emerald-500 dark:bg-[#22C55E]" />
          <span className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Converted</span>
        </div>
      </div>
    </motion.div>
  );
}
