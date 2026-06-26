'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { Trophy, TrendingUp, Target, Phone, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function SalesPerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [perfRes, dashRes] = await Promise.all([
          api.get('/sales/performance').catch(() => ({ data: null })),
          api.get('/sales/dashboard').catch(() => ({ data: null })),
        ]);
        setData({ perf: perfRes.data?.data || perfRes.data, dash: dashRes.data?.data || dashRes.data });
      } catch { } finally { setLoading(false); }
    }
    load();
  }, []);

  const kpis = [
    { label: 'Total Leads',    value: data?.dash?.totalLeads    ?? '—', icon: Target,    color: 'bg-blue-50 text-blue-600'    },
    { label: 'Converted',      value: data?.dash?.converted      ?? '—', icon: Trophy,    color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Calls Made',     value: data?.perf?.calls          ?? '—', icon: Phone,     color: 'bg-violet-50 text-violet-600' },
    { label: 'Revenue',        value: data?.dash?.revenue ? `₹${(data.dash.revenue/100000).toFixed(1)}L` : '—', icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ];

  const trend = data?.perf?.trend || data?.dash?.revenueTrend || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.color} shrink-0`}><k.icon className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{k.label}</p>
              <p className="text-lg font-extrabold text-[var(--foreground)]">{loading ? '…' : k.value}</p>
            </div>
          </div>
        ))}
      </div>
      {trend.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Performance Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#sp)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesProfilePage() {
  return (
    <ProfileCore
      accent="blue"
      roleLabel="Sales Executive"
      extraTabs={[{
        id: 'performance', label: 'Performance', icon: BarChart3,
        content: <SalesPerformanceTab />,
      }]}
    />
  );
}
