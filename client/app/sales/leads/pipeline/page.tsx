'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, Plus, Phone, Mail, Send, Sparkles, RefreshCw, BadgeCheck, AlertTriangle, X, Users, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

const COLUMNS = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'] as const;

const COL_STYLES: Record<string, { header: string; dot: string; bg: string }> = {
  New: { header: 'text-blue-700 bg-blue-50 border-blue-100', dot: 'bg-blue-500', bg: 'bg-blue-50/40' },
  Contacted: { header: 'text-purple-700 bg-purple-50 border-purple-100', dot: 'bg-purple-500', bg: 'bg-purple-50/30' },
  Interested: { header: 'text-amber-700 bg-amber-50 border-amber-100', dot: 'bg-amber-500', bg: 'bg-amber-50/30' },
  'Not Interested': { header: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400', bg: 'bg-slate-50/30' },
  Converted: { header: 'text-green-700 bg-green-50 border-green-100', dot: 'bg-green-500', bg: 'bg-green-50/40' },
  Lost: { header: 'text-red-600 bg-red-50 border-red-100', dot: 'bg-red-400', bg: 'bg-red-50/20' },
};

const PRIORITY_COLORS: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700',
  Warm: 'bg-orange-100 text-orange-700',
  Cold: 'bg-sky-100 text-sky-700',
};

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [isSendMarketingOpen, setIsSendMarketingOpen] = useState(false);
  const [mktLoading, setMktLoading] = useState(false);
  const [mktForm, setMktForm] = useState({ createNew: false, listId: '', newListName: '' });
  const [selectedLeadsForMkt, setSelectedLeadsForMkt] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('/sales/leads');
      setLeads(res.data.data.leads || []);
    } catch {
      showToast('Could not load leads', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchContactLists = useCallback(async () => {
    try {
      const res = await api.get('/marketing/lists');
      const d = res.data.data;
      setContactLists(Array.isArray(d) ? d : d?.lists ?? []);
    } catch {
      setContactLists([]);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchContactLists();
  }, [fetchLeads, fetchContactLists]);

  const handleSendToMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    setMktLoading(true);
    if (!selectedLeadsForMkt.length) {
      showToast('No leads selected', 'error');
      setMktLoading(false);
      return;
    }

    try {
      await api.post('/marketing/contacts/import', {
        listId: mktForm.createNew ? undefined : mktForm.listId || undefined,
        createList: mktForm.createNew,
        listName: mktForm.createNew ? mktForm.newListName : undefined,
        contacts: selectedLeadsForMkt.map(l => ({
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          source: l.source
        }))
      });
      setIsSendMarketingOpen(false);
      showToast(`${selectedLeadsForMkt.length} leads sent to Marketing!`);
      setSelectedLeadsForMkt([]);
      setMktForm({ createNew: false, listId: '', newListName: '' });
      fetchContactLists();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send leads', 'error');
    } finally {
      setMktLoading(false);
    }
  };

  const moveLead = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await api.patch(`/sales/leads/${leadId}`, { status: newStatus });
      showToast(`Moved to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
      fetchLeads(true);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (draggedId) {
      moveLead(draggedId, col);
      setDraggedId(null);
    }
  };

  const stats = {
    total: leads.length,
    converted: leads.filter(l => l.status === 'Converted').length,
    hot: leads.filter(l => l.priority === 'Hot').length,
    winRate: leads.length ? Math.round((leads.filter(l => l.status === 'Converted').length / leads.length) * 100) : 0,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/sales/leads')} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Pipeline Kanban</h2>
            <p className="text-xs text-slate-500 mt-0.5">Drag cards between columns or use the status dropdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchLeads(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => router.push('/sales/leads')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hot Leads', value: stats.hot, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Converted', value: stats.converted, icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map(col => {
            const colLeads = leads.filter(l => l.status === col);
            const styles = COL_STYLES[col];
            return (
              <div key={col}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col)}
                className={`w-56 flex flex-col rounded-2xl border border-slate-200 shadow-sm bg-white min-h-[60vh] transition ${draggedId ? 'border-dashed' : ''}`}>

                 {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-2xl border-b ${styles.header}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${styles.dot} shrink-0`} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wide truncate">{col}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                     {colLeads.length > 0 && (
                       <button onClick={() => { setSelectedLeadsForMkt(colLeads); setIsSendMarketingOpen(true); }}
                         title="Send Stage to Marketing"
                         className="p-0.5 hover:bg-white/40 rounded transition text-inherit">
                         <Send className="w-3 h-3" />
                       </button>
                     )}
                     <span className="text-[10px] font-bold bg-white/60 px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                   </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {colLeads.length === 0 && (
                    <div className="h-20 flex items-center justify-center">
                      <p className="text-[10px] text-slate-300 text-center">Drop leads here</p>
                    </div>
                  )}
                  {colLeads.map(lead => (
                    <motion.div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e as any, lead.id)}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white border rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-2 hover:shadow-md transition
                        ${draggedId === lead.id ? 'opacity-40 scale-95' : 'border-slate-200 hover:border-slate-300'}`}>

                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0
                            ${lead.priority === 'Hot' ? 'bg-gradient-to-br from-red-500 to-orange-400' : lead.priority === 'Warm' ? 'bg-gradient-to-br from-amber-400 to-yellow-400' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                            {(lead.name || 'L').charAt(0)}
                          </div>
                          <p className="text-[11px] font-bold text-slate-800 truncate">{lead.name}</p>
                        </div>
                        <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full uppercase shrink-0 ${PRIORITY_COLORS[lead.priority] || 'bg-slate-100 text-slate-500'}`}>
                          {lead.priority}
                        </span>
                      </div>

                      {lead.company && <p className="text-[10px] text-slate-400 font-medium truncate">{lead.company}</p>}

                      {lead.conversion_probability != null && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${(lead.conversion_probability || 0) >= 70 ? 'bg-green-500' : (lead.conversion_probability || 0) >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${lead.conversion_probability || 0}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 shrink-0">{lead.conversion_probability}%</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <div className="flex gap-1">
                          <button onClick={() => { if (lead.phone) window.open(`tel:${lead.phone}`); }}
                            disabled={!lead.phone} title="Call"
                            className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition disabled:opacity-30">
                            <Phone className="w-3 h-3" />
                          </button>
                          <button onClick={() => { if (lead.email) window.open(`mailto:${lead.email}`); }}
                            disabled={!lead.email} title="Email"
                            className="p-1 rounded hover:bg-green-50 text-slate-400 hover:text-green-600 transition disabled:opacity-30">
                            <Mail className="w-3 h-3" />
                          </button>
                          <button onClick={() => { setSelectedLeadsForMkt([lead]); setIsSendMarketingOpen(true); }}
                            title="Send to Marketing"
                            className="p-1 rounded hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition">
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                        <select value={lead.status} onChange={e => moveLead(lead.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="text-[8px] font-bold text-slate-600 border border-slate-200 rounded-lg px-1 py-0.5 cursor-pointer outline-none bg-slate-50 hover:border-blue-400 transition">
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] font-semibold text-amber-900">
            AI Pipeline Insight: Leads in <strong>Interested</strong> stage have the highest conversion probability. Set follow-up tasks immediately to advance them to Converted.
          </p>
        </div>
        <button onClick={() => router.push('/sales/tasks')} className="text-[10px] font-bold text-amber-700 hover:underline shrink-0 uppercase whitespace-nowrap">
          Add Tasks →
        </button>
      </div>

      {/* ── Send to Marketing Modal ── */}
      <AnimatePresence>
        {isSendMarketingOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSendMarketingOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative z-[10000]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Send to Marketing</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {selectedLeadsForMkt.length} lead(s) selected
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
                    <input type="text" placeholder="Enter list name..." required value={mktForm.newListName} onChange={e => setMktForm({ ...mktForm, newListName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-purple-500" />
                  ) : (
                    <select required value={mktForm.listId} onChange={e => setMktForm({ ...mktForm, listId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-purple-500">
                      <option value="">— Select a list —</option>
                      {contactLists.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.contact_count} contacts)</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                  <p className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> After adding to list:
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
    </div>
  );
}
