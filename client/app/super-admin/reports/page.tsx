'use client';

import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Platform Analytics</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Global metrics, subscriptions, and database sizing charts</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:bg-slate-50 transition text-slate-600">
            <Calendar className="w-3.5 h-3.5" /> This Quarter
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Platform Revenue', value: '₹18.42L' },
          { label: 'Monthly Recurring (MRR)', value: '₹5.8L' },
          { label: 'Avg Tenant Spend', value: '₹15.2K' },
          { label: 'Churn Rate', value: '1.42%' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">{s.label}</span>
            <p className="text-xl font-bold text-[#0F172A] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase">Workspace signup & active user growth</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ month: 'Jan', signups: 12, users: 120 }, { month: 'Feb', signups: 19, users: 180 }, { month: 'Mar', signups: 26, users: 240 }, { month: 'Apr', signups: 38, users: 310 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#2563EB" fill="#2563EB" fillOpacity={0.05} />
              <Area type="monotone" dataKey="signups" stroke="#10B981" fill="#10B981" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
