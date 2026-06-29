'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
  supportGetTickets, supportGetTicket, supportUpdateTicket,
  supportAddMessage, supportGetDashboard, supportCreateTicket
} from '../../../services/supportService';
import { useAuthStore } from '../../../store/authStore';
import {
  Search, Filter, Plus, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  Send, Paperclip, Lock, MessageSquare, Sparkles, RefreshCw, X, SortAsc,
  SortDesc, ArrowUpDown, BarChart2, Bell, Tag, User, Calendar, Zap,
  AlertCircle, TrendingUp, ChevronDown, ChevronLeft, ShieldAlert,
  HelpCircle, UserCheck, Users, BookOpen, FileText, Check, AlertOctagon
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  ticket_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string;
  assigned_avatar: string;
  created_date: string;
  sla_deadline: string;
  response_time: string;
  resolution_time: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  is_internal_note: boolean;
  time: string;
  avatar?: string;
}

// ─── Mock Data matching Image 1 & 2 exactly (Fallback) ────────────────────────
const MOCK_TICKETS: Ticket[] = [
  { id: 'tkt-1256', ticket_id: '#TK-1256', customer_name: 'Rohit Sharma', customer_email: 'rohit.sharma@email.com', customer_phone: '+91 98765 43210', title: 'Unable to login to account', description: 'Customer is unable to login to their account. Getting error message "Invalid credentials".', category: 'Technical', priority: 'High', status: 'Open', assigned_to: 'Neha Verma', assigned_avatar: 'NV', created_date: '26 May, 10:30 AM', sla_deadline: new Date(Date.now() + 930000).toISOString(), response_time: '15m 30s', resolution_time: '18h 45m' },
  { id: 'tkt-1255', ticket_id: '#TK-1255', customer_name: 'Neha Patel', customer_email: 'neha.patel@email.com', customer_phone: '+91 98222 33445', title: 'Payment not processed', description: 'Transaction deducted from bank account but CRM subscription not updated.', category: 'Billing', priority: 'High', status: 'In Progress', assigned_to: 'Rahul Sharma', assigned_avatar: 'RS', created_date: '26 May, 10:15 AM', sla_deadline: new Date(Date.now() + 1800000).toISOString(), response_time: '20m 10s', resolution_time: '16h 20m' },
  { id: 'tkt-1254', ticket_id: '#TK-1254', customer_name: 'Amit Verma', customer_email: 'amit.verma@email.com', customer_phone: '+91 97111 22334', title: 'Page loading very slow', description: 'Dashboard takes over 15 seconds to load reports during morning hours.', category: 'Technical', priority: 'Medium', status: 'Open', assigned_to: 'Amit Patel', assigned_avatar: 'AP', created_date: '26 May, 09:50 AM', sla_deadline: new Date(Date.now() + 3600000).toISOString(), response_time: '45m 00s', resolution_time: '22h 10m' },
  { id: 'tkt-1253', ticket_id: '#TK-1253', customer_name: 'Pooja Singh', customer_email: 'pooja.singh@email.com', customer_phone: '+91 96555 44332', title: 'Email not received', description: 'System notification emails are not arriving in customer inbox.', category: 'General', priority: 'High', status: 'Open', assigned_to: 'Pooja Singh', assigned_avatar: 'PS', created_date: '26 May, 09:40 AM', sla_deadline: new Date(Date.now() + 1200000).toISOString(), response_time: '12m 45s', resolution_time: '14h 30m' },
  { id: 'tkt-1252', ticket_id: '#TK-1252', customer_name: 'Vikram Mehta', customer_email: 'vikram.mehta@email.com', customer_phone: '+91 98444 55667', title: 'Subscription cancel issue', description: 'Wants to cancel add-on seats but button is grayed out.', category: 'Billing', priority: 'Medium', status: 'In Progress', assigned_to: 'Rahul Sharma', assigned_avatar: 'RS', created_date: '26 May, 09:25 AM', sla_deadline: new Date(Date.now() + 7200000).toISOString(), response_time: '1h 15m', resolution_time: '20h 00m' },
  { id: 'tkt-1251', ticket_id: '#TK-1251', customer_name: 'Anjali Gupta', customer_email: 'anjali.gupta@email.com', customer_phone: '+91 99111 88776', title: 'App crashes on launch', description: 'Mobile app crashes immediately upon opening on iOS 18.', category: 'Technical', priority: 'High', status: 'Escalated', assigned_to: 'Neha Verma', assigned_avatar: 'NV', created_date: '26 May, 09:10 AM', sla_deadline: new Date(Date.now() - 300000).toISOString(), response_time: 'Breached', resolution_time: '12h 15m' },
  { id: 'tkt-1250', ticket_id: '#TK-1250', customer_name: 'Rohit Gupta', customer_email: 'rohit.gupta@email.com', customer_phone: '+91 98999 66554', title: 'Refund not received', description: 'Approved refund from last week has not reached bank account.', category: 'Billing', priority: 'Medium', status: 'Open', assigned_to: 'Amit Patel', assigned_avatar: 'AP', created_date: '26 May, 09:05 AM', sla_deadline: new Date(Date.now() + 10800000).toISOString(), response_time: '2h 30m', resolution_time: '23h 45m' },
  { id: 'tkt-1249', ticket_id: '#TK-1249', customer_name: 'Sneha Kapoor', customer_email: 'sneha.kapoor@email.com', customer_phone: '+91 95555 11223', title: 'Want to upgrade plan', description: 'Enquiring about custom pricing for 50 additional enterprise seats.', category: 'General', priority: 'Low', status: 'Open', assigned_to: 'Pooja Singh', assigned_avatar: 'PS', created_date: '26 May, 08:50 AM', sla_deadline: new Date(Date.now() + 86400000).toISOString(), response_time: '4h 10m', resolution_time: '47h 30m' },
];

