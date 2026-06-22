'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  Users
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie,
  Pie, Cell
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
    employeeCount: number;
  };
  revenueTrend: Array<{ month: string; revenue: number }>;
  expenseTrend: Array<{ month: string; expenses: number }>;
  expenseByCategory: Array<{ category: string; total: number }>;
  taxSummary: Array<{ taxType: string; total: number; status: string }>;
  recentInvoices: Array<{ id: string; invoice_number: string; customer_name: string; total: number; status: string; due_date: string }>;
  recentPayments: Array<{ id: string; amount: number; method: string; status: string; paid_at: string; invoice_number: string }>;
  pendingExpenses: Array<{ id: string; category: string; description: string; amount: number; expense_date: string; vendor_name: string }>;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export default function FinanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const [res, stats] = await Promise.all([
        financeGetDashboard(),
        financeGetPaymentStats()
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
  }, []);

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

  const kpis = data?.kpis || { totalRevenue: 0, totalExpenses: 0, profit: 0, outstandingInvoices: { count: 0, amount: 0 }, overdueInvoices: { count: 0, amount: 0 }, taxPending: 0, taxPaid: 0, totalPayroll: 0, employeeCount: 0 };

  // Merge revenue and expense trends for cash flow chart
  const cashFlowData = (data?.revenueTrend || []).map((r, i) => ({
    month: r.month,
    revenue: r.revenue,
    expenses: data?.expenseTrend?.[i]?.expenses || 0
  }));

  return (
    <div className="space-y-8">
      {/* Header section with Premium Gradient Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden shadow-lg p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 55%, #60a5fa 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full translate-y-24 -translate-x-12 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Finance Dashboard <DollarSign className="w-8 h-8 text-amber-300 drop-shadow-md" />
            </h1>
            <p className="text-blue-100 mt-2 font-medium">
              Welcome back, {user?.name || 'Finance Manager'}. Here is your financial overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/finance/invoices" className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all active:scale-95">
              <FileText className="w-4 h-4" />
              New Invoice
            </a>
            <button onClick={loadDashboard} className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl text-white transition-all active:scale-95 shadow-md">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {[
          { label: 'Revenue', value: kpis.totalRevenue, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', shadow: 'shadow-emerald-500/10', sub: 'Total collected', subIcon: ArrowUpRight, subColor: 'text-emerald-600' },
          { label: 'Expenses', value: kpis.totalExpenses, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', shadow: 'shadow-rose-500/10', sub: 'Total approved', subIcon: ArrowDownRight, subColor: 'text-rose-600' },
          { label: 'Profit', value: kpis.profit, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', shadow: 'shadow-blue-500/10', sub: 'Revenue - Expenses', subIcon: null, subColor: 'text-[var(--muted-foreground)]' },
          { label: 'Outstanding', value: kpis.outstandingInvoices.amount, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', shadow: 'shadow-amber-500/10', sub: `${kpis.outstandingInvoices.count} pending`, subIcon: Clock, subColor: 'text-amber-600' },
          { label: 'Overdue', value: kpis.overdueInvoices.amount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', shadow: 'shadow-red-500/10', sub: `${kpis.overdueInvoices.count} overdue`, subIcon: AlertCircle, subColor: 'text-red-600' },
          { label: 'Tax Pending', value: kpis.taxPending, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', shadow: 'shadow-indigo-500/10', sub: `₹${kpis.taxPaid} paid`, subIcon: CheckCircle2, subColor: 'text-indigo-600', colSpan: 'col-span-2 lg:col-span-1' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.colSpan || ''} bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl p-5 rounded-2xl border ${kpi.border} shadow-sm hover:shadow-lg hover:-translate-y-1 ${kpi.shadow} transition-all duration-300 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`} />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-2 ${kpi.bg} ${kpi.color} rounded-xl shadow-sm`}><kpi.icon className="w-4 h-4" /></div>
            </div>
            <p className={`text-2xl font-black mt-4 relative z-10 ${kpi.label === 'Profit' && kpi.value < 0 ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
              {formatCurrency(kpi.value)}
            </p>
            <p className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${kpi.subColor} relative z-10`}>
              {kpi.subIcon && <kpi.subIcon className="w-3.5 h-3.5" />} {kpi.sub}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Payment Gateway Performance Section */}
      {paymentStats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Gateway Statistics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 dark:bg-[#1A1A1A]/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Online Collected</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(paymentStats.totalCollected)}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Processed via Stripe / Razorpay</p>
            </div>
            <div className="bg-white/70 dark:bg-[#1A1A1A]/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Online Outstanding</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(paymentStats.pending)}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Unpaid client invoice totals</p>
            </div>
            <div className="bg-white/70 dark:bg-[#1A1A1A]/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Failed Checkouts</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{paymentStats.failed}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Aborted or declined payments</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Cash Flow Chart */}
        <div className="lg:col-span-3 bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Cash Flow
            </h3>
            <span className="px-3 py-1 bg-[var(--accent)] text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider rounded-lg">6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev)" strokeWidth={3} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={3} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow">
          <h3 className="font-extrabold text-[var(--foreground)] text-lg mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" /> Expense Breakdown
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <RechartsPie>
                <Pie data={data?.expenseByCategory || []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="total" paddingAngle={5} nameKey="category" stroke="none">
                  {(data?.expenseByCategory || []).map((_e, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
            {(data?.expenseByCategory || []).map((d, i) => (
              <div key={d.category} className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] bg-[var(--accent)] px-2.5 py-1 rounded-lg">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.category}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tables Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {[
          { title: 'Recent Invoices', icon: FileText, data: data?.recentInvoices, link: '/finance/invoices', color: 'text-blue-500', render: (inv: any) => (
            <>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--foreground)] truncate max-w-[160px]">{inv.invoice_number}</p>
                <span className="text-[11px] text-[var(--muted-foreground)] font-semibold">{inv.customer_name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[var(--foreground)]">₹{parseFloat(String(inv.total)).toLocaleString()}</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1
                  ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    inv.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    inv.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {inv.status}
                </span>
              </div>
            </>
          )},
          { title: 'Online Payments', icon: CreditCard, data: paymentStats?.recentPayments, link: '/finance/payments', color: 'text-emerald-500', render: (pay: any) => (
            <>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">₹{parseFloat(String(pay.amount)).toLocaleString()}</p>
                <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mt-0.5 mr-1.5">{pay.gateway}</span>
                <span className="text-[11px] text-[var(--muted-foreground)] font-semibold block">{pay.customer_name} ({pay.invoice_number})</span>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                  ${pay.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    pay.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {pay.status}
                </span>
                <p className="text-[10px] text-[var(--muted-foreground)] font-semibold mt-1">
                  {pay.paid_at ? new Date(pay.paid_at).toLocaleDateString() : new Date(pay.created_at).toLocaleDateString()}
                </p>
              </div>
            </>
          )},
          { title: 'Pending Approvals', icon: AlertCircle, data: data?.pendingExpenses, link: '/finance/expenses', color: 'text-amber-500', render: (exp: any) => (
            <>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--foreground)] truncate max-w-[160px]">{exp.description}</p>
                <span className="text-[11px] text-[var(--muted-foreground)] font-semibold">{exp.category} {exp.vendor_name ? `• ${exp.vendor_name}` : ''}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-amber-600">₹{parseFloat(String(exp.amount)).toLocaleString()}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-wider mt-1">
                  Pending
                </span>
              </div>
            </>
          )}
        ].map((list, i) => (
          <div key={i} className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[var(--foreground)] text-lg flex items-center gap-2">
                <list.icon className={`w-5 h-5 ${list.color}`} /> {list.title}
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {(list.data || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] text-sm font-medium py-8 opacity-60">
                  <list.icon className="w-8 h-8 mb-2 opacity-50" />
                  No records found.
                </div>
              ) : (
                (list.data || []).map((item: any) => (
                  <div key={item.id} className="p-4 bg-[var(--surface)] hover:bg-[var(--accent)] transition-colors rounded-2xl flex items-center justify-between border border-[var(--border)] group cursor-pointer">
                    {list.render(item)}
                  </div>
                ))
              )}
            </div>
            <a href={list.link} className="w-full mt-5 py-3 bg-[var(--surface)] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-500/30 border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-bold rounded-xl text-center block transition-all shadow-sm">
              View All
            </a>
          </div>
        ))}
      </motion.div>

      {/* Tax Summary & Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tax Summary Table */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <h3 className="font-extrabold text-[var(--foreground)] text-lg mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" /> Tax Summary
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="p-4">Tax Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm font-bold text-[var(--foreground)] bg-[var(--card)]">
                {(data?.taxSummary || []).map((t, i) => (
                  <tr key={i} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="p-4">{t.taxType}</td>
                    <td className="p-4 text-right">₹{t.total.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                        ${t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          t.status === 'Filed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                          t.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(data?.taxSummary || []).length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-[var(--muted-foreground)] font-medium">No tax records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-[var(--border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <h3 className="font-extrabold text-[var(--foreground)] text-lg mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/finance/invoices" className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><FileText className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Invoices</span>
            </a>
            <a href="/finance/payments" className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
              <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-blue-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><CreditCard className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Payments</span>
            </a>
            <a href="/finance/expenses" className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-amber-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><Receipt className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Expenses</span>
            </a>
            <a href="/finance/vendors" className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border border-violet-200/60 dark:border-violet-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
              <div className="p-3 bg-violet-500 text-white rounded-2xl shadow-violet-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300"><Building2 className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-violet-800 dark:text-violet-300">Vendors</span>
            </a>
          </div>
          <a href="/finance/analytics" className="w-full mt-4 py-3.5 flex items-center justify-center gap-2 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)] text-sm font-black uppercase tracking-wider rounded-2xl text-center transition-all shadow-sm">
            <PieChart className="w-4 h-4" /> View Full Analytics
          </a>
        </div>
      </motion.div>
    </div>
  );
}
