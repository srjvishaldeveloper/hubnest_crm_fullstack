'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { BarChart3, Megaphone, TrendingUp, Users, Mail } from 'lucide-react';

function MarketingPerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/dashboard')
      .then(r => setData(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Campaigns',    value: data?.totalCampaigns  ?? '—', icon: Megaphone,  color: 'bg-rose-50 text-rose-600'     },
    { label: 'Leads',        value: data?.totalLeads      ?? '—', icon: Users,      color: 'bg-blue-50 text-blue-600'     },
    { label: 'Emails Sent',  value: data?.emailsSent      ?? '—', icon: Mail,       color: 'bg-violet-50 text-violet-600' },
    { label: 'Conversions',  value: data?.conversions     ?? '—', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
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
  );
}

export default function MarketingProfilePage() {
  return (
    <ProfileCore
      accent="rose"
      roleLabel="Marketing Manager"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <MarketingPerformanceTab /> }]}
    />
  );
}
