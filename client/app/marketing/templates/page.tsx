'use client';

import { useState, useEffect } from 'react';
import {
  Mail, MessageSquare, FileText, Globe, Plus, Trash2, Edit2, Copy,
  Loader2, Search, X, Eye, Star, Clock
} from 'lucide-react';
import api from '../../../services/api';

type TemplateType = 'email' | 'whatsapp' | 'sms' | 'landing';

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  subject?: string;
  content?: string;
  usage_count?: number;
  last_used?: string;
  created_at?: string;
}

const TABS: { key: TemplateType; label: string; icon: any }[] = [
  { key: 'email', label: 'Email Templates', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp Templates', icon: MessageSquare },
  { key: 'sms', label: 'SMS Templates', icon: FileText },
  { key: 'landing', label: 'Landing Page Templates', icon: Globe },
];

const typeColors: Record<TemplateType, string> = {
  email: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
  whatsapp: 'bg-green-50 dark:bg-green-900/20 text-green-600',
  sms: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  landing: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
};

const placeholderColors: Record<TemplateType, string> = {
  email: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
  whatsapp: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  sms: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
  landing: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
};

export default function TemplateLibraryPage() {
  const [activeTab, setActiveTab] = useState<TemplateType>('email');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplContent, setTplContent] = useState('');

  useEffect(() => { fetchTemplates(); }, [activeTab]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await api.get(`/marketing/templates?type=${activeTab}`);
      const data = res.data?.templates || res.data?.data || res.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch { setTemplates([]); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/marketing/templates', { name: tplName, type: activeTab, subject: tplSubject, content: tplContent });
      const nt = res.data?.template || res.data?.data || { id: `t-${Date.now()}`, name: tplName, type: activeTab, subject: tplSubject, content: tplContent, usage_count: 0 };
      setTemplates([nt, ...templates]);
      setShowModal(false);
      setTplName(''); setTplSubject(''); setTplContent('');
    } catch {
      setTemplates([{ id: `t-${Date.now()}`, name: tplName, type: activeTab, subject: tplSubject, content: tplContent, usage_count: 0 }, ...templates]);
      setShowModal(false);
      setTplName(''); setTplSubject(''); setTplContent('');
    } finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch { setTemplates(templates.filter(t => t.id !== id)); }
    finally { setDeleting(null); }
  }

  function handleDuplicate(tpl: Template) {
    const copy = { ...tpl, id: `t-${Date.now()}`, name: `${tpl.name} (Copy)`, usage_count: 0 };
    setTemplates([copy, ...templates]);
  }

  const filtered = templates.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()));
  const TypeIcon = TABS.find(t => t.key === activeTab)?.icon || Mail;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Template Library</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Manage reusable content templates for all channels</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-100 dark:border-[#1f1f1f]">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition border-b-2 ${activeTab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
              <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {/* Search within tab */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl px-3.5 py-2.5 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab} templates...`}
              className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-[#1f1f1f] rounded-2xl">
              <TypeIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No {activeTab} templates yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first template using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((tpl) => (
                <div key={tpl.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden flex flex-col">
                  {/* Thumbnail */}
                  <div className={`h-20 bg-gradient-to-br ${placeholderColors[tpl.type]} flex items-center justify-center`}>
                    <TypeIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">{tpl.name}</p>
                      {tpl.subject && <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5 truncate">Subject: {tpl.subject}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#a3a3a3]">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Used {tpl.usage_count || 0}x</span>
                      {tpl.last_used && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(tpl.last_used).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3 mt-auto">
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                        Use
                      </button>
                      <button onClick={() => setPreviewTemplate(tpl)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button onClick={() => handleDuplicate(tpl)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(tpl.id)} disabled={deleting === tpl.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition ml-auto">
                        {deleting === tpl.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f] sticky top-0 bg-white dark:bg-[#161616] z-10">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Create Template</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Template Name</label>
                <input required value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Welcome Email Series"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {TABS.map(t => (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key as TemplateType)}
                      className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl border transition ${activeTab === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-[#0d0d0d] text-slate-600 dark:text-[#a3a3a3] border-slate-200 dark:border-[#1f1f1f] hover:border-indigo-400'}`}>
                      <t.icon className="w-3.5 h-3.5" /> {t.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === 'email' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Subject Line</label>
                  <input value={tplSubject} onChange={e => setTplSubject(e.target.value)} placeholder="e.g. Welcome to HubNest CRM!"
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Content</label>
                <textarea required value={tplContent} onChange={e => setTplContent(e.target.value)}
                  placeholder={activeTab === 'email' ? 'HTML or plain text content...' : activeTab === 'whatsapp' ? 'WhatsApp message template...' : 'SMS message content...'}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-32 resize-none font-mono" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">{previewTemplate.name}</h2>
              <button onClick={() => setPreviewTemplate(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {previewTemplate.subject && (
                <div className="p-3 bg-slate-50 dark:bg-[#0d0d0d] rounded-xl">
                  <p className="text-xs font-bold text-slate-500 dark:text-[#a3a3a3] mb-1">SUBJECT</p>
                  <p className="text-sm text-slate-800 dark:text-[#ededed]">{previewTemplate.subject}</p>
                </div>
              )}
              <div className="p-4 bg-slate-50 dark:bg-[#0d0d0d] rounded-xl min-h-[120px]">
                <p className="text-xs font-bold text-slate-500 dark:text-[#a3a3a3] mb-2">CONTENT</p>
                <p className="text-sm text-slate-700 dark:text-[#ededed] whitespace-pre-wrap font-mono">{previewTemplate.content || 'No content'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
