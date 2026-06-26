'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
  supportGetTickets, supportGetTicket, supportUpdateTicket,
  supportAddMessage, supportGetDashboard
} from '../../../services/supportService';
import { useAuthStore } from '../../../store/authStore';
import {
  ScrollText, Search, Filter, Plus, Clock, CheckCircle,
  AlertTriangle, ChevronRight, Send, Paperclip, CheckCircle2, Lock,
  MessageSquare, Sparkles, RefreshCw, X, SortAsc, SortDesc,
  ArrowUpDown, BarChart2, Bell, Tag, User, Calendar, Zap,
  AlertCircle, TrendingUp, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  sla_deadline: string;
  satisfaction_rating: number | null;
  customer_name: string;
  customer_email: string;
  agent_name: string | null;
  assigned_agent_id: string | null;
  created_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

const MOCK_TICKETS: Ticket[] = [
  { id: 'tkt-001', title: 'Payment gateway not processing refunds', description: 'Customer unable to receive refunds for cancelled subscriptions.', category: 'Billing', priority: 'High', status: 'Open', sla_deadline: new Date(Date.now() - 600000).toISOString(), satisfaction_rating: null, customer_name: 'Rohit Sharma', customer_email: 'rohit@example.com', agent_name: 'Neha Verma', assigned_agent_id: 'agent-1', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tkt-002', title: 'Cannot access enterprise dashboard', description: 'Enterprise users cannot log into admin dashboard since last night.', category: 'Technical', priority: 'High', status: 'In Progress', sla_deadline: new Date(Date.now() + 2700000).toISOString(), satisfaction_rating: null, customer_name: 'Apex Corp', customer_email: 'admin@apex.com', agent_name: 'Rajan Mehta', assigned_agent_id: 'agent-2', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tkt-003', title: 'API rate limits causing 429 errors', description: 'Integration API is throwing 429 rate limit exceeded errors intermittently.', category: 'Technical', priority: 'High', status: 'Open', sla_deadline: new Date(Date.now() + 1800000).toISOString(), satisfaction_rating: null, customer_name: 'TechVault', customer_email: 'dev@techvault.io', agent_name: null, assigned_agent_id: null, created_at: new Date(Date.now() - 5400000).toISOString() },
  { id: 'tkt-004', title: 'Invoice PDF download broken for March', description: 'Invoice download button shows loading but never downloads file.', category: 'Billing', priority: 'Medium', status: 'Open', sla_deadline: new Date(Date.now() + 86400000).toISOString(), satisfaction_rating: null, customer_name: 'BizPro', customer_email: 'finance@bizpro.in', agent_name: 'Priya Singh', assigned_agent_id: 'agent-3', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 'tkt-005', title: 'SMTP integration failing silently', description: 'Outgoing emails from CRM not being delivered.', category: 'Technical', priority: 'Medium', status: 'In Progress', sla_deadline: new Date(Date.now() + 3600000).toISOString(), satisfaction_rating: null, customer_name: 'CloudSuite', customer_email: 'support@cloudsuite.io', agent_name: 'Arjun Kapoor', assigned_agent_id: 'agent-4', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'tkt-006', title: 'How to upgrade subscription plan?', description: 'Customer wants to know how to upgrade from Basic to Enterprise.', category: 'General', priority: 'Low', status: 'Resolved', sla_deadline: new Date(Date.now() - 86400000).toISOString(), satisfaction_rating: 5, customer_name: 'Meena Arora', customer_email: 'meena@example.com', agent_name: 'Neha Verma', assigned_agent_id: 'agent-1', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'tkt-007', title: 'Report export shows wrong date range', description: 'Monthly sales report always shows previous month data.', category: 'Technical', priority: 'Low', status: 'Resolved', sla_deadline: new Date(Date.now() - 3600000 * 5).toISOString(), satisfaction_rating: 4, customer_name: 'StartupX', customer_email: 'cto@startupx.com', agent_name: 'Priya Singh', assigned_agent_id: 'agent-3', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'tkt-008', title: 'Unable to add team members', description: 'Admin cannot invite new users to the workspace.', category: 'Account', priority: 'Medium', status: 'Open', sla_deadline: new Date(Date.now() + 3600000 * 20).toISOString(), satisfaction_rating: null, customer_name: 'GlobalTrade', customer_email: 'it@globaltrade.in', agent_name: null, assigned_agent_id: null, created_at: new Date(Date.now() - 3600000 * 6).toISOString() },
];

const MOCK_CONVERSATION: Message[] = [
  { id: 'msg-1', ticket_id: 'tkt-001', sender_type: 'Customer', sender_id: 'cust-1', sender_name: 'Rohit Sharma', message: 'Hi, I have been trying to get a refund since 3 days but the payment gateway keeps failing. The transaction shows pending.', is_internal_note: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'msg-2', ticket_id: 'tkt-001', sender_type: 'Agent', sender_id: 'agent-1', sender_name: 'Neha Verma', message: 'Hi Rohit, I understand the frustration. Let me look into this right away. Can you please share the transaction ID so I can check our payment logs?', is_internal_note: false, created_at: new Date(Date.now() - 3200000).toISOString() },
  { id: 'msg-3', ticket_id: 'tkt-001', sender_type: 'Agent', sender_id: 'agent-1', sender_name: 'Neha Verma', message: 'I see the issue — looks like a Razorpay webhook timeout. Escalating to tech team.', is_internal_note: true, created_at: new Date(Date.now() - 3000000).toISOString() },
  { id: 'msg-4', ticket_id: 'tkt-001', sender_type: 'Customer', sender_id: 'cust-1', sender_name: 'Rohit Sharma', message: 'Sure! Transaction ID: RPY-9802344-X. Amount: ₹4,999. Please resolve ASAP.', is_internal_note: false, created_at: new Date(Date.now() - 2800000).toISOString() },
];

const STATUS_COLORS: Record<string, string> = { 'Open': 'bg-blue-50 text-blue-700', 'In Progress': 'bg-amber-50 text-amber-700', 'Resolved': 'bg-green-50 text-green-700', 'Closed': 'bg-slate-100 text-slate-600' };
const PRIORITY_COLORS: Record<string, string> = { 'High': 'bg-red-100 text-red-700', 'Medium': 'bg-amber-100 text-amber-700', 'Low': 'bg-slate-100 text-slate-600' };

const ANALYTICS_STATUS = [
  { name: 'Open', value: 38, color: '#3B82F6' },
  { name: 'In Progress', value: 24, color: '#F59E0B' },
  { name: 'Resolved', value: 52, color: '#10B981' },
  { name: 'Closed', value: 18, color: '#94A3B8' },
];

const ANALYTICS_PRIORITY = [
  { name: 'High', count: 22 },
  { name: 'Medium', count: 48 },
  { name: 'Low', count: 62 },
];

const SMART_REPLIES = [
  { label: 'Checking now', text: 'Hi, I am looking into this issue right now and will update you shortly.' },
  { label: 'Confirm email', text: 'Could you please confirm the email address registered with your account?' },
  { label: 'Issue resolved', text: 'This issue has been resolved on our end. Please log out and back in to verify.' },
  { label: 'Escalating', text: 'I am escalating this to our senior technical team for immediate attention.' },
  { label: 'Need more info', text: 'To investigate further, could you share any error messages or screenshots?' },
];

// ─── SLA Countdown Component ─────────────────────────────────────────────────
function SLATimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsBreached(true);
        setRemaining('Breached');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={`text-[10px] font-bold ${isBreached ? 'text-red-600' : remaining && parseInt(remaining) < 30 ? 'text-amber-600' : 'text-slate-500'}`}>
      {isBreached ? '⚠️ Breached' : `⏱ ${remaining}`}
    </span>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function TicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'sla_deadline'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chatTab, setChatTab] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const tabToStatus: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

  async function loadTickets() {
    try {
      setLoadingList(true);
      const effectiveStatus = activeTab !== 'all' ? tabToStatus[activeTab] : statusFilter || undefined;
      const res = await supportGetTickets({ status: effectiveStatus, priority: priorityFilter || undefined, category: categoryFilter || undefined, search: searchQuery || undefined, page, limit: PAGE_SIZE });
      setTickets(res.tickets || []);
      setTotal(res.total || 0);
    } catch {
      const filtered = MOCK_TICKETS.filter(t => {
        if (activeTab !== 'all' && t.status !== tabToStatus[activeTab]) return false;
        if (statusFilter && t.status !== statusFilter) return false;
        if (priorityFilter && t.priority !== priorityFilter) return false;
        if (categoryFilter && t.category !== categoryFilter) return false;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      const sorted = [...filtered].sort((a, b) => {
        let va: string | number = a[sortBy] || '';
        let vb: string | number = b[sortBy] || '';
        if (sortBy === 'priority') { const map: Record<string, number> = { High: 3, Medium: 2, Low: 1 }; va = map[a.priority] || 0; vb = map[b.priority] || 0; }
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
      setTickets(sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(sorted.length);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadTicketDetails(id: string) {
    try {
      setLoadingDetail(true);
      const res = await supportGetTicket(id);
      setSelectedTicket(res.ticket);
      setConversation(res.conversation || []);
    } catch {
      const t = MOCK_TICKETS.find(x => x.id === id) || null;
      setSelectedTicket(t);
      setConversation(id === 'tkt-001' ? MOCK_CONVERSATION : []);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => { loadTickets(); }, [statusFilter, priorityFilter, categoryFilter, page, activeTab, sortBy, sortDir]);

  useEffect(() => {
    supportGetDashboard().then(res => {
      if (res?.agentPerformance) setAgents(res.agentPerformance.map((a: any) => ({ id: a.id, name: a.name })));
    }).catch(() => setAgents([{ id: 'agent-1', name: 'Neha Verma' }, { id: 'agent-2', name: 'Rajan Mehta' }, { id: 'agent-3', name: 'Priya Singh' }, { id: 'agent-4', name: 'Arjun Kapoor' }]));
  }, []);

  useEffect(() => {
    if (selectedId) { loadTicketDetails(selectedId); router.push(`/support/tickets?id=${selectedId}`, { scroll: false }); }
    else { setSelectedTicket(null); setConversation([]); }
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  async function handleSendReply(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedId) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`, ticket_id: selectedId, sender_type: 'Agent',
      sender_id: user?.id || 'agent-1', sender_name: user?.name || 'You',
      message: replyText, is_internal_note: chatTab === 'note', created_at: new Date().toISOString()
    };
    setConversation(prev => [...prev, newMsg]);
    setReplyText('');
    try {
      setSendingMsg(true);
      await supportAddMessage(selectedId, { message: replyText, isInternalNote: chatTab === 'note' });
      loadTickets();
    } catch { /* optimistic update kept */ } finally { setSendingMsg(false); }
  }

  async function handleUpdateMetadata(field: 'status' | 'priority' | 'assigned_agent_id', value: string) {
    if (!selectedId || !selectedTicket) return;
    setSelectedTicket(prev => prev ? { ...prev, [field]: value === 'unassigned' ? null : value } : prev);
    try {
      await supportUpdateTicket(selectedId, { [field]: value === 'unassigned' ? null : value });
      loadTickets();
    } catch { /* optimistic kept */ }
  }

  const tabCounts = {
    all: MOCK_TICKETS.length,
    open: MOCK_TICKETS.filter(t => t.status === 'Open').length,
    in_progress: MOCK_TICKETS.filter(t => t.status === 'In Progress').length,
    resolved: MOCK_TICKETS.filter(t => t.status === 'Resolved').length,
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Tickets Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and resolve customer support tickets with live SLA tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${showAnalytics ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${showFilters ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {/* ── Analytics Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Total Tickets', value: total || MOCK_TICKETS.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Avg Resolution', value: '3h 12m', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'SLA Compliance', value: '94%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Avg CSAT', value: '4.7 / 5', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
                  <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Ticket Status Distribution</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={ANALYTICS_STATUS} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {ANALYTICS_STATUS.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {ANALYTICS_STATUS.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Tickets by Priority</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ANALYTICS_PRIORITY} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                      {ANALYTICS_PRIORITY.map((_, i) => <Cell key={i} fill={['#EF4444', '#F59E0B', '#10B981'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Search</label>
                <div className="relative">
                  <input type="text" placeholder="Search tickets, customers..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadTickets()}
                    className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 w-full" />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              {[
                { label: 'Status', value: statusFilter, set: setStatusFilter, opts: ['', 'Open', 'In Progress', 'Resolved', 'Closed'] },
                { label: 'Priority', value: priorityFilter, set: setPriorityFilter, opts: ['', 'High', 'Medium', 'Low'] },
                { label: 'Category', value: categoryFilter, set: setCategoryFilter, opts: ['', 'Technical', 'Billing', 'General', 'Account', 'Integration'] },
              ].map(f => (
                <div key={f.label} className="min-w-32">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{f.label}</label>
                  <select value={f.value} onChange={e => f.set(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500 bg-white w-full">
                    {f.opts.map(o => <option key={o} value={o}>{o || `All ${f.label}s`}</option>)}
                  </select>
                </div>
              ))}
              <div className="min-w-32">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sort By</label>
                <div className="flex gap-1">
                  {(['created_at', 'priority', 'sla_deadline'] as const).map(col => {
                    const labels: Record<string, string> = { created_at: 'Date', priority: 'Priority', sla_deadline: 'SLA' };
                    const active = sortBy === col;
                    return (
                      <button key={col} onClick={() => toggleSort(col)}
                        className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition flex items-center gap-0.5
                          ${active ? 'bg-blue-50 border-blue-300 text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {labels[col]}
                        {active ? (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); setSearchQuery(''); }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition">
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(tab => {
          const labels: Record<string, string> = { all: 'All', open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
          return (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1
                ${activeTab === tab ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {labels[tab]}
              <span className={`text-[9px] font-black px-1 py-0.5 rounded-full ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                {(tabCounts as any)[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Split View ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Tickets List */}
        <div className={`${selectedId ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-300`}>
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tickets ({total})</span>
            <button onClick={loadTickets} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {loadingList ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">No tickets match the active filters.</div>
            ) : (
              tickets.map(t => {
                const active = selectedId === t.id;
                const isBreached = new Date(t.sla_deadline) < new Date() && t.status !== 'Resolved' && t.status !== 'Closed';
                return (
                  <motion.div key={t.id} whileHover={{ x: 1 }} onClick={() => setSelectedId(active ? null : t.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${active ? 'bg-blue-50/40 border-l-4 border-l-[#2563EB]' : ''} ${isBreached ? 'border-l-4 border-l-red-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold text-slate-400">#{t.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs leading-snug truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.customer_name} • {t.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <SLATimer deadline={t.sla_deadline} />
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.agent_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`px-3 py-1.5 border rounded-xl transition ${pg === page ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-slate-200 hover:bg-slate-50'}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">→</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Ticket Detail / Chat Panel ────────────────────────────── */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-[680px] overflow-hidden sticky top-6"
            >
              {/* Chat Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-100 text-[#2563EB] rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                    {selectedTicket?.id.slice(0, 3).toUpperCase() || '...'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedTicket?.title || 'Loading...'}</p>
                    <p className="text-[10px] text-slate-400">{selectedTicket?.customer_name} • {selectedTicket?.customer_email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SLA + Status Bar */}
              {selectedTicket && (
                <div className="px-4 py-2 bg-white border-b border-slate-50 flex items-center gap-3 flex-wrap shrink-0">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${PRIORITY_COLORS[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[selectedTicket.status]}`}>{selectedTicket.status}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{selectedTicket.category}</span>
                  <span className="ml-auto"><SLATimer deadline={selectedTicket.sla_deadline} /></span>
                </div>
              )}

              {/* Conversation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-thin">
                {loadingDetail ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                  </div>
                ) : (
                  <>
                    {selectedTicket && (
                      <div className="p-3.5 bg-blue-50/60 border border-blue-100/50 rounded-2xl">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Original Issue</span>
                        <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">{selectedTicket.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-[9px] text-slate-400">Category: {selectedTicket.category}</span>
                          <span className="text-[9px] text-slate-400">•</span>
                          <span className="text-[9px] text-slate-400">Priority: {selectedTicket.priority}</span>
                          <span className="text-[9px] text-slate-400">•</span>
                          <span className="text-[9px] text-slate-400">Opened: {new Date(selectedTicket.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {conversation.length === 0 && !loadingDetail && (
                      <div className="text-center py-6 text-slate-400 text-xs">No messages yet. Start the conversation.</div>
                    )}
                    {conversation.map(msg => {
                      const isAgent = msg.sender_type === 'Agent';
                      const isNote = msg.is_internal_note;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} gap-1`}>
                          <span className="text-[9px] text-slate-400 font-bold px-1">
                            {msg.sender_name}{isNote && ' • 🔒 Internal Note'}
                          </span>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed
                            ${isNote ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tr-none'
                              : isAgent ? 'bg-[#2563EB] text-white rounded-tr-none shadow-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[8px] text-slate-350 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Controls: Status/Priority/Assign */}
              <div className="p-3 bg-slate-50 border-y border-slate-100 grid grid-cols-3 gap-2 shrink-0">
                {[
                  { label: 'Status', field: 'status' as const, value: selectedTicket?.status || '', opts: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                  { label: 'Priority', field: 'priority' as const, value: selectedTicket?.priority || '', opts: ['High', 'Medium', 'Low'] },
                ].map(ctrl => (
                  <div key={ctrl.label}>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">{ctrl.label}</label>
                    <select value={ctrl.value} onChange={e => handleUpdateMetadata(ctrl.field, e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                      {ctrl.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Reassign</label>
                  <select value={selectedTicket?.assigned_agent_id || 'unassigned'}
                    onChange={e => handleUpdateMetadata('assigned_agent_id', e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                    <option value="unassigned">Unassigned</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Smart Replies */}
              <div className="px-4 py-2 border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 bg-white scrollbar-none">
                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Smart:
                </span>
                {SMART_REPLIES.map(r => (
                  <button key={r.label} onClick={() => setReplyText(r.text)}
                    className="text-[10px] text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold shrink-0 transition">
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 bg-white shrink-0">
                <div className={`flex border rounded-2xl overflow-hidden focus-within:ring-2 transition ${chatTab === 'note' ? 'border-amber-300 focus-within:ring-amber-200' : 'border-slate-200 focus-within:ring-blue-100 focus-within:border-blue-400'}`}>
                  <div className="bg-slate-50 border-r border-slate-200 flex flex-col justify-start p-1.5 gap-1">
                    <button onClick={() => setChatTab('reply')} title="Reply to customer"
                      className={`p-2 rounded-xl transition ${chatTab === 'reply' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setChatTab('note')} title="Internal note"
                      className={`p-2 rounded-xl transition ${chatTab === 'note' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSendReply} className="flex-1 flex items-center pr-3">
                    <input type="text"
                      placeholder={chatTab === 'note' ? '🔒 Internal note (agents only)...' : 'Type reply to customer...'}
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-3 text-xs focus:outline-none text-slate-700 font-semibold placeholder:text-slate-400" />
                    <div className="flex items-center gap-2">
                      <button type="button" className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button type="submit" disabled={sendingMsg || !replyText.trim()}
                        className={`p-2.5 rounded-xl transition active:scale-95 shadow-sm ${chatTab === 'note' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#2563EB] hover:bg-blue-700'} text-white disabled:opacity-50`}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold pl-1">
                  {chatTab === 'note' ? '🔒 Only visible to support agents' : 'Customer will receive this reply via email'}
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── CREATE TICKET MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0F172A]">Create New Ticket</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form className="p-6 space-y-4 text-xs font-semibold text-slate-600"
                onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label>Customer Email *</label>
                    <input type="email" required placeholder="customer@domain.com"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label>Customer Name</label>
                    <input type="text" placeholder="Full name"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Issue Title *</label>
                  <input type="text" required placeholder="Describe the issue briefly"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label>Description *</label>
                  <textarea required rows={4} placeholder="Detailed description..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Category</label>
                    <select className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500">
                      <option>Technical</option><option>Billing</option><option>General</option><option>Account</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Priority</label>
                    <select className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500">
                      <option value="High">High (4h SLA)</option>
                      <option value="Medium">Medium (24h SLA)</option>
                      <option value="Low">Low (48h SLA)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition">Create Ticket</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    }>
      <TicketsContent />
    </Suspense>
  );
}
