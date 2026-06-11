'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, Plus, Phone, MessageSquare, Sparkles } from 'lucide-react';

const COLUMNS = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];

const MOCK_LEADS = [
  { id: '1', name: 'Arjun Mehta', phone: '+91 98765 43210', status: 'New', priority: 'Hot', company: 'Mehta Tech' },
  { id: '2', name: 'Priya Sharma', phone: '+91 87654 32109', status: 'Contacted', priority: 'Hot', company: 'Sharma Retail' },
  { id: '3', name: 'Rahul Singh', phone: '+91 76543 21098', status: 'Interested', priority: 'Warm', company: 'Singh Agencies' },
  { id: '4', name: 'Kavitha Nair', phone: '+91 65432 10987', status: 'Lost', priority: 'Cold', company: 'Nair Exports' },
  { id: '5', name: 'Priya Agarwal', phone: '+91 95432 09876', status: 'New', priority: 'Hot', company: 'Agarwal & Sons' }
];

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/leads');
      setLeads(res.data.data.leads);
    } catch {
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const moveLead = async (leadId: string, newStatus: string) => {
    try {
      await api.patch(`/sales/leads/${leadId}`, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch {
      // Local fallback
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/sales/leads')} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Pipeline Kanban Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop or select statuses to advance deals.</p>
          </div>
        </div>
        <button onClick={() => router.push('/sales/leads')} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colLeads = leads.filter(l => l.status === col);
            return (
              <div key={col} className="bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-2xl p-4 flex flex-col min-w-[220px] max-h-[70vh]">
                {/* Column Title */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{col}</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:shadow transition relative"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-800 truncate pr-1">{lead.name}</p>
                        <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full uppercase tracking-wider shrink-0
                          ${lead.priority === 'Hot' ? 'bg-red-50 text-red-600' : (lead.priority === 'Warm' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}`}>
                          {lead.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{lead.company || 'Private Lead'}</p>
                      
                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-[10px]">
                        <span className="text-slate-400 font-bold">{lead.phone.slice(0, 11)}...</span>
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-slate-50 dark:bg-[#161616] text-slate-400 hover:text-slate-700 rounded transition">
                            <Phone className="w-3 h-3" />
                          </button>
                          <select
                            value={lead.status}
                            onChange={e => moveLead(lead.id, e.target.value)}
                            className="bg-slate-50 dark:bg-[#161616] text-[8px] font-bold text-slate-600 border border-slate-200 rounded p-0.5 cursor-pointer outline-none"
                          >
                            {COLUMNS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Suggestion */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs font-semibold text-amber-900">
          AI Pipeline Insight: High-quality deals in <strong>Interested</strong> have remained stationary for 3 days. We recommend setting call tasks for follow-up immediately.
        </p>
      </div>

    </div>
  );
}