const MOCK_CONVERSATION: Message[] = [
  { id: 'm1', sender_type: 'Customer', sender_name: 'Rohit Sharma', message: 'I am unable to login to my account. It shows invalid credentials.', time: '10:30 AM', avatar: 'RS' },
  { id: 'm2', sender_type: 'Agent', sender_name: 'Neha Verma (Agent)', message: 'Hello Rohit, I\'m sorry you\'re facing this issue. Can you please confirm your registered email?', time: '10:32 AM', avatar: 'NV' },
  { id: 'm3', sender_type: 'Customer', sender_name: 'Rohit Sharma', message: 'rohit.sharma@email.com', time: '10:35 AM', avatar: 'RS' },
  { id: 'm4', sender_type: 'Agent', sender_name: 'Neha Verma (Agent)', message: 'Thanks! I\'ve reset your password. Please check your email.', time: '10:36 AM', avatar: 'NV' },
  { id: 'm5', sender_type: 'Customer', sender_name: 'Rohit Sharma', message: 'I received the email and able to login now. Thank you!', time: '10:40 AM', avatar: 'RS' },
  { id: 'm6', sender_type: 'Agent', sender_name: 'Neha Verma (Agent)', message: 'Great! Please let us know if you need any further help.', time: '10:41 AM', avatar: 'NV' },
];

const MOCK_TIMELINE = [
  { time: '10:30 AM', title: 'Ticket Created', desc: 'Ticket created by Rohit Sharma', icon: '🔵' },
  { time: '10:32 AM', title: 'Assigned to Neha Verma', desc: 'Automatically assigned', icon: '🔵' },
  { time: '10:35 AM', title: 'Customer Replied', desc: 'Customer replied to ticket', icon: '🟢' },
  { time: '10:36 AM', title: 'Agent Replied', desc: 'Agent responded to customer', icon: '🟢' },
  { time: '10:41 AM', title: 'Ticket Updated', desc: 'Status updated to Open', icon: '🟡' },
];

