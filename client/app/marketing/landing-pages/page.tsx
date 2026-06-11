'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Plus, Sparkles, Trash2, Edit2, Eye, Loader2, X,
  Copy, CheckCircle, BarChart2, Calendar, ExternalLink, Search
} from 'lucide-react';
import api from '../../../services/api';

interface LandingPage {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  status: 'Published' | 'Draft';
  visits?: number;
  conversions?: number;
  created_at?: string;
  seo_title?: string;
  seo_description?: string;
}

const statusColors = {
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [pageName, setPageName] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => { fetchPages(); }, []);

  async function fetchPages() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/pages');
      const data = res.data?.pages || res.data?.data || res.data || [];
      setPages(Array.isArray(data) ? data : []);
    } catch { setPages([]); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/marketing/pages', { title: pageName, name: pageName, slug, seo_title: seoTitle, seo_description: seoDesc, status: 'Draft' });
      const np = res.data?.page || res.data?.data || { id: `p-${Date.now()}`, name: pageName, title: pageName, slug, seo_title: seoTitle, seo_description: seoDesc, status: 'Draft', visits: 0, conversions: 0 };
      setPages([np, ...pages]);
      setShowModal(false);
      setPageName(''); setSeoTitle(''); setSeoDesc(''); setSlug('');
    } catch {
      setPages([{ id: `p-${Date.now()}`, name: pageName, title: pageName, slug, status: 'Draft', visits: 0, conversions: 0 }, ...pages]);
      setShowModal(false);
      setPageName(''); setSeoTitle(''); setSeoDesc(''); setSlug('');
    } finally { setCreating(false); }
  }

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      await api.patch(`/marketing/pages/${id}`, { status: 'Published' });
      setPages(pages.map(p => p.id === id ? { ...p, status: 'Published' } : p));
    } catch {
      setPages(pages.map(p => p.id === id ? { ...p, status: 'Published' } : p));
    } finally { setPublishing(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this landing page?')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/pages/${id}`);
      setPages(pages.filter(p => p.id !== id));
    } catch { setPages(pages.filter(p => p.id !== id)); }
    finally { setDeleting(null); }
  }

  async function handleDuplicate(page: LandingPage) {
    setDuplicating(page.id);
    try {
      const copy = { ...page, id: `p-${Date.now()}`, name: `${page.name} (Copy)`, title: `${page.title || page.name} (Copy)`, status: 'Draft' as const };
      await api.post('/marketing/pages', copy);
      setPages([copy, ...pages]);
    } catch {
      setPages([{ ...page, id: `p-${Date.now()}`, name: `${page.name} (Copy)`, status: 'Draft' }, ...pages]);
    } finally { setDuplicating(null); }
  }

  const filtered = pages.filter(p => (p.name || p.title || '').toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Pages', value: pages.length, color: 'text-indigo-600' },
    { label: 'Published', value: pages.filter(p => p.status === 'Published').length, color: 'text-green-600' },
    { label: 'Draft', value: pages.filter(p => p.status === 'Draft').length, color: 'text-yellow-600' },
    { label: 'Total Visits', value: pages.reduce((a, p) => a + (p.visits || 0), 0).toLocaleString(), color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Landing Pages</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Build and publish campaign landing pages</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Page
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..."
          className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No landing pages yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first landing page to drive campaign conversions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((page) => (
            <div key={page.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden flex flex-col">
              {/* Preview bar */}
              <div className="h-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 flex items-center justify-center">
                <Globe className="w-8 h-8 text-indigo-300" />
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] truncate">{page.name || page.title}</p>
                    {page.slug && <p className="text-[11px] text-slate-400 mt-0.5">/{page.slug}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[page.status]}`}>{page.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#a3a3a3]">
                  <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {(page.visits || 0).toLocaleString()} visits</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {page.conversions || 0} conv.</span>
                </div>
                {page.created_at && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(page.created_at).toLocaleDateString()}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3 mt-auto">
                  <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  {page.status === 'Draft' && (
                    <button onClick={() => handlePublish(page.id)} disabled={publishing === page.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                      {publishing === page.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />} Publish
                    </button>
                  )}
                  <button onClick={() => handleDuplicate(page)} disabled={duplicating === page.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                    {duplicating === page.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />} Duplicate
                  </button>
                  <button onClick={() => handleDelete(page.id)} disabled={deleting === page.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition ml-auto">
                    {deleting === page.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Page Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Create Landing Page</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Page Name</label>
                <input required value={pageName} onChange={e => setPageName(e.target.value)} placeholder="e.g. Summer Sale Landing Page"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">SEO Title</label>
                <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Meta title for search engines"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">SEO Description</label>
                <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} placeholder="Meta description for search engines"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-20 resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Custom URL Slug</label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl focus-within:border-indigo-500">
                  <span className="text-xs text-slate-400">/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="my-landing-page"
                    className="bg-transparent text-sm text-slate-900 dark:text-[#ededed] outline-none flex-1 placeholder:text-slate-400" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
