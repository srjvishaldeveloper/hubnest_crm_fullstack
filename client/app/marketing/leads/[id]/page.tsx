'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, Mail, MapPin, Plus, ChevronLeft,
  Loader2, AlertTriangle, Sparkles, CheckCircle2,
} from 'lucide-react';
import api from '../../../../services/api';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  platform?: string;
  campaign?: string;
  campaign_name?: string;
  status: string;
  quality?: number;
  quality_score?: number;
  created_at?: string;
  city?: string;
  device?: string;
  ad_group?: string;
  creative?: string;
}

const STATUS_COLORS: Record<string, string> = {
  New:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  new:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Qualified:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  qualified:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Converted:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  converted:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Follow-up':    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Not Interested':'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Spam:           'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function MarketingLeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [notes, setNotes] = useState<{ id: number; text: string; date: string; author: string }[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    async function fetchLead() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/marketing/leads/${id}`);
        const data = res.data?.data || res.data;
        setLead(data);
      } catch {
        // Fallback: fetch list and find by id
        try {
          const listRes = await api.get('/marketing/leads');
          const list: Lead[] = listRes.data?.data || listRes.data?.leads || listRes.data || [];
          const found = list.find((l) => String(l.id) === String(id));
          if (found) {
            setLead(found);
          } else {
            setError('Lead not found. It may have been deleted.');
          }
        } catch {
          setError('Failed to load lead details.');
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLead();
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!lead) return;
    setUpdating(true);
    try {
      await api.patch(`/marketing/leads/${lead.id}`, { status: newStatus });
      setLead((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      // Show inline error
    } finally {
      setUpdating(false);
    }
  }

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes((prev) => [
      { id: Date.now(), text: newNote, date: 'Just now', author: 'Marketing User' },
      ...prev,
    ]);
    setNewNote('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading lead...</span>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-[#ededed]">{error || 'Lead not found'}</p>
        <Link
          href="/marketing/leads"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </div>
    );
  }

  const quality = lead.quality ?? lead.quality_score ?? 0;
  const qualityLabel = quality >= 80 ? 'High Quality'
    : quality >= 60 ? 'Medium Quality'
    : quality >= 30 ? 'Low Quality'
    : 'Spam Risk';
  const qualityColor = quality >= 80
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    : quality >= 60
    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    : quality >= 30
    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';

  const initials = lead.name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '??';

  const lifecycleSteps = [
    { step: 'New',       desc: `Lead captured from ${lead.source || lead.platform || 'unknown source'}.` },
    { step: 'Assigned',  desc: 'Assigned to marketing queue.' },
    { step: 'Contacted', desc: 'Awaiting first call dispatch.'  },
    { step: 'Converted', desc: 'Pending deal closure.'         },
  ];
  const currentStepIdx = ['New', 'new'].includes(lead.status) ? 0
    : ['Qualified', 'qualified', 'Assigned', 'assigned'].includes(lead.status) ? 1
    : ['Follow-up', 'follow-up', 'Contacted'].includes(lead.status) ? 2
    : ['Converted', 'converted'].includes(lead.status) ? 3
    : 0;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link
          href="/marketing/leads"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          <Link href="/marketing/leads" className="hover:underline">Leads</Link>
          <span className="mx-1">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">{lead.name}</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-extrabold text-base shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">{lead.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${qualityColor}`}>
                {qualityLabel}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide capitalize ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lead ID: #{lead.id} • Created {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={lead.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#161616] text-xs font-semibold text-slate-700 dark:text-[#ededed] outline-none"
          >
            {['New', 'Qualified', 'Follow-up', 'Converted', 'Not Interested', 'Spam'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => updateStatus('Converted')}
            disabled={updating || lead.status === 'Converted'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Assign to Sales
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details + notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact details */}
          <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {lead.phone || '—'}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {lead.city || 'India'}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                Quality Score: {quality}
              </div>
            </div>
          </div>

          {/* Marketing attribution */}
          <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Marketing Attribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Campaign</span>
                <span className="text-xs font-bold text-slate-700 dark:text-[#ededed]">{lead.campaign_name || lead.campaign || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Source / Platform</span>
                <span className="text-xs font-bold text-slate-700 dark:text-[#ededed]">{lead.source || lead.platform || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Ad Group</span>
                <span className="text-xs font-bold text-slate-700 dark:text-[#ededed]">{lead.ad_group || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Creative</span>
                <span className="text-xs font-bold text-slate-700 dark:text-[#ededed]">{lead.creative || '—'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Notes & Comments</h3>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111] text-slate-700 dark:text-[#ededed] outline-none focus:border-indigo-500 transition font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No notes yet. Add the first note above.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#1f1f1f] rounded-xl space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">{n.text}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500">
                      <span>By {n.author}</span>
                      <span>{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — lifecycle + AI */}
        <div className="space-y-6">
          {/* Lead Lifecycle */}
          <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Lead Lifecycle</h3>
            <div className="space-y-4 pt-2">
              {lifecycleSteps.map((s, idx) => {
                const done = idx <= currentStepIdx;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${
                        done
                          ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < lifecycleSteps.length - 1 && (
                        <div className={`w-0.5 h-10 ${done ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#ededed] leading-tight">{s.step}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-5 rounded-2xl border border-violet-200/50 dark:border-violet-900/30 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <h3 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">AI Recommendation</h3>
            </div>
            <p className="text-[11px] text-violet-700 dark:text-violet-400 leading-relaxed">
              {quality >= 80
                ? 'High-quality lead. Priority follow-up within 1 hour increases conversion by 7×.'
                : quality >= 60
                ? 'Medium-quality lead. Send a personalized email within 24h to improve engagement.'
                : 'Low-quality lead. Consider a re-qualification campaign before assigning.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
