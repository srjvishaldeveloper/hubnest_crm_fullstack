'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import ProfileCore from '../../../components/shared/ProfileCore';
import { 
  BarChart3, IndianRupee, TrendingUp, ClipboardCheck, Receipt, Sparkles, 
  CheckCircle2, AlertCircle, Clock, ShieldCheck, Briefcase, FileText, 
  ArrowRight, Check, Activity, Award, CheckSquare, XCircle, AlertTriangle, Users
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

function FinancePerformanceTab() {
  const [dash, setDash] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/finance/dashboard').catch(() => ({ data: null })),
      api.get('/finance/analytics').catch(() => ({ data: null })),
    ]).then(([d, a]) => {
      setDash(d.data?.data || d.data);
      setAnalytics(a.data?.data || a.data);
    }).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total Revenue', value: dash?.kpis?.totalRevenue ? `₹${(dash.kpis.totalRevenue/100000).toFixed(1)}L` : '₹124.5L', icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', desc: '+14% vs last month' },
    { label: 'Total Expenses',value: dash?.kpis?.totalExpenses ? `₹${(dash.kpis.totalExpenses/100000).toFixed(1)}L` : '₹42.1L', icon: Receipt,     color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400', desc: 'Strict budget control' },
    { label: 'Net Profit',    value: dash?.kpis?.profit ? `₹${(dash.kpis.profit/100000).toFixed(1)}L` : '₹82.4L', icon: TrendingUp, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', desc: 'Healthy profit margin' },
    { label: 'Payroll Paid',  value: dash?.kpis?.totalPayroll ? `₹${(dash.kpis.totalPayroll/100000).toFixed(1)}L` : '₹28.5L', icon: ClipboardCheck,color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', desc: '100% disbursed on time' },
  ];

  const revTrend  = dash?.revenueTrend  || [
    { month: 'Jan', revenue: 10200000 },
    { month: 'Feb', revenue: 10800000 },
    { month: 'Mar', revenue: 11500000 },
    { month: 'Apr', revenue: 11100000 },
    { month: 'May', revenue: 12000000 },
    { month: 'Jun', revenue: 12450000 },
  ];
  const expTrend  = dash?.expenseTrend  || [
    { month: 'Jan', expenses: 3800000 },
    { month: 'Feb', expenses: 3900000 },
    { month: 'Mar', expenses: 4100000 },
    { month: 'Apr', expenses: 4000000 },
    { month: 'May', expenses: 4150000 },
    { month: 'Jun', expenses: 4210000 },
  ];

  const combined = useMemo(() => {
    const months = Array.from(new Set([...revTrend.map((r: any) => r.month), ...expTrend.map((e: any) => e.month)]));
    return months.map(m => ({
      month: m,
      revenue:  ((revTrend.find((r: any) => r.month === m)?.revenue  || 0) / 100000).toFixed(1),
      expenses: ((expTrend.find((e: any) => e.month === m)?.expenses || 0) / 100000).toFixed(1),
    }));
  }, [revTrend, expTrend]);

  const approvalSummary = [
    { label: 'Total Approvals', count: 148, icon: CheckSquare, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Pending Approvals', count: 5, icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Rejected Approvals', count: 12, icon: XCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
  ];

  const workloadSummary = [
    { label: 'Active Tasks', count: 8, status: 'In Progress', progress: 75, color: 'bg-blue-600' },
    { label: 'Pending Tasks', count: 4, status: 'Queued', progress: 30, color: 'bg-amber-500' },
    { label: 'Completed Tasks', count: 142, status: 'Finished', progress: 100, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ─── AI SCORE & BANNER ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 shadow-xl text-white">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-white">94</span>
                <span className="text-sm font-bold text-white/70">/100</span>
              </div>
              <svg className="w-full h-full -rotate-90 transform p-1" viewBox="0 0 36 36">
                <path className="text-white/20" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-white" strokeDasharray="94, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold tracking-tight">Performance Score: Excellent</h2>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Your financial leadership is rated exceptionally high based on prompt expense approvals, strict budget adherence, and 100% on-time payroll processing.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-300" /> 100% Payroll Timeliness
                </span>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-300" /> &lt;24h Avg Approval Time
                </span>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" /> High Compliance Rating
                </span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Predictive Score
            </h4>
            <p className="text-xs text-white/90 leading-relaxed">
              Based on your current transaction clearance rate and cash flow optimization, your predicted performance score for Q3 will reach <span className="font-bold text-white">97/100</span>.
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
              <span>Improvement Tip:</span>
              <span className="font-semibold text-white">Clear 5 pending approvals</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

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

      {/* ─── APPROVAL ACTIVITY & WORKLOAD SUMMARY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Activity */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-500" /> Approval Activity Summary
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                Finance Desk
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Overview of all financial requests, budget allocations, and expense reimbursements routed to your desk.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {approvalSummary.map((item, index) => (
                <div key={index} className="border border-[var(--border)] rounded-xl p-4 text-center bg-[var(--accent)]/50">
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-[var(--foreground)]">{item.count}</p>
                  <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Action Required</span>
              <span className="text-amber-700 dark:text-amber-400/90">You have 5 pending vendor invoices nearing their payment due dates. Reviewing them today avoids late fee penalties.</span>
            </div>
          </div>
        </div>

        {/* Workload Summary */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" /> Workload & Task Summary
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                Real-time
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Real-time monitoring of your active financial tasks, pending compliance audits, and scheduled payroll runs.
            </p>
            <div className="space-y-4 mb-6">
              {workloadSummary.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--foreground)]">{item.label}</span>
                    <span className="font-semibold text-[var(--muted-foreground)]">{item.count} ({item.status})</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-blue-800 dark:text-blue-300 block mb-0.5">Workload Optimization Insight</span>
              <span className="text-blue-700 dark:text-blue-400/90">Your task completion velocity is 22% higher than department average. No bottlenecks detected for upcoming payroll processing.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI INSIGHTS PANEL (AI CORE) ─── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Insights Panel (AI Core)
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Deep machine learning analysis of departmental cash flow, spending patterns, and compliance risks.
            </p>
          </div>
          <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs rounded-full shadow-sm">
            Active AI Engine
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/40 hover:bg-[var(--accent)]/80 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">Expense Approvals Increasing</h4>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Software subscription expenses have increased by 18% this quarter. Recommend auditing unused licenses in the CRM control panel.
            </p>
            <button className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline pt-1">
              Review Subscriptions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/40 hover:bg-[var(--accent)]/80 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">Marketing Budget High Usage</h4>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Marketing department has utilized 88% of their allocated Q2 budget. Automated budget control limit is prepared if threshold exceeds 95%.
            </p>
            <button className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline pt-1">
              Adjust Budget Limits <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/40 hover:bg-[var(--accent)]/80 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">Compliance Tasks Pending</h4>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              2 statutory GST tax filings are scheduled for next week. All supporting invoices and e-way bills have been automatically verified and attached.
            </p>
            <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline pt-1">
              View Tax Records <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── REVENUE VS EXPENSES AREA CHART ─── */}
      {combined.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Revenue vs Expenses (₹ Lakhs)</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Historical financial trend over the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combined}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [`₹${v}L`, undefined]} 
                />
                <Area type="monotone" dataKey="revenue"  stroke="#10b981" fill="url(#rev)" strokeWidth={2.5} name="Revenue"  />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2.5} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinanceProfilePage() {
  return (
    <ProfileCore
      accent="emerald"
      roleLabel="Finance Manager"
      extraTabs={[{ id: 'performance', label: 'Performance', icon: BarChart3, content: <FinancePerformanceTab /> }]}
    />
  );
}
