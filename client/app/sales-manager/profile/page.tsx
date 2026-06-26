'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { BarChart3, Target, TrendingUp, Users, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function SalesManagerPerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales-manager/dashboard')
      .then(r => setData(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Team Size',      value: data?.teamSize         ?? '—', icon: Users,     color: 'bg-blue-50 text-blue-600'     },
    { label: 'Team Revenue',   value: data?.teamRevenue ? `₹${(data.teamRevenue/100000).toFixed(1)}L` : '—', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Leads Assigned', value: data?.leadsAssigned    ?? '—', icon: Target,    color: 'bg-amber-50 text-amber-600'   },
    { label: 'Conversions',    value: data?.teamConversions  ?? '—', icon: Trophy,    color: 'bg-violet-50 text-violet-600' },
  ];

  const trend = data?.revenueTrend || [];

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
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Team Revenue Trend</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesManagerProfilePage() {
  return (
    <ProfileCore
      accent="blue"
      roleLabel="Sales Manager"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <SalesManagerPerformanceTab /> }]}
    />
  );
}
