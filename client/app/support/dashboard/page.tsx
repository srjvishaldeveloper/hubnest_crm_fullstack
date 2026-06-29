'use client';

import { useEffect, useState } from 'react';
import { supportGetDashboard, supportCreateTicket } from '../../../services/supportService';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ScrollText,
  Users,
  BookOpen,
  UserCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  UserCheck,
  Sun,
  Moon,
  X
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    pendingTickets: number;
    slaCompliance: number;
  };
  priorityTickets: Array<{
    id: string;
    title: string;
    priority: string;
    sla_deadline: string;
    status: string;
    customer_name: string;
  }>;
  slaTracking: Array<{
    id: string;
    title: string;
    sla_deadline: string;
    customer_name: string;
    status: string;
  }>;
  agentPerformance: Array<{ id: string; name: string; ticketsHandled: number; resolutionTime: string; satisfaction: number }>;
  customerAlerts: Array<{ name: string; issues: string; risk: string }>;
  weeklyTickets?: Array<{ day: string; open: number; resolved: number; pending: number }>;
  categoryBar?: Array<{ name: string; count: number }>;
  slaTrend?: Array<{ day: string; compliance: number }>;
  csatTrend?: Array<{ week: string; score: number }>;
  statusOverview?: Array<{ status: string; count: number }>;
  recentActivity?: Array<{ time: string; desc: string; ticketId: string }>;
}

