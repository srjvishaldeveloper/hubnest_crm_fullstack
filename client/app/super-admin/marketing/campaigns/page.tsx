'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Megaphone, RefreshCw, XCircle, Users, BarChart3, Target, Calendar, Search } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  type: string;
  status: string;
  sentAt: string;
  tenantName?: string;
  recipients?: number;
  openRate?: number;
  clickRate?: number;
}

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCampaigns = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/marketing/campaigns')
      .then(r => setCampaigns(r.data?.data || []))
      .catch(() => setError('Failed to load campaigns.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter(c => 
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.type?.toLowerCase().includes(search.toLowerCase()) ||
    c.tenantName?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status?.toLowerCase() === 'active').length,
    avgOpenRate: campaigns.length ? Math.round(campaigns.reduce((acc, c) => acc + (c.openRate || 0), 0) / campaigns.length) : 0
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="bg-card rounded-2xl border border-slate-200/80 h-96 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchCampaigns} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#F59E0B]" /> Email & SMS Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit active tenant marketing outreach plans and delivery statistics</p>
        </div>
        <button onClick={fetchCampaigns} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, color: 'text-[#F59E0B] bg-amber-50' },
          { label: 'Active Running', value: stats.activeCampaigns, icon: Target, color: 'text-green-600 bg-green-50' },
          { label: 'Average Open Rate', value: `${stats.avgOpenRate}%`, icon: BarChart3, color: 'text-purple-600 bg-purple-50' }
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campaigns, types, tenants..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition" 
          />
        </div>
      </div>

      {/* Table list */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No campaigns found</p>
            <p className="text-slate-400 text-sm mt-1">Tenant marketing executors can generate campaigns</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Campaign Name', 'Tenant Workspace', 'Channels', 'Recipients', 'Engagement (Open/Click)', 'Status', 'Launch Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(camp => (
                  <tr key={camp._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{camp.name}</td>
                    <td className="px-5 py-4 font-medium text-slate-600">{camp.tenantName || 'Platform Tenant'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">{camp.type}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{camp.recipients ? camp.recipients.toLocaleString() : '0'}</td>
                    <td className="px-5 py-4">
                      {camp.openRate ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="font-bold text-slate-900">{camp.openRate}%</span> open / 
                          <span className="font-bold text-slate-900">{camp.clickRate}%</span> click
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        camp.status?.toLowerCase() === 'active' ? 'bg-green-50 text-green-700' :
                        camp.status?.toLowerCase() === 'completed' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
