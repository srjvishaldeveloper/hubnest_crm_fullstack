'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Sliders, ChevronDown } from 'lucide-react';

const WEEKLY_DATA = [
  { name: 'Week 1', fb: 4200, google: 2400 },
  { name: 'Week 2', fb: 3000, google: 1398 },
  { name: 'Week 3', fb: 2000, google: 9800 },
  { name: 'Week 4', fb: 2780, google: 3908 },
];

const COMPARISON_DATA = [
  { name: 'Summer Sale', roi: 214, spent: 75000 },
  { name: 'Google Search', roi: 189, spent: 95000 },
  { name: 'Insta Stories', roi: 210, spent: 38600 },
];

export default function MarketingCampaignAnalyticsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState('All');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campaign Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Deep analysis of impressions, click rates, CPL, and ROI metrics across channels.</p>
        </div>
        <div className="relative">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 transition outline-none text-slate-700"
          >
            <option value="All">All Campaigns</option>
            <option value="Summer Sale">Summer Sale 2026</option>
            <option value="Google Search">Google Search Brand</option>
            <option value="Insta Stories">Insta Story Leads</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Impressions', value: '148,600', sub: '+12% vs last month' },
          { label: 'Click CTR', value: '4.8%', sub: 'Avg 3.2% industry' },
          { label: 'Average CPL', value: '₹145', sub: '-6% cost reduction' },
          { label: 'Overall ROI', value: '204%', sub: 'High profitability' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly clicks trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Weekly Performance Trend</h3>
          <div className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="fb" name="Facebook" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="google" name="Google" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Campaign ROI Comparison (%)</h3>
          <div className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPARISON_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Bar dataKey="roi" name="ROI %" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
