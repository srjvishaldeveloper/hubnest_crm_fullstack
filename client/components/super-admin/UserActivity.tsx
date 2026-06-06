'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DATA = [
  { time: '6AM', users: 120 },
  { time: '8AM', users: 450 },
  { time: '10AM', users: 890 },
  { time: '12PM', users: 1200 },
  { time: '2PM', users: 980 },
  { time: '4PM', users: 1450 },
  { time: '6PM', users: 720 },
  { time: '8PM', users: 340 },
];

export default function UserActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB]" />
            User Activity
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">Active users today by hour</p>
        </div>
        <span className="text-[11px] bg-blue-50 text-[#2563EB] font-semibold px-2 py-1 rounded-full">3,241 Today</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={DATA}>
          <defs>
            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
