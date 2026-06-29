'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { BarChart3, Target, TrendingUp, Phone, CheckCircle2, Sparkles, Award, Check, Edit3, X, Save } from 'lucide-react';

function SalesExecutivePerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interactive Target / Change State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [customTarget, setCustomTarget] = useState(100000); // 1L default target
  const [customAchieved, setCustomAchieved] = useState(86000); // 86K default achieved
  const [tempTarget, setTempTarget] = useState(customTarget);
  const [tempAchieved, setTempAchieved] = useState(customAchieved);

  useEffect(() => {
    api.get('/sales/performance')
      .then(r => {
        const d = r.data?.data?.stats || r.data;
        setData(d);
        if (d?.target_amount) setCustomTarget(Number(d.target_amount));
        if (d?.achieved_amount) setCustomAchieved(Number(d.achieved_amount));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveTarget = () => {
    api.patch('/sales/performance', { target_amount: tempTarget, achieved_amount: tempAchieved })
      .then(() => {
        setCustomTarget(tempTarget);
        setCustomAchieved(tempAchieved);
        setShowChangeModal(false);
      })
      .catch(() => {
        setCustomTarget(tempTarget);
        setCustomAchieved(tempAchieved);
        setShowChangeModal(false);
      });
  };

  const calculatedScore = useMemo(() => {
    if (!customTarget) return 86;
    const score = Math.min(Math.round((customAchieved / customTarget) * 100), 100);
    return Math.max(score, 10);
  }, [customTarget, customAchieved]);

  const kpis = [
    { label: 'Monthly Target',  value: `₹${(customTarget/1000).toFixed(0)}K`, icon: Target,       color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', desc: 'Quota assigned' },
    { label: 'Achieved Revenue',value: `₹${(customAchieved/1000).toFixed(0)}K`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', desc: `${calculatedScore}% of quota met` },
    { label: 'Total Calls',     value: data?.calls_made ?? '142 Calls', icon: Phone,        color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', desc: 'Active prospecting' },
    { label: 'Converted Deals', value: data?.converted_leads ?? '18 Won', icon: CheckCircle2, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', desc: 'Closed this month' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ─── PERFORMANCE SCORE GRID CARD ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 shadow-xl text-white">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-white">{calculatedScore}</span>
                <span className="text-sm font-bold text-white/70">/100</span>
              </div>
              <svg className="w-full h-full -rotate-90 transform p-1" viewBox="0 0 36 36">
                <path className="text-white/20" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-white" strokeDasharray={`${calculatedScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold tracking-tight">Sales Executive Score: {calculatedScore >= 80 ? 'Excellent' : 'Good'}</h2>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Your performance score reflects monthly quota achievement, outbound call activity, and deal conversion efficiency.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-300" /> Consistent Outreach
                </span>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" /> High Conversion Rate
                </span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Dynamic Adjustment
              </h4>
              <p className="text-xs text-white/90 leading-relaxed mb-3">
                Customize your monthly individual sales targets to instantly update goal thresholds and recalculate your score.
              </p>
            </div>
            <button 
              onClick={() => { setTempTarget(customTarget); setTempAchieved(customAchieved); setShowChangeModal(true); }}
              className="w-full py-2 bg-white text-indigo-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Change Target / Goals
            </button>
          </div>
        </div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── CHANGE TARGET MODAL ─── */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" /> Adjust Sales Executive Targets
              </h3>
              <button onClick={() => setShowChangeModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1.5">Monthly Target (₹)</label>
                <input 
                  type="number" 
                  value={tempTarget} 
                  onChange={(e) => setTempTarget(Number(e.target.value))} 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-blue-500" 
                />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Example: 100000 for ₹1 Lakh</p>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1.5">Achieved Amount (₹)</label>
                <input 
                  type="number" 
                  value={tempAchieved} 
                  onChange={(e) => setTempAchieved(Number(e.target.value))} 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-blue-500" 
                />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Example: 86000 for ₹86K</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowChangeModal(false)} className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)] transition">
                Cancel
              </button>
              <button onClick={handleSaveTarget} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${k.color} shrink-0`}>
              <k.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider truncate">{k.label}</p>
              <p className="text-xl font-extrabold text-[var(--foreground)] mt-0.5">{loading ? '…' : k.value}</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1 truncate">{k.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SalesExecutiveProfilePage() {
  return (
    <ProfileCore
      accent="blue"
      roleLabel="Sales Executive"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <SalesExecutivePerformanceTab /> }]}
    />
  );
}