export default function SupportDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Theme Toggle State & Toast
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Fields
  const [custEmail, setCustEmail] = useState('');
  const [custName, setCustName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');

  const user = useAuthStore((s) => s.user);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await supportGetDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load support dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!custEmail || !title || !desc) return;
    try {
      setSubmitting(true);
      await supportCreateTicket({
        customerEmail: custEmail,
        customerName: custName,
        title,
        description: desc,
        category,
        priority
      });
      setShowCreateModal(false);
      // Reset
      setCustEmail('');
      setCustName('');
      setTitle('');
      setDesc('');
      setCategory('Technical');
      setPriority('Medium');
      setToastMessage('Ticket Created Successfully!');
      loadDashboard();
    } catch (err) {
      console.error('Failed to create ticket', err);
      alert('Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    setToastMessage(`Switched to ${newTheme ? 'Dark' : 'Light'} Dashboard Theme`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm text-slate-500 font-medium animate-pulse">Assembling Support Insights...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || { totalTickets: 0, openTickets: 0, resolvedTickets: 0, pendingTickets: 0, slaCompliance: 92 };

  // Calculate Breached count vs At Risk count for mockup circle
  const breachedCount = data?.slaTracking.filter(t => t.status === 'Breached').length || 0;
  const atRiskCount = data?.slaTracking.filter(t => t.status === 'At Risk (< 1hr)').length || 0;
  const withinSlaCount = (data?.slaTracking.length || 0) - breachedCount - atRiskCount;

  return (
    <div className={`space-y-8 p-6 rounded-3xl animate-fade-in transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A] text-slate-100' : 'bg-slate-50/50 text-slate-800'}`}>
      
      {/* ── LIVE TOAST NOTIFICATION ───────────────────────────────────────── */}
      {toastMessage && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 z-50 bg-[#2563EB] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400 text-xs font-bold"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-blue-200 hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
        </motion.div>
      )}

      {/* Header section with Theme Switcher & Create button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
            Good Morning, {user?.name || 'Neha'}! 👋
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Here is what is happening with your support desk today.</p>
        </div>
        <div className="flex items-center gap-4">
          
          {/* Dark / Light Theme Custom Switch */}
          <div className={`flex items-center gap-2.5 px-4 py-2 border rounded-2xl shadow-sm transition-colors duration-200 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-blue-400' : 'text-slate-600'}`}>
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
            <button
              type="button"
              onClick={handleThemeToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={isDarkMode}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>

          <button
            onClick={loadDashboard}
            className={`p-2.5 border rounded-2xl transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Tickets</span>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><ScrollText className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{kpis.totalTickets}</p>
          <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.6% vs yesterday
          </p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Open Tickets</span>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-red-950 text-red-400' : 'bg-red-50 text-red-600'}`}><AlertCircle className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{kpis.openTickets}</p>
          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs yesterday
          </p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Resolved Tickets</span>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'}`}><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{kpis.resolvedTickets}</p>
          <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +20.8% vs yesterday
          </p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Tickets</span>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-amber-950 text-amber-400' : 'bg-amber-50 text-amber-600'}`}><Clock className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{kpis.pendingTickets}</p>
          <p className="text-xs text-amber-500 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +5.6% vs yesterday
          </p>
        </div>

        <div className={`col-span-2 lg:col-span-1 p-5 rounded-2xl border shadow-sm hover:shadow-md transition ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>SLA Compliance</span>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <p className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{kpis.slaCompliance}%</p>
          <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +6.3% vs yesterday
          </p>
        </div>
      </div>

      {/* Main Grid: Priority list, SLA breakdown, Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Urgent tickets */}
        <div className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Priority Tickets (Urgent)</h3>
              <a href="/support/tickets" className={`text-xs font-bold hover:underline ${isDarkMode ? 'text-blue-400' : 'text-[#2563EB]'}`}>View All</a>
            </div>
            
            <div className="space-y-3">
              {data?.priorityTickets.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No urgent priority tickets.</div>
              ) : (
                data?.priorityTickets.map(t => (
                  <div key={t.id} className={`p-3 rounded-xl flex items-center justify-between border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold truncate max-w-[180px] ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t.title}</p>
                      <span className="text-[10px] text-slate-400 font-medium">#{t.id.slice(0,8)} • {t.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'bg-red-950 text-red-300' : 'bg-red-100 text-red-700'}`}>
                        {t.priority}
                      </span>
                      <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                        {new Date(t.sla_deadline) > new Date() ? '15m 30s left' : 'Breached'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <a
            href="/support/tickets"
            className={`w-full mt-5 py-2.5 border font-bold text-xs rounded-xl text-center block transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            View All Priority Tickets
          </a>
        </div>

        {/* SLA circle visualization */}
        <div className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>SLA Tracking</h3>
              <a href="/support/tickets" className={`text-xs font-bold hover:underline ${isDarkMode ? 'text-blue-400' : 'text-[#2563EB]'}`}>View Details</a>
            </div>

            {/* Premium circular chart */}
            <div className="flex items-center justify-around my-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="8" fill="transparent" />
                  <circle
                    cx="56" cy="56" r="46"
                    stroke="#EF4444" strokeWidth="8" fill="transparent"
                    strokeDasharray={288}
                    strokeDashoffset={288 - (288 * (breachedCount || 1)) / (data?.slaTracking.length || 5)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{data?.slaTracking.length || 0}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">At Risk</p>
                </div>
              </div>
              
              <div className={`space-y-1.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Breached: <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{breachedCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>At Risk (&lt;1h): <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{atRiskCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Within SLA: <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{withinSlaCount}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              {data?.slaTracking.slice(0, 3).map(t => (
                <div key={t.id} className={`flex items-center justify-between text-xs border-b pb-1.5 ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                  <span className="truncate max-w-[160px]">{t.title}</span>
                  <span className={`font-bold ${t.status === 'Breached' ? 'text-red-500' : 'text-amber-500'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <a
            href="/support/tickets"
            className={`w-full mt-4 py-2.5 border font-bold text-xs rounded-xl text-center block transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            View Full SLA Report
          </a>
        </div>

        {/* Quick Actions Panel */}
        <div className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div>
            <h3 className={`font-bold text-base mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 active:scale-95 group ${isDarkMode ? 'bg-blue-950/40 border-blue-800/50 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50/50 hover:bg-blue-50 border-blue-100 text-[#2563EB]'}`}
              >
                <div className="p-2.5 bg-[#2563EB] text-white rounded-xl group-hover:scale-110 transition"><Plus className="w-4 h-4" /></div>
                <span className="text-xs font-bold">Create Ticket</span>
              </button>

              <a
                href="/support/tickets"
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 active:scale-95 group ${isDarkMode ? 'bg-purple-950/40 border-purple-800/50 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-50/50 hover:bg-purple-50 border-purple-100 text-purple-600'}`}
              >
                <div className="p-2.5 bg-purple-600 text-white rounded-xl group-hover:scale-110 transition"><UserCheck className="w-4 h-4" /></div>
                <span className="text-xs font-bold">Assign Tickets</span>
              </a>

              <a
                href="/support/customers"
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 active:scale-95 group ${isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40' : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 text-emerald-600'}`}
              >
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl group-hover:scale-110 transition"><Users className="w-4 h-4" /></div>
                <span className="text-xs font-bold">Add Customer</span>
              </a>

              <a
                href="/support/knowledge-base"
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 active:scale-95 group ${isDarkMode ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-400 hover:bg-indigo-900/40' : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100 text-indigo-600'}`}
              >
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl group-hover:scale-110 transition"><BookOpen className="w-4 h-4" /></div>
                <span className="text-xs font-bold">Knowledge Base</span>
              </a>
            </div>
          </div>

          {/* AI Insights Summary inside Quick Action card */}
          <div className={`border rounded-2xl p-4 mt-4 flex items-start gap-3 ${isDarkMode ? 'bg-indigo-950/40 border-indigo-800/50' : 'bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border-indigo-100/50'}`}>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}><Sparkles className="w-4 h-4" /></div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>AI Insight</p>
              <p className={`text-xs font-medium leading-relaxed mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                High priority tickets are increasing by 18% today. Consider reassigning unresolved technical questions.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Performance overview, Customer alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent Performance table */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Agent Performance Overview</h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">This Week</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold text-slate-400 uppercase tracking-wider ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <th className="pb-3 font-semibold">Agent</th>
                  <th className="pb-3 font-semibold text-center">Tickets Handled</th>
                  <th className="pb-3 font-semibold text-center">Avg Resolution Time</th>
                  <th className="pb-3 font-semibold text-center">CSAT</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs font-medium ${isDarkMode ? 'divide-slate-700 text-white' : 'divide-slate-50 text-[#0F172A]'}`}>
                {data?.agentPerformance.map(a => (
                  <tr key={a.id} className={`transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                    <td className="py-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{a.name}</p>
                        <span className="text-[10px] text-slate-400 font-medium">Support Agent</span>
                      </div>
                    </td>
                    <td className={`py-3.5 text-center font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{a.ticketsHandled}</td>
                    <td className={`py-3.5 text-center font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{a.resolutionTime}</td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ring-1 ${isDarkMode ? 'bg-green-950 text-green-300 ring-green-800' : 'bg-green-50 text-green-700 ring-green-600/10'}`}>
                        ⭐ {a.satisfaction} / 5.0
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer alerts / sentiment alerts */}
        <div className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div>
            <h3 className={`font-bold text-base mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Customer Alerts</h3>
            <div className="space-y-4">
              {data?.customerAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No customer alert warnings.</div>
              ) : (
                data?.customerAlerts.map(c => (
                  <div key={c.name} className={`flex items-start gap-3 p-3 border rounded-xl ${isDarkMode ? 'bg-red-950/40 border-red-800/50' : 'bg-red-50/30 border-red-100/50'}`}>
                    <div className={`p-2 rounded-xl mt-0.5 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'}`}>
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{c.name}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.issues}</p>
                      <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider mt-1.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        ⚠️ {c.risk}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <a
            href="/support/customers"
            className={`w-full mt-4 py-2.5 border font-bold text-xs rounded-xl text-center block transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            Review Unhappy Customers
          </a>
        </div>

      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl border w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up ${isDarkMode ? 'bg-[#1E293B] border-slate-700 text-white' : 'bg-white border-slate-200/80 text-slate-800'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Create New Support Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500 text-sm font-bold">✕</button>
            </div>
            
            <form onSubmit={handleCreateTicket} className={`p-6 space-y-4 text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Customer Email *</label>
                  <input
                    type="email" required value={custEmail} onChange={e => setCustEmail(e.target.value)}
                    placeholder="customer@domain.com"
                    className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label>Customer Name</label>
                  <input
                    type="text" value={custName} onChange={e => setCustName(e.target.value)}
                    placeholder="Rohit Sharma"
                    className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label>Ticket Title *</label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Unable to access subscription..."
                  className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="space-y-1">
                <label>Problem Description *</label>
                <textarea
                  required rows={4} value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Explain details of the complaint..."
                  className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label>Priority</label>
                  <select
                    value={priority} onChange={e => setPriority(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl font-medium focus:outline-none focus:border-blue-500 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
                  >
                    <option value="High">High (4h SLA)</option>
                    <option value="Medium">Medium (24h SLA)</option>
                    <option value="Low">Low (48h SLA)</option>
                  </select>
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 border rounded-xl font-bold ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
