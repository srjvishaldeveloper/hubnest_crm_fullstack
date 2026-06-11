'use client';

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Layers, RefreshCw, XCircle, ShieldCheck, Check, Settings2, Users, Building, Activity } from 'lucide-react';

interface Department {
  key: string;
  name: string;
  enabled: boolean;
  userLimit: number;
  usage: string;
}

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchDepts = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/departments')
      .then(r => setDepts(r.data?.data || []))
      .catch(() => setError('Failed to load department modules.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleToggle = async (key: string, currentVal: boolean) => {
    setToggling(key);
    try {
      // Mock toggle updates locally since it's configuration
      setDepts(prev => prev.map(d => d.key === key ? { ...d, enabled: !currentVal } : d));
    } catch {
      // handled
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchDepts} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Layers className="w-6 h-6 text-[#F59E0B]" /> Department Modules
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure global application modules and feature limits</p>
        </div>
        <button onClick={fetchDepts} className="p-2 border border-slate-200 rounded-xl bg-card hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {depts.map(dept => (
          <div key={dept.key} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  dept.enabled ? 'bg-amber-50 text-[#F59E0B]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Layers className="w-5 h-5" />
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(dept.key, dept.enabled)}
                  disabled={toggling === dept.key}
                  className={`w-11 h-6 rounded-full transition-colors relative outline-none flex items-center ${
                    dept.enabled ? 'bg-[#F59E0B]' : 'bg-slate-200'
                  } disabled:opacity-50`}
                >
                  <span className={`w-4 border border-white h-4 rounded-full bg-card transition-transform absolute ${
                    dept.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Module key: {dept.key}</span>
              </div>

              {/* Stats & Usage details */}
              {dept.enabled ? (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-[#1f1f1f]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Max Users
                    </span>
                    <p className="text-sm font-semibold text-slate-700">{dept.userLimit > 0 ? dept.userLimit : 'Unlimited'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Active Usage
                    </span>
                    <p className="text-sm font-semibold text-slate-700">{dept.usage}</p>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 dark:border-[#1f1f1f] text-slate-400 text-xs flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-slate-300" /> Module is currently disabled globally.
                </div>
              )}
            </div>

            {dept.enabled && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between text-xs text-emerald-600 font-semibold bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Fully functional</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 rounded-full uppercase">Active</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
