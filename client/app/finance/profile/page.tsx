'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { BarChart3, IndianRupee, TrendingUp, ClipboardCheck, Receipt } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer
} from 'recharts';

function FinancePerformanceTab() {
  const [dash, setDash] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/finance/dashboard').catch(() => ({ data: null })),
      api.get('/finance/analytics').catch(() => ({ data: null })),
    ]).then(([d, a]) => {
      setDash(d.data?.data || d.data);
      setAnalytics(a.data?.data || a.data);
    }).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total Revenue', value: dash?.kpis?.totalRevenue ? `₹${(dash.kpis.totalRevenue/100000).toFixed(1)}L` : '—', icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Expenses',value: dash?.kpis?.totalExpenses ? `₹${(dash.kpis.totalExpenses/100000).toFixed(1)}L` : '—', icon: Receipt,     color: 'bg-rose-50 text-rose-600'    },
    { label: 'Net Profit',    value: dash?.kpis?.profit ? `₹${(dash.kpis.profit/100000).toFixed(1)}L` : '—', icon: TrendingUp, color: 'bg-blue-50 text-blue-600'    },
    { label: 'Payroll Paid',  value: dash?.kpis?.totalPayroll ? `₹${(dash.kpis.totalPayroll/100000).toFixed(1)}L` : '—', icon: ClipboardCheck,color: 'bg-violet-50 text-violet-600'},
  ];

  const revTrend  = dash?.revenueTrend  || [];
  const expTrend  = dash?.expenseTrend  || [];

  const combined = useMemo(() => {
    const months = Array.from(new Set([...revTrend.map((r: any) => r.month), ...expTrend.map((e: any) => e.month)]));
    return months.map(m => ({
      month: m,
      revenue:  ((revTrend.find((r: any) => r.month === m)?.revenue  || 0) / 100000),
      expenses: ((expTrend.find((e: any) => e.month === m)?.expenses || 0) / 100000),
    }));
  }, [revTrend, expTrend]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.color} shrink-0`}><k.icon className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{k.label}</p>
              <p className="text-base font-extrabold text-[var(--foreground)]">{loading ? '…' : k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {combined.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Revenue vs Expenses (₹ Lakhs)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combined}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`₹${v}L`, undefined]} />
                <Area type="monotone" dataKey="revenue"  stroke="#10b981" fill="url(#rev)" strokeWidth={2.5} name="Revenue"  />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2.5} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinanceProfilePage() {
  return (
    <ProfileCore
      accent="emerald"
      roleLabel="Finance Manager"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <FinancePerformanceTab /> }]}
    />
  );
}
