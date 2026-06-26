'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { supportGetCustomers } from '../../../services/supportService';
import {
  Users, Search, Filter, ChevronRight, RefreshCw, Star,
  CheckCircle2, AlertTriangle, MessageSquare, Phone, Mail,
  TrendingUp, Sparkles, X, Plus, BarChart2, SortAsc, SortDesc,
  ArrowUpDown, Activity, Calendar, Building, Shield
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  total_tickets: string;
  last_interaction: string | null;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust-001', name: 'Rohit Sharma', email: 'rohit.sharma@example.com', phone: '+91 98765 43210', company: 'TechBridge Pvt Ltd', status: 'Active', total_tickets: '8', last_interaction: new Date(Date.now() - 3600000).toISOString() },
  { id: 'cust-002', name: 'Apex Corp Admin', email: 'admin@apexcorp.in', phone: '+91 99999 00001', company: 'Apex Corp', status: 'Active', total_tickets: '14', last_interaction: new Date(Date.now() - 7200000).toISOString() },
  { id: 'cust-003', name: 'Priya Khurana', email: 'priya@cloudsuite.io', phone: '+91 87654 32109', company: 'CloudSuite', status: 'Active', total_tickets: '5', last_interaction: new Date(Date.now() - 86400000).toISOString() },
  { id: 'cust-004', name: 'Meena Arora', email: 'meena.arora@gmail.com', phone: '+91 78888 55544', company: null, status: 'Active', total_tickets: '2', last_interaction: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'cust-005', name: 'GlobalTrade IT', email: 'it@globaltrade.in', phone: '+91 96321 55500', company: 'GlobalTrade Inc', status: 'Active', total_tickets: '11', last_interaction: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: 'cust-006', name: 'StartupX Dev', email: 'cto@startupx.com', phone: '+91 91234 56789', company: 'StartupX', status: 'Active', total_tickets: '6', last_interaction: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'cust-007', name: 'BizPro Finance', email: 'finance@bizpro.in', phone: null, company: 'BizPro Solutions', status: 'Inactive', total_tickets: '3', last_interaction: new Date(Date.now() - 86400000 * 8).toISOString() },
  { id: 'cust-008', name: 'Rahul Gupta', email: 'rahul.gupta@techvault.io', phone: '+91 99988 77766', company: 'TechVault', status: 'Active', total_tickets: '9', last_interaction: new Date(Date.now() - 3600000 * 5).toISOString() },
];

const MOCK_CSAT_TREND = [
  { month: 'Jan', score: 4.1 },
  { month: 'Feb', score: 4.3 },
  { month: 'Mar', score: 4.0 },
  { month: 'Apr', score: 4.5 },
  { month: 'May', score: 4.7 },
  { month: 'Jun', score: 4.8 },
];

const MOCK_TICKET_TREND = [
  { month: 'Jan', tickets: 3 },
  { month: 'Feb', tickets: 5 },
  { month: 'Mar', tickets: 2 },
  { month: 'Apr', tickets: 7 },
  { month: 'May', tickets: 4 },
  { month: 'Jun', tickets: 6 },
];

const STATUS_PIE = [
  { name: 'Active', value: 7, color: '#10B981' },
  { name: 'Inactive', value: 1, color: '#94A3B8' },
];

const TICKET_CATEGORY_BAR = [
  { category: 'Technical', count: 22 },
  { category: 'Billing', count: 15 },
  { category: 'General', count: 8 },
  { category: 'Account', count: 4 },
];

