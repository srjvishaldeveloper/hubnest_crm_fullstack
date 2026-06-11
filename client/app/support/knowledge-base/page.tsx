'use client';

import { useEffect, useState } from 'react';
import {
  supportGetArticles,
  supportGetArticle,
  supportCreateArticle,
  supportUpdateArticle,
  supportRateArticle
} from '../../../services/supportService';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Sparkles,
  RefreshCw,
  Folder,
  Tag,
  ArrowRight,
  BookMarked
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  author_name: string | null;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Article for view
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Editor Modal
  const [showEditor, setShowEditor] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorCategory, setEditorCategory] = useState('Account Help');
  const [editorContent, setEditorContent] = useState('');
  const [editorStatus, setEditorStatus] = useState('Draft');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);

  const categories = ['Technical Issues', 'Billing', 'Account Help', 'General FAQs'];

  async function loadArticles() {
    try {
      setLoadingList(true);
      const res = await supportGetArticles({
        category: selectedCategory || undefined,
        search: searchQuery || undefined
      });
      setArticles(res.articles);
    } catch (err) {
      console.error('Failed to load articles', err);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadArticleDetail(id: string) {
    try {
      setLoadingDetail(true);
      const res = await supportGetArticle(id);
      setSelectedArticle(res.article);
    } catch (err) {
      console.error('Failed to load article detail', err);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedArticleId) {
      loadArticleDetail(selectedArticleId);
    } else {
      setSelectedArticle(null);
    }
  }, [selectedArticleId]);

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!editorTitle || !editorContent || !editorCategory) return;

    try {
      setSavingArticle(true);
      if (editingArticleId) {
        await supportUpdateArticle(editingArticleId, {
          title: editorTitle,
          content: editorContent,
          category: editorCategory,
          status: editorStatus
        });
      } else {
        await supportCreateArticle({
          title: editorTitle,
          content: editorContent,
          category: editorCategory,
          status: editorStatus
        });
      }
      setShowEditor(false);
      setEditorTitle('');
      setEditorContent('');
      setEditorCategory('Account Help');
      setEditorStatus('Draft');
      setEditingArticleId(null);
      loadArticles();
      if (selectedArticleId && selectedArticleId === editingArticleId) {
        loadArticleDetail(selectedArticleId);
      }
    } catch (err) {
      console.error('Failed to save article', err);
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleRate(isLike: boolean) {
    if (!selectedArticleId || !selectedArticle) return;
    try {
      await supportRateArticle(selectedArticleId, isLike);
      loadArticleDetail(selectedArticleId);
      loadArticles();
    } catch (err) {
      console.error('Failed to rate article', err);
    }
  }

  function handleEditClick(article: Article) {
    setEditingArticleId(article.id);
    setEditorTitle(article.title);
    setEditorCategory(article.category);
    setEditorContent(article.content);
    setEditorStatus(article.status);
    setShowEditor(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Knowledge Base Library</h1>
          <p className="text-xs text-slate-500">Provide self-help documents, system FAQs, and training guides to solve issues quickly.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingArticleId(null);
              setEditorTitle('');
              setEditorCategory('Account Help');
              setEditorContent('');
              setEditorStatus('Draft');
              setShowEditor(true);
            }}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Article
          </button>
          <button
            onClick={loadArticles}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-[#161616] rounded-xl text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Articles list + Article reading room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Categories and Articles queue */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Categories Tab Selector */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition
                ${selectedCategory === '' ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-650 hover:bg-slate-50 dark:bg-[#161616]'}`}
            >
              All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition
                  ${selectedCategory === cat ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-650 hover:bg-slate-50 dark:bg-[#161616]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search tool */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadArticles()}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Articles list */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {loadingList ? (
              <div className="text-center py-12">
                <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-medium">Assembling solution index...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                No solutions or FAQs found.
              </div>
            ) : (
              articles.map(art => {
                const active = selectedArticleId === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`p-4 hover:bg-slate-50 dark:bg-[#161616]/50 cursor-pointer transition flex items-start justify-between gap-4 ${active ? 'bg-blue-50/30 border-l-4 border-l-[#2563EB]' : ''}`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-xs leading-snug">{art.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <Folder className="w-3 h-3" /> {art.category} • <Eye className="w-3 h-3" /> {art.views_count} views
                      </p>
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0
                      ${art.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {art.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Document details and rating */}
        <div className="lg:col-span-7">
          {selectedArticleId ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6 min-h-[500px] flex flex-col justify-between animate-scale-up">
              
              {loadingDetail ? (
                <div className="h-96 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#2563EB] text-[9px] font-extrabold rounded-md uppercase">
                            {selectedArticle?.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Created {selectedArticle?.created_at && new Date(selectedArticle.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">{selectedArticle?.title}</h2>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Author: {selectedArticle?.author_name || 'System Manager'}</p>
                      </div>
                      
                      <button
                        onClick={() => selectedArticle && handleEditClick(selectedArticle)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition shrink-0"
                      >
                        Edit Article
                      </button>
                    </div>

                    {/* Content body */}
                    <div className="text-xs leading-relaxed text-slate-700 font-semibold space-y-3 whitespace-pre-line py-2">
                      {selectedArticle?.content}
                    </div>
                  </div>

                  {/* Ratings panel */}
                  <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                    <div>
                      <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wide">Was this article helpful?</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRate(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650 border border-slate-200 transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-green-600" /> Helpful ({selectedArticle?.likes_count})
                        </button>
                        <button
                          onClick={() => handleRate(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650 border border-slate-200 transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-red-600" /> Not Helpful ({selectedArticle?.dislikes_count})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {selectedArticle?.views_count} views</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-green-500" /> {selectedArticle?.likes_count} likes</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <BookMarked className="w-12 h-12 text-blue-150 mb-3" />
              <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm">Select an Article</h3>
              <p className="text-xs text-slate-450 max-w-xs mt-1 leading-relaxed">
                Click a topic on the left list to view details, update system guides, or review customer ratings.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE / EDIT ARTICLE MODAL */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-xl shadow-xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">
                {editingArticleId ? 'Modify Help Article' : 'Compose Help Article'}
              </h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <label>Article Title *</label>
                <input
                  type="text" required value={editorTitle} onChange={e => setEditorTitle(e.target.value)}
                  placeholder="How to connect CRM platform integration..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Category *</label>
                  <select
                    value={editorCategory} onChange={e => setEditorCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label>Status</label>
                  <select
                    value={editorStatus} onChange={e => setEditorStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label>Article Content (Markdown/Text) *</label>
                <textarea
                  required rows={10} value={editorContent} onChange={e => setEditorContent(e.target.value)}
                  placeholder="Write step-by-step guidelines, troubleshooting guides, FAQs..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end gap-3">
                <button
                  type="button" onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:bg-[#161616]"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={savingArticle}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {savingArticle ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
