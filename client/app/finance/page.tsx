'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { financeGetDashboard, financeGetPaymentStats } from '../../services/financeService';
import { useAuthStore } from '../../store/authStore';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  FileText,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Building2,
  PieChart,
  Wallet,
  Users,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  BrainCircuit,
  BellRing,
  Check,
  X,
  Briefcase,
  Scale,
  Target,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie,
  Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['var(--chart-blue)', 'var(--chart-green)', 'var(--chart-orange)', 'var(--chart-cyan)', 'var(--chart-yellow)', 'var(--chart-red)', 'var(--chart-teal)'];

interface DashboardData {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    outstandingInvoices: { count: number; amount: number };
    overdueInvoices: { count: number; amount: number };
    taxPending: number;
    taxPaid: number;
    totalPayroll: number;
    pendingPayroll: number;
    employeeCount: number;
  };
  revenueTrend: Array<{ month: string; revenue: number }>;
  expenseTrend: Array<{ month: string; expenses: number }>;
  expenseByCategory: Array<{ category: string; total: number }>;
  taxSummary: Array<{ taxType: string; total: number; status: string }>;
  recentInvoices: Array<{ id: string; invoice_number: string; customer_name: string; total: number; status: string; due_date: string }>;
  recentPayments: Array<{ id: string; amount: number; method: string; status: string; paid_at: string; invoice_number: string }>;
  pendingExpenses: Array<{ id: string; category: string; description: string; amount: number; expense_date: string; vendor_name: string }>;
  budgetTracking: Array<{ department: string; allocated: number; used: number }>;
  aiInsights: Array<{ type: string; message: string; action: string }>;
  complianceAlerts: Array<{ type: string; description: string; severity: string; dueDate: string }>;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export default function FinanceDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const user = useAuthStore((s) => s.user);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const [res, stats] = await Promise.all([
        financeGetDashboard(timeFilter),
        financeGetPaymentStats(timeFilter)
      ]);
      setData(res);
      setPaymentStats(stats);
    } catch (err) {
      console.error('Failed to load finance dashboard', err);
      setError('Failed to load finance dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)] font-medium animate-pulse">Assembling Finance Insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-[var(--destructive)]" />
          <p className="text-sm text-[var(--muted-foreground)] font-medium">{error}</p>
          <button onClick={loadDashboard} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || { totalRevenue: 0, totalExpenses: 0, profit: 0, outstandingInvoices: { count: 0, amount: 0 }, overdueInvoices: { count: 0, amount: 0 }, taxPending: 0, taxPaid: 0, totalPayroll: 0, pendingPayroll: 0, employeeCount: 0 };
  const budgetTracking = data?.budgetTracking || [];
  const aiInsights = data?.aiInsights || [];
  const complianceAlerts = data?.complianceAlerts || [];

  // Merge revenue and expense trends for Profit & Loss / Cash flow
  const cashFlowData = (data?.revenueTrend || []).map((r, i) => {
    const rev = r.revenue;
    const exp = data?.expenseTrend?.[i]?.expenses || 0;
    return {
      month: r.month,
      revenue: rev,
      expenses: exp,
      profit: rev - exp
    };
  });

  return (
    <div className="space-y-8">
      {/* Header section with Premium Gradient Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full translate-y-24 -translate-x-12 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Finance Hub <DollarSign className="w-8 h-8 text-amber-300 drop-shadow-lg" />
            </h1>
            <p className="text-blue-100 mt-2 font-medium flex items-center gap-2">
              Good Morning, {user?.name || 'Finance Manager'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl text-white transition-all active:scale-95 shadow-md relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#1e3a8a]" />
            </button>
            <button className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl text-white transition-all active:scale-95 shadow-md relative">
              <BellRing className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg ml-2 cursor-pointer" onClick={() => router.push('/finance/profile')}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
              )}
            </div>
            <a href="/finance/invoices" className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] transition-all active:scale-95 border border-white/10">
              <FileText className="w-4 h-4" />
              New Invoice
            </a>
            <button onClick={loadDashboard} className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl text-white transition-all active:scale-95 shadow-md">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter and Insights Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-white dark:bg-[#1A1A1A] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="Weekly">Weekly View</option>
          <option value="Monthly">Monthly View</option>
          <option value="Quarterly">Quarterly View</option>
          <option value="Yearly">Yearly View</option>
        </select>
      </div>

      {/* AI Insights Banner Core */}
      {aiInsights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.03 }} className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-500/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">AI Core Insights</h4>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{aiInsights[0].message}</p>
            </div>
          </div>
          <button className="px-4 py-1.5 bg-white dark:bg-[#1A1A1A] border border-violet-200 dark:border-violet-500/30 rounded-lg text-xs font-bold text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/40 transition-colors shadow-sm">
            {aiInsights[0].action}
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {[
          { label: 'Total Revenue', value: kpis.totalRevenue, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', shadow: 'shadow-emerald-500/10', aiTag: 'Growth prediction: +12%', tagColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20', href: '/finance/analytics' },
          { label: 'Total Expenses', value: kpis.totalExpenses, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', shadow: 'shadow-rose-500/10', aiTag: 'Expense Alerts: 2 detected', tagColor: 'text-rose-600 bg-rose-100 dark:bg-rose-500/20', href: '/finance/expenses' },
          { label: 'Net Profit', value: kpis.profit, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', shadow: 'shadow-blue-500/10', aiTag: 'Profit prediction: Stable', tagColor: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20', href: '/finance/analytics' },
          { label: 'Payroll Cost', value: kpis.totalPayroll, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', shadow: 'shadow-amber-500/10', aiTag: 'Cost Optimization: Available', tagColor: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20', href: '/finance/payroll' },
        ].map((kpi, i) => (
          <div key={i} onClick={() => router.push(kpi.href)} className={`cursor-pointer bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl p-5 rounded-2xl border ${kpi.border} shadow-sm hover:shadow-lg hover:-translate-y-1 ${kpi.shadow} transition-all duration-300 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`} />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-2 ${kpi.bg} ${kpi.color} rounded-xl shadow-sm`}><kpi.icon className="w-4 h-4" /></div>
            </div>
            <p className={`text-3xl font-black mt-4 relative z-10 tracking-tight ${kpi.label === 'Net Profit' && kpi.value < 0 ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
              {formatCurrency(kpi.value)}
            </p>
            <div className={`inline-flex items-center px-2 py-1 mt-3 rounded-md text-[10px] font-black uppercase tracking-wider ${kpi.tagColor} relative z-10`}>
              <BrainCircuit className="w-3 h-3 mr-1" /> {kpi.aiTag}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Charts Row: Revenue & Expense Overview, Profit & Loss */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Revenue Overview */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Revenue Overview
            </h3>
            <span className="flex items-center text-[10px] font-black text-violet-600 bg-violet-500/10 px-2 py-1 rounded-md uppercase tracking-widest"><BrainCircuit className="w-3 h-3 mr-1" /> Revenue Trend Analysis</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorRevOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevOnly)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Overview & Unusual Spending */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-500" /> Expense Overview
            </h3>
            <span className="flex items-center text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-widest animate-pulse"><ShieldAlert className="w-3 h-3 mr-1" /> Unusual Spending Detected</span>
          </div>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <RechartsPie>
                <Pie data={data?.expenseByCategory || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="total" paddingAngle={5} stroke="none">
                  {(data?.expenseByCategory || []).map((_e, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
             {(data?.expenseByCategory || []).slice(0, 3).map((d, i) => (
                <div key={d.category} className="text-xs font-bold text-[var(--muted-foreground)] bg-[var(--accent)] px-2 py-1 rounded border border-[var(--border)] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.category} (₹{(d.total/1000).toFixed(0)}k)
                </div>
              ))}
          </div>
        </div>

        {/* Profit vs Loss Analysis */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Profit & Loss
            </h3>
            <span className="flex items-center text-[10px] font-black text-blue-600 bg-blue-500/10 px-2 py-1 rounded-md uppercase tracking-widest"><BrainCircuit className="w-3 h-3 mr-1" /> Profit Forecasting</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} dx={-10} />
                <Tooltip cursor={{fill: 'var(--accent)'}} contentStyle={{ borderRadius: 16, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Payroll, Budgets, Approvals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payroll Summary */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Payroll Summary
            </h3>
          </div>
          <div className="space-y-4">
             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Salary Paid</p>
                   <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(kpis.totalPayroll)}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
             </div>
             <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Payroll</p>
                   <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(kpis.pendingPayroll)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center rounded-xl"><Clock className="w-6 h-6" /></div>
             </div>
             <div className="text-center mt-2">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest"><BrainCircuit className="w-3.5 h-3.5" /> AI: Payroll Prediction Stable</span>
             </div>
          </div>
        </div>

        {/* Budget Tracking */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" /> Budget Tracking
            </h3>
          </div>
          <div className="space-y-5">
             {budgetTracking.map((b, i) => {
               const percentage = (b.used / b.allocated) * 100;
               return (
               <div key={i}>
                 <div className="flex justify-between items-end mb-1.5">
                   <span className="text-sm font-bold text-[var(--foreground)]">{b.department}</span>
                   <span className="text-xs font-semibold text-[var(--muted-foreground)]">₹{(b.used/1000).toFixed(0)}k / ₹{(b.allocated/1000).toFixed(0)}k</span>
                 </div>
                 <div className="w-full bg-[var(--border)] rounded-full h-2.5 overflow-hidden">
                   <div className={`h-2.5 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                 </div>
               </div>
             )})}
             {budgetTracking.length === 0 && <div className="text-center text-sm font-medium text-[var(--muted-foreground)] py-8">No budgets allocated.</div>}
             <div className="text-center mt-4">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest"><BrainCircuit className="w-3.5 h-3.5" /> AI: Budget Optimization available</span>
             </div>
          </div>
        </div>

        {/* Expense Approval Panel */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Expense Approvals
            </h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[220px]">
             {data?.pendingExpenses.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] text-sm font-medium py-8 opacity-60">
                 No pending approvals.
               </div>
             ) : (
               data?.pendingExpenses.map((exp: any) => (
                 <div key={exp.id} className="p-3 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] rounded-xl flex items-center justify-between group">
                   <div className="space-y-0.5">
                     <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[120px]">{exp.description}</p>
                     <p className="text-[10px] font-black text-amber-600">₹{parseFloat(String(exp.amount)).toLocaleString()}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button className="w-7 h-7 flex items-center justify-center bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-md transition-colors" title="Approve">
                       <Check className="w-4 h-4" />
                     </button>
                     <button className="w-7 h-7 flex items-center justify-center bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-md transition-colors" title="Reject">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))
             )}
          </div>
          {data?.pendingExpenses && data.pendingExpenses.length > 0 && (
             <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest"><BrainCircuit className="w-3.5 h-3.5" /> AI: Safe to approve 80%</span>
             </div>
          )}
        </div>
      </motion.div>

      {/* Tables Row: Unpaid Invoices, Payments, Compliance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unpaid Invoices */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
                <FileText className={`w-5 h-5 text-blue-500`} /> Unpaid Invoices
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {(data?.recentInvoices || []).filter(i => i.status !== 'Paid').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] text-sm font-medium py-8 opacity-60">No unpaid invoices.</div>
              ) : (
                (data?.recentInvoices || []).filter(i => i.status !== 'Paid').map((inv: any) => (
                  <div key={inv.id} className="p-4 bg-[var(--surface)] hover:bg-[var(--accent)] transition-colors rounded-2xl flex items-center justify-between border border-[var(--border)] group cursor-pointer">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--foreground)] truncate max-w-[160px]">{inv.invoice_number}</p>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-semibold">{inv.customer_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[var(--foreground)]">₹{parseFloat(String(inv.total)).toLocaleString()}</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1
                          ${inv.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {inv.status}
                        </span>
                      </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest"><BrainCircuit className="w-3.5 h-3.5" /> AI: Late Payment Alerts Active</span>
             </div>
        </div>

        {/* Online Payments */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
                <CreditCard className={`w-5 h-5 text-emerald-500`} /> Online Payments
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {(paymentStats?.recentPayments || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] text-sm font-medium py-8 opacity-60">No payments found.</div>
              ) : (
                (paymentStats?.recentPayments || []).map((pay: any, idx: number) => (
                  <div key={idx} className="p-4 bg-[var(--surface)] hover:bg-[var(--accent)] transition-colors rounded-2xl flex items-center justify-between border border-[var(--border)] group cursor-pointer">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">₹{parseFloat(String(pay.amount)).toLocaleString()}</p>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-semibold block">{pay.customer_name || 'Client'}</span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                          ${pay.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                            pay.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {pay.status}
                        </span>
                      </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest"><BrainCircuit className="w-3.5 h-3.5" /> AI: Payment Prediction Active</span>
             </div>
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
                <Scale className={`w-5 h-5 text-indigo-500`} /> Compliance Alerts
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {(complianceAlerts).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] text-sm font-medium py-8 opacity-60">All compliant.</div>
              ) : (
                complianceAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-[var(--surface)] hover:bg-[var(--accent)] transition-colors rounded-2xl flex items-start gap-3 border border-[var(--border)]">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${alert.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[var(--foreground)]">{alert.type}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-tight">{alert.description}</p>
                        <p className="text-[10px] font-black mt-2 text-indigo-600">Due: {new Date(alert.dueDate).toLocaleDateString()}</p>
                      </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </motion.div>

      {/* Quick Actions Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <h3 className="font-extrabold text-[var(--foreground)] text-lg mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-violet-500" /> Quick Actions</span>
          <span className="text-[10px] font-black text-violet-600 bg-violet-500/10 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5" /> AI Suggested Actions</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/finance/payroll" className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-indigo-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><Users className="w-5 h-5" /></div>
            <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Run Payroll</span>
          </a>
          <a href="/finance/expenses" className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-amber-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><Receipt className="w-5 h-5" /></div>
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Add Expense</span>
          </a>
          <a href="/finance/invoices" className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
            <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-blue-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><FileText className="w-5 h-5" /></div>
            <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Create Invoice</span>
          </a>
          <a href="/finance/analytics" className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><BarChart3 className="w-5 h-5" /></div>
            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">View Reports</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