const MOCK_INTERACTIONS = [
  { type: 'Ticket', desc: 'Payment gateway refund issue resolved', date: '2 hours ago', icon: '🎫', color: 'blue' },
  { type: 'Call', desc: 'Outbound call — followed up on billing query', date: '1 day ago', icon: '📞', color: 'green' },
  { type: 'Email', desc: 'Sent onboarding guide and API docs', date: '3 days ago', icon: '📧', color: 'purple' },
  { type: 'Ticket', desc: 'Dashboard access issue — fixed by team', date: '1 week ago', icon: '🎫', color: 'amber' },
];

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'total_tickets' | 'last_interaction'>('last_interaction');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await supportGetCustomers({ status: statusFilter || undefined, search: searchQuery || undefined, page, limit: PAGE_SIZE });
      setCustomers(res.customers);
      setTotal(res.total);
    } catch {
      let filtered = MOCK_CUSTOMERS.filter(c => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.email.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.company || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      filtered.sort((a, b) => {
        let va: string | number = a[sortBy] || '';
        let vb: string | number = b[sortBy] || '';
        if (sortBy === 'total_tickets') { va = parseInt(a.total_tickets); vb = parseInt(b.total_tickets); }
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
      setCustomers(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, [statusFilter, page, sortBy, sortDir]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeCount = MOCK_CUSTOMERS.filter(c => c.status === 'Active').length;
  const highRisk = MOCK_CUSTOMERS.filter(c => parseInt(c.total_tickets) >= 10).length;

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Customers Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage customer platform activity, tickets, CSAT, and retention metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnalytics(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${showAnalytics ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${showFilters ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: MOCK_CUSTOMERS.length, icon: Users, bg: 'bg-blue-50', text: 'text-blue-600', trend: '+12.4%' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600', trend: '+8.1%' },
          { label: 'High Ticket Volume', value: highRisk, icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600', trend: '−3.2%' },
          { label: 'Avg CSAT', value: '4.7 / 5', icon: Star, bg: 'bg-purple-50', text: 'text-purple-600', trend: '+0.3' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} whileHover={{ scale: 1.02, y: -1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{s.label}</span>
                <div className={`p-2 ${s.bg} ${s.text} rounded-xl`}><Icon className="w-4 h-4" /></div>
              </div>
              <p className={`text-2xl font-black mt-4 ${s.text}`}>{s.value}</p>
              <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {s.trend} this month
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Analytics Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Customer Status</p>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={STATUS_PIE} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4}>
                      {STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-2">
                  {STATUS_PIE.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Tickets by Category</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={TICKET_CATEGORY_BAR} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                      {TICKET_CATEGORY_BAR.map((_, i) => <Cell key={i} fill={['#3B82F6', '#F59E0B', '#10B981', '#6366F1'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Avg CSAT Trend (6M)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={MOCK_CSAT_TREND} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748B' }} />
                    <YAxis domain={[3.5, 5]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} formatter={(v) => [`${v}/5`, 'CSAT']} />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Search</label>
                <div className="relative">
                  <input type="text" placeholder="Name, email, company..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadCustomers()}
                    className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 w-full" />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <div className="min-w-32">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none bg-white w-full">
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="min-w-40">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sort By</label>
                <div className="flex gap-1">
                  {(['name', 'total_tickets', 'last_interaction'] as const).map(col => {
                    const labels: Record<string, string> = { name: 'Name', total_tickets: 'Tickets', last_interaction: 'Recent' };
                    const active = sortBy === col;
                    return (
                      <button key={col} onClick={() => toggleSort(col)}
                        className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition flex items-center gap-0.5
                          ${active ? 'bg-blue-50 border-blue-300 text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {labels[col]}
                        {active ? (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => { setStatusFilter(''); setSearchQuery(''); }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition">Clear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Split View ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Customers Table */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-300`}>
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Customers ({total})</span>
            <button onClick={loadCustomers} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Contact</th>
                  {!selectedCustomer && <th className="p-4">Company</th>}
                  <th className="p-4 text-center">Tickets</th>
                  {!selectedCustomer && <th className="p-4">Last Active</th>}
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center">
                    <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading customers...</p>
                  </td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-xs">No customers found.</td></tr>
                ) : customers.map(c => {
                  const active = selectedCustomer?.id === c.id;
                  const highVolume = parseInt(c.total_tickets) >= 10;
                  return (
                    <motion.tr key={c.id} whileHover={{ backgroundColor: '#F8FAFC' }} onClick={() => setSelectedCustomer(active ? null : c)}
                      className={`cursor-pointer transition-all ${active ? 'bg-blue-50/40 border-l-4 border-l-[#2563EB]' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${highVolume ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#2563EB]'}`}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <span className="text-[10px] text-slate-400">#{c.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-600 font-semibold truncate max-w-[140px]">{c.email}</p>
                        <p className="text-[10px] text-slate-400">{c.phone || '—'}</p>
                      </td>
                      {!selectedCustomer && (
                        <td className="p-4 text-slate-500 font-semibold">{c.company || 'Personal'}</td>
                      )}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 font-bold rounded-lg min-w-8 text-center ${highVolume ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {c.total_tickets}
                        </span>
                      </td>
                      {!selectedCustomer && (
                        <td className="p-4 text-slate-500 text-[10px]">
                          {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50">
              <span>Showing {customers.length} of {total}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-white bg-white disabled:opacity-50">←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`px-3 py-1.5 border rounded-xl transition ${pg === page ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-slate-200 hover:bg-white bg-white'}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-white bg-white disabled:opacity-50">→</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Customer Detail Panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5 space-y-4 sticky top-6"
            >
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0F172A] text-sm">{selectedCustomer.name}</h3>
                      <p className="text-[10px] text-slate-400">#{selectedCustomer.id.slice(0, 8)}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${selectedCustomer.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {selectedCustomer.status}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.phone || 'Not provided'}</div>
                  {selectedCustomer.company && <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.company}</div>}
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" />Last active: {selectedCustomer.last_interaction ? new Date(selectedCustomer.last_interaction).toLocaleString() : 'Never'}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Tickets', value: selectedCustomer.total_tickets, color: 'text-blue-600' },
                    { label: 'CSAT', value: '4.7', color: 'text-green-600' },
                    { label: 'Open', value: '2', color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => router.push('/support/tickets')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
                    <MessageSquare className="w-3.5 h-3.5" /> View Tickets
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </button>
                </div>
              </div>

              {/* CSAT Trend Mini Chart */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" /> Ticket Activity (6M)
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={MOCK_TICKET_TREND} margin={{ left: -10, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="tickets" name="Tickets" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Interaction History */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Interaction History</p>
                <div className="space-y-3">
                  {MOCK_INTERACTIONS.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base mt-0.5">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded
                            ${item.color === 'blue' ? 'bg-blue-50 text-blue-700' : item.color === 'green' ? 'bg-green-50 text-green-700' : item.color === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.type}
                          </span>
                          <span className="text-[9px] text-slate-400">{item.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insight */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">AI Insight</p>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-0.5">
                      {parseInt(selectedCustomer.total_tickets) >= 8
                        ? `${selectedCustomer.name} is a high-volume customer. Consider proactive check-in to prevent churn. Offer priority SLA tier.`
                        : `${selectedCustomer.name} has low ticket volume and positive CSAT. Great candidate for upselling premium plan.`}
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ADD CUSTOMER MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0F172A]">Add New Customer</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form className="p-6 space-y-4 text-xs font-semibold text-slate-600" onSubmit={e => { e.preventDefault(); setShowAddModal(false); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label>Full Name *</label>
                    <input type="text" required placeholder="Customer full name"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label>Email *</label>
                    <input type="email" required placeholder="email@domain.com"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label>Phone</label>
                    <input type="text" placeholder="+91 98765 43210"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label>Company</label>
                    <input type="text" placeholder="Company name (optional)"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition">Add Customer</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
