'use client';

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Activity, RefreshCw, XCircle, Cpu, HardDrive, ShieldCheck, Database, Zap, Clock } from 'lucide-react';

interface MonitorStats {
  cpu: number;
  memory: number;
  dbStatus: string;
  redisStatus: string;
  queueStatus: string;
  storage: number;
  uptime: number;
}

export default function SystemMonitorPage() {
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/monitoring')
      .then(r => setStats(r.data?.data))
      .catch(() => setError('Failed to retrieve system health metrics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / (3600*24));
    const h = Math.floor((sec % (3600*24)) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error || 'Monitoring stats unavailable'}</p>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Activity className="w-6 h-6 text-[#F59E0B]" /> System Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time platform infrastructure, docker instances, and microservice status logs</p>
        </div>
        <button onClick={fetchStats} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Cpu className="w-4 h-4 text-[#F59E0B]" /> CPU Allocation</span>
            <span className="text-sm font-extrabold text-[#F59E0B] bg-amber-50 px-2 py-0.5 rounded-full">{stats.cpu}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-[#F59E0B] h-3 rounded-full transition-all duration-500" style={{ width: `${stats.cpu}%` }} />
          </div>
          <p className="text-xs text-slate-400">Average system CPU core load on main server instance.</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-4 h-4 text-purple-500" /> RAM Consumption</span>
            <span className="text-sm font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{stats.memory}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-purple-600 h-3 rounded-full transition-all duration-500" style={{ width: `${stats.memory}%` }} />
          </div>
          <p className="text-xs text-slate-400">Total system RAM consumption by Node container and Redis cache.</p>
        </div>

        {/* Disk Storage */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-emerald-500" /> Disk Storage</span>
            <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stats.storage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats.storage}%` }} />
          </div>
          <p className="text-xs text-slate-400">Volume storage occupancy for document templates and file uploads.</p>
        </div>

        {/* Database Status */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Postgres Connection Pool</span>
            <p className="text-lg font-bold text-slate-900">Active Pool</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl border border-green-200 text-xs font-bold capitalize">
            <Database className="w-4 h-4" /> {stats.dbStatus}
          </div>
        </div>

        {/* Redis Status */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Redis Cache Memory (Memurai)</span>
            <p className="text-lg font-bold text-slate-900">Healthy status</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl border border-green-200 text-xs font-bold capitalize">
            <Zap className="w-4 h-4" /> {stats.redisStatus}
          </div>
        </div>

        {/* Process Uptime */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Docker Process Uptime</span>
            <p className="text-lg font-bold text-slate-900">{formatUptime(stats.uptime)}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
            <Clock className="w-4 h-4" /> Online
          </div>
        </div>
      </div>
    </div>
  );
}
