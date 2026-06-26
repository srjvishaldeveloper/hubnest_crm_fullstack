'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { financeGetAnalytics } from '../../../services/financeService';
import {
  BarChart3, RefreshCw, AlertCircle, TrendingUp, TrendingDown,
  ArrowUpRight, Users, Building2, ArrowUp, ArrowDown,
  Search, Filter, SlidersHorizontal, X, ChevronDown,
  Sparkles, IndianRupee, Activity, Target, Award, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend, ComposedChart
} from 'recharts';

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899'];

interface AnalyticsData {
  cashFlow: Array<{ month: string; inflow: number; outflow: number }>;
  paymentMethods: Array<{ method: string; count: number; total: number }>;
  invoiceStatus: Array<{ status: string; count: number; total: number }>;
  topCustomers: Array<{ name: string; invoiceCount: number; revenue: number }>;
  vendorSpend: Array<{ name: string; spend: number; expenseCount: number }>;
  profitTrend: Array<{ month: string; profit: number }>;
}

function fmt(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

const invoiceStatusColors: Record<string, string> = {
  'Paid': '#10b981',
  'Sent': '#6366f1',
  'Overdue': '#ef4444',
  'Draft': '#f59e0b',
  'Cancelled': '#94a3b8',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs min-w-[140px]">
      {label && <p className="font-bold text-[var(--foreground)] mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color || p.fill}} />
            {p.name}
          </span>
          <span className="font-bold text-[var(--foreground)]">
            {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

type SortDir = 'asc' | 'desc';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ── Sort/Filter state ── */
  const [dateRange, setDateRange] = useState('6M');
  const [customerSearch, setCustomerSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [customerSort, setCustomerSort] = useState<{ by: 'name'|'revenue'|'invoices'; dir: SortDir }>({ by: 'revenue', dir: 'desc' });
  const [vendorSort, setVendorSort] = useState<{ by: 'name'|'spend'|'expenses'; dir: SortDir }>({ by: 'spend', dir: 'desc' });
  const [chartView, setChartView] = useState<'combined'|'separate'>('combined');

  async function loadAnalytics() {
    try {
      setLoading(true); setError('');
      const res = await financeGetAnalytics();
      setData(res);
    } catch {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAnalytics(); }, []);

  /* ── Derived metrics ── */
  const totalInflow  = useMemo(() => (data?.cashFlow || []).reduce((s, m) => s + m.inflow, 0), [data]);
  const totalOutflow = useMemo(() => (data?.cashFlow || []).reduce((s, m) => s + m.outflow, 0), [data]);
  const netProfit    = useMemo(() => totalInflow - totalOutflow, [totalInflow, totalOutflow]);
  const totalRevenue = useMemo(() => (data?.topCustomers || []).reduce((s, c) => s + c.revenue, 0), [data]);

  /* ── Filtered + sorted customers ── */
  const filteredCustomers = useMemo(() => {
    let list = [...(data?.topCustomers || [])];
    if (customerSearch) list = list.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
    list.sort((a, b) => {
      const { by, dir } = customerSort;
      let cmp = by === 'name' ? a.name.localeCompare(b.name) : by === 'revenue' ? a.revenue - b.revenue : a.invoiceCount - b.invoiceCount;
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, customerSearch, customerSort]);

  /* ── Filtered + sorted vendors ── */
  const filteredVendors = useMemo(() => {
    let list = [...(data?.vendorSpend || [])];
    if (vendorSearch) list = list.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
    list.sort((a, b) => {
      const { by, dir } = vendorSort;
      let cmp = by === 'name' ? a.name.localeCompare(b.name) : by === 'spend' ? a.spend - b.spend : a.expenseCount - b.expenseCount;
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, vendorSearch, vendorSort]);

  function toggleCustomerSort(by: 'name'|'revenue'|'invoices') {
    setCustomerSort(prev => prev.by === by ? { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'desc' });
  }
  function toggleVendorSort(by: 'name'|'spend'|'expenses') {
    setVendorSort(prev => prev.by === by ? { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'desc' });
  }

  const SortIcon = ({ col, current, dir }: { col: string; current: string; dir: SortDir }) =>
    col === current ? (dir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />) : <ArrowDown className="w-3 h-3 opacity-20" />;

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)] font-semibold animate-pulse">Loading Financial Analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)] max-w-xs">{error}</p>
        <button onClick={loadAnalytics} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/20">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7" /> Financial Analytics
            </h1>
            <p className="text-white/70 mt-1 text-sm">Deep insights into your financial performance</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 border border-white/20 rounded-xl p-1 gap-1">
              {['1M','3M','6M','1Y'].map(r => (
                <button key={r} onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${dateRange===r ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={loadAnalytics}
              className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-white transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── SUMMARY KPI STRIP ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Inflow',   value: fmt(totalInflow),  icon: TrendingUp,   color:'emerald', badge:'+14.5%', up:true },
          { label:'Total Outflow',  value: fmt(totalOutflow), icon: TrendingDown, color:'red',     badge:'+6.2%',  up:false },
          { label:'Net Profit',     value: fmt(netProfit),    icon: IndianRupee,  color:'indigo',  badge:'+8.2%',  up:true },
          { label:'Total Revenue',  value: fmt(totalRevenue), icon: Award,        color:'amber',   badge:'+12%',   up:true },
        ].map((k,i) => (
          <motion.div key={k.label} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.05+i*0.05 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${k.color}-100 dark:bg-${k.color}-950/30`}>
                <k.icon className={`w-5 h-5 text-${k.color}-600 dark:text-${k.color}-400`} />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${k.up ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                {k.up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}{k.badge}
              </span>
            </div>
            <p className="text-xl font-black text-[var(--foreground)]">{k.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── CASH FLOW + PROFIT ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cash Flow */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Cash Flow</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Inflow vs Outflow · {dateRange} view</p>
            </div>
            <div className="flex gap-1.5">
              {['combined','separate'].map(v => (
                <button key={v} onClick={() => setChartView(v as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${chartView===v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'}`}>
                  {v === 'combined' ? 'Grouped' : 'Area'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              {chartView === 'combined' ? (
                <BarChart data={data?.cashFlow || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="inflow"  fill="#10b981" radius={[4,4,0,0]} name="Inflow" />
                  <Bar dataKey="outflow" fill="#ef4444" radius={[4,4,0,0]} name="Outflow" />
                </BarChart>
              ) : (
                <ComposedChart data={data?.cashFlow || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Area type="monotone" dataKey="inflow"  fill="#10b981" stroke="#10b981" fillOpacity={0.15} strokeWidth={2} name="Inflow" />
                  <Area type="monotone" dataKey="outflow" fill="#ef4444" stroke="#ef4444" fillOpacity={0.1}  strokeWidth={2} name="Outflow" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Profit Trend</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Net profit month-over-month</p>
            </div>
            <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 8.2%
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <AreaChart data={data?.profitTrend || []}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="profit" stroke="#6366f1" fill="url(#profitGrad)" strokeWidth={2.5} dot={{ r:4, fill:'#6366f1', strokeWidth:2, stroke:'white' }} activeDot={{ r:6 }} name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── INVOICE STATUS + PAYMENT METHODS ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Invoice Status Donut */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Invoice Status</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Distribution by status</p>
            </div>
            <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 12%
            </span>
          </div>
          {(data?.invoiceStatus || []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">No invoice data</div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                  <PieChart>
                    <Pie data={data?.invoiceStatus || []} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="count" paddingAngle={4} nameKey="status">
                      {(data?.invoiceStatus || []).map((e, i) => (
                        <Cell key={i} fill={invoiceStatusColors[e.status] || CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {(data?.invoiceStatus || []).map((s, i) => {
                  const total = (data?.invoiceStatus || []).reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : '0';
                  const color = invoiceStatusColors[s.status] || CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold text-[var(--foreground)]">{s.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">{s.count}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{fmt(s.total)}</span>
                          <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-[var(--accent)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Payment Methods</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Volume by payment type</p>
            </div>
          </div>
          {(data?.paymentMethods || []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">No payment method data</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={data?.paymentMethods || []} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="method" tick={{ fontSize:11, fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" radius={[0,6,6,0]} name="Total Amount">
                    {(data?.paymentMethods || []).map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── TOP CUSTOMERS ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Top Customers by Revenue</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{filteredCustomers.length} of {(data?.topCustomers || []).length} customers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-2.5" />
              <input type="text" placeholder="Search customers..." value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-indigo-500 w-44 transition" />
              {customerSearch && <button onClick={() => setCustomerSearch('')} className="absolute right-2.5 top-2.5 text-[var(--muted-foreground)]"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  { label:'#', col: null },
                  { label:'Customer', col: 'name' as const },
                  { label:'Invoices', col: 'invoices' as const },
                  { label:'Revenue', col: 'revenue' as const },
                  { label:'Share', col: null },
                ].map(h => (
                  <th key={h.label}
                    onClick={() => h.col && toggleCustomerSort(h.col)}
                    className={`pb-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider ${h.col ? 'cursor-pointer hover:text-[var(--foreground)] select-none' : ''} ${h.label === 'Revenue' || h.label === 'Invoices' ? 'text-right' : ''} ${h.label === 'Share' ? 'text-right' : ''}`}>
                    <span className="flex items-center gap-1 justify-start">
                      {h.label}
                      {h.col && <SortIcon col={h.col} current={customerSort.by} dir={customerSort.dir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--muted-foreground)] text-sm">No customers found.</td></tr>
              ) : filteredCustomers.map((c, i) => {
                const share = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                return (
                  <tr key={c.name} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="py-3.5 text-xs text-[var(--muted-foreground)] font-bold w-8">{i+1}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 shadow-md shadow-blue-500/20">
                          {c.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-[var(--foreground)]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)]">
                        {c.invoiceCount} inv
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">{fmt(c.revenue)}</td>
                    <td className="py-3.5 pr-1">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(share, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-bold w-8 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── VENDOR SPEND ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-950/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-base">Top Vendors by Spend</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{filteredVendors.length} of {(data?.vendorSpend || []).length} vendors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={`${vendorSort.by}:${vendorSort.dir}`}
              onChange={e => {
                const [by, dir] = e.target.value.split(':') as ['name'|'spend'|'expenses', SortDir];
                setVendorSort({ by, dir });
              }}
              className="px-3 py-2 text-xs border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-indigo-500 transition">
              <option value="spend:desc">Sort: Highest Spend</option>
              <option value="spend:asc">Sort: Lowest Spend</option>
              <option value="expenses:desc">Sort: Most Expenses</option>
              <option value="name:asc">Sort: Name A–Z</option>
              <option value="name:desc">Sort: Name Z–A</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-2.5" />
              <input type="text" placeholder="Search vendors..." value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-indigo-500 w-40 transition" />
              {vendorSearch && <button onClick={() => setVendorSearch('')} className="absolute right-2.5 top-2.5 text-[var(--muted-foreground)]"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  { label:'#', col: null },
                  { label:'Vendor', col: 'name' as const },
                  { label:'Expenses', col: 'expenses' as const },
                  { label:'Total Spend', col: 'spend' as const },
                  { label:'Bar', col: null },
                ].map(h => (
                  <th key={h.label}
                    onClick={() => h.col && toggleVendorSort(h.col)}
                    className={`pb-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider ${h.col ? 'cursor-pointer hover:text-[var(--foreground)] select-none' : ''}`}>
                    <span className="flex items-center gap-1">
                      {h.label}
                      {h.col && <SortIcon col={h.col} current={vendorSort.by} dir={vendorSort.dir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredVendors.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--muted-foreground)] text-sm">No vendor data yet.</td></tr>
              ) : (() => {
                const maxSpend = Math.max(...filteredVendors.map(v => v.spend), 1);
                return filteredVendors.map((v, i) => (
                  <tr key={v.name} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="py-3.5 text-xs text-[var(--muted-foreground)] font-bold w-8">{i+1}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 shadow-md shadow-violet-500/20">
                          {v.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-[var(--foreground)]">{v.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)]">
                        {v.expenseCount} exp
                      </span>
                    </td>
                    <td className="py-3.5 font-black text-sm text-amber-600 dark:text-amber-400">{fmt(v.spend)}</td>
                    <td className="py-3.5 w-32">
                      <div className="h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(v.spend / maxSpend) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
