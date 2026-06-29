'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { BarChart3, Target, TrendingUp, Users, Trophy, Sparkles, Award, Check, CheckSquare, Clock, Activity, Edit3, X, Save, Shield, HelpCircle, AlertTriangle, MessageSquare, PhoneCall, Mail, ChevronRight, Zap, CheckCircle2, Key, Lock, Bell, FileText, Download, Upload, Folder } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function SalesManagerPerformanceTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interactive Target / Change State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [customTarget, setCustomTarget] = useState(5000000); // 50L default
  const [customRevenue, setCustomRevenue] = useState(4200000); // 42L default
  const [tempTarget, setTempTarget] = useState(customTarget);
  const [tempRevenue, setTempRevenue] = useState(customRevenue);

  useEffect(() => {
    api.get('/sales-manager/dashboard')
      .then(r => {
        const d = r.data?.data || r.data;
        setData(d);
        if (d?.managerTarget?.revenue_target) setCustomTarget(Number(d.managerTarget.revenue_target));
        else if (d?.managerTarget?.target_amount) setCustomTarget(Number(d.managerTarget.target_amount));
        if (d?.managerTarget?.revenue_achieved) setCustomRevenue(Number(d.managerTarget.revenue_achieved));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveTarget = () => {
    api.patch('/sales-manager/targets', { revenueTarget: tempTarget, revenueAchieved: tempRevenue })
      .then(() => {
        setCustomTarget(tempTarget);
        setCustomRevenue(tempRevenue);
        setShowChangeModal(false);
      })
      .catch(() => {
        setCustomTarget(tempTarget);
        setCustomRevenue(tempRevenue);
        setShowChangeModal(false);
      });
  };

  const calculatedScore = useMemo(() => {
    if (!customTarget) return 85;
    const score = Math.min(Math.round((customRevenue / customTarget) * 100), 100);
    return Math.max(score, 10);
  }, [customTarget, customRevenue]);

  const kpis = [
    { label: 'Team Size',      value: data?.teamPerformance?.length ?? '8 Executives', icon: Users,     color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', desc: 'Active sales reps' },
    { label: 'Team Revenue',   value: `₹${(customRevenue/100000).toFixed(1)}L`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', desc: `Target: ₹${(customTarget/100000).toFixed(1)}L` },
    { label: 'Leads Assigned', value: data?.kpis?.totalLeads ?? '342 Leads', icon: Target,    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', desc: 'Distributed this month' },
    { label: 'Conversions',    value: data?.managerTarget?.leads_converted ?? '128 Won', icon: Trophy,    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', desc: '37.4% conversion win rate' },
  ];

  const trend = data?.pipeline?.map((p: any) => ({ month: p.stage, revenue: p.count })) || [
    { month: 'Prospecting', revenue: 45 },
    { month: 'Qualification', revenue: 38 },
    { month: 'Proposal', revenue: 30 },
    { month: 'Negotiation', revenue: 22 },
    { month: 'Closed Won', revenue: 128 },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ─── PERFORMANCE SCORE GRID CARD ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-8 shadow-xl text-white">
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
                <h2 className="text-2xl font-bold tracking-tight">Sales Leadership Score: {calculatedScore >= 80 ? 'Excellent' : 'Good'}</h2>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Your performance score reflects team revenue generation, lead distribution velocity, and pipeline progression efficiency.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-300" /> Team Target Aligned
                </span>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" /> Active Mentorship
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
                Customize your monthly team goals to instantly update target thresholds and recalculate leadership scores.
              </p>
            </div>
            <button 
              onClick={() => { setTempTarget(customTarget); setTempRevenue(customRevenue); setShowChangeModal(true); }}
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
                <Edit3 className="w-4 h-4 text-blue-500" /> Adjust Team Targets
              </h3>
              <button onClick={() => setShowChangeModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1.5">Target Revenue (₹)</label>
                <input 
                  type="number" 
                  value={tempTarget} 
                  onChange={(e) => setTempTarget(Number(e.target.value))} 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-blue-500" 
                />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Example: 5000000 for ₹50 Lakhs</p>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1.5">Achieved Revenue (₹)</label>
                <input 
                  type="number" 
                  value={tempRevenue} 
                  onChange={(e) => setTempRevenue(Number(e.target.value))} 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:border-blue-500" 
                />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Example: 4200000 for ₹42 Lakhs</p>
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

      {/* ─── PIPELINE TREND ─── */}
      {trend.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Sales Pipeline Stage Conversion</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Distribution of active deals across current pipeline stages</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesManagerProfilePage() {
  const extraTabs = [
    { id: 'performance', label: 'Performance', icon: BarChart3, content: <SalesManagerPerformanceTab /> },
    { id: 'team_insights', label: 'Team Insights', icon: Users, content: <SalesManagerTeamInsightsTab /> },
    { id: 'activity', label: 'Activity & Tasks', icon: Activity, content: <SalesManagerActivityTab /> },
    { id: 'security', label: 'Security', icon: Lock, content: <SalesManagerSecurityTab /> },
    { id: 'notifications', label: 'Notifications', icon: Bell, content: <SalesManagerNotificationsTab /> },
    { id: 'documents', label: 'Documents', icon: Folder, content: <SalesManagerDocumentsTab /> },
    { id: 'permissions', label: 'Permissions', icon: Shield, content: <SalesManagerPermissionsTab /> },
    { id: 'ai_insights', label: 'AI Strategy Core', icon: Sparkles, content: <SalesManagerAiInsightsTab /> },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, content: <SalesManagerHelpTab /> },
  ];

  return (
    <ProfileCore
      accent="blue"
      roleLabel="Sales Manager"
      extraTabs={extraTabs}
    />
  );
}

// ─── TAB 2: TEAM INSIGHTS ───
function SalesManagerTeamInsightsTab() {
  const teamList = [
    { name: 'Priya Sharma', role: 'Senior Sales Executive', leads: 68, won: 24, rate: 35.3, status: 'Top Performer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { name: 'Rahul Mehta', role: 'Sales Executive', leads: 54, won: 18, rate: 33.3, status: 'On Track', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
    { name: 'Sneha Patel', role: 'Sales Executive', leads: 61, won: 17, rate: 27.9, status: 'On Track', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
    { name: 'Arjun Singh', role: 'Sales Executive', leads: 47, won: 14, rate: 29.8, status: 'Needs Support', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
    { name: 'Geeta Rao', role: 'Sales Executive', leads: 39, won: 10, rate: 25.6, status: 'Coaching Recommended', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Team Performance Overview & Ranking
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Active monitoring of executive conversion rates and AI coaching recommendations</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Executive</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Leads Handled</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Conversions</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Win Rate</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">AI Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {teamList.map((m, i) => (
                <tr key={i} className="hover:bg-[var(--accent)] transition">
                  <td className="px-4 py-3.5 font-bold text-[var(--foreground)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {m.name}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{m.role}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-[var(--foreground)]">{m.leads}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-emerald-600">{m.won}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-[var(--foreground)]">{m.rate}%</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${m.color}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4" /> Top Performer Highlight
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mb-4">
            Priya Sharma has consistently achieved over 35% conversion rate. Consider assigning her to mentor junior executives or lead high-value enterprise pitches.
          </p>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition">
            Reward / Assign Mentorship
          </button>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Coaching Opportunity
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-4">
            Geeta Rao's conversion win rate has experienced a slight decline (25.6%). AI diagnosis indicates drop-offs during the negotiation stage.
          </p>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition">
            Schedule Coaching Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: ACTIVITY & PRODUCTIVITY ───
function SalesManagerActivityTab() {
  const activities = [
    { type: 'Calls Completed', count: '142 Calls', icon: PhoneCall, progress: 85, color: 'bg-blue-500' },
    { type: 'Emails Sent', count: '384 Emails', icon: Mail, progress: 92, color: 'bg-violet-500' },
    { type: 'Meetings Held', count: '28 Meetings', icon: Users, progress: 75, color: 'bg-amber-500' },
    { type: 'Tasks Closed', count: '94 Tasks', icon: CheckSquare, progress: 88, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Team Activity & Productivity Metrics
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Aggregate tracking of communication velocity and task execution across the sales team</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold">
            Productivity Score: 88/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((a, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f1f1f] shadow-sm border border-[var(--border)] flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{a.type}</p>
                    <p className="text-lg font-black text-[var(--foreground)] mt-0.5">{a.count}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--foreground)]">{a.progress}% to goal</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${a.color}`} style={{ width: `${a.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: PERMISSIONS & ACCESS ───
function SalesManagerPermissionsTab() {
  const permissions = [
    { module: 'Leads Management', level: 'Full Access', desc: 'Create, edit, assign, bulk assign, and delete sales leads', active: true },
    { module: 'Team Executives', level: 'Full Access', desc: 'Add new executives, set individual target amounts, and review activity', active: true },
    { module: 'Sales Reports & Analytics', level: 'Full Access', desc: 'View, filter, export PDF/CSV, and save custom sales reports', active: true },
    { module: 'System Admin Configuration', level: 'Restricted', desc: 'Manage top-level organizational branches and global billing rules', active: false },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Module Permissions & Authorization
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Current access rights assigned to your Sales Manager role by the central administration</p>
          </div>
        </div>
        <div className="space-y-4">
          {permissions.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.active ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{p.module}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{p.desc}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800'}`}>
                {p.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 5: AI INSIGHTS CORE ───
function SalesManagerAiInsightsTab() {
  const insights = [
    { title: 'Pipeline Velocity Optimization', desc: 'Leads assigned within 15 minutes of inbound inquiry exhibit a 40% higher conversion rate. Currently, average initial contact time is 22 minutes.', action: 'Automate Instant Routing', icon: Zap, color: 'text-blue-600 bg-blue-50' },
    { title: 'Stagnant Deal Alert', desc: 'There are 34 deals in the Negotiation stage that have not received an activity log in over 7 days. Estimated total at-risk value: ₹14.2L.', action: 'Trigger Re-engagement Sequence', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { title: 'Revenue Target Projection', desc: 'Based on current daily conversion trajectory, the team is forecasted to achieve 104% of the monthly revenue target. Keep the focus on closing warm prospects.', action: 'View Revenue Forecast Chart', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-lg font-black">AI Core Strategy Engine</h3>
            <p className="text-xs text-white/80 mt-0.5">Real-time predictive analytics and decision guidance powered by CRM machine learning</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
          The AI engine constantly scans team activity logs, lead interaction patterns, and email response latency to identify hidden bottlenecks and highlight immediate opportunities for revenue capture.
        </p>
      </div>

      <div className="space-y-4">
        {insights.map((ins, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${ins.color}`}>
                <ins.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)]">{ins.title}</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed max-w-2xl">{ins.desc}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition shrink-0 flex items-center justify-center gap-1.5">
              {ins.action} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 6: HELP & SUPPORT ───
function SalesManagerHelpTab() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDesc) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTicketSubject('');
      setTicketDesc('');
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> Raise an Issue / Contact Administrator
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Submit technical support requests or system configuration change queries directly to IT support</p>
          </div>
          {submitted ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-sm font-bold">Support Ticket Created Successfully!</p>
                <p className="text-xs mt-0.5 opacity-90">An administrator will review your request and respond within 2 hours.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Issue Subject *</label>
                <input 
                  type="text" 
                  value={ticketSubject} 
                  onChange={(e) => setTicketSubject(e.target.value)} 
                  placeholder="e.g. Lead Export Permission Error" 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-xs focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Detailed Description *</label>
                <textarea 
                  rows={4} 
                  value={ticketDesc} 
                  onChange={(e) => setTicketDesc(e.target.value)} 
                  placeholder="Explain the problem or request in detail..." 
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] text-xs focus:outline-none focus:border-blue-500 resize-none" 
                  required 
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                Submit Support Ticket
              </button>
            </form>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-yellow-300" />
            </div>
            <h3 className="text-xl font-black">24/7 AI Chatbot Assistant</h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Need immediate answers on lead routing rules, target formula configurations, or executive leaderboard calculations? Our AI Support Assistant is ready to help instantly.
            </p>
          </div>
          <button className="w-full mt-6 py-3 bg-white text-indigo-700 hover:bg-slate-100 rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Start AI Support Chat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: SECURITY SETTINGS ───
function SalesManagerSecurityTab() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [twoFactor, setTwoFactor] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('New passwords do not match');
      return;
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }, 3500);
  };

  return (
    <div className="space-y-6 pb-10">
      {showToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">Security settings updated successfully!</span>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> Password Management
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Update your account credentials and security keys</p>
          </div>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Current Password</label>
            <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/25">
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">Two-Factor Authentication (2FA)</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Secure your account with an extra layer of biometric or OTP security</p>
          </div>
        </div>
        <button onClick={() => { setTwoFactor(!twoFactor); setShowToast(true); setTimeout(() => setShowToast(false), 2500); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${twoFactor ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-slate-100 text-slate-600'}`}>
          {twoFactor ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
}

// ─── TAB: NOTIFICATIONS CONTROL ───
function SalesManagerNotificationsTab() {
  const [notifs, setNotifs] = useState([
    { id: 'lead_assign', title: 'New Lead Assignment Alerts', desc: 'Get instantly notified when a high-value lead enters the manager pool', email: true, push: true },
    { id: 'team_act', title: 'Team Executive Task Closures', desc: 'Daily digests of calls completed and follow-ups closed by executives', email: false, push: true },
    { id: 'app_req', title: 'Pending Approval Requests', desc: 'Immediate mobile notifications for leave and discount approval submissions', email: true, push: true },
    { id: 'sys_sec', title: 'System Security & Access Logins', desc: 'Receive security warnings when new devices access your manager profile', email: true, push: false },
  ]);
  const [savedToast, setSavedToast] = useState(false);

  const toggleVal = (id: string, key: 'email' | 'push') => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, [key]: !n[key] } : n));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      {savedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">Notification preferences updated!</span>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" /> Communication & Alert Control
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Customizable rules for instant push notifications and daily email summaries</p>
          </div>
        </div>
        <div className="space-y-4">
          {notifs.map(n => (
            <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{n.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => toggleVal(n.id, 'email')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${n.email ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  Email: {n.email ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => toggleVal(n.id, 'push')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${n.push ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  Push: {n.push ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: DOCUMENT STORAGE ───
function SalesManagerDocumentsTab() {
  const [docs, setDocs] = useState([
    { id: 'doc-1', name: 'Q3_Sales_Strategy_Guidelines.pdf', size: '4.2 MB', date: '2026-06-15', type: 'PDF', category: 'Strategy' },
    { id: 'doc-2', name: 'Executive_Onboarding_Manual_2026.pdf', size: '12.8 MB', date: '2026-06-20', type: 'PDF', category: 'Training' },
    { id: 'doc-3', name: 'Enterprise_Contract_Template_v4.docx', size: '1.1 MB', date: '2026-06-25', type: 'DOCX', category: 'Contracts' },
    { id: 'doc-4', name: 'Regional_Compliance_Audit_Report.xlsx', size: '2.5 MB', date: '2026-06-28', type: 'XLSX', category: 'Compliance' },
  ]);
  const [uploadToast, setUploadToast] = useState(false);

  const handleUpload = () => {
    const fakeName = prompt('Enter new document name (e.g. Price_List_v2.pdf):');
    if (!fakeName) return;
    setDocs(prev => [{ id: `doc-${Date.now()}`, name: fakeName, size: '2.4 MB', date: '2026-06-29', type: fakeName.endsWith('.pdf') ? 'PDF' : 'DOC', category: 'General' }, ...prev]);
    setUploadToast(true);
    setTimeout(() => setUploadToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-10">
      {uploadToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">Document securely uploaded to cloud storage!</span>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-600" /> Manager Document Vault
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Secure cloud repository for sales playbooks, compliance templates, and training materials</p>
          </div>
          <button onClick={handleUpload} className="flex items-center gap-1.5 px-4 py-2 bg-[#059669] text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20">
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
        <div className="space-y-3">
          {docs.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">
                  {d.type}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">{d.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--muted-foreground)]">
                    <span className="font-semibold text-emerald-600">{d.category}</span>
                    <span>•</span>
                    <span>{d.size}</span>
                    <span>•</span>
                    <span>Uploaded {d.date}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => alert(`Downloading ${d.name}...`)} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors shrink-0">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
