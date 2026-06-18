'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Search, Plus, Phone, MessageSquare, Eye, Mail, Calendar, Tag, X,
  Activity, Trash2, ArrowUpRight, Sparkles, Trophy, TrendingUp,
  Send, Users, CheckCircle2, AlertCircle, Clock, Filter,
  BarChart2, Zap, Star, ChevronDown, RefreshCw, LogIn,
  BadgeCheck, AlertTriangle, MoreHorizontal, List, Target, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  platform?: string;
  status: string;
  priority: string;
  notes?: string;
  next_followup?: string;
  conversion_probability?: number;
  quality_score?: number;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
}

interface Activity {
  id: string;
  type: string;
  outcome?: string;
  notes?: string;
  duration_seconds?: number;
  created_at: string;
}

interface ContactList {
  id: string;
  name: string;
  contact_count: number;
}

interface Stats {
  total: number;
  hot: number;
  converted: number;
  lost: number;
  followupDue: number;
  winRate: number;
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
      type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4 shrink-0" /> : type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-purple-100 text-purple-700',
  Interested: 'bg-amber-100 text-amber-700',
  'Not Interested': 'bg-slate-100 text-slate-500',
  Converted: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700',
  Warm: 'bg-orange-100 text-orange-700',
  Cold: 'bg-sky-100 text-sky-700',
};

