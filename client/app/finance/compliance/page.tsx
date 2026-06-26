'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { financeGetComplianceDashboard } from '../../../services/financeService';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, XCircle,
  Search, SortAsc, SortDesc, TrendingUp,
  FileText, Upload, Download, Calendar, Bell,
  AlertCircle, Eye, Sparkles,
  Users, IndianRupee, Landmark,
  ClipboardCheck, Scale, BookOpen, ChevronRight,
  BarChart3, Activity, RefreshCw, X, Check
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtINRFull(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Shield, Landmark, IndianRupee, ClipboardCheck,
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const taxBreakdown = [
  { name: 'GST',        value: 3234500, fill: '#10b981' },
  { name: 'TDS',        value: 689300,  fill: '#3b82f6' },
  { name: 'Income Tax', value: 2430000, fill: '#f59e0b' },
  { name: 'Prof. Tax',  value: 38000,   fill: '#8b5cf6' },
  { name: 'PF',         value: 2220000, fill: '#06b6d4' },
  { name: 'ESI',        value: 744000,  fill: '#ec4899' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData]     = useState<any>(null);
  const [importMsg, setImportMsg] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await financeGetComplianceDashboard();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const taxRecords           = data?.taxRecords           || [];
  const statutoryCompliance  = data?.statutoryCompliance  || [];
  const deadlines            = data?.deadlines            || [];
  const complianceScoreTrend = data?.complianceScoreTrend || [];
  const riskItems            = data?.riskItems            || [];
  const documents            = data?.documents            || [];

  const [searchTax, setSearchTax]       = useState('');
  const [filterType, setFilterType]     = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy]             = useState<'dueDate' | 'amount' | 'type'>('dueDate');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [searchDoc, setSearchDoc]       = useState('');

  /* ── KPI values ── */
  const totalTasks     = taxRecords.length;
  const completedTasks = taxRecords.filter((r: any) => r.status === 'Filed').length;
  const pendingTasks   = taxRecords.filter((r: any) => r.status === 'Pending').length;
  const overdueTasks   = taxRecords.filter((r: any) => r.status === 'Overdue').length;
  const complianceScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function handleKpiClick(status: string) {
    setFilterStatus(prev => prev === status ? 'All' : status);
    document.getElementById('tax-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function exportCSV() {
    const headers = ['ID', 'Tax Type', 'Period', 'Description', 'Amount (₹)', 'Due Date', 'Status', 'Filed Date'];
    const rows = taxRecords.map((r: any) => [r.id, r.taxType, r.period, r.description, r.amount, r.dueDate, r.status, r.filingDate || '']);
    const csv = [headers, ...rows].map((row: any) => row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'compliance_records.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).trim().split('\n').slice(1);
      setImportMsg(`✅ Parsed ${lines.length} record(s) from CSV. Review and save to apply.`);
      setTimeout(() => setImportMsg(''), 5000);
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = '';
  }

  const filteredTaxRecords = useMemo(() => {
    let list = [...taxRecords];
    if (searchTax) {
      const q = searchTax.toLowerCase();
      list = list.filter((r: any) => r.taxType.toLowerCase().includes(q) || r.period.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    if (filterType !== 'All')   list = list.filter((r: any) => r.taxType === filterType);
    if (filterStatus !== 'All') list = list.filter((r: any) => r.status === filterStatus);
    list.sort((a: any, b: any) => {
      let cmp = 0;
      if (sortBy === 'dueDate') cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      else if (sortBy === 'amount') cmp = a.amount - b.amount;
      else cmp = a.taxType.localeCompare(b.taxType);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [searchTax, filterType, filterStatus, sortBy, sortDir, taxRecords]);

  const filteredDocs = useMemo(() => {
    if (!searchDoc) return documents;
    const q = searchDoc.toLowerCase();
    return documents.filter((d: any) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
  }, [searchDoc, documents]);

  function toggleSort(field: 'dueDate' | 'amount' | 'type') {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      Filed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      Verified:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      Expired: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  }

  function urgencyStyle(urgency: string) {
    if (urgency === 'overdue')  return { dot: 'bg-red-500',    border: 'border-red-400',    text: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20'    };
    if (urgency === 'upcoming') return { dot: 'bg-amber-500',  border: 'border-amber-400',  text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return                              { dot: 'bg-emerald-500',border: 'border-emerald-400',text: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
  }

  function severityBadge(severity: string) {
    const map: Record<string, string> = {
      High:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      Low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    };
    return map[severity] || 'bg-slate-100 text-slate-700';
  }

  const kpiCards = [
    { label: 'Total Tasks',       value: totalTasks,     sub: `${totalTasks} total records`,                  icon: ClipboardCheck, color: 'from-blue-500 to-blue-600',    filterKey: 'All'     },
    { label: 'Filed / Completed', value: completedTasks, sub: `${completedTasks} of ${totalTasks} completed`, icon: CheckCircle2,   color: 'from-emerald-500 to-emerald-600',filterKey: 'Filed'   },
    { label: 'Pending',           value: pendingTasks,   sub: `${pendingTasks} of ${totalTasks} pending`,     icon: Clock,          color: 'from-amber-500 to-amber-600',   filterKey: 'Pending' },
    { label: 'Overdue',           value: overdueTasks,   sub: `${overdueTasks} of ${totalTasks} overdue`,     icon: XCircle,        color: 'from-red-500 to-red-600',       filterKey: 'Overdue' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading compliance data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── COMPLIANCE HEALTH BANNER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 md:p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Compliance Module</h1>
              <p className="text-emerald-100 mt-1">Monitor regulatory compliance, tax filings & statutory obligations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <button onClick={() => csvRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold">{complianceScore}%</div>
              <div className="text-emerald-100 text-sm mt-1">Compliance Score</div>
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
              {complianceScore >= 80 ? 'Healthy' : complianceScore >= 60 ? 'Fair' : 'At Risk'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── IMPORT MSG ── */}
      <AnimatePresence>
        {importMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4" /> {importMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KPI CARDS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const isActive = filterStatus === kpi.filterKey;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              onClick={() => handleKpiClick(kpi.filterKey)}
              className={`bg-white dark:bg-[#1e293b] rounded-xl border p-5 shadow-sm cursor-pointer group hover:shadow-lg transition-all duration-300 active:scale-[0.98] ${isActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
                  <motion.p className="text-3xl font-bold mt-1 text-slate-800 dark:text-white"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.3 + idx * 0.1 }}>
                    {kpi.value}
                  </motion.p>
                  <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${kpi.color}`}
                  initial={{ width: 0 }} animate={{ width: `${totalTasks > 0 ? (kpi.value / totalTasks) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }} />
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <ChevronRight className="w-3 h-3" /> Click to filter
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ─── AI INSIGHT CARD ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 md:p-6 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start gap-4">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              AI Compliance Insight
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Auto-generated</span>
            </h3>
            <p className="mt-2 text-amber-50 leading-relaxed">
              GST filing deadline in <strong>5 days</strong>. 2 PF submissions are <strong>overdue</strong>. TDS for Q1 needs review before July 7th.
              Consider prioritizing PF payment to avoid penalty accumulation of ₹5,000/day under EPFO guidelines.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── TAX MANAGEMENT SECTION ───────────────────────────────────────── */}
      <motion.div
        id="tax-table"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <IndianRupee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tax Management</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track all tax filings and payments</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search tax records..." value={searchTax} onChange={e => setSearchTax(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="All">All Types</option>
              <option value="GST">GST</option>
              <option value="TDS">TDS</option>
              <option value="Income Tax">Income Tax</option>
              <option value="Professional Tax">Professional Tax</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="All">All Statuses</option>
              <option value="Filed">Filed</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  <button onClick={() => toggleSort('type')} className="flex items-center gap-1 hover:text-blue-600 transition">
                    Tax Type {sortBy === 'type' && (sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />)}
                  </button>
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Period</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 ml-auto hover:text-blue-600 transition">
                    Amount {sortBy === 'amount' && (sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />)}
                  </button>
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  <button onClick={() => toggleSort('dueDate')} className="flex items-center gap-1 hover:text-blue-600 transition">
                    Due Date {sortBy === 'dueDate' && (sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />)}
                  </button>
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Filed On</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTaxRecords.map((rec: any, idx: number) => (
                  <motion.tr key={rec.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3.5"><span className="font-medium text-slate-800 dark:text-white">{rec.taxType}</span></td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{rec.period}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{rec.description}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 dark:text-white">{fmtINR(rec.amount)}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {new Date(rec.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(rec.status)}`}>
                        {rec.status === 'Filed'   && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {rec.status === 'Overdue' && <AlertTriangle className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {rec.filingDate
                        ? new Date(rec.filingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredTaxRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No tax records match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── STATUTORY COMPLIANCE SECTION ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
            <Scale className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Statutory Compliance</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">PF, ESI & Labor Welfare Fund status</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statutoryCompliance.map((item: any, idx: number) => {
            const IconComp = ICON_MAP[item.iconType] || Shield;
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1.5 bg-gradient-to-r ${item.color}`} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-white`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{item.name}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{item.description}</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Monthly Amount</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{fmtINR(item.monthlyAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Employees Covered</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.employees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Last Filed</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {new Date(item.lastFiled).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Next Due</span>
                      <span className={`font-medium ${item.status === 'Overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {new Date(item.nextDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── DEADLINE TRACKER ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
            <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Deadline Tracker</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming compliance deadlines & filing dates</p>
          </div>
        </div>
        <div className="space-y-3">
          {[...deadlines].sort((a: any, b: any) => a.daysLeft - b.daysLeft).map((dl: any, idx: number) => {
            const style = urgencyStyle(dl.urgency);
            return (
              <motion.div key={dl.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:shadow-sm`}>
                <div className="flex items-center gap-3 sm:w-[180px] flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${style.dot} ring-4 ring-white dark:ring-slate-800 flex-shrink-0`} />
                  <span className={`text-sm font-semibold ${style.text}`}>
                    {new Date(dl.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{dl.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dl.category} • {fmtINR(dl.amount)}</p>
                </div>
                <div className="flex-shrink-0">
                  {dl.daysLeft < 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      <AlertTriangle className="w-3 h-3" />{Math.abs(dl.daysLeft)} days overdue
                    </span>
                  ) : dl.daysLeft <= 7 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Clock className="w-3 h-3" />{dl.daysLeft} days left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />{dl.daysLeft} days left
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── CHARTS SECTION ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 md:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg"><Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Compliance Score Trend</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">6-month compliance health overview</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [`${v}%`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 md:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg"><BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tax Breakdown by Type</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Annual contribution distribution</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taxBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" nameKey="name">
                  {taxBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [fmtINRFull(v), 'Amount']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value: any) => <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ─── RISK MANAGEMENT PANEL ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Risk Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compliance risks & mitigation status</p>
          </div>
        </div>
        <div className="space-y-3">
          {riskItems.map((risk: any, idx: number) => (
            <motion.div key={risk.id}
              initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0 ${risk.severity === 'High' ? 'bg-red-500' : risk.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{risk.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityBadge(risk.severity)}`}>{risk.severity}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{risk.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 sm:self-center">
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium">
                  {risk.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── DOCUMENT MANAGEMENT ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }}
        className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg"><BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Document Management</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Compliance documents & certificates</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search documents..." value={searchDoc} onChange={e => setSearchDoc(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Document Name</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Upload Date</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Expiry</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc: any, idx: number) => (
                <motion.tr key={doc.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-white">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">{doc.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{doc.uploadDate}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(doc.status)}`}>
                      {doc.status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
                      {doc.status === 'Pending'  && <Clock className="w-3 h-3" />}
                      {doc.status === 'Expired'  && <XCircle className="w-3 h-3" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />No documents found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
