'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
  supportGetArticles, supportGetArticle, supportCreateArticle,
  supportUpdateArticle, supportRateArticle
} from '../../../services/supportService';
import {
  BookOpen, Search, Plus, ThumbsUp, ThumbsDown, Eye,
  Sparkles, RefreshCw, Folder, Tag, BookMarked, BarChart2,
  TrendingUp, Star, Filter, X, Edit3, Clock, CheckCircle2,
  Users, Zap, ArrowRight
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

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ARTICLES: Article[] = [
  { id: 'art-001', title: 'How to reset your CRM account password', content: `**Problem:** User has forgotten their password.\n\n**Solution:**\n1. Go to the Login page.\n2. Click "Forgot Password" below the login button.\n3. Enter your registered email address.\n4. Check your email for a password reset link (valid 15 minutes).\n5. Click the link and set a new strong password.\n\n**Tips:** Use a password with at least 8 characters, including uppercase, numbers, and symbols.\n\n**Still not working?** Contact our support team at support@hubnest.in`, category: 'Account Help', status: 'Published', views_count: 342, likes_count: 28, dislikes_count: 2, author_name: 'Priya Singh', created_at: new Date(Date.now() - 86400000 * 15).toISOString() },
  { id: 'art-002', title: 'Understanding SLA tiers and response times', content: `**What is SLA?**\nService Level Agreement (SLA) defines the expected response and resolution time for support tickets.\n\n**SLA Tiers in HubNest CRM:**\n\n| Priority | First Response | Resolution |\n|----------|---------------|------------|\n| High     | 1 hour        | 4 hours    |\n| Medium   | 4 hours       | 24 hours   |\n| Low      | 8 hours       | 48 hours   |\n\n**SLA Breach:**\nWhen a ticket is not resolved within the SLA window, it is marked as "Breached" and escalated automatically to the team lead.\n\n**How to check SLA status:**\nOpen any ticket in the Tickets module — the SLA timer is visible in the top-right corner of the ticket detail panel.`, category: 'Technical Issues', status: 'Published', views_count: 218, likes_count: 19, dislikes_count: 1, author_name: 'Neha Verma', created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'art-003', title: 'How to raise a billing dispute or refund request', content: `**To raise a billing dispute:**\n\n1. Log in to your account.\n2. Navigate to Settings > Billing.\n3. Click on the invoice with the issue.\n4. Click "Raise Dispute" and explain the issue.\n5. Our billing team will review within 2 business days.\n\n**Refund Policy:**\n- Refunds for cancellations made within 7 days are eligible for full refund.\n- After 7 days, partial refunds based on remaining billing cycle may apply.\n\n**Contact:** billing@hubnest.in`, category: 'Billing', status: 'Published', views_count: 187, likes_count: 15, dislikes_count: 3, author_name: 'Rajan Mehta', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'art-004', title: 'Integrating CRM API with third-party tools', content: `**Prerequisites:**\n- HubNest CRM API key (found in Settings > Developer)\n- Basic understanding of REST APIs\n\n**Authentication:**\nAll API requests require the Authorization header:\n\n\`\`\`\nAuthorization: Bearer <YOUR_API_KEY>\n\`\`\`\n\n**Rate Limits:**\n- Standard: 100 requests/minute\n- Enterprise: 500 requests/minute\n\n**Common Integrations:**\n- Zapier: Use the HubNest Zapier app (search in Zapier marketplace)\n- Slack: Connect via Settings > Integrations > Slack\n- Google Workspace: Settings > Integrations > Google`, category: 'Technical Issues', status: 'Published', views_count: 312, likes_count: 24, dislikes_count: 0, author_name: 'Arjun Kapoor', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'art-005', title: 'How to add or remove team members from your workspace', content: `**Adding team members:**\n\n1. Go to Settings > Team Members.\n2. Click "Invite Member".\n3. Enter the email address and select a role (Admin, Agent, Viewer).\n4. The invited user will receive an email with onboarding instructions.\n\n**Removing a member:**\n1. Go to Settings > Team Members.\n2. Find the user and click the "Remove" button.\n3. Their access will be revoked immediately.\n\n**Note:** Only Admin users can add or remove team members.`, category: 'Account Help', status: 'Published', views_count: 145, likes_count: 11, dislikes_count: 1, author_name: 'Priya Singh', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'art-006', title: 'Common troubleshooting steps for login issues', content: `**If you cannot log in:**\n\n1. Make sure you are using the correct email and password.\n2. Check if Caps Lock is on.\n3. Clear browser cache and cookies.\n4. Try incognito/private mode.\n5. If using Google SSO, ensure your Google account is linked.\n\n**2FA Issues:**\nIf you have 2FA enabled and cannot receive the OTP:\n- Check your authenticator app time sync\n- Use backup codes from your Security settings\n\n**Account Locked:**\nAfter 5 failed attempts, your account may be temporarily locked. Wait 15 minutes or contact support.`, category: 'Technical Issues', status: 'Draft', views_count: 89, likes_count: 7, dislikes_count: 2, author_name: 'Neha Verma', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'art-007', title: 'Understanding your invoice and payment options', content: `**Invoice details:**\nEach invoice includes:\n- Billing period\n- Plan name and seats\n- Taxes applicable\n- Payment method used\n\n**Payment Methods supported:**\n- Credit/Debit Card (Visa, Mastercard, Amex)\n- UPI (India)\n- Net Banking\n- NEFT/RTGS (Enterprise plans)\n\n**Download Invoice:**\nGo to Settings > Billing > Invoices and click "Download PDF" next to any invoice.`, category: 'Billing', status: 'Published', views_count: 203, likes_count: 18, dislikes_count: 0, author_name: 'Rajan Mehta', created_at: new Date(Date.now() - 86400000 * 12).toISOString() },
  { id: 'art-008', title: 'General FAQ — HubNest CRM platform', content: `**Q: Is my data secure?**\nYes. HubNest uses AES-256 encryption and is SOC2 Type II compliant.\n\n**Q: Can I export my data?**\nYes. Go to Settings > Data Export to download CSV or JSON exports.\n\n**Q: What browsers are supported?**\nChrome 90+, Firefox 85+, Safari 14+, Edge 90+.\n\n**Q: Is there a mobile app?**\nYes, available on iOS (App Store) and Android (Play Store).\n\n**Q: What is the SLA for free plans?**\nFree plans have community support only with no guaranteed SLA.`, category: 'General FAQs', status: 'Published', views_count: 445, likes_count: 35, dislikes_count: 3, author_name: 'Neha Verma', created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
];

const ANALYTICS_VIEWS = [
  { title: 'General FAQ', views: 445 },
  { title: 'API Integration', views: 312 },
  { title: 'Password Reset', views: 342 },
  { title: 'Billing Dispute', views: 187 },
  { title: 'SLA Tiers', views: 218 },
];

const CATEGORY_PIE = [
  { name: 'Technical', value: 3, color: '#3B82F6' },
  { name: 'Account Help', value: 2, color: '#10B981' },
  { name: 'Billing', value: 2, color: '#F59E0B' },
  { name: 'General FAQs', value: 1, color: '#6366F1' },
];

const VIEWS_TREND = [
  { week: 'W1', views: 980 },
  { week: 'W2', views: 1240 },
  { week: 'W3', views: 1090 },
  { week: 'W4', views: 1580 },
];

const CATEGORIES = ['Technical Issues', 'Billing', 'Account Help', 'General FAQs'];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorCategory, setEditorCategory] = useState('Account Help');
  const [editorContent, setEditorContent] = useState('');
  const [editorStatus, setEditorStatus] = useState('Draft');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);

  async function loadArticles() {
    try {
      setLoadingList(true);
      const res = await supportGetArticles({ category: selectedCategory || undefined, search: searchQuery || undefined });
      setArticles(res.articles);
    } catch {
      let filtered = MOCK_ARTICLES.filter(a => {
        if (selectedCategory && a.category !== selectedCategory) return false;
        if (statusFilter && a.status !== statusFilter) return false;
        if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      setArticles(filtered);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadArticleDetail(id: string) {
    try {
      setLoadingDetail(true);
      const res = await supportGetArticle(id);
      setSelectedArticle(res.article);
    } catch {
      setSelectedArticle(MOCK_ARTICLES.find(a => a.id === id) || null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => { loadArticles(); }, [selectedCategory, statusFilter]);

  useEffect(() => {
    if (selectedArticleId) loadArticleDetail(selectedArticleId);
    else setSelectedArticle(null);
  }, [selectedArticleId]);

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!editorTitle || !editorContent) return;
    try {
      setSavingArticle(true);
      if (editingArticleId) {
        await supportUpdateArticle(editingArticleId, { title: editorTitle, content: editorContent, category: editorCategory, status: editorStatus });
      } else {
        await supportCreateArticle({ title: editorTitle, content: editorContent, category: editorCategory, status: editorStatus });
      }
      setShowEditor(false);
      resetEditor();
      loadArticles();
    } catch { resetEditor(); setShowEditor(false); } finally { setSavingArticle(false); }
  }

  function resetEditor() {
    setEditorTitle(''); setEditorContent(''); setEditorCategory('Account Help');
    setEditorStatus('Draft'); setEditingArticleId(null);
  }

  async function handleRate(isLike: boolean) {
    if (!selectedArticleId || !selectedArticle) return;
    setSelectedArticle(prev => prev ? { ...prev, likes_count: prev.likes_count + (isLike ? 1 : 0), dislikes_count: prev.dislikes_count + (isLike ? 0 : 1) } : prev);
    try { await supportRateArticle(selectedArticleId, isLike); } catch { /* optimistic */ }
  }

  function handleEditClick(article: Article) {
    setEditingArticleId(article.id);
    setEditorTitle(article.title);
    setEditorCategory(article.category);
    setEditorContent(article.content);
    setEditorStatus(article.status);
    setShowEditor(true);
  }

  const publishedCount = articles.filter(a => a.status === 'Published').length;
  const totalViews = MOCK_ARTICLES.reduce((s, a) => s + a.views_count, 0);
  const totalLikes = MOCK_ARTICLES.reduce((s, a) => s + a.likes_count, 0);

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Knowledge Base Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">Self-help articles, system FAQs, and training guides for customers and agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnalytics(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${showAnalytics ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button
            onClick={() => { resetEditor(); setShowEditor(true); }}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Article
          </button>
          <button onClick={loadArticles} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Articles', value: MOCK_ARTICLES.length, icon: BookOpen, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Published', value: publishedCount, icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600' },
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, bg: 'bg-purple-50', text: 'text-purple-600' },
          { label: 'Helpful Votes', value: totalLikes, icon: ThumbsUp, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} whileHover={{ scale: 1.02, y: -1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
                <div className={`p-2 ${s.bg} ${s.text} rounded-xl`}><Icon className="w-4 h-4" /></div>
              </div>
              <p className={`text-2xl font-black mt-4 ${s.text}`}>{s.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Analytics Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Articles by Category</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={CATEGORY_PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                      {CATEGORY_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {CATEGORY_PIE.map(c => (
                    <div key={c.name} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Top Articles by Views</p>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={ANALYTICS_VIEWS} layout="vertical" margin={{ left: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <YAxis type="category" dataKey="title" tick={{ fontSize: 8, fill: '#64748B' }} width={90} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="views" name="Views" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3">Weekly Views Trend</p>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={VIEWS_TREND} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Line type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Split Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left: Categories + Search + Article List */}
        <div className="lg:col-span-5 space-y-4">

          {/* Category Filter Pills */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedCategory === '' ? 'bg-blue-50 text-[#2563EB] border border-blue-200' : 'text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                All Topics
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedCategory === cat ? 'bg-blue-50 text-[#2563EB] border border-blue-200' : 'text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search + Status Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type="text" placeholder="Search help topics..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadArticles()}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 bg-white" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500">
              <option value="">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Articles List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
            {loadingList ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                <p className="text-xs text-slate-400">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">No articles found.</div>
            ) : articles.map(art => {
              const active = selectedArticleId === art.id;
              return (
                <motion.div key={art.id} whileHover={{ x: 1 }}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition flex items-start justify-between gap-3 ${active ? 'bg-blue-50/30 border-l-4 border-l-[#2563EB]' : ''}`}
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-[#0F172A] text-xs leading-snug truncate">{art.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold flex-wrap">
                      <span className="flex items-center gap-1"><Folder className="w-3 h-3" />{art.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{art.views_count}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="w-3 h-3" />{art.likes_count}</span>
                    </div>
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${art.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                    {art.status}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Article Reader or Placeholder */}
        <div className="lg:col-span-7">
          {selectedArticleId ? (
            <AnimatePresence mode="wait">
              <motion.div key={selectedArticleId}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 min-h-[500px] flex flex-col"
              >
                {loadingDetail ? (
                  <div className="flex-1 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                  </div>
                ) : selectedArticle ? (
                  <>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#2563EB] text-[9px] font-extrabold rounded-md uppercase">{selectedArticle.category}</span>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase ${selectedArticle.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>{selectedArticle.status}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                        </div>
                        <h2 className="text-base font-black text-[#0F172A] leading-snug">{selectedArticle.title}</h2>
                        <p className="text-[10px] text-slate-400 mt-1">Author: {selectedArticle.author_name || 'System'}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleEditClick(selectedArticle)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setSelectedArticleId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Article Stats Bar */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" />{selectedArticle.views_count} views</span>
                      <span className="flex items-center gap-1.5 text-green-600"><ThumbsUp className="w-3.5 h-3.5" />{selectedArticle.likes_count} helpful</span>
                      <span className="flex items-center gap-1.5 text-red-400"><ThumbsDown className="w-3.5 h-3.5" />{selectedArticle.dislikes_count} not helpful</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        Helpfulness: {Math.round((selectedArticle.likes_count / Math.max(selectedArticle.likes_count + selectedArticle.dislikes_count, 1)) * 100)}%
                      </span>
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 text-xs leading-relaxed text-slate-700 font-medium space-y-2 whitespace-pre-line py-2">
                      {selectedArticle.content}
                    </div>

                    {/* Rating + AI Suggestion */}
                    <div className="border-t border-slate-100 pt-5 mt-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Was this article helpful?</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleRate(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-green-50 hover:border-green-200 border border-slate-200 rounded-xl text-xs font-bold transition">
                              <ThumbsUp className="w-3.5 h-3.5 text-green-600" /> Helpful ({selectedArticle.likes_count})
                            </button>
                            <button onClick={() => handleRate(false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 rounded-xl text-xs font-bold transition">
                              <ThumbsDown className="w-3.5 h-3.5 text-red-500" /> Not Helpful ({selectedArticle.dislikes_count})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* AI Suggest */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2563EB] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide">AI Suggestion</p>
                          <p className="text-[10px] text-slate-600 font-semibold mt-0.5 leading-relaxed">
                            This article has {selectedArticle.views_count} views. Consider adding a video tutorial to improve engagement and reduce similar tickets by up to 40%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <BookMarked className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-sm">Select an Article</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                Click a topic on the left to read, edit, or rate help articles. Use the "Add Article" button to create new content.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { resetEditor(); setShowEditor(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition">
                  <Plus className="w-3.5 h-3.5" /> Create Article
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ARTICLE EDITOR MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditor(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#2563EB]" />
                  {editingArticleId ? 'Edit Article' : 'New Help Article'}
                </h3>
                <button onClick={() => setShowEditor(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSaveArticle} className="p-6 space-y-4 text-xs font-semibold text-slate-600 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label>Article Title *</label>
                  <input type="text" required value={editorTitle} onChange={e => setEditorTitle(e.target.value)}
                    placeholder="How to connect CRM API integration..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Category *</label>
                    <select value={editorCategory} onChange={e => setEditorCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Status</label>
                    <select value={editorStatus} onChange={e => setEditorStatus(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white">
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Article Content *</label>
                  <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-2.5 mb-1.5 text-[10px] text-slate-500 font-semibold">
                    💡 Supports Markdown: **bold**, `code`, # Heading, - Lists
                  </div>
                  <textarea required rows={12} value={editorContent} onChange={e => setEditorContent(e.target.value)}
                    placeholder="Write step-by-step guides, troubleshooting steps, FAQs..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white font-mono" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowEditor(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={savingArticle}
                    className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2">
                    {savingArticle ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Article'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
