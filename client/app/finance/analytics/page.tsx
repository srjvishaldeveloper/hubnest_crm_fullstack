'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { financeGetAnalytics } from '../../../services/financeService';
import {
  BarChart3, RefreshCw, AlertCircle, TrendingUp,
  ArrowUpRight, DollarSign, Users, Building2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';

const CHART_COLORS = ['var(--chart-blue)', 'var(--chart-green)', 'var(--chart-orange)', 'var(--chart-cyan)', 'var(--chart-yellow)', 'var(--chart-red)', 'var(--chart-teal)'];

interface AnalyticsData {
  cashFlow: Array<{ month: string; inflow: number; outflow: number }>;
  paymentMethods: Array<{ method: string; count: number; total: number }>;
  invoiceStatus: Array<{ status: string; count: number; total: number }>;
  topCustomers: Array<{ name: string; invoiceCount: number; revenue: number }>;
  vendorSpend: Array<{ name: string; spend: number; expenseCount: number }>;
  profitTrend: Array<{ month: string; profit: number }>;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)] font-medium animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-[var(--destructive)]" />
          <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
          <button onClick={loadAnalytics} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  const invoiceStatusColors: Record<string, string> = {
    'Paid': 'var(--chart-green)',
    'Sent': 'var(--chart-blue)',
    'Overdue': 'var(--chart-red)',
    'Draft': 'var(--chart-yellow)',
    'Cancelled': 'var(--chart-axis)'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--primary)]" /> Financial Analytics
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Deep insights into your financial performance.</p>
        </div>
        <button onClick={loadAnalytics} className="p-2.5 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] rounded-xl text-[var(--muted-foreground)] transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Row 1: Cash Flow + Profit Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cash Flow */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Cash Flow (Inflow vs Outflow)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={data?.cashFlow || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="inflow" fill="var(--chart-green)" radius={[4, 4, 0, 0]} name="Inflow" />
                <Bar dataKey="outflow" fill="var(--chart-red)" radius={[4, 4, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Profit Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <AreaChart data={data?.profitTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="profit" stroke="var(--chart-blue)" fill="var(--chart-blue)" fillOpacity={0.1} strokeWidth={2} name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Row 2: Invoice Status + Payment Methods */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Invoice Status Distribution */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Invoice Status Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <PieChart>
                  <Pie data={data?.invoiceStatus || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" paddingAngle={3} nameKey="status">
                    {(data?.invoiceStatus || []).map((e, i) => (
                      <Cell key={i} fill={invoiceStatusColors[e.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {(data?.invoiceStatus || []).map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: invoiceStatusColors[s.status] || 'var(--chart-axis)' }} />
                    <span className="text-xs font-semibold text-[var(--foreground)]">{s.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[var(--foreground)]">{s.count}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{formatCurrency(s.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--foreground)] text-base mb-4">Payment Methods</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={data?.paymentMethods || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Bar dataKey="total" fill="var(--chart-cyan)" radius={[0, 4, 4, 0]} name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Row 3: Top Customers + Vendor Spend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Customers */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" /> Top Customers by Revenue
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold text-center">Invoices</th>
                  <th className="pb-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
                {(data?.topCustomers || []).map((c, i) => (
                  <tr key={c.name} className="hover:bg-[var(--accent)] transition">
                    <td className="py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-950/30 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-bold">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-[var(--muted-foreground)]">{c.invoiceCount}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(c.revenue)}</td>
                  </tr>
                ))}
                {(data?.topCustomers || []).length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-[var(--muted-foreground)]">No customer data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Spend */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--foreground)] text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" /> Top Vendors by Spend
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Vendor</th>
                  <th className="pb-3 font-semibold text-center">Expenses</th>
                  <th className="pb-3 font-semibold text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
                {(data?.vendorSpend || []).map((v, i) => (
                  <tr key={v.name} className="hover:bg-[var(--accent)] transition">
                    <td className="py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-violet-100 dark:bg-violet-950/30 text-violet-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                          {v.name.charAt(0)}
                        </div>
                        <span className="font-bold">{v.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-[var(--muted-foreground)]">{v.expenseCount}</td>
                    <td className="py-3 text-right font-bold text-amber-600">{formatCurrency(v.spend)}</td>
                  </tr>
                ))}
                {(data?.vendorSpend || []).length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-[var(--muted-foreground)]">No vendor data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