const MOCK_RECENT_ACTIVITY = [
  { time: '10:30 AM', title: 'New ticket created', desc: '#TK-1256 by Rohit Sharma', badge: 'New', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { time: '10:20 AM', title: 'Customer replied', desc: '#TK-1255 by Neha Patel', badge: 'Reply', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { time: '10:15 AM', title: 'Status changed to In Progress', desc: '#TK-1254', badge: 'Update', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { time: '10:05 AM', title: 'Ticket resolved', desc: '#TK-1253 resolved by Pooja Singh', badge: 'Resolved', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { time: '09:50 AM', title: 'Ticket escalated', desc: '#TK-1251 escalated to Manager', badge: 'Escalated', color: 'bg-rose-50 text-rose-600 border-rose-200' },
];

const MOCK_CUSTOMER_ALERTS = [
  { count: 5, label: 'unhappy customers detected', desc: 'Needs immediate attention', type: 'error' },
  { count: 3, label: 'customers with repeated issues', desc: 'Risk of churn', type: 'warning' },
  { count: 2, label: 'escalated tickets waiting', desc: 'High priority attention required', type: 'error' },
];

const MOCK_TOP_ISSUES = [
  { issue: 'Login issues', percent: 25, count: 314, color: '#6366F1' },
  { issue: 'Payment Problems', percent: 20, count: 251, color: '#6366F1' },
  { issue: 'Technical Errors', percent: 18, count: 226, color: '#6366F1' },
  { issue: 'Account Access', percent: 15, count: 188, color: '#6366F1' },
  { issue: 'Feature Requests', percent: 10, count: 125, color: '#6366F1' },
  { issue: 'Others', percent: 12, count: 152, color: '#6366F1' },
];

const MOCK_ARTICLES = [
  { title: 'How to reset password?', views: '2,345 views' },
  { title: 'How to update billing information?', views: '1,876 views' },
  { title: 'How to connect third-party apps?', views: '1,234 views' },
  { title: 'Subscription & Plans Guide', views: '987 views' },
];

const MOCK_AGENT_PERFORMANCE = [
  { name: 'Neha Verma', handled: 132, avgResponse: '1h 25m', resolutionTime: '3h 15m', sla: '95%', rating: 4.8, avatar: 'NV' },
  { name: 'Rahul Sharma', handled: 118, avgResponse: '1h 40m', resolutionTime: '3h 45m', sla: '93%', rating: 4.6, avatar: 'RS' },
  { name: 'Amit Patel', handled: 105, avgResponse: '1h 15m', resolutionTime: '2h 50m', sla: '91%', rating: 4.4, avatar: 'AP' },
  { name: 'Pooja Singh', handled: 96, avgResponse: '2h 05m', resolutionTime: '3h 20m', sla: '90%', rating: 4.3, avatar: 'PS' },
  { name: 'Vikram Mehta', handled: 78, avgResponse: '1h 50m', resolutionTime: '3h 00m', sla: '88%', rating: 4.1, avatar: 'VM' },
];

const MOCK_TICKET_TREND_DATA = [
  { day: 'Mon', created: 35, resolved: 20 },
  { day: 'Tue', created: 42, resolved: 35 },
  { day: 'Wed', created: 30, resolved: 25 },
  { day: 'Thu', created: 48, resolved: 40 },
  { day: 'Fri', created: 38, resolved: 32 },
  { day: 'Sat', created: 25, resolved: 20 },
  { day: 'Sun', created: 20, resolved: 18 },
];

const SLA_PIE = [
  { name: 'Within SLA', value: 520, color: '#10B981' },
  { name: 'At Risk (< 1hr)', value: 18, color: '#F59E0B' },
  { name: 'Breached', value: 8, color: '#EF4444' },
];

const STATUS_PIE = [
  { name: 'Open', value: 458, color: '#EF4444' },
  { name: 'In Progress', value: 326, color: '#F59E0B' },
  { name: 'Resolved', value: 325, color: '#10B981' },
  { name: 'Closed', value: 147, color: '#3B82F6' },
];

const PRIORITY_PIE = [
  { name: 'High', value: 452, color: '#EF4444' },
  { name: 'Medium', value: 578, color: '#F59E0B' },
  { name: 'Low', value: 226, color: '#3B82F6' },
];

function TicketsMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  // Dynamic State
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(MOCK_TICKETS[0]);
  const [conversation, setConversation] = useState<Message[]>(MOCK_CONVERSATION);
  const [replyText, setReplyText] = useState('');
  const [activeChatTab, setActiveChatTab] = useState<'reply' | 'note' | 'smart'>('reply');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create Ticket Form State
  const [newTicketEmail, setNewTicketEmail] = useState('');
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketCat, setNewTicketCat] = useState('Technical');
  const [newTicketPrio, setNewTicketPrio] = useState('Medium');

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [agentFilter, setAgentFilter] = useState('All Agents');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Backend Data Synchronization ───────────────────────────────────────────
  const fetchDashboardAndTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, ticketsRes] = await Promise.all([
        supportGetDashboard().catch(() => null),
        supportGetTickets({
          status: statusFilter !== 'All Status' ? statusFilter : undefined,
          priority: priorityFilter !== 'All Priority' ? priorityPrioMap(priorityFilter) : undefined,
          category: categoryFilter !== 'All Categories' ? categoryFilter : undefined,
          search: searchQuery || undefined,
          limit: 50
        }).catch(() => null)
      ]);

      if (dashRes) setDashboardData(dashRes);

      if (ticketsRes && ticketsRes.tickets && ticketsRes.tickets.length > 0) {
        const mapped: Ticket[] = ticketsRes.tickets.map((t: any) => ({
          id: t.id,
          ticket_id: `#TK-${t.id.slice(0, 4).toUpperCase()}`,
          customer_name: t.customer_name || 'Valued Customer',
          customer_email: t.customer_email || 'customer@domain.com',
          customer_phone: t.customer_phone || '+91 98765 43210',
          title: t.title || 'Support Request',
          description: t.description || 'No detailed description provided.',
          category: t.category || 'General',
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          assigned_to: t.agent_name || 'Neha Verma',
          assigned_avatar: (t.agent_name || 'Neha Verma').split(' ').map((n: string)=>n[0]).join(''),
          created_date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          sla_deadline: t.sla_deadline || new Date(Date.now() + 3600000).toISOString(),
          response_time: '15m 30s',
          resolution_time: '18h 45m'
        }));
        setTickets(mapped);
        if (!selectedTicket || !mapped.find(m => m.id === selectedTicket.id)) {
          setSelectedTicket(mapped[0]);
        }
      } else {
        // Fallback to beautiful mock data filtered locally
        let res = MOCK_TICKETS.filter(t => {
          if (statusFilter !== 'All Status' && t.status !== statusFilter) return false;
          if (priorityFilter !== 'All Priority' && t.priority !== priorityFilter) return false;
          if (categoryFilter !== 'All Categories' && t.category !== categoryFilter) return false;
          if (agentFilter !== 'All Agents' && t.assigned_to !== agentFilter) return false;
          if (searchQuery && !t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        setTickets(res);
      }
    } catch (error) {
      setTickets(MOCK_TICKETS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, agentFilter, searchQuery, selectedTicket]);

  useEffect(() => {
    fetchDashboardAndTickets();
  }, [fetchDashboardAndTickets]);

  // Load specific ticket conversation when selectedTicket changes
  useEffect(() => {
    if (!selectedTicket) return;
    supportGetTicket(selectedTicket.id).then(res => {
      if (res && res.conversation && res.conversation.length > 0) {
        setConversation(res.conversation.map((m: any) => ({
          id: m.id,
          sender_type: m.sender_type,
          sender_name: m.sender_name || (m.sender_type === 'Agent' ? 'Agent' : selectedTicket.customer_name),
          message: m.message,
          is_internal_note: !!m.is_internal_note,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: m.sender_type === 'Agent' ? 'AG' : selectedTicket.customer_name.split(' ').map((n: string)=>n[0]).join('')
        })));
      } else {
        setConversation(MOCK_CONVERSATION);
      }
    }).catch(() => {
      setConversation(MOCK_CONVERSATION);
    });
  }, [selectedTicket]);

  function priorityPrioMap(p: string) { return p; }

  // Handle dynamic message sending to backend
  async function handleSendMsg(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const isNote = activeChatTab === 'note';
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_type: 'Agent',
      sender_name: isNote ? 'Neha Verma (Internal Note)' : 'Neha Verma (Agent)',
      message: replyText,
      is_internal_note: isNote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'NV'
    };
    // Optimistic UI update
    setConversation([...conversation, newMsg]);
    const textToSend = replyText;
    setReplyText('');

    try {
      await supportAddMessage(selectedTicket.id, {
        message: textToSend,
        isInternalNote: isNote
      });
      fetchDashboardAndTickets();
    } catch (err) {
      // Keep optimistic update
    }
  }

  // Handle dynamic ticket creation
  async function handleCreateTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supportCreateTicket({
        customerEmail: newTicketEmail,
        customerName: newTicketName || undefined,
        title: newTicketTitle,
        description: newTicketDesc,
        category: newTicketCat,
        priority: newTicketPrio
      });
      setShowCreateModal(false);
      alert('Ticket created successfully!');
      fetchDashboardAndTickets();
      // Reset form
      setNewTicketEmail(''); setNewTicketName(''); setNewTicketTitle(''); setNewTicketDesc('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create ticket. Please check inputs.');
    }
  }

  // Derived dashboard metrics or fallbacks
  const kpis = dashboardData?.kpis || {
    totalTickets: 1256, openTickets: 458, resolvedTickets: 675, pendingTickets: 326, slaCompliance: 92
  };
  const recentActivities = dashboardData?.recentActivity?.length ? dashboardData.recentActivity : MOCK_RECENT_ACTIVITY;
  const custAlerts = dashboardData?.customerAlerts?.length ? dashboardData.customerAlerts : MOCK_CUSTOMER_ALERTS;
  const agentPerf = dashboardData?.agentPerformance?.length ? dashboardData.agentPerformance : MOCK_AGENT_PERFORMANCE;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800">
      
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and resolve customer support tickets efficiently</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="border-r border-slate-100 pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">{kpis.totalTickets || 1256}</p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Filter Toggle Button */}
          <button onClick={fetchDashboardAndTickets} title="Refresh Live Data" className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Create Ticket Dropdown Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#6366F1] hover:bg-indigo-600 text-white px-4 py-2.5 rounded-l-xl font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#5053d4] hover:bg-[#4346b9] text-white px-2 py-2.5 rounded-r-xl border-l border-indigo-400/30 shadow-md transition"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS (6 CARDS MATCHING IMAGE 1) ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Tickets', value: kpis.openTickets || '458', trend: '+12.4% vs yesterday', isPositive: true, icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
          { label: 'In Progress', value: kpis.pendingTickets || '326', trend: '+8.6% vs yesterday', isPositive: true, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Resolved Tickets', value: kpis.resolvedTickets || '675', trend: '+20.8% vs yesterday', isPositive: true, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Closed Tickets', value: '875', trend: '+18.3% vs yesterday', isPositive: true, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'SLA Compliance', value: `${kpis.slaCompliance || 92}%`, trend: '+6.3% vs yesterday', isPositive: true, icon: ShieldAlert, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Avg. Response Time', value: '1h 32m', trend: '-8m vs yesterday', isPositive: false, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl border ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-black text-[#0F172A] mt-0.5">{kpi.value}</p>
            </div>
            <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${!kpi.isPositive && 'transform rotate-180'}`} /> {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* ── MAIN SPLIT LAYOUT (LEFT: MAIN, RIGHT: DETAILS) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 8 SPANS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TICKETS TABLE SECTION */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-[#0F172A] text-base">All Tickets</h3>
                <p className="text-xs text-slate-500 font-medium">{tickets.length} Tickets Found</p>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option>All Status</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Escalated</option>
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option>All Priority</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option>All Categories</option><option>Technical</option><option>Billing</option><option>General</option>
                </select>
                <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option>All Agents</option><option>Neha Verma</option><option>Rahul Sharma</option><option>Amit Patel</option><option>Pooja Singh</option>
                </select>
                <select className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option>Sort: Newest First</option><option>Sort: Oldest First</option><option>Sort: Urgent SLA</option>
                </select>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white p-0.5">
                  <button className="p-1.5 bg-slate-100 text-slate-800 rounded-lg"><BarChart2 className="w-3.5 h-3.5 transform rotate-90" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><Search className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Issue Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {tickets.map(t => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <tr key={t.id} onClick={() => setSelectedTicket(t)} className={`hover:bg-indigo-50/30 cursor-pointer transition ${isSelected ? 'bg-indigo-50/40 font-bold' : ''}`}>
                        <td className="py-3.5 px-4 font-bold text-indigo-600">{t.ticket_id}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center text-slate-700 shrink-0">
                              {t.customer_name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <span className="font-bold text-slate-900">{t.customer_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 max-w-[180px] truncate">{t.title}</td>
                        <td className="py-3.5 px-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px]">{t.category}</span></td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${t.priority === 'High' ? 'bg-rose-100 text-rose-700' : t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${t.status === 'Open' ? 'bg-blue-100 text-blue-700' : t.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : t.status === 'Escalated' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 font-bold text-[10px] flex items-center justify-center text-indigo-700 shrink-0">
                              {t.assigned_avatar}
                            </div>
                            <span>{t.assigned_to}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{t.created_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50/50">
              <span>Showing 1 to {tickets.length} of {kpis.totalTickets || 1256} tickets</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 hover:text-slate-600">&lt;</button>
                <button className="px-3 py-1.5 border border-indigo-600 bg-indigo-600 text-white rounded-xl">1</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">2</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">3</button>
                <span>...</span>
                <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">126</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:text-slate-600">&gt;</button>
              </div>
            </div>
          </div>

          {/* 3 DOUGHNUT CHARTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* SLA Overview */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-3">SLA Overview</h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <PieChart width={96} height={96}>
                      <Pie data={SLA_PIE} cx={48} cy={48} innerRadius={32} outerRadius={44} dataKey="value" paddingAngle={2}>
                        {SLA_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute text-center">
                      <p className="text-lg font-black text-slate-800">26</p>
                      <p className="text-[9px] font-bold text-slate-400">At Risk</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 flex-1 pl-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Breached</span>
                      <span className="font-bold text-slate-800">8 (3%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />At Risk (&lt;1hr)</span>
                      <span className="font-bold text-slate-800">18 (6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Within SLA</span>
                      <span className="font-bold text-slate-800">520 (92%)</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View Full SLA Report
              </button>
            </div>

            {/* Tickets by Status */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-3">Tickets by Status</h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <PieChart width={96} height={96}>
                      <Pie data={STATUS_PIE} cx={48} cy={48} innerRadius={32} outerRadius={44} dataKey="value" paddingAngle={2}>
                        {STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute text-center">
                      <p className="text-lg font-black text-slate-800">{kpis.totalTickets || 1256}</p>
                      <p className="text-[9px] font-bold text-slate-400">Total</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 flex-1 pl-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Open</span>
                      <span className="font-bold text-slate-800">{kpis.openTickets || 458} (36%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />In Progress</span>
                      <span className="font-bold text-slate-800">{kpis.pendingTickets || 326} (26%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Resolved</span>
                      <span className="font-bold text-slate-800">{kpis.resolvedTickets || 325} (26%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Closed</span>
                      <span className="font-bold text-slate-800">147 (12%)</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View Full Report
              </button>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-3">Priority Distribution</h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <PieChart width={96} height={96}>
                      <Pie data={PRIORITY_PIE} cx={48} cy={48} innerRadius={32} outerRadius={44} dataKey="value" paddingAngle={2}>
                        {PRIORITY_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 flex-1 pl-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />High</span>
                      <span className="font-bold text-slate-800">36% (452)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
                      <span className="font-bold text-slate-800">46% (578)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Low</span>
                      <span className="font-bold text-slate-800">18% (226)</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View Details
              </button>
            </div>

          </div>

          {/* AGENT PERFORMANCE & TICKETS TREND ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Agent Performance Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Agent Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                        <th className="pb-2">Agent</th>
                        <th className="pb-2 text-center">Tickets Handled</th>
                        <th className="pb-2 text-center">Avg. Response Time</th>
                        <th className="pb-2 text-center">Resolution Time</th>
                        <th className="pb-2 text-center">SLA Compliance</th>
                        <th className="pb-2 text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {agentPerf.map((a: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="py-2.5 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {a.avatar || (a.name || 'A').split(' ').map((n: string)=>n[0]).join('')}
                            </div>
                            <span className="font-bold text-slate-900">{a.name}</span>
                          </td>
                          <td className="py-2.5 text-center font-bold">{a.handled || a.ticketsHandled || 112}</td>
                          <td className="py-2.5 text-center text-slate-500">{a.avgResponse || '1h 25m'}</td>
                          <td className="py-2.5 text-center text-slate-500">{a.resolutionTime || '3h 15m'}</td>
                          <td className="py-2.5 text-center font-bold text-emerald-600">{a.sla || '95%'}</td>
                          <td className="py-2.5 text-center font-bold text-amber-500">★ {a.rating || a.satisfaction || 4.7}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View Full Performance Report
              </button>
            </div>

            {/* Tickets Trend Line Chart */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0F172A] text-sm">Tickets Trend (This Week)</h3>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Created</span>
                    <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Resolved</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dashboardData?.weeklyTickets?.length ? dashboardData.weeklyTickets : MOCK_TICKET_TREND_DATA} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tickets Created</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xl font-black text-slate-800">{kpis.totalTickets || 1256}</p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+18.6%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tickets Resolved</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xl font-black text-slate-800">{kpis.resolvedTickets || 675}</p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+20.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RECENT ACTIVITY, CUSTOMER ALERTS, QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Recent Activity */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Recent Activity</h3>
                <div className="space-y-4 text-xs">
                  {recentActivities.map((act: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400">{act.time ? new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '10:30 AM'}</span>
                          <span className="font-bold text-slate-900">{act.title || 'Update Logged'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{act.desc}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${act.color || 'bg-blue-50 text-blue-600 border-blue-200'} shrink-0`}>
                        {act.badge || 'Log'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View All Activity
              </button>
            </div>

            {/* Customer Alerts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Customer Alerts</h3>
                <div className="space-y-4">
                  {custAlerts.map((al: any, i: number) => (
                    <div key={i} className={`p-3.5 rounded-2xl border flex items-start gap-3 ${al.type === 'error' ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${al.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {al.count || '⚠️'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{al.count ? `${al.count} ${al.label}` : al.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{al.desc || al.risk || al.issues}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View All Alerts
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Create Ticket', icon: Plus, link: () => setShowCreateModal(true) },
                    { label: 'Assign Ticket', icon: UserCheck, link: () => alert('Opening ticket assignment module...') },
                    { label: 'Add Customer', icon: Users, link: () => router.push('/support/customers') },
                    { label: 'Knowledge Base', icon: BookOpen, link: () => router.push('/support/knowledge-base') },
                    { label: 'View Reports', icon: FileText, link: () => alert('Generating full operational report...') },
                    { label: 'Bulk Actions', icon: HelpCircle, link: () => alert('Opening bulk actions wizard...') },
                  ].map((btn, idx) => (
                    <button key={idx} onClick={btn.link} className="p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-indigo-600 transition active:scale-95 group">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl group-hover:scale-110 transition"><btn.icon className="w-4 h-4" /></div>
                      <span className="text-[11px] font-bold text-slate-700">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* TOP ISSUE CATEGORIES, SUGGESTED KNOWLEDGE ARTICLES, AI INSIGHTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Top Issue Categories */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Top Issue Categories</h3>
                <div className="space-y-3">
                  {MOCK_TOP_ISSUES.map((is, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{is.issue}</span>
                        <span className="text-slate-400 font-semibold">{is.percent}% ({is.count})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${is.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View Full Report
              </button>
            </div>

            {/* Suggested Knowledge Articles */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-4">Suggested Knowledge Articles</h3>
                <div className="space-y-3">
                  {MOCK_ARTICLES.map((art, i) => (
                    <div key={i} onClick={() => router.push('/support/knowledge-base')} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><BookOpen className="w-3.5 h-3.5" /></div>
                        <span className="text-xs font-bold text-slate-800">{art.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{art.views}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => router.push('/support/knowledge-base')} className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View All Articles
              </button>
            </div>

            {/* AI Insights */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl"><Sparkles className="w-4 h-4" /></div>
                  <h3 className="font-bold text-[#0F172A] text-sm">AI Insights</h3>
                </div>
                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <div className="flex items-start gap-2.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                    <span className="text-indigo-600 font-bold">📈</span>
                    <p>High priority tickets are increasing by 18% today.</p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-rose-50/50 border border-rose-100 p-3 rounded-xl">
                    <span className="text-rose-600 font-bold">⚠️</span>
                    <p>SLA risk detected for 26 tickets.</p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                    <span className="text-amber-600 font-bold">💡</span>
                    <p>Suggested: Reassign 8 tickets to available agents.</p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                    <span className="text-emerald-600 font-bold">💳</span>
                    <p>Payment related issues are trending this week.</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition">
                View All Insights
              </button>
            </div>

          </div>

          {/* SUGGESTED ACTIONS (AI POWERED) BOTTOM SECTION */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Suggested Actions (AI Powered)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Assign 10 tickets to available agents', desc: 'Workload is high for some agents.', btn: 'Assign Now', color: 'bg-amber-50 border-amber-200 text-amber-700', btnBg: 'bg-amber-100 hover:bg-amber-200 text-amber-800' },
                { title: 'Respond to 26 SLA at-risk tickets', desc: 'Avoid SLA breach and improve score.', btn: 'View Tickets', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', btnBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' },
                { title: 'Review 5 escalated tickets', desc: 'High priority escalations pending.', btn: 'Review Now', color: 'bg-rose-50 border-rose-200 text-rose-700', btnBg: 'bg-rose-100 hover:bg-rose-200 text-rose-800' },
                { title: 'Update knowledge base articles', desc: 'Related to top customer issues.', btn: 'Update Now', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', btnBg: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800' },
              ].map((act, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between ${act.color}`}>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-snug">{act.title}</p>
                    <p className="text-[10px] text-slate-600 font-medium mt-1">{act.desc}</p>
                  </div>
                  <button onClick={() => alert(`Initiating action: ${act.title}...`)} className={`w-full mt-4 py-1.5 rounded-xl font-bold text-xs transition shadow-sm ${act.btnBg}`}>
                    {act.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 SPANS (TICKET DETAILS SIDEBAR) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6 sticky top-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-[#0F172A] text-base">Ticket Details</h3>
            <div className="flex gap-1">
              <button className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Title & Badges */}
          {selectedTicket ? (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-black text-indigo-600">{selectedTicket.ticket_id}</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded uppercase">{selectedTicket.priority}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full uppercase ml-auto">{selectedTicket.status}</span>
                </div>
                <h4 className="font-black text-[#0F172A] text-sm">{selectedTicket.title}</h4>
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Metadata Table */}
              <div className="space-y-3.5 text-xs border-y border-slate-100 py-4">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Category</span><span className="font-bold text-slate-800">{selectedTicket.category}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Created Date</span><span className="font-bold text-slate-800">{selectedTicket.created_date}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Customer</span><span className="font-bold text-slate-800">{selectedTicket.customer_name}</span></div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-bold">Contact</span>
                  <div className="text-right font-bold text-slate-700 space-y-0.5">
                    <p>{selectedTicket.customer_phone || '+91 98765 43210'}</p>
                    <p className="text-[10px] text-indigo-600">{selectedTicket.customer_email}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-slate-400 font-bold">Assigned To</span>
                  <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center justify-center">
                      {selectedTicket.assigned_avatar}
                    </div>
                    <span className="font-bold text-slate-800">{selectedTicket.assigned_to}</span>
                  </div>
                </div>
              </div>

              {/* SLA Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#0F172A] text-sm">SLA Information</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Response Time</span>
                    <span className="text-emerald-600">{selectedTicket.response_time} / 1h</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Resolution Time</span>
                    <span className="text-indigo-600">{selectedTicket.resolution_time} / 24h</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-600" /> Time Left</span>
                  <span className="text-emerald-700 font-black">{selectedTicket.resolution_time}</span>
                </div>
              </div>

              {/* Conversation Section */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-[#0F172A] text-sm">Conversation</h4>
                
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {conversation.map((msg, i) => {
                    const isAgent = msg.sender_type === 'Agent';
                    return (
                      <div key={i} className={`flex items-start gap-2.5 ${isAgent ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${isAgent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {msg.avatar || 'U'}
                        </div>
                        <div className={`flex-1 space-y-1 ${isAgent ? 'text-right' : ''}`}>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold px-1">
                            <span>{msg.sender_name}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed inline-block text-left ${isAgent ? (msg.is_internal_note ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-[#6366F1] text-white') : 'bg-slate-100 text-slate-800'}`}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conversation Input Bar */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 text-xs font-bold">
                    <button type="button" onClick={() => setActiveChatTab('reply')} className={`px-3 py-1.5 rounded-xl transition ${activeChatTab === 'reply' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}>
                      Reply
                    </button>
                    <button type="button" onClick={() => setActiveChatTab('note')} className={`px-3 py-1.5 rounded-xl transition ${activeChatTab === 'note' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                      Internal Note
                    </button>
                    <button type="button" onClick={() => setActiveChatTab('smart')} className={`px-3 py-1.5 rounded-xl transition ${activeChatTab === 'smart' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                      Smart Reply
                    </button>
                  </div>

                  {activeChatTab === 'smart' ? (
                    <div className="p-3 space-y-2 bg-blue-50/30">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3" /> Select AI Suggestion</p>
                      <div className="space-y-1.5">
                        {[
                          'I have verified the logs and reset your credentials. Please try logging in now.',
                          'We are currently experiencing heavy API load. Our tech team is on it.',
                          'I am escalating this ticket to our senior billing specialist.'
                        ].map((txt, idx) => (
                          <button key={idx} onClick={() => { setReplyText(txt); setActiveChatTab('reply'); }} className="w-full text-left p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition">
                            {txt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMsg} className="p-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={activeChatTab === 'note' ? 'Type internal note...' : 'Type your message...'}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none placeholder:text-slate-400"
                      />
                      <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600"><Paperclip className="w-4 h-4" /></button>
                      <button type="submit" className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow transition active:scale-95 ${activeChatTab === 'note' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#6366F1] hover:bg-indigo-600'}`}>
                        Send
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Ticket Timeline Section */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-[#0F172A] text-sm">Ticket Timeline</h4>
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-4 text-xs">
                  {MOCK_TIMELINE.map((tl, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[31px] top-0.5 text-sm">{tl.icon}</span>
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{tl.title}</span>
                        <span className="text-[9px] text-slate-400">{tl.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{tl.desc}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition">
                  View Full Timeline
                </button>
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-xs text-center py-12">Select a ticket to view details</div>
          )}

        </div>

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
              <form className="p-6 space-y-4 text-xs font-semibold text-slate-600" onSubmit={handleCreateTicketSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label>Customer Email *</label>
                    <input type="email" required placeholder="customer@domain.com" value={newTicketEmail} onChange={e=>setNewTicketEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800" />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label>Customer Name</label>
                    <input type="text" placeholder="Full name" value={newTicketName} onChange={e=>setNewTicketName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Issue Title *</label>
                  <input type="text" required placeholder="Describe the issue briefly" value={newTicketTitle} onChange={e=>setNewTicketTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label>Description *</label>
                  <textarea required rows={4} placeholder="Detailed description..." value={newTicketDesc} onChange={e=>setNewTicketDesc(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Category</label>
                    <select value={newTicketCat} onChange={e=>setNewTicketCat(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:border-indigo-500">
                      <option>Technical</option><option>Billing</option><option>General</option><option>Account</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Priority</label>
                    <select value={newTicketPrio} onChange={e=>setNewTicketPrio(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:border-indigo-500">
                      <option value="High">High (4h SLA)</option>
                      <option value="Medium">Medium (24h SLA)</option>
                      <option value="Low">Low (48h SLA)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#6366F1] hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition">Create Ticket</button>
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
        <RefreshCw className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    }>
      <TicketsMain />
    </Suspense>
  );
}
