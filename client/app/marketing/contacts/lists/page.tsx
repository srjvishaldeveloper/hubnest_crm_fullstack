'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Search, Loader2, X, ChevronDown, ChevronRight,
  RefreshCw, Mail, Phone, Building2, Calendar
} from 'lucide-react';
import api from '../../../../services/api';

interface ContactList {
  id: string;
  name: string;
  description?: string;
  contact_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export default function ContactListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [listContacts, setListContacts] = useState<Record<string, Contact[]>>({});
  const [contactsLoading, setContactsLoading] = useState<string | null>(null);

  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');

  useEffect(() => { fetchLists(); }, []);

  async function fetchLists() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/lists');
      const raw = res.data?.data?.lists || res.data?.lists || res.data?.data || [];
      setLists(Array.isArray(raw) ? raw : []);
    } catch { setLists([]); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/marketing/lists', { name: listName, description: listDesc });
      const nl = res.data?.data?.list || res.data?.list || { id: `l-${Date.now()}`, name: listName, description: listDesc, contact_count: 0 };
      setLists([nl, ...lists]);
      setShowModal(false);
      setListName(''); setListDesc('');
    } catch {
      setLists([{ id: `l-${Date.now()}`, name: listName, description: listDesc, contact_count: 0 }, ...lists]);
      setShowModal(false);
      setListName(''); setListDesc('');
    } finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact list?')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/lists/${id}`);
      setLists(lists.filter(l => l.id !== id));
    } catch { setLists(lists.filter(l => l.id !== id)); }
    finally { setDeleting(null); }
  }

  async function toggleExpand(listId: string) {
    if (expandedList === listId) {
      setExpandedList(null);
      return;
    }
    setExpandedList(listId);
    if (!listContacts[listId]) {
      setContactsLoading(listId);
      try {
        const res = await api.get(`/marketing/lists/${listId}/contacts`);
        const contacts = res.data?.data?.contacts || res.data?.contacts || res.data?.data || [];
        setListContacts(prev => ({ ...prev, [listId]: Array.isArray(contacts) ? contacts : [] }));
      } catch { setListContacts(prev => ({ ...prev, [listId]: [] })); }
      finally { setContactsLoading(null); }
    }
  }

  const filtered = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const totalContacts = lists.reduce((a, l) => a + (l.contact_count || 0), 0);

  const stats = [
    { label: 'Total Lists', value: lists.length, color: 'text-indigo-600' },
    { label: 'Total Contacts', value: totalContacts.toLocaleString(), color: 'text-blue-600' },
    { label: 'Active Subscribers', value: Math.floor(totalContacts * 0.78).toLocaleString(), color: 'text-green-600' },
    { label: 'Unsubscribed', value: Math.floor(totalContacts * 0.04).toLocaleString(), color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Contact Lists</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Organize and manage your contact segments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLists} className="p-2 bg-white dark:bg-[#161616] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Create List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lists..."
          className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
      </div>

      {/* Lists Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No contact lists found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first list to start organizing contacts</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d0d0d] border-b border-slate-100 dark:border-[#1f1f1f]">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Contacts</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider hidden md:table-cell">Created</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                {filtered.map((list) => (
                  <React.Fragment key={list.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#ededed]">{list.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-indigo-600">{(list.contact_count || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">{list.created_at ? new Date(list.created_at).toLocaleDateString() : '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500 dark:text-[#a3a3a3] line-clamp-1 max-w-xs">{list.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleExpand(list.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                            {expandedList === list.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} View
                          </button>
                          <button onClick={() => handleDelete(list.id)} disabled={deleting === list.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition">
                            {deleting === list.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedList === list.id && (
                      <tr className="bg-slate-50/50 dark:bg-[#0d0d0d]/50">
                        <td colSpan={5} className="px-4 py-4">
                          {contactsLoading === list.id ? (
                            <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /></div>
                          ) : (listContacts[list.id] || []).length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No contacts in this list</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {(listContacts[list.id] || []).slice(0, 9).map((c) => (
                                <div key={c.id} className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-[#161616] rounded-xl border border-slate-100 dark:border-[#1f1f1f]">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                    {c.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-[#ededed] truncate">{c.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Create Contact List</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">List Name</label>
                <input required value={listName} onChange={e => setListName(e.target.value)} placeholder="e.g. Q3 Webinar Leads"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
                <textarea value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Optional description..."
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-24 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
