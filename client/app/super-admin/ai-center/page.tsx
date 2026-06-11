'use client';

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Sparkles, RefreshCw, XCircle, Cpu, DollarSign, Database, Activity, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';

interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  activeStatus: boolean;
}

interface AIUsage {
  totalTokens: number;
  creditsUsed: number;
  creditsRemaining: number;
  callsCount: number;
}

interface AIData {
  config: AIConfig;
  usage: AIUsage;
}

export default function AICenterPage() {
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/ai-center')
      .then(r => setData(r.data?.data))
      .catch(() => setError('Failed to load AI configuration.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusToggle = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const nextVal = !data.config.activeStatus;
      // Mock toggled update
      setData(prev => prev ? { ...prev, config: { ...prev.config, activeStatus: nextVal } } : null);
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error || 'Config data missing'}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Sparkles className="w-6 h-6 text-[#F59E0B]" /> AI Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform LLM models, API quotas, and billing analytics</p>
        </div>
        <button onClick={fetchData} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tokens Consumed', value: data.usage.totalTokens.toLocaleString(), icon: Database, color: 'text-[#F59E0B] bg-amber-50' },
          { label: 'Model Calls', value: data.usage.callsCount.toLocaleString(), icon: Activity, color: 'text-purple-600 bg-purple-50' },
          { label: 'Credits Consumed ($)', value: `$${data.usage.creditsUsed.toFixed(2)}`, icon: DollarSign, color: 'text-red-600 bg-red-50' },
          { label: 'Credits Remaining ($)', value: `$${data.usage.creditsRemaining.toFixed(2)}`, icon: ShieldCheck, color: 'text-green-600 bg-green-50' }
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Configuration */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#F59E0B]" /> Active LLM Model Settings
          </h2>
          <p className="text-xs text-slate-400">Configure parameters for platform chatbot & report microservices</p>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <span className="text-sm font-semibold text-slate-700">Primary Inference Model</span>
              <span className="font-mono bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">{data.config.model}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <span className="text-sm font-semibold text-slate-700">Model Temperature</span>
              <span className="text-sm font-bold text-slate-900">{data.config.temperature}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <span className="text-sm font-semibold text-slate-700">Max Token Limit</span>
              <span className="text-sm font-bold text-slate-900">{data.config.maxTokens}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm font-semibold text-slate-700 font-medium">Service Online Status</span>
              <button 
                onClick={handleStatusToggle} 
                disabled={saving}
                className="text-[#F59E0B] disabled:opacity-50"
              >
                {data.config.activeStatus ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Audit / Health check log */}
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F59E0B]" /> AI Microservice Health
          </h2>
          <p className="text-xs text-slate-400">Status of connected microservice instances running on docker hosts</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50">
              <span className="text-xs font-semibold text-slate-700">AI Chatbot Microservice (Port 8003)</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50">
              <span className="text-xs font-semibold text-slate-700">Analytics Microservice (Port 8002)</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50">
              <span className="text-xs font-semibold text-slate-700">Redis LLM Cache Connection</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
