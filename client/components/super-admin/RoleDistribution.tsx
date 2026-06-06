'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

const DATA = [
  { name: 'Super Admin', value: 4, color: '#1e40af' },
  { name: 'Admin', value: 28, color: '#2563EB' },
  { name: 'Manager', value: 86, color: '#3b82f6' },
  { name: 'Agent', value: 342, color: '#60a5fa' },
  { name: 'Viewer', value: 1204, color: '#93c5fd' },
];

const TOTAL = DATA.reduce((sum, d) => sum + d.value, 0);

export default function RoleDistribution() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="mb-4">
        <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-[#2563EB]" />
          Role Distribution
        </h3>
        <p className="text-[11px] text-[#64748B] mt-0.5">Users by role across the platform</p>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              dataKey="value"
              strokeWidth={2}
              stroke="white"
            >
              {DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-extrabold text-[#0F172A]">{TOTAL.toLocaleString()}</p>
            <p className="text-[10px] text-[#64748B]">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-[#64748B] truncate">{d.name}</span>
            <span className="text-[11px] font-bold text-[#0F172A] ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
