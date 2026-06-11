'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  supportGetTickets,
  supportGetTicket,
  supportUpdateTicket,
  supportAddMessage,
  supportGetDashboard // to load agents and overview metrics
} from '../../../services/supportService';
import { useAuthStore } from '../../../store/authStore';
import {
  ScrollText,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Send,
  Paperclip,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  RefreshCw,
  MoreVertical,
  X
} from 'lucide-react';

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

function TicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Selected Ticket details
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Message Sending
  const [activeTab, setActiveTab] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Agents list for assignment
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  const user = useAuthStore((s) => s.user);

  // Load tickets list
  async function loadTickets() {
    try {
      setLoadingList(true);
      const res = await supportGetTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setTickets(res.tickets);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load tickets list', err);
    } finally {
      setLoadingList(false);
    }
  }

  // Load selected ticket details
  async function loadTicketDetails(id: string) {
    try {
      setLoadingDetail(true);
      const res = await supportGetTicket(id);
      setSelectedTicket(res.ticket);
      setConversation(res.conversation);
    } catch (err) {
      console.error('Failed to load ticket details', err);
      setSelectedId(null);
      setSelectedTicket(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Load agent names from dashboard/performance data
  async function loadAgents() {
    try {
      const res = await supportGetDashboard();
      if (res?.agentPerformance) {
        setAgents(res.agentPerformance.map((a: any) => ({ id: a.id, name: a.name })));
      }
    } catch (err) {
      console.error('Failed to load agents list', err);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter, page]);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadTicketDetails(selectedId);
      // Update URL query parameter
      router.push(`/support/tickets?id=${selectedId}`);
    } else {
      setSelectedTicket(null);
      setConversation([]);
      router.push('/support/tickets');
    }
  }, [selectedId]);

  async function handleSendReply(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedId) return;

    try {
      setSendingMsg(true);
      await supportAddMessage(selectedId, {
        message: replyText,
        isInternalNote: activeTab === 'note'
      });
      setReplyText('');
      loadTicketDetails(selectedId);
      loadTickets(); // Refresh queue list too
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleUpdateMetadata(field: 'status' | 'priority' | 'assigned_agent_id', value: string) {
    if (!selectedId || !selectedTicket) return;
    try {
      const updates = { [field]: value === 'unassigned' ? null : value };
      await supportUpdateTicket(selectedId, updates);
      loadTicketDetails(selectedId);
      loadTickets();
    } catch (err) {
      console.error('Failed to update ticket field', err);
    }
  }

  const handleSmartReply = (text: string) => {
    setReplyText(text);
  };

  return (
    <div className="space-y-6">
      {/* Top action/filters bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Tickets Queue</h1>
          <p className="text-xs text-slate-500">Manage and resolve customer support tickets efficiently.</p>
        </div>
        
        {/* Search & filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTickets()}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 w-52"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={loadTickets}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Main split-screen panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Queue List */}
        <div className={`${selectedId ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-300`}>
          <div className="p-4 bg-slate-50 dark:bg-[#161616] border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Tickets ({total})</span>
            {selectedId && (
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden text-xs text-[#2563EB] font-bold hover:underline"
              >
                Show List Fullscreen
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f] text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-[#161616]/50">
                  <th className="p-4 font-semibold">Ticket ID / Submitter</th>
                  <th className="p-4 font-semibold">Issue Details</th>
                  <th className="p-4 font-semibold">Priority</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Assigned Agent</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-[#0F172A] dark:text-[#F9FAFB]">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">Retrieving tickets queue...</p>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      No tickets match the active filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map(t => {
                    const active = selectedId === t.id;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`hover:bg-slate-50 dark:bg-[#161616]/65 transition-all cursor-pointer ${active ? 'bg-blue-50/40 border-l-4 border-l-[#2563EB]' : ''}`}
                      >
                        <td className="p-4">
                          <p className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">#{t.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{t.customer_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700 truncate max-w-[200px]">{t.title}</p>
                          <span className="inline-block text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mt-0.5 leading-none">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide
                            ${t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider
                            ${t.status === 'Open' ? 'bg-blue-50 text-blue-600' : t.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-700'}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-500 font-semibold">{t.agent_name || 'Unassigned'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Simple pagination */}
          <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Showing {tickets.length} of {total} tickets</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={tickets.length < 20}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Control Room Pane */}
        {selectedId && (
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-[700px] overflow-hidden sticky top-6 animate-scale-up">
            
            {/* Control Pane Header */}
            <div className="p-4 bg-slate-50 dark:bg-[#161616] border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 text-[#2563EB] rounded-xl flex items-center justify-center font-bold">
                  #{selectedTicket?.id.slice(0, 4)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate max-w-[220px]">{selectedTicket?.title}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{selectedTicket?.customer_name} ({selectedTicket?.customer_email})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Log Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#161616]/40 scrollbar-thin">
              {loadingDetail ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
                </div>
              ) : (
                <>
                  {/* Issue description box */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100/40 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Original Issue Description</span>
                    <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">{selectedTicket?.description}</p>
                    <span className="inline-block text-[9px] text-slate-400 font-semibold mt-2">
                      Category: {selectedTicket?.category} • Priority: {selectedTicket?.priority}
                    </span>
                  </div>

                  {/* Messages list */}
                  {conversation.map(msg => {
                    const isAgent = msg.sender_type === 'Agent';
                    const isNote = msg.is_internal_note;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <span className="text-[9px] text-slate-400 font-bold px-1">
                          {msg.sender_name} {isNote ? '• 🔒 Internal Note' : ''}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed
                          ${isNote
                            ? 'bg-amber-50 text-amber-800 border border-amber-100 rounded-tr-none'
                            : isAgent
                              ? 'bg-[#2563EB] text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-100 dark:border-[#1f1f1f] rounded-tl-none shadow-sm'}`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[8px] text-slate-350 px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Controls Box (Status, Priority, Reassign Agent) */}
            <div className="p-3 bg-slate-50 dark:bg-[#161616] border-y border-slate-100 dark:border-[#1f1f1f] grid grid-cols-3 gap-2 shrink-0">
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Status</label>
                <select
                  value={selectedTicket?.status || ''}
                  onChange={e => handleUpdateMetadata('status', e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Priority</label>
                <select
                  value={selectedTicket?.priority || ''}
                  onChange={e => handleUpdateMetadata('priority', e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Reassign</label>
                <select
                  value={selectedTicket?.assigned_agent_id || 'unassigned'}
                  onChange={e => handleUpdateMetadata('assigned_agent_id', e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-white"
                >
                  <option value="unassigned">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Reply Suggestions */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1f1f1f] flex gap-2 overflow-x-auto shrink-0 bg-white select-none scrollbar-none">
              <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Smart Replies:
              </span>
              <button
                onClick={() => handleSmartReply('Hi, I am looking into this issue and will update you shortly.')}
                className="text-[10px] text-slate-600 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold shrink-0"
              >
                Checking now
              </button>
              <button
                onClick={() => handleSmartReply('Please confirm the email registered with the tenant organization.')}
                className="text-[10px] text-slate-600 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold shrink-0"
              >
                Confirm email
              </button>
              <button
                onClick={() => handleSmartReply('This issue has been resolved. Please log out and log back in to test.')}
                className="text-[10px] text-slate-600 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold shrink-0"
              >
                Issue resolved
              </button>
            </div>

            {/* Reply Input Box */}
            <div className="p-4 bg-white shrink-0">
              <div className="flex border border-slate-200 rounded-2xl overflow-hidden focus-within:border-blue-500 transition">
                <div className="bg-slate-50 dark:bg-[#161616] border-r border-slate-200 flex flex-col justify-start p-1.5">
                  <button
                    onClick={() => setActiveTab('reply')}
                    title="Send Reply"
                    className={`p-2 rounded-xl text-slate-500 hover:bg-slate-200/50 transition ${activeTab === 'reply' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('note')}
                    title="🔒 Internal Note"
                    className={`p-2 rounded-xl text-slate-500 hover:bg-slate-200/50 transition mt-1.5 ${activeTab === 'note' ? 'bg-white text-amber-600 shadow-sm' : ''}`}
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSendReply} className="flex-1 flex items-center pr-3">
                  <input
                    type="text"
                    placeholder={activeTab === 'note' ? 'Add internal comment (visible to agents only)...' : 'Type reply to customer...'}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-3 text-xs focus:outline-none placeholder:text-slate-400 font-semibold text-slate-700"
                  />
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={sendingMsg}
                      className={`p-2.5 rounded-xl transition-all ${activeTab === 'note' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#2563EB] hover:bg-blue-700'} text-white shadow-md shadow-blue-500/10 active:scale-95`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading tickets workspace...</p>
        </div>
      </div>
    }>
      <TicketsContent />
    </Suspense>
  );
}
