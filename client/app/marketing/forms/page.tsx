'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Plus, Sparkles, Trash2, Edit2, Code, Eye, Loader2,
  CheckCircle, X, BarChart2, Clock, ToggleLeft, ToggleRight, Search,
  Link2, Check
} from 'lucide-react';
import api from '../../../services/api';

const FORM_TYPES = ['Lead Capture', 'Survey', 'Registration', 'Newsletter', 'Contact'];

const typeBadgeColor: Record<string, string> = {
  'Lead Capture': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Survey': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Registration': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Newsletter': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Contact': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

interface Form {
  id: string;
  name: string;
  type: string;
  description?: string;
  submission_count?: number;
  last_submission?: string;
  is_embedded?: boolean;
  completion_rate?: number;
}

interface Submission {
  id: string;
  submitted_at: string;
  data: Record<string, any>;
}

export default function FormBuilderPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submissionsPanel, setSubmissionsPanel] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Lead Capture');
  const [formDesc, setFormDesc] = useState('');
  const [aiToggle, setAiToggle] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function closeCreateModal() {
    setShowCreateModal(false);
    setFormName('');
    setFormType('Lead Capture');
    setFormDesc('');
    setAiPrompt('');
    setAiToggle(false);
    setCreateError('');
  }

  function handleCopyLink(formId: string) {
    const url = `${window.location.origin}/public/form/${formId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(formId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  useEffect(() => { fetchForms(); }, []);

  async function fetchForms() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/forms');
      const data = res.data?.forms || res.data?.data || res.data || [];
      setForms(Array.isArray(data) ? data : []);
    } catch { setForms([]); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      let fields: any[] = [];
      if (aiToggle && aiPrompt.trim()) {
        try {
          const aiRes = await api.post('/marketing/ai/form/generate', { prompt: aiPrompt });
          fields = aiRes.data?.form?.fields || aiRes.data?.data?.fields || [];
        } catch {
          // AI generation failed — continue with empty fields, don't block form creation
        }
      }
      const res = await api.post('/marketing/forms', {
        name: formName,
        type: formType,
        description: formDesc,
        fields,
      });
      const newForm = res.data?.form || res.data?.data || res.data;
      // Ensure type is set for immediate UI display (backend may return it from settings)
      if (newForm && !newForm.type) newForm.type = formType;
      setForms((prev) => [newForm, ...prev]);
      closeCreateModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create form. Please try again.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this form?')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
    } catch { setForms(forms.filter(f => f.id !== id)); }
    finally { setDeleting(null); }
  }

  async function openSubmissions(form: Form) {
    setSubmissionsPanel(form);
    setSubLoading(true);
    try {
      const res = await api.get(`/marketing/forms/${form.id}/submissions`);
      setSubmissions(res.data?.submissions || res.data?.data || []);
    } catch { setSubmissions([]); } finally { setSubLoading(false); }
  }

  const filtered = forms.filter(f => (f.name || '').toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Forms', value: forms.length, color: 'text-indigo-600' },
    { label: 'Submissions Today', value: forms.reduce((a, f) => a + (f.submission_count || 0), 0), color: 'text-green-600' },
    { label: 'Active Embedded', value: forms.filter(f => f.is_embedded).length, color: 'text-blue-600' },
    { label: 'Avg Completion', value: forms.length ? `${Math.round(forms.reduce((a, f) => a + (f.completion_rate || 0), 0) / forms.length)}%` : '0%', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Form Builder</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Create and manage lead capture forms</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAiToggle(true); setCreateError(''); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Sparkles className="w-4 h-4" /> AI Generate Form
          </button>
          <button onClick={() => { setAiToggle(false); setCreateError(''); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Form
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..."
          className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No forms found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first form to start capturing leads</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((form) => (
            <div key={form.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] truncate">{form.name}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadgeColor[form.type] || typeBadgeColor['Contact']}`}>
                    {form.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  {form.is_embedded
                    ? <span className="flex items-center gap-1 text-green-600"><ToggleRight className="w-3.5 h-3.5" /> Embedded</span>
                    : <span className="flex items-center gap-1 text-slate-400"><ToggleLeft className="w-3.5 h-3.5" /> Not Embedded</span>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#a3a3a3]">
                <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {form.submission_count || 0} submissions</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {form.last_submission ? new Date(form.last_submission).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3">
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                  <Code className="w-3 h-3" /> Embed
                </button>
                <button
                  onClick={() => handleCopyLink(form.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                    copied === form.id
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100'
                  }`}
                >
                  {copied === form.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                  {copied === form.id ? 'Copied!' : 'Share Link'}
                </button>
                <button onClick={() => openSubmissions(form)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                  <Eye className="w-3 h-3" /> Submissions
                </button>
                <button onClick={() => handleDelete(form.id)} disabled={deleting === form.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition ml-auto">
                  {deleting === form.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">{aiToggle ? 'AI Generate Form' : 'Create Form'}</h2>
              <button onClick={closeCreateModal} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Lead Capture Q3"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                  {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional description..."
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-20 resize-none" />
              </div>
              <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#ededed]">AI Generate Fields</span>
                </div>
                <button type="button" onClick={() => setAiToggle(!aiToggle)}
                  className={`w-10 h-5 rounded-full transition-colors ${aiToggle ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'} relative`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${aiToggle ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {aiToggle && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">AI Prompt</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder='e.g. "Create a registration form for a tech conference with name, email, company, and job title"'
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-24 resize-none" />
                </div>
              )}
              {createError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2">
                  {createError}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeCreateModal}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className={`flex-1 py-2.5 ${aiToggle ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60`}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : aiToggle ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {aiToggle ? 'Generate' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Slide-Over Panel */}
      {submissionsPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSubmissionsPanel(null)} />
          <div className="w-full max-w-2xl bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-[#1f1f1f] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Submissions</h2>
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">{submissionsPanel.name}</p>
              </div>
              <button onClick={() => setSubmissionsPanel(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {subLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-600 animate-spin" /></div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1f1f1f]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#0d0d0d] border-b border-slate-200 dark:border-[#1f1f1f]">
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">Submitted At</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                      {submissions.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                          <td className="px-3 py-2.5 text-slate-500 dark:text-[#a3a3a3]">{i + 1}</td>
                          <td className="px-3 py-2.5 text-slate-700 dark:text-[#ededed]">{new Date(s.submitted_at).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-[#a3a3a3] font-mono text-[10px] max-w-xs truncate">{JSON.stringify(s.data)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
