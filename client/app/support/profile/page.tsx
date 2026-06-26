'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { Headphones, BarChart3, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

function SupportPerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/support/dashboard')
      .then(r => setData(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Open Tickets',   value: data?.openTickets   ?? '—', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600'    },
    { label: 'Resolved Today', value: data?.resolvedToday ?? '—', icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Avg Resolution', value: data?.avgResolution ?? '—', icon: Clock,         color: 'bg-blue-50 text-blue-600'      },
    { label: 'CSAT Score',     value: data?.csatScore     ?? '—', icon: Headphones,    color: 'bg-violet-50 text-violet-600'  },
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

export default function SupportProfilePage() {
  return (
    <ProfileCore
      accent="emerald"
      roleLabel="Support Agent"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <SupportPerformanceTab /> }]}
    />
  );
}
