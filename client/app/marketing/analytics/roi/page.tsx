'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';

const REVENUE_DATA = [
  { name: 'Jan', cost: 120000, revenue: 240000 },
  { name: 'Feb', cost: 150000, revenue: 350000 },
  { name: 'Mar', cost: 180000, revenue: 410000 },
  { name: 'Apr', cost: 220000, revenue: 580000 },
  { name: 'May', cost: 245600, revenue: 770000 },
];

export default function MarketingROIReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ROI Report</h2>
          <p className="text-xs text-slate-500 mt-1">Monitor costs, campaign revenue attribution, and net profit margins across active campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Overall ROI', value: '214%', desc: 'Return on investment' },
          { label: 'Total Spent', value: '₹2,45,600', desc: 'Attributed ad spend' },
          { label: 'Revenue Generated', value: '₹7,70,000', desc: 'Sales pipeline value' },
          { label: 'Net Profit', value: '₹5,24,400', desc: 'Profit margin: 68%' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Campaign ROI details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Campaign</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Spend</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Revenue</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Summer Sale 2026', spend: '₹75,000', rev: '₹2,35,000', roi: '214%' },
                  { name: 'Google Ads Search Brand', spend: '₹95,000', rev: '₹2,75,000', roi: '189%' },
                  { name: 'Insta Story Leads Gen', spend: '₹38,600', rev: '₹1,20,000', roi: '210%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{row.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.spend}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.rev}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-600 font-mono">{row.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-violet-900 to-indigo-900 p-5 rounded-2xl border border-violet-800 shadow-sm text-white space-y-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-violet-300">AI ROI Prediction</h3>
            </div>
            <p className="text-2xl font-extrabold">235%</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on historical data and current CTR, ROI is projected to rise to 235% next week if budget is scaled on Meta.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Top Performing Channel</h3>
            <div>
              <p className="text-xs font-bold text-slate-700">Meta Ads Manager</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">ROI: 214% • Total Leads: 1,256</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Profit vs Spend Trend</h3>
        <div className="h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" fill="#D1FAE5" />
              <Area type="monotone" dataKey="cost" name="Spend" stroke="#3B82F6" fill="#DBEAFE" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
