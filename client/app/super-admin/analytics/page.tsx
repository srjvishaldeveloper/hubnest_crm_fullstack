'use client';

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { BarChart3, RefreshCw, XCircle, Users, Activity, HardDrive, ShieldCheck, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  tenantGrowth: { month: string; count: number }[];
  activeUsersTrend: { month: string; active: number }[];
  dbSizes: { name: string; size: string }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/analytics')
      .then(r => setData(r.data?.data))
      .catch(() => setError('Failed to load system analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error || 'Data missing'}</p>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <BarChart3 className="w-6 h-6 text-[#F59E0B]" /> Analytics Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit tenant metrics, monthly signups, active users, and system sizing</p>
        </div>
        <button onClick={fetchAnalytics} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Growth AreaChart */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Tenant Growth Trend</h2>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.tenantGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.06} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Users BarChart */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Active Platform Users</h2>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activeUsersTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="active" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Database Sizing Info */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-[#F59E0B]" /> Database Sizing Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {data.dbSizes.map(db => (
            <div key={db.name} className="p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">{db.name}</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{db.size}</p>
              </div>
              <HardDrive className="w-6 h-6 text-slate-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
