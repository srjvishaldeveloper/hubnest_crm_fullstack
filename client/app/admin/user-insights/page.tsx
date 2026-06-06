'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, UserCheck, Flame, Award } from 'lucide-react';

const PERFORMANCE_DATA = [
  { name: 'Varun', converted: 32, leads: 142 },
  { name: 'Sneha', converted: 24, leads: 98 },
  { name: 'Amit', converted: 0, leads: 0 },
  { name: 'Priya', converted: 8, leads: 45 },
];

export default function AdminUserInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">User Performance Insights</h2>
        <p className="text-xs text-slate-500 mt-1">Detailed statistics, conversions, and metrics of individual team members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Top Performer', value: 'Sneha Gupta', sub: '94% Conv. Rate', icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Most Leads Handled', value: 'Varun Malhotra', sub: '142 Leads assigned', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg Conversion', value: '84.6%', sub: 'Active team average', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Lead Conversions vs Assignments
        </h3>
        <div className="h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PERFORMANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="leads" name="Leads Assigned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Deals Closed" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
