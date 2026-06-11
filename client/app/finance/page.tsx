'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { financeGetDashboard } from '../../services/financeService';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetDashboard();
      setData(res);
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
      {/* Header section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Finance Dashboard 💰
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Welcome back, {user?.name || 'Finance Manager'}. Here is your financial overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/finance/invoices" className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all active:scale-95">
            <FileText className="w-4 h-4" />
            New Invoice
          </a>
          <button onClick={loadDashboard} className="p-2.5 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] rounded-xl text-[var(--muted-foreground)] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Revenue</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl"><DollarSign className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-4">{formatCurrency(kpis.totalRevenue)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total collected
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Expenses</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-4">{formatCurrency(kpis.totalExpenses)}</p>
          <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Total approved
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Profit</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${kpis.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(kpis.profit)}</p>
          <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-1">Revenue - Expenses</p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Outstanding</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl"><Receipt className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-4">{formatCurrency(kpis.outstandingInvoices.amount)}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {kpis.outstandingInvoices.count} invoices pending
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Overdue</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-4">{formatCurrency(kpis.overdueInvoices.amount)}</p>
          <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {kpis.overdueInvoices.count} overdue
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tax Summary</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl"><Wallet className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-4">{formatCurrency(kpis.taxPaid)}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {formatCurrency(kpis.taxPending)} pending
          </p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Cash Flow Chart */}
        <div className="lg:col-span-3 bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base">Cash Flow Overview</h3>
            <span className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Last 6 Months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-green)" fill="var(--chart-green)" fillOpacity={0.1} strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="var(--chart-red)" fill="var(--chart-red)" fillOpacity={0.1} strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="lg:col-span-2 bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Expense Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={data?.expenseByCategory || []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="total" paddingAngle={3} nameKey="category">
                  {(data?.expenseByCategory || []).map((_e, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {(data?.expenseByCategory || []).map((d, i) => (
              <div key={d.category} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.category}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tables Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Invoices */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base">Recent Invoices</h3>
            <a href="/finance/invoices" className="text-xs text-[var(--primary)] font-bold hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            {(data?.recentInvoices || []).length === 0 ? (
              <div className="text-center py-6 text-[var(--muted-foreground)] text-xs">No invoices yet.</div>
            ) : (
              (data?.recentInvoices || []).map(inv => (
                <div key={inv.id} className="p-3 bg-[var(--surface)] rounded-xl flex items-center justify-between border border-[var(--border)]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[160px]">{inv.invoice_number}</p>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">{inv.customer_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[var(--foreground)]">₹{parseFloat(String(inv.total)).toLocaleString()}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider mt-0.5
                      ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                        inv.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <a href="/finance/invoices" className="w-full mt-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-bold rounded-xl text-center block transition-all">
            View All Invoices
          </a>
        </div>

        {/* Recent Payments */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base">Recent Payments</h3>
            <a href="/finance/payments" className="text-xs text-[var(--primary)] font-bold hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            {(data?.recentPayments || []).length === 0 ? (
              <div className="text-center py-6 text-[var(--muted-foreground)] text-xs">No payments yet.</div>
            ) : (
              (data?.recentPayments || []).map(pay => (
                <div key={pay.id} className="p-3 bg-[var(--surface)] rounded-xl flex items-center justify-between border border-[var(--border)]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[var(--foreground)]">₹{parseFloat(String(pay.amount)).toLocaleString()}</p>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">{pay.invoice_number || 'Direct Payment'}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 uppercase tracking-wider">
                      {pay.method}
                    </span>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-semibold mt-0.5">
                      {new Date(pay.paid_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <a href="/finance/payments" className="w-full mt-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-bold rounded-xl text-center block transition-all">
            View All Payments
          </a>
        </div>

        {/* Pending Expenses */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base">Pending Approvals</h3>
            <a href="/finance/expenses" className="text-xs text-[var(--primary)] font-bold hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            {(data?.pendingExpenses || []).length === 0 ? (
              <div className="text-center py-6 text-[var(--muted-foreground)] text-xs">No pending expenses.</div>
            ) : (
              (data?.pendingExpenses || []).map(exp => (
                <div key={exp.id} className="p-3 bg-[var(--surface)] rounded-xl flex items-center justify-between border border-[var(--border)]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[160px]">{exp.description}</p>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">{exp.category} {exp.vendor_name ? `• ${exp.vendor_name}` : ''}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">₹{parseFloat(String(exp.amount)).toLocaleString()}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 uppercase tracking-wider mt-0.5">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <a href="/finance/expenses" className="w-full mt-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-bold rounded-xl text-center block transition-all">
            Review All Expenses
          </a>
        </div>
      </motion.div>

      {/* Tax Summary & Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tax Summary Table */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Tax Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Tax Type</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
                {(data?.taxSummary || []).map((t, i) => (
                  <tr key={i} className="hover:bg-[var(--accent)] transition">
                    <td className="py-3">{t.taxType}</td>
                    <td className="py-3 text-right font-bold">₹{t.total.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider
                        ${t.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          t.status === 'Filed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                          t.status === 'Overdue' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(data?.taxSummary || []).length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-[var(--muted-foreground)]">No tax records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/finance/invoices" className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-emerald-600 transition-all active:scale-95 group">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl group-hover:scale-110 transition"><FileText className="w-4 h-4" /></div>
              <span className="text-xs font-bold">Invoices</span>
            </a>
            <a href="/finance/payments" className="p-4 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-blue-600 transition-all active:scale-95 group">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition"><CreditCard className="w-4 h-4" /></div>
              <span className="text-xs font-bold">Payments</span>
            </a>
            <a href="/finance/expenses" className="p-4 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-amber-600 transition-all active:scale-95 group">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl group-hover:scale-110 transition"><Receipt className="w-4 h-4" /></div>
              <span className="text-xs font-bold">Expenses</span>
            </a>
            <a href="/finance/vendors" className="p-4 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-violet-100 dark:border-violet-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-violet-600 transition-all active:scale-95 group">
              <div className="p-2.5 bg-violet-600 text-white rounded-xl group-hover:scale-110 transition"><Building2 className="w-4 h-4" /></div>
              <span className="text-xs font-bold">Vendors</span>
            </a>
          </div>
          <a href="/finance/analytics" className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 bg-[var(--surface)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-bold rounded-xl text-center transition-all">
            <PieChart className="w-3.5 h-3.5" /> View Full Analytics
          </a>
        </div>
      </motion.div>
    </div>
  );
}
