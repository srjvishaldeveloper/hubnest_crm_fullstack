'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { LayoutDashboard, Building2, Users, TrendingUp, Activity } from 'lucide-react';

function SuperAdminOverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/dashboard')
      .then(r => setData(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total Tenants', value: data?.totalTenants ?? '—', icon: Building2,  color: 'bg-blue-50 text-blue-600'     },
    { label: 'Total Users',   value: data?.totalUsers   ?? '—', icon: Users,      color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Plans',  value: data?.activePlans  ?? '—', icon: Activity,   color: 'bg-violet-50 text-violet-600' },
    { label: 'MRR',           value: data?.mrr          ?? '—', icon: TrendingUp, color: 'bg-amber-50 text-amber-600'   },
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

export default function SuperAdminProfilePage() {
  return (
    <ProfileCore
      accent="blue"
      roleLabel="Super Admin"
      extraTabs={[{ id: 'overview', label: 'Overview', icon: LayoutDashboard, content: <SuperAdminOverviewTab /> }]}
    />
  );
}
