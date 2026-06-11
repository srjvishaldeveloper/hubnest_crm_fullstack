'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, XCircle, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface RevenueData {
  mrr: number;
  arr: number;
  totalRevenue: number;
  churnRate: number;
  monthlyTrend: { month: string; revenue: number; subscriptions: number }[];
  revenueByPlan: { plan: string; revenue: number }[];
}

function KPICard({ label, value, change, icon, color }: { label: string; value: string; change?: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-[#1f1f1f] shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">{value}</p>
      <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">{label}</p>
    </div>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true); setError('');
    api.get('/super-admin/billing/revenue')
      .then(r => setData(r.data?.data || null))
      .catch(() => setError('Failed to load revenue data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-72" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <XCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium mb-4">{error}</p>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  );

  const d = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#F59E0B]" /> Revenue Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-1">Financial overview and billing analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Monthly Recurring Revenue" value={d ? `$${(d.mrr || 0).toLocaleString()}` : '—'} icon={<DollarSign className="w-5 h-5 text-[#F59E0B]" />} color="bg-amber-50" change={8.2} />
        <KPICard label="Annual Recurring Revenue" value={d ? `$${(d.arr || 0).toLocaleString()}` : '—'} icon={<TrendingUp className="w-5 h-5 text-green-600" />} color="bg-green-50" change={12.5} />
        <KPICard label="Total Revenue (All Time)" value={d ? `$${(d.totalRevenue || 0).toLocaleString()}` : '—'} icon={<BarChart2 className="w-5 h-5 text-purple-600" />} color="bg-purple-50" />
        <KPICard label="Churn Rate" value={d ? `${(d.churnRate || 0).toFixed(2)}%` : '—'} icon={<TrendingDown className="w-5 h-5 text-red-500" />} color="bg-red-50" change={-2.1} />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-[#1f1f1f] shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-4">Revenue Trend</h2>
        {d?.monthlyTrend && d.monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={d.monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Revenue ($)" />
              <Line type="monotone" dataKey="subscriptions" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Subscriptions" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-60">
            <BarChart2 className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">No trend data available</p>
          </div>
        )}
      </div>

      {/* Revenue by Plan */}
      {d?.revenueByPlan && d.revenueByPlan.length > 0 && (
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Revenue by Plan</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {d.revenueByPlan.map(p => {
              const maxRev = Math.max(...d.revenueByPlan.map(x => x.revenue), 1);
              const pct = Math.round((p.revenue / maxRev) * 100);
              return (
                <div key={p.plan} className="px-6 py-4 flex items-center gap-4">
                  <span className="w-28 text-sm font-semibold text-slate-700 dark:text-[#d4d4d4]">{p.plan}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="h-2 bg-[#F59E0B] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 text-right text-sm font-bold text-slate-900 dark:text-[#ededed]">${p.revenue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