function priorityLabel(p: string) {
  return p === 'Hot' ? 'Hot 🔥' : p === 'Warm' ? 'Warm' : 'Cold';
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const router = useRouter();

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, hot: 0, converted: 0, lost: 0, followupDue: 0, winRate: 0 });

  // UI State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'history' | 'actions'>('details');
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isSendMarketingOpen, setIsSendMarketingOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<Lead | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Add Lead form
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', company: '', source: 'Manual', priority: 'Warm', notes: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Edit Lead (detail panel)
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editFollowup, setEditFollowup] = useState('');
  const [editProb, setEditProb] = useState(50);
  const [saveLoading, setSaveLoading] = useState(false);

  // Log Activity form
  const [actForm, setActForm] = useState({ type: 'Call', outcome: 'Connected', notes: '', duration_seconds: 0 });
  const [actLoading, setActLoading] = useState(false);

  // Send to marketing form
  const [mktForm, setMktForm] = useState({ listId: '', createNew: false, newListName: '' });
  const [mktLoading, setMktLoading] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // ── Fetch leads ──────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/sales/leads');
      const data: Lead[] = res.data.data.leads || [];
      setLeads(data);

      const hot = data.filter(l => l.priority === 'Hot').length;
      const converted = data.filter(l => l.status === 'Converted').length;
      const lost = data.filter(l => l.status === 'Lost').length;
      const followupDue = data.filter(l => l.next_followup && new Date(l.next_followup) <= new Date()).length;
      const winRate = data.length ? Math.round((converted / data.length) * 100) : 0;
      setStats({ total: data.length, hot, converted, lost, followupDue, winRate });
    } catch {
      showToast('Could not fetch leads from server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchContactLists = useCallback(async () => {
    try {
      const res = await api.get('/marketing/lists');
      const d = res.data.data;
      setContactLists(Array.isArray(d) ? d : d?.lists ?? []);
    } catch {
      // Marketing lists not critical — silently skip
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchContactLists();
  }, [fetchLeads, fetchContactLists]);

  // Sync edit fields when lead selected
  useEffect(() => {
    if (!selectedLead) return;
    setEditNotes(selectedLead.notes || '');
    setEditStatus(selectedLead.status || 'New');
    setEditPriority(selectedLead.priority || 'Warm');
    setEditFollowup(selectedLead.next_followup ? new Date(selectedLead.next_followup).toISOString().slice(0, 16) : '');
    setEditProb(selectedLead.conversion_probability || 50);
    setDetailTab('details');
    setActivities([]);

    api.get(`/sales/leads/${selectedLead.id}/activity`)
      .then(r => setActivities(r.data.data.activities || []))
      .catch(() => setActivities([]));
  }, [selectedLead?.id]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || (l.phone || '').includes(q) ||
      (l.company || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
    const matchPriority = !priorityFilter || l.priority === priorityFilter;

    if (activeTab === 'Hot') return matchSearch && matchPriority && l.priority === 'Hot';
    if (activeTab === 'Follow-up') return matchSearch && matchPriority && l.next_followup && new Date(l.next_followup) <= new Date(Date.now() + 24 * 3600 * 1000);
    if (activeTab === 'Converted') return matchSearch && matchPriority && l.status === 'Converted';
    if (activeTab === 'Lost') return matchSearch && matchPriority && l.status === 'Lost';
    return matchSearch && matchPriority;
  });

  // ── Add Lead ─────────────────────────────────────────────────────────────────
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/sales/leads', newLead);
      const lead = res.data.data.lead;
      setLeads(prev => [lead, ...prev]);
      setStats(s => ({ ...s, total: s.total + 1, hot: newLead.priority === 'Hot' ? s.hot + 1 : s.hot }));
      setIsAddOpen(false);
      setNewLead({ name: '', phone: '', email: '', company: '', source: 'Manual', priority: 'Warm', notes: '' });
      showToast('Lead created successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create lead', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Update Lead ──────────────────────────────────────────────────────────────
  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setSaveLoading(true);
    try {
      const payload = { notes: editNotes, status: editStatus, priority: editPriority, next_followup: editFollowup || null, conversion_probability: editProb };
      const res = await api.patch(`/sales/leads/${selectedLead.id}`, payload);
      const updated: Lead = res.data.data.lead;
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
      setSelectedLead(updated);
      showToast('Lead updated successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update lead', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Log Activity ─────────────────────────────────────────────────────────────
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setActLoading(true);
    try {
      await api.post('/sales/activities', { lead_id: selectedLead.id, ...actForm });
      // Refresh activities
      const r = await api.get(`/sales/leads/${selectedLead.id}/activity`);
      setActivities(r.data.data.activities || []);
      setIsLogActivityOpen(false);
      setActForm({ type: 'Call', outcome: 'Connected', notes: '', duration_seconds: 0 });
      showToast('Activity logged!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to log activity', 'error');
    } finally {
      setActLoading(false);
    }
  };

  // ── Send to Marketing ────────────────────────────────────────────────────────
  const handleSendToMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    setMktLoading(true);
    const targets = bulkMode ? Array.from(selectedForBulk) : (selectedLead ? [selectedLead.id] : []);
    if (!targets.length) { showToast('No leads selected', 'error'); setMktLoading(false); return; }

    try {
      await api.post('/marketing/contacts/import', {
        listId: mktForm.createNew ? undefined : mktForm.listId || undefined,
        createList: mktForm.createNew,
        listName: mktForm.createNew ? mktForm.newListName : undefined,
        contacts: leads.filter(l => targets.includes(l.id)).map(l => ({
          name: l.name, email: l.email, phone: l.phone, company: l.company, source: l.source
        }))
      });
      setIsSendMarketingOpen(false);
      setSelectedForBulk(new Set());
      setBulkMode(false);
      setMktForm({ listId: '', createNew: false, newListName: '' });
      await fetchContactLists();
      showToast(`${targets.length} lead(s) sent to marketing list!`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send to marketing', 'error');
    } finally {
      setMktLoading(false);
    }
  };

  // ── Delete Lead (hard delete) ────────────────────────────────────────────────
  const handleDeleteLead = async () => {
    if (!isDeleteOpen) return;
    const leadId = isDeleteOpen.id;
    const leadName = isDeleteOpen.name;
    setIsDeleteOpen(null);
    // Optimistic remove immediately
    setLeads(prev => prev.filter(l => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);
    try {
      await api.delete(`/sales/leads/${leadId}`);
      showToast(`"${leadName}" deleted permanently`);
    } catch (err: any) {
      // Rollback by reloading
      const res = await api.get('/sales/leads').catch(() => null);
      if (res) setLeads(res.data?.data?.leads || []);
      showToast(err?.response?.data?.message || 'Failed to delete lead', 'error');
    }
  };

  // ── Quick Call/Email ──────────────────────────────────────────────────────────
  const handleQuickCall = (lead: Lead) => {
    if (lead.phone) window.open(`tel:${lead.phone}`);
  };

  const handleQuickEmail = (lead: Lead) => {
    if (lead.email) window.open(`mailto:${lead.email}`);
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedForBulk(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Stat Cards ────────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Hot Leads', value: stats.hot, icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Follow-up Due', value: stats.followupDue, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Converted', value: stats.converted, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Lost', value: stats.lost, icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leads Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} of {leads.length} leads · Last synced {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>

          {bulkMode ? (
            <>
              <button
                onClick={() => { setBulkMode(false); setSelectedForBulk(new Set()); }}
                className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
              >Cancel</button>
              <button
                onClick={() => { if (selectedForBulk.size) setIsSendMarketingOpen(true); }}
                disabled={!selectedForBulk.size}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Send {selectedForBulk.size > 0 ? `(${selectedForBulk.size})` : ''} to Marketing
              </button>
            </>
          ) : (
            <button
              onClick={() => setBulkMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold rounded-xl hover:bg-purple-100 transition"
            >
              <List className="w-3.5 h-3.5" /> Bulk Actions
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition">
            <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 leading-none">{card.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, phone, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
            {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition shrink-0 ${showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filter {priorityFilter && `· ${priorityFilter}`}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">Priority:</span>
            {['', 'Hot', 'Warm', 'Cold'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${priorityFilter === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {p || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {['All', 'Hot', 'Follow-up', 'Converted', 'Lost'].map(tab => {
          const counts: Record<string, number> = {
            All: leads.length, Hot: stats.hot, 'Follow-up': stats.followupDue,
            Converted: stats.converted, Lost: stats.lost
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                activeTab === tab ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'Hot' ? 'Hot 🔥' : tab}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {counts[tab] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* Leads List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No leads found in this view.</p>
              {(search || priorityFilter) && (
                <button onClick={() => { setSearch(''); setPriorityFilter(''); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-0.5">
              {filtered.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => !bulkMode && setSelectedLead(lead)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md group ${
                    selectedLead?.id === lead.id && !bulkMode
                      ? 'border-blue-500 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-4 flex items-center gap-3">
                    {/* Bulk checkbox */}
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedForBulk.has(lead.id)}
                        onChange={e => { e.stopPropagation(); toggleBulkSelect(lead.id); }}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-blue-600 shrink-0"
                      />
                    )}

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      lead.priority === 'Hot' ? 'from-red-500 to-orange-500' :
                      lead.priority === 'Warm' ? 'from-amber-500 to-yellow-400' :
                      'from-blue-400 to-indigo-500'
                    }`}>
                      {lead.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-800 truncate">{lead.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${PRIORITY_COLORS[lead.priority] || 'bg-slate-100 text-slate-600'}`}>
                          {priorityLabel(lead.priority)}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {lead.company || 'Private'} {lead.phone ? `· ${lead.phone}` : ''} {lead.email ? `· ${lead.email}` : ''}
                      </p>
                      {lead.next_followup && (
                        <p className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${
                          new Date(lead.next_followup) < new Date() ? 'text-red-500' : 'text-amber-600'
                        }`}>
                          <Clock className="w-2.5 h-2.5" /> Follow-up: {fmtDateTime(lead.next_followup)}
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-1 shrink-0">
                      {lead.conversion_probability != null && (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                          <span className="text-[10px] font-bold text-slate-400">Win %</span>
                          <span className={`text-sm font-extrabold ${(lead.conversion_probability || 0) >= 70 ? 'text-green-600' : (lead.conversion_probability || 0) >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                            {lead.conversion_probability}%
                          </span>
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleQuickCall(lead); }} disabled={!lead.phone}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-30" title="Call">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleQuickEmail(lead); }} disabled={!lead.email}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition disabled:opacity-30" title="Email">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSelectedLead(lead); setIsSendMarketingOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition" title="Send to Marketing">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setIsDeleteOpen(lead); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete Lead">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Source + date strip */}
                  <div className="px-4 pb-3 flex items-center gap-3">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{lead.source || 'Manual'}</span>
                    {lead.platform && lead.platform !== 'Direct' && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{lead.platform}</span>
                    )}
                    <span className="text-[9px] text-slate-400 ml-auto">Added {fmtDate(lead.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Insight Bar */}
          {!loading && leads.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-[11px] font-semibold text-blue-900">
                  {stats.hot > 0
                    ? `You have ${stats.hot} hot lead${stats.hot > 1 ? 's' : ''} — prioritise follow-ups today.`
                    : stats.followupDue > 0
                    ? `${stats.followupDue} follow-up${stats.followupDue > 1 ? 's' : ''} overdue. Take action now.`
                    : 'All caught up! Keep nurturing your pipeline.'
                  }
                </p>
              </div>
              <button onClick={() => router.push('/sales/tasks')} className="text-[10px] font-bold text-blue-600 hover:underline uppercase shrink-0">
                Tasks →
              </button>
            </div>
          )}
        </div>

        {/* ── Lead Detail Panel ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
          {selectedLead ? (
            <div className="flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 ${
                    selectedLead.priority === 'Hot' ? 'from-red-500 to-orange-500' :
                    selectedLead.priority === 'Warm' ? 'from-amber-500 to-yellow-400' :
                    'from-blue-400 to-indigo-500'
                  }`}>{selectedLead.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{selectedLead.name}</h4>
                    <p className="text-[10px] text-slate-500">{selectedLead.phone || selectedLead.email || 'No contact info'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-slate-200/60 rounded-xl transition text-slate-400 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions Row */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <button onClick={() => handleQuickCall(selectedLead)} disabled={!selectedLead.phone}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition disabled:opacity-40">
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
                <button onClick={() => handleQuickEmail(selectedLead)} disabled={!selectedLead.email}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition disabled:opacity-40">
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button onClick={() => setIsLogActivityOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition">
                  <Activity className="w-3.5 h-3.5" /> Log
                </button>
                <button onClick={() => setIsSendMarketingOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition">
                  <Send className="w-3.5 h-3.5" /> Market
                </button>
              </div>

              {/* Panel Tabs */}
              <div className="flex border-b border-slate-100 text-xs">
                {(['details', 'history', 'actions'] as const).map(t => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className={`flex-1 py-2.5 font-bold capitalize border-b-2 transition ${detailTab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {t === 'history' ? 'Timeline' : t === 'actions' ? 'More' : 'Details'}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4 text-xs">

                {detailTab === 'details' && (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Email', value: selectedLead.email || '—' },
                        { label: 'Company', value: selectedLead.company || '—' },
                        { label: 'Source', value: selectedLead.source || '—' },
                        { label: 'Platform', value: selectedLead.platform || 'Direct' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">{label}</span>
                          <span className="font-semibold text-slate-800 break-all">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Win probability */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex justify-between font-bold text-slate-500 mb-2">
                        <span>Win Probability (AI)</span>
                        <span className={`${(selectedLead.conversion_probability || 0) >= 70 ? 'text-green-600' : (selectedLead.conversion_probability || 0) >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                          {editProb}%
                        </span>
                      </div>
                      <input type="range" min={0} max={100} value={editProb}
                        onChange={e => setEditProb(Number(e.target.value))}
                        className="w-full accent-blue-600" />
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${editProb >= 70 ? 'bg-green-500' : editProb >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${editProb}%` }} />
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <p className="font-bold text-slate-700">Update Lead</p>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500">
                            {['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'].map(st => (
                              <option key={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                          <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500">
                            {['Hot', 'Warm', 'Cold'].map(pr => <option key={pr}>{pr}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Next Follow-up</label>
                        <input type="datetime-local" value={editFollowup} onChange={e => setEditFollowup(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500" />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                        <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                          placeholder="Log discussion notes..."
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                      </div>

                      <button onClick={handleUpdateLead} disabled={saveLoading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                        {saveLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {detailTab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-700">Activity Timeline</p>
                      <button onClick={() => setIsLogActivityOpen(true)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Log
                      </button>
                    </div>
                    {activities.length === 0 ? (
                      <div className="py-8 text-center">
                        <Activity className="w-6 h-6 text-slate-200 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400">No activities yet. Log a call, email or meeting.</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                        {activities.map((act, i) => (
                          <div key={i} className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100" />
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                              <span>{act.type}</span>
                              <span>{fmtDateTime(act.created_at)}</span>
                            </div>
                            {act.outcome && <p className="font-bold text-slate-800">Outcome: {act.outcome}</p>}
                            {act.notes && <p className="text-slate-500 mt-0.5 leading-snug">{act.notes}</p>}
                            {act.duration_seconds ? <p className="text-slate-400 mt-0.5">{Math.round(act.duration_seconds / 60)} min</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'actions' && (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-700">More Actions</p>
                    <div className="space-y-2">
                      <button onClick={() => setIsLogActivityOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Log Activity</p>
                          <p className="text-[10px] text-slate-400">Record a call, email or meeting</p>
                        </div>
                      </button>
                      <button onClick={() => setIsSendMarketingOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                          <Send className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Send to Marketing</p>
                          <p className="text-[10px] text-slate-400">Add to email list &amp; automation</p>
                        </div>
                      </button>
                      <button onClick={() => router.push('/marketing/campaigns/email')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                        <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Send Email Campaign</p>
                          <p className="text-[10px] text-slate-400">Target this lead with a campaign</p>
                        </div>
                      </button>
                      <button onClick={() => router.push(`/sales/tasks`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Create Task</p>
                          <p className="text-[10px] text-slate-400">Schedule a follow-up task</p>
                        </div>
                      </button>
                      <button onClick={() => setIsDeleteOpen(selectedLead)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-100 hover:bg-red-50 transition text-left">
                        <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-bold text-red-600">Delete Lead</p>
                          <p className="text-[10px] text-slate-400">Permanently remove this lead</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center min-h-[40vh]">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Select a lead to view details, log activity, and send to marketing automation.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom KPI Panels ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Priority Leads</h4>
          </div>
          {leads.filter(l => l.priority === 'Hot').slice(0, 3).length === 0 ? (
            <p className="text-[11px] text-slate-400">No hot leads right now.</p>
          ) : (
            <div className="space-y-2">
              {leads.filter(l => l.priority === 'Hot').slice(0, 3).map(l => (
                <div key={l.id} onClick={() => setSelectedLead(l)} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{l.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{l.name}</p>
                    <p className="text-[9px] text-slate-400">{l.company || 'Private'}</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-green-600">{l.conversion_probability || 0}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pipeline Summary</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Total Leads', value: stats.total, color: 'text-slate-800' },
              { label: 'Converted', value: stats.converted, color: 'text-green-600' },
              { label: 'Lost', value: stats.lost, color: 'text-slate-400' },
              { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-blue-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                <span className="font-semibold text-slate-500">{row.label}</span>
                <span className={`font-extrabold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-purple-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Marketing Lists</h4>
          </div>
          {contactLists.length === 0 ? (
            <p className="text-[11px] text-slate-400">No marketing lists yet. Send leads to create one.</p>
          ) : (
            <div className="space-y-2">
              {contactLists.slice(0, 3).map(list => (
                <div key={list.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">{list.name}</span>
                  <span className="font-extrabold text-purple-600 shrink-0 ml-2">{list.contact_count} contacts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* ── Add Lead Modal ── */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Create New Lead</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lead will be assigned to you automatically</p>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                    <input required type="text" placeholder="Rahul Sharma" value={newLead.name}
                      onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</label>
                    <input type="text" placeholder="+91 98765 43210" value={newLead.phone}
                      onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input type="email" placeholder="rahul@company.com" value={newLead.email}
                      onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company</label>
                    <input type="text" placeholder="Company name" value={newLead.company}
                      onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Source</label>
                    <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Manual', 'Facebook', 'Google', 'Instagram', 'LinkedIn', 'Website', 'Referral', 'WhatsApp'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <select value={newLead.priority} onChange={e => setNewLead({ ...newLead, priority: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Hot', 'Warm', 'Cold'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                  <textarea rows={3} placeholder="Initial discussion, requirements, budget..." value={newLead.notes}
                    onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                </div>
                <button type="submit" disabled={addLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-blue-500/20">
                  {addLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Log Activity Modal ── */}
      <AnimatePresence>
        {isLogActivityOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsLogActivityOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Log Activity</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">For: {selectedLead.name}</p>
                </div>
                <button onClick={() => setIsLogActivityOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleLogActivity} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activity Type</label>
                    <select value={actForm.type} onChange={e => setActForm({ ...actForm, type: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call', 'Email', 'Meeting', 'WhatsApp', 'Demo', 'Follow-up'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outcome</label>
                    <select value={actForm.outcome} onChange={e => setActForm({ ...actForm, outcome: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Connected', 'No Answer', 'Interested', 'Not Interested', 'Callback Requested', 'Converted', 'Voicemail'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration (minutes)</label>
                  <input type="number" min={0} placeholder="0" value={actForm.duration_seconds ? actForm.duration_seconds / 60 : ''}
                    onChange={e => setActForm({ ...actForm, duration_seconds: Number(e.target.value) * 60 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                  <textarea rows={3} required placeholder="What was discussed?" value={actForm.notes}
                    onChange={e => setActForm({ ...actForm, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                </div>
                <button type="submit" disabled={actLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {actLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
                  Log Activity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Send to Marketing Modal ── */}
      <AnimatePresence>
        {isSendMarketingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSendMarketingOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Send to Marketing</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {bulkMode ? `${selectedForBulk.size} leads selected` : selectedLead ? `Lead: ${selectedLead.name}` : ''}
                  </p>
                </div>
                <button onClick={() => setIsSendMarketingOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSendToMarketing} className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                  <p className="font-semibold text-purple-800">
                    This will add the lead(s) to a marketing contact list so they can receive email campaigns and automation workflows.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!mktForm.createNew} onChange={() => setMktForm({ ...mktForm, createNew: false })} className="accent-purple-600" />
                      <span className="font-semibold text-slate-700">Add to existing list</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={mktForm.createNew} onChange={() => setMktForm({ ...mktForm, createNew: true })} className="accent-purple-600" />
                      <span className="font-semibold text-slate-700">Create new list</span>
                    </label>
                  </div>

                  {mktForm.createNew ? (
                    <input type="text" required placeholder="New list name (e.g. Hot Leads June)" value={mktForm.newListName}
                      onChange={e => setMktForm({ ...mktForm, newListName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-purple-500 font-semibold text-slate-800 transition" />
                  ) : (
                    <select required={!mktForm.createNew} value={mktForm.listId} onChange={e => setMktForm({ ...mktForm, listId: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-purple-500">
                      <option value="">— Select a list —</option>
                      {contactLists.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.contact_count} contacts)</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                  <p className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> After adding to list:
                  </p>
                  <p className="text-blue-700">• Go to <strong>Email Campaigns</strong> and select this list to send emails</p>
                  <p className="text-blue-700">• Or trigger an <strong>Automation Workflow</strong> using this list</p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsSendMarketingOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={mktLoading}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 text-xs">
                    {mktLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to Marketing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete ── */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteOpen(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl relative z-10 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Delete Lead?</h3>
              <p className="text-xs text-slate-500 mb-5">"{isDeleteOpen.name}" will be permanently deleted. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setIsDeleteOpen(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleDeleteLead} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
