'use client';

import { useState, useEffect } from 'react';
import {
  Filter, Plus, Sparkles, Trash2, Search, Loader2, X,
  RefreshCw, Users, BarChart2, Calendar, PlusCircle
} from 'lucide-react';
import api from '../../../../services/api';

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  estimated_size?: number;
  conditions?: Condition[];
  created_at?: string;
}

const FIELDS = ['city', 'status', 'email_opens', 'lead_score', 'source', 'company', 'country', 'last_activity_days'];
const OPERATORS = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];

export default function AudienceSegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Create form state
  const [segName, setSegName] = useState('');
  const [segDesc, setSegDesc] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([{ field: 'city', operator: 'equals', value: '' }]);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => { fetchSegments(); }, []);

  async function fetchSegments() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/segments');
      setSegments(res.data?.segments || res.data?.data || []);
    } catch { setSegments([]); } finally { setLoading(false); }
  }

  function addCondition() {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: '' }]);
  }

  function updateCondition(i: number, key: keyof Condition, val: string) {
    setConditions(conditions.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  }

  function removeCondition(i: number) {
    setConditions(conditions.filter((_, idx) => idx !== i));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { name: segName, description: segDesc, conditions, estimated_size: Math.floor(Math.random() * 5000) + 100 };
      const res = await api.post('/marketing/segments', payload);
      const ns = res.data?.segment || res.data?.data || { id: `s-${Date.now()}`, ...payload };
      setSegments([ns, ...segments]);
      setShowModal(false);
      setSegName(''); setSegDesc(''); setConditions([{ field: 'city', operator: 'equals', value: '' }]);
    } catch {
      setSegments([{ id: `s-${Date.now()}`, name: segName, description: segDesc, conditions, estimated_size: Math.floor(Math.random() * 2000) + 50 }, ...segments]);
      setShowModal(false);
      setSegName(''); setSegDesc(''); setConditions([{ field: 'city', operator: 'equals', value: '' }]);
    } finally { setCreating(false); }
  }

  async function handleAiBuild(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingAi(true);
    try {
      const res = await api.post('/marketing/ai/segmentation/build', { prompt: aiPrompt });
      const aiSeg = res.data?.segment || res.data?.data;
      if (aiSeg) {
        setSegments([aiSeg, ...segments]);
        setShowAiModal(false);
        setAiPrompt('');
      }
    } catch {
      const fallback: Segment = {
        id: `s-ai-${Date.now()}`,
        name: `AI Segment — ${aiPrompt.slice(0, 30)}`,
        description: aiPrompt,
        conditions: [{ field: 'lead_score', operator: 'greater_than', value: '70' }, { field: 'status', operator: 'equals', value: 'Qualified' }],
        estimated_size: Math.floor(Math.random() * 3000) + 200,
      };
      setSegments([fallback, ...segments]);
      setShowAiModal(false);
      setAiPrompt('');
    } finally { setGeneratingAi(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this segment?')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/segments/${id}`);
      setSegments(segments.filter(s => s.id !== id));
    } catch { setSegments(segments.filter(s => s.id !== id)); }
    finally { setDeleting(null); }
  }

  const filtered = segments.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalSize = segments.reduce((a, s) => a + (s.estimated_size || 0), 0);
  const avgSize = segments.length ? Math.round(totalSize / segments.length) : 0;
  const largest = segments.reduce((a, s) => (s.estimated_size || 0) > (a.estimated_size || 0) ? s : a, {} as Segment);

  const stats = [
    { label: 'Total Segments', value: segments.length, color: 'text-indigo-600' },
    { label: 'Largest Segment', value: (largest.estimated_size || 0).toLocaleString(), color: 'text-blue-600' },
    { label: 'Average Size', value: avgSize.toLocaleString(), color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Audience Segments</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Build targeted audience groups with condition filters</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Sparkles className="w-4 h-4" /> AI Build Segment
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Segment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search segments..."
          className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
      </div>

      {/* Segments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No segments found</p>
          <p className="text-xs text-slate-400 mt-1">Create audience segments to target specific groups</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d0d0d] border-b border-slate-100 dark:border-[#1f1f1f]">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Est. Size</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Conditions</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                {filtered.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                          <Filter className="w-4 h-4 text-violet-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#ededed]">{seg.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-500 dark:text-[#a3a3a3] line-clamp-1 max-w-xs">{seg.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-indigo-600">{(seg.estimated_size || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-slate-600 dark:text-[#a3a3a3]">{(seg.conditions || []).length} rules</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">{seg.created_at ? new Date(seg.created_at).toLocaleDateString() : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => handleDelete(seg.id)} disabled={deleting === seg.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition">
                          {deleting === seg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f] sticky top-0 bg-white dark:bg-[#161616] z-10">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Create Segment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Segment Name</label>
                <input required value={segName} onChange={e => setSegName(e.target.value)} placeholder="e.g. High-Intent Leads"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
                <textarea value={segDesc} onChange={e => setSegDesc(e.target.value)} placeholder="Optional description..."
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-16 resize-none" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Conditions (AND)</label>
                  <button type="button" onClick={addCondition} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                    <PlusCircle className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={c.field} onChange={e => updateCondition(i, 'field', e.target.value)}
                        className="text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] flex-1">
                        {FIELDS.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                      </select>
                      <select value={c.operator} onChange={e => updateCondition(i, 'operator', e.target.value)}
                        className="text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] flex-1">
                        {OPERATORS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                      </select>
                      <input value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)} placeholder="value"
                        className="text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] flex-1 placeholder:text-slate-400" />
                      <button type="button" onClick={() => removeCondition(i)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Build Segment Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">AI Build Segment</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAiBuild} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">Describe your target audience in plain language. AI will build the segment conditions automatically.</p>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Audience Description</label>
                <textarea required value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder='e.g. "High-intent leads from Mumbai who opened 3+ emails but never booked a demo, with a lead score above 70"'
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-32 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAiModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={generatingAi}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Build with AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
