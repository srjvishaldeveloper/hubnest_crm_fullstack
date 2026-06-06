'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';

const SPEND_TREND = [
  { day: 'Mon', spend: 32000 },
  { day: 'Tue', spend: 45000 },
  { day: 'Wed', spend: 28000 },
  { day: 'Thu', spend: 52000 },
  { day: 'Fri', spend: 41000 },
  { day: 'Sat', spend: 18000 },
  { day: 'Sun', spend: 29600 },
];

export default function MarketingBudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budget Manager</h2>
          <p className="text-xs text-slate-500 mt-1">Track allocations, daily spends, and cost optimization alerts across active campaigns.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
          Reallocate Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Budget', value: '₹3,50,000', desc: 'Active allocations' },
          { label: 'Total Spent', value: '₹2,45,600', desc: '70.2% used' },
          { label: 'Remaining', value: '₹1,04,400', desc: 'Available budget' },
          { label: 'Over-budget Alerts', value: '0', desc: '2 warnings (amber)', color: 'text-amber-600' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-extrabold mt-0.5 ${s.color || 'text-slate-900'}`}>{s.value}</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Campaign Budgets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Campaign</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Allocated</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Spent</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Remaining</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Used %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Summer Sale 2026', limit: '₹1,50,000', spent: '₹1,12,000', rem: '₹38,000', pct: '74.6%' },
                  { name: 'Google Ads Search Brand', limit: '₹1,20,000', spent: '₹95,000', rem: '₹25,000', pct: '79.1%' },
                  { name: 'Insta Story Leads Gen', limit: '₹80,000', spent: '₹38,600', rem: '₹41,400', pct: '48.2%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{row.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.limit}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.spent}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.rem}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-600 font-mono">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily spend chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Daily Spend Trend (₹)</h3>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEND_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Bar dataKey="spend" name="Spent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
