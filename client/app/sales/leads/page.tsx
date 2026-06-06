'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Search, Filter, Plus, Phone, MessageSquare, Eye, Edit2, Mail, Calendar, MapPin, Tag, CheckSquare,
  Activity, X, Trash2, ArrowUpRight, TrendingUp, DollarSign, Award, ShieldAlert, Sparkles, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock fallback leads list
const MOCK_LEADS = [
  { id: '1', name: 'Arjun Mehta', email: 'arjun@example.com', phone: '+91 98765 43210', source: 'Facebook', campaign: 'Summer Sale', platform: 'Facebook', status: 'New', priority: 'Hot', company: 'Mehta Tech', notes: 'Interested in enterprise subscription.', next_followup: '2026-06-07T10:30:00Z', conversion_probability: 92, created_at: '2026-06-01' },
  { id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109', source: 'Google', campaign: 'Brand Awareness', platform: 'Google', status: 'Contacted', priority: 'Hot', company: 'Sharma Retail', notes: 'Scheduled demo for next Monday.', next_followup: '2026-06-08T11:45:00Z', conversion_probability: 88, created_at: '2026-06-01' },
  { id: '3', name: 'Rahul Singh', email: 'rahul@example.com', phone: '+91 76543 21098', source: 'Instagram', campaign: 'Insta Story', platform: 'Instagram', status: 'Interested', priority: 'Warm', company: 'Singh Agencies', notes: 'Sent quote. Waiting for response.', next_followup: '2026-06-09T14:30:00Z', conversion_probability: 65, created_at: '2026-05-31' },
  { id: '4', name: 'Kavitha Nair', email: 'kavitha@example.com', phone: '+91 65432 10987', source: 'Website', campaign: 'Retargeting', platform: 'Website', status: 'Lost', priority: 'Cold', company: 'Nair Exports', notes: 'Budget too low.', next_followup: null, conversion_probability: 15, created_at: '2026-05-31' },
  { id: '5', name: 'Priya Agarwal', email: 'priya.agarwal@gmail.com', phone: '+91 95432 09876', source: 'Facebook', campaign: 'Summer Sale', platform: 'Facebook', status: 'New', priority: 'Hot', company: 'Agarwal & Sons', notes: 'Fresh lead from ad.', next_followup: '2026-06-06T10:30:00Z', conversion_probability: 95, created_at: '2026-06-06' }
];

export default function LeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('All Leads'); // All Leads, Hot, Follow-up Due, Converted, Lost
  const [detailTab, setDetailTab] = useState<'details' | 'history'>('details');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // Add Lead Form State
  const [newLead, setNewLead] = useState({
    name: '', phone: '', email: '', company: '', source: 'Manual', priority: 'Warm', notes: ''
  });

  // Edit Lead State
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editFollowup, setEditFollowup] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/leads');
      setLeads(res.data.data.leads);
    } catch (err) {
      console.warn('Backend API leads offline, using mock data.');
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch activities when lead is selected
  useEffect(() => {
    if (!selectedLead) return;
    setEditNotes(selectedLead.notes || '');
    setEditStatus(selectedLead.status || 'New');
    setEditPriority(selectedLead.priority || 'Warm');
    setEditFollowup(selectedLead.next_followup ? new Date(selectedLead.next_followup).toISOString().slice(0, 16) : '');

    const fetchActivities = async () => {
      try {
        const res = await api.get(`/sales/leads/${selectedLead.id}/activity`);
        setActivities(res.data.data.activities);
      } catch {
        // Mock fallback activities
        setActivities([
          { id: '1', type: 'Call', outcome: 'Connected', notes: 'Talked to customer. Interested in product.', created_at: new Date() },
          { id: '2', type: 'Email', outcome: 'Interested', notes: 'Sent catalogue details.', created_at: new Date(Date.now() - 3600000) }
        ]);
      }
    };
    fetchActivities();
  }, [selectedLead]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/sales/leads', newLead);
      setLeads([res.data.data.lead, ...leads]);
      setIsAddModalOpen(false);
      setNewLead({ name: '', phone: '', email: '', company: '', source: 'Manual', priority: 'Warm', notes: '' });
    } catch (err) {
      // Offline fallback
      const mockNew = {
        id: String(Date.now()),
        ...newLead,
        platform: 'Direct',
        status: 'New',
        conversion_probability: 70,
        created_at: new Date().toISOString().slice(0, 10),
        next_followup: null
      };
      setLeads([mockNew, ...leads]);
      setIsAddModalOpen(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    const updatePayload = {
      notes: editNotes,
      status: editStatus,
      priority: editPriority,
      next_followup: editFollowup || null,
      conversion_probability: editPriority === 'Hot' ? 90 : (editPriority === 'Warm' ? 60 : 25)
    };

    try {
      const res = await api.patch(`/sales/leads/${selectedLead.id}`, updatePayload);
      setLeads(leads.map(l => l.id === selectedLead.id ? res.data.data.lead : l));
      setSelectedLead(res.data.data.lead);
      alert('Lead details updated successfully!');
    } catch {
      // Offline update
      const updated = {
        ...selectedLead,
        ...updatePayload
      };
      setLeads(leads.map(l => l.id === selectedLead.id ? updated : l));
      setSelectedLead(updated);
      alert('Lead details updated locally!');
    }
  };

  const filtered = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                          l.phone.includes(search) ||
                          (l.company && l.company.toLowerCase().includes(search.toLowerCase()));

    if (activeTab === 'Hot') return matchesSearch && l.priority === 'Hot';
    if (activeTab === 'Follow-up Due') return matchesSearch && l.next_followup;
    if (activeTab === 'Converted') return matchesSearch && l.status === 'Converted';
    if (activeTab === 'Lost') return matchesSearch && l.status === 'Lost';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leads Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total Assigned: {filtered.length} leads</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:w-56 focus-within:border-blue-500 transition">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-md shadow-blue-500/10">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {['All Leads', 'Hot', 'Follow-up Due', 'Converted', 'Lost'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab === 'Hot' ? 'Hot 🔥' : tab}
          </button>
        ))}
      </div>

      {/* Main Grid: Leads List & Detail slide panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400">No leads found in this view.</p>
            </div>
          ) : (
            filtered.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:shadow-md
                  ${selectedLead?.id === lead.id ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider
                        ${lead.priority === 'Hot' ? 'bg-red-100 text-red-700' : (lead.priority === 'Warm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}`}>
                        {lead.priority === 'Hot' ? 'Hot 🔥' : lead.priority}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider
                        ${lead.status === 'Converted' ? 'bg-green-100 text-green-700' : (lead.status === 'Lost' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600')}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{lead.company || 'Private Lead'} · {lead.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Last Contact</span>
                    <p className="text-[10px] font-semibold text-slate-700 mt-0.5">
                      {lead.created_at || 'Just Now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition" title="Call">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-green-600 transition" title="WhatsApp">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#2563EB] transition" title="View Details">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-[11px] font-bold text-blue-900">AI Insight: You have 3 high-value Hot leads overdue for follow-up today.</p>
            </div>
            <button onClick={() => router.push('/sales/tasks')} className="text-[10px] font-bold text-blue-600 hover:underline uppercase shrink-0">Check Tasks →</button>
          </div>
        </div>

        {/* Lead Detail Slide Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[50vh] flex flex-col">
          {selectedLead ? (
            <div className="flex-1 flex flex-col">
              {/* Slide Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Detail</h3>
                  <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">{selectedLead.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedLead.phone}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-slate-200/50 rounded-xl transition text-slate-400 hover:text-slate-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slider Tabs */}
              <div className="flex border-b border-slate-100 text-center text-xs">
                <button
                  onClick={() => setDetailTab('details')}
                  className={`flex-1 py-2.5 font-bold border-b-2 transition
                    ${detailTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Lead Details
                </button>
                <button
                  onClick={() => setDetailTab('history')}
                  className={`flex-1 py-2.5 font-bold border-b-2 transition
                    ${detailTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Activity History
                </button>
              </div>

              {/* Slider Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {detailTab === 'details' ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">Basic Info</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Email</span>
                          <span className="font-semibold text-slate-800 break-all">{selectedLead.email || 'Not Provided'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Company</span>
                          <span className="font-semibold text-slate-800">{selectedLead.company || 'Not Provided'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Source</span>
                          <span className="font-semibold text-slate-800">{selectedLead.source}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Platform</span>
                          <span className="font-semibold text-slate-800">{selectedLead.platform || 'Direct'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form Fields */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <p className="font-bold text-slate-800">Lead Status & Priority</p>
                      
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                        >
                          {['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                        <select
                          value={editPriority}
                          onChange={e => setEditPriority(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                        >
                          {['Hot', 'Warm', 'Cold'].map(pr => (
                            <option key={pr} value={pr}>{pr}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Next Followup Date</label>
                        <input
                          type="datetime-local"
                          value={editFollowup}
                          onChange={e => setEditFollowup(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Notes</label>
                        <textarea
                          rows={3}
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="Log notes about lead discussion..."
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-slate-700"
                        />
                      </div>

                      <button
                        onClick={handleUpdateLead}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
                      >
                        Save Changes
                      </button>
                    </div>

                    {/* Win probability bar */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                        <span>Win Probability (AI)</span>
                        <span>{selectedLead.conversion_probability || 50}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedLead.conversion_probability || 50}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">Timeline Activity</p>
                    <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                      {activities.map((act, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100" />
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                              <span>{act.type} logged</span>
                              <span>{new Date(act.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="font-bold text-slate-800 mt-0.5">Outcome: {act.outcome || 'Logged'}</p>
                            <p className="text-slate-500 mt-1 leading-snug">{act.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs">Select a lead from the list to view full timeline details, edit notes, schedule follow-ups, and update status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Leads Page Bottom Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4.5 h-4.5 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Priority Plan</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your daily target recommends contacting <strong>Priya Agarwal</strong> (95% win probability) and <strong>Arjun Mehta</strong> (92% win probability) first.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Converted Leads</span>
            <span className="font-extrabold text-green-600">12 Leads</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Lost Leads</span>
            <span className="font-extrabold text-slate-400">4 Leads</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Win Rate</span>
            <span className="font-extrabold text-blue-600">75%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">CPL Conversion</span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4.2%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-extrabold text-slate-800">₹8,520</span>
            <span className="text-[10px] text-slate-400">average CPL</span>
          </div>
          <button onClick={() => router.push('/sales/dashboard')} className="w-full mt-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition">
            View Analytics Report
          </button>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create Manual Lead</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={newLead.name}
                      onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={newLead.phone}
                      onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={newLead.email}
                      onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={newLead.company}
                      onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Source</label>
                    <select
                      value={newLead.source}
                      onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                    >
                      {['Manual', 'Facebook', 'Google', 'Website', 'LinkedIn', 'Instagram', 'Referral'].map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <select
                      value={newLead.priority}
                      onChange={e => setNewLead({ ...newLead, priority: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                    >
                      {['Hot', 'Warm', 'Cold'].map(pr => (
                        <option key={pr} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter discussion notes or requirement specifications..."
                    value={newLead.notes}
                    onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-slate-500">
                  <span>Note: This lead will be automatically assigned to you.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/10"
                >
                  Save Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
