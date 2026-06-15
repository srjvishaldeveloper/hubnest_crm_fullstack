'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Plus, Trash2, Edit2, Eye, Loader2, X,
  Copy, CheckCircle, BarChart2, Calendar, ExternalLink, Search, Save, Download,
  Check, Share2, MessageCircle, Mail, Layout, Layers, Zap, BookOpen,
  ShoppingBag, Megaphone, Users, Star, Gift, Briefcase,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../../services/api';

// ─── Templates ────────────────────────────────────────────────────────────────

const PAGE_TEMPLATES = [
  {
    id: 'blank', name: 'Blank', description: 'Start from scratch', icon: Layout,
    color: '#6366f1', category: 'General',
    content: '<h1>Page Title</h1><br/><p>Start building your landing page here...</p>',
  },
  {
    id: 'product-launch', name: 'Product Launch', description: 'Announce a new product', icon: Zap,
    color: '#f97316', category: 'Marketing',
    content: '<h1>Introducing Our New Product</h1><br/><p>We\'re excited to announce the launch of our latest innovation. Designed for you, built for results.</p><br/><h2>Key Features</h2><ul><li>Feature 1 — Describe the benefit</li><li>Feature 2 — Describe the benefit</li><li>Feature 3 — Describe the benefit</li></ul><br/><h2>Get Started Today</h2><p>Limited time offer — sign up now and get 30% off your first month.</p>',
  },
  {
    id: 'webinar', name: 'Webinar Registration', description: 'Drive event signups', icon: Users,
    color: '#8b5cf6', category: 'Events',
    content: '<h1>Join Our Free Webinar</h1><br/><p><strong>Date:</strong> Coming Soon &nbsp;|&nbsp; <strong>Time:</strong> 3:00 PM IST &nbsp;|&nbsp; <strong>Duration:</strong> 60 min</p><br/><h2>What You\'ll Learn</h2><ul><li>Topic 1 — Key insight</li><li>Topic 2 — Key insight</li><li>Topic 3 — Key insight</li></ul><br/><h2>Your Speaker</h2><p>Expert name and bio goes here. Add credentials and social proof.</p><br/><p><strong>Register now — seats are limited!</strong></p>',
  },
  {
    id: 'ebook', name: 'Ebook Download', description: 'Grow your list with a lead magnet', icon: BookOpen,
    color: '#10b981', category: 'Marketing',
    content: '<h1>Free Guide: [Your Topic]</h1><br/><p>Download our comprehensive guide and discover the strategies top professionals use to achieve extraordinary results.</p><br/><h2>What\'s Inside</h2><ul><li>Chapter 1: Getting Started</li><li>Chapter 2: Core Strategies</li><li>Chapter 3: Advanced Techniques</li><li>Chapter 4: Case Studies</li></ul><br/><p>Over <strong>5,000 professionals</strong> have already downloaded this guide. Get your free copy today.</p>',
  },
  {
    id: 'sale', name: 'Flash Sale', description: 'Promote a limited-time offer', icon: ShoppingBag,
    color: '#ef4444', category: 'Ecommerce',
    content: '<h1>⚡ Flash Sale — Up to 50% Off!</h1><br/><p>Don\'t miss our biggest sale of the year. Limited stock available. Offer ends soon!</p><br/><h2>Featured Deals</h2><ul><li>Product A — Was ₹2,000 Now ₹1,000</li><li>Product B — Was ₹3,500 Now ₹1,750</li><li>Product C — Was ₹5,000 Now ₹2,500</li></ul><br/><p><strong>Use code FLASH50 at checkout to claim your discount.</strong></p>',
  },
  {
    id: 'newsletter', name: 'Newsletter Signup', description: 'Grow your email subscriber list', icon: Megaphone,
    color: '#06b6d4', category: 'Marketing',
    content: '<h1>Stay in the Loop</h1><br/><p>Join thousands of subscribers who get our weekly newsletter packed with insights, tips, and exclusive offers.</p><br/><h2>What You\'ll Get</h2><ul><li>Weekly industry insights</li><li>Exclusive subscriber discounts</li><li>Early access to new features</li><li>Curated content from experts</li></ul><br/><p>No spam, ever. Unsubscribe anytime.</p>',
  },
  {
    id: 'testimonials', name: 'Social Proof', description: 'Showcase reviews and testimonials', icon: Star,
    color: '#f59e0b', category: 'General',
    content: '<h1>Trusted by 10,000+ Customers</h1><br/><p>See what our customers are saying about us.</p><br/><h2>Customer Reviews</h2><p>⭐⭐⭐⭐⭐ &quot;Absolutely transformed how we work. Highly recommend!&quot; — <strong>Rahul S., CEO</strong></p><br/><p>⭐⭐⭐⭐⭐ &quot;Best investment we\'ve made this year. Results speak for themselves.&quot; — <strong>Priya M., Marketing Head</strong></p><br/><p>⭐⭐⭐⭐⭐ &quot;Easy to use, incredible support, and it just works.&quot; — <strong>Amir K., Founder</strong></p>',
  },
  {
    id: 'referral', name: 'Referral Program', description: 'Invite friends and earn rewards', icon: Gift,
    color: '#ec4899', category: 'Marketing',
    content: '<h1>Share & Earn Rewards</h1><br/><p>Invite your friends and colleagues to join us. You both earn exclusive rewards when they sign up.</p><br/><h2>How It Works</h2><ol><li>Share your unique referral link</li><li>Your friend signs up using your link</li><li>You both get rewarded instantly</li></ol><br/><h2>Rewards</h2><ul><li>You earn: ₹500 credit</li><li>Your friend gets: 30-day free trial</li></ul>',
  },
  {
    id: 'portfolio', name: 'Portfolio / About', description: 'Showcase your work or brand', icon: Briefcase,
    color: '#64748b', category: 'Business',
    content: '<h1>About Us</h1><br/><p>We are a team of passionate professionals dedicated to delivering exceptional results for our clients.</p><br/><h2>Our Mission</h2><p>To empower businesses with the tools and strategies they need to grow and succeed in today\'s competitive landscape.</p><br/><h2>What We Do</h2><ul><li>Strategic Consulting</li><li>Digital Marketing</li><li>Product Development</li><li>Brand Strategy</li></ul><br/><h2>Get In Touch</h2><p>Ready to work together? Reach out to us today.</p>',
  },
] as const;

type PageTemplate = (typeof PAGE_TEMPLATES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingPage {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  campaign_id?: string | null;
  status: 'Published' | 'Draft';
  visits?: number;
  conversions?: number;
  created_at?: string;
  seo_title?: string;
  seo_description?: string;
  settings?: Record<string, string>;
}

const statusColors = {
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ tpl, onUse }: { tpl: PageTemplate; onUse: (t: PageTemplate) => void }) {
  const Icon = tpl.icon;
  return (
    <div className="group bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <div className="h-1" style={{ backgroundColor: tpl.color }} />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tpl.color + '20' }}>
            <Icon className="w-5 h-5" style={{ color: tpl.color }} />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {tpl.category}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">{tpl.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{tpl.description}</p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <button
          onClick={() => onUse(tpl)}
          style={{ backgroundColor: tpl.color }}
          className="w-full py-2 text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm active:scale-[0.98]">
          Use Template
        </button>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ page, onClose }: { page: LandingPage; onClose: () => void }) {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const shareUrl = `${origin}/public/landingpage/${page.id}`;

  const iframeCode = `<iframe\n  src="${shareUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);"\n  title="${page.name || page.title}"\n></iframe>`;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopiedWhat(key);
    setTimeout(() => setCopiedWhat(null), 2000);
  }

  function downloadQR() {
    const svg = document.getElementById('lp-share-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${(page.name || page.title || 'page').replace(/[^a-z0-9]/gi, '_')}-qr.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Share Landing Page</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5 truncate max-w-[280px]">{page.name || page.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Direct link */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Direct Link</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl}
                className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none" />
              <button onClick={() => copy(shareUrl, 'link')}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition shrink-0">
                {copiedWhat === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedWhat === 'link' ? 'Copied!' : 'Copy'}
              </button>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                className="p-2.5 border border-slate-200 dark:border-[#1f1f1f] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          {/* QR Code */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-[#0d0d0d] rounded-xl border border-slate-200 dark:border-[#1f1f1f]">
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm">
              <QRCodeSVG id="lp-share-qr" value={shareUrl} size={96} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-[#ededed]">QR Code</p>
              <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">Scan to open on any device. Download as PNG to print or share.</p>
              <button onClick={downloadQR}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg transition">
                <Download className="w-3 h-3" /> Download PNG
              </button>
            </div>
          </div>
          {/* Embed */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Embed Code (iframe)</p>
            <div className="relative">
              <textarea readOnly value={iframeCode} rows={5}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none resize-none" />
              <button onClick={() => copy(iframeCode, 'iframe')}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] text-[11px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition">
                {copiedWhat === 'iframe' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedWhat === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          {/* Social share */}
          <div className="flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent('Check out this page: ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(page.name || page.title || 'Landing Page')}&body=${encodeURIComponent('Check out this landing page: ' + shareUrl)}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
            <button onClick={() => copy(shareUrl, 'social')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition">
              <Share2 className="w-3.5 h-3.5" />
              {copiedWhat === 'social' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ page, onClose }: { page: LandingPage; onClose: () => void }) {
  const accent = (page.settings as any)?.themeColor || '#4f46e5';
  const content = (page.settings as any)?.content || '';
  const title = page.title || page.name;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-100 dark:bg-[#0d0d0d]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#161616] border-b border-slate-200 dark:border-[#1f1f1f] shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Preview</p>
            <p className="text-[10px] text-slate-400">{title}</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
          Preview Mode
        </span>
      </div>

      {/* Page preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-slate-50 dark:bg-[#0a0a0a] font-sans">
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
          <header className="bg-white dark:bg-[#161616] border-b border-slate-200 dark:border-[#1f1f1f] shadow-sm">
            <div className="max-w-4xl mx-auto px-6 py-8 text-center">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold mb-4 uppercase tracking-wider"
                style={{ backgroundColor: accent + '20', color: accent }}
              >
                <Globe className="w-3 h-3" /> Landing Page
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#ededed] tracking-tight">{title}</h1>
              {page.seo_description && (
                <p className="mt-3 text-base text-slate-500 dark:text-[#a3a3a3] max-w-2xl mx-auto leading-relaxed">{page.seo_description}</p>
              )}
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-10">
            {content ? (
              <div
                className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-8"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-12 text-center">
                <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-[#a3a3a3] font-medium">No content yet — use the editor to add content.</p>
              </div>
            )}
          </main>
          <footer className="py-8 text-center">
            <p className="text-[11px] font-medium text-slate-400 dark:text-[#666]">
              Powered by <span className="font-bold text-slate-900 dark:text-[#ededed]">HubNest CRM</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageView = 'templates' | 'mypages';

export default function LandingPagesPage() {
  const [view, setView] = useState<PageView>('templates');
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  // Create form state
  const [pageName, setPageName] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [themeColor, setThemeColor] = useState('#4f46e5');

  // Modals
  const [builderModal, setBuilderModal] = useState<LandingPage | null>(null);
  const [builderContent, setBuilderContent] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [shareModal, setShareModal] = useState<LandingPage | null>(null);
  const [previewModal, setPreviewModal] = useState<LandingPage | null>(null);

  useEffect(() => {
    fetchPages();
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await api.get('/marketing/campaigns');
      const data = res.data?.data || res.data?.campaigns || res.data || [];
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }

  async function fetchPages() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/pages');
      const data = res.data?.data?.pages || res.data?.pages || res.data?.data || res.data || [];
      setPages(Array.isArray(data) ? data : []);
    } catch { setPages([]); } finally { setLoading(false); }
  }

  function openCreateFromTemplate(tpl: PageTemplate) {
    setSelectedTemplate(tpl);
    setPageName(tpl.name);
    setThemeColor(tpl.color);
    setSlug(tpl.id);
    setSeoTitle('');
    setSeoDesc('');
    setCampaignId('');
    setShowCreateModal(true);
  }

  function openCreateBlank() {
    setSelectedTemplate(null);
    setPageName('');
    setThemeColor('#4f46e5');
    setSlug('');
    setSeoTitle('');
    setSeoDesc('');
    setCampaignId('');
    setShowCreateModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const templateContent = selectedTemplate?.content || '';
    try {
      const res = await api.post('/marketing/pages', {
        title: pageName,
        slug: slug || pageName.toLowerCase().replace(/\s+/g, '-'),
        status: 'Draft',
        content: { template: selectedTemplate?.id || 'blank', themeColor, html: templateContent },
        seo_settings: { title: seoTitle, description: seoDesc },
        campaign_id: campaignId || null,
      });
      const raw = res.data?.data?.page || res.data?.page || res.data?.data || res.data;
      // Normalize DB row: DB stores `content` JSON, map it to `settings` for UI
      const np: LandingPage = raw?.id ? {
        ...raw,
        name: raw.title || pageName,
        settings: raw.settings || raw.content || { template: selectedTemplate?.id || 'blank', themeColor, html: templateContent },
        visits: raw.visits || 0,
        conversions: raw.conversions || 0,
      } : {
        id: `p-${Date.now()}`, name: pageName, title: pageName,
        slug, campaign_id: campaignId || null,
        status: 'Draft' as const, visits: 0, conversions: 0,
        settings: { template: selectedTemplate?.id || 'blank', themeColor, content: templateContent } as any,
      };
      setPages([np, ...pages]);
      setShowCreateModal(false);
      setView('mypages');
      setBuilderModal(np);
      setBuilderContent(templateContent);
    } catch {
      const fallback: LandingPage = {
        id: `p-${Date.now()}`, name: pageName, title: pageName,
        slug, campaign_id: campaignId || null, status: 'Draft',
        visits: 0, conversions: 0,
        settings: { template: selectedTemplate?.id || 'blank', themeColor, content: templateContent } as any,
      };
      setPages([fallback, ...pages]);
      setShowCreateModal(false);
      setView('mypages');
      setBuilderModal(fallback);
      setBuilderContent(templateContent);
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
      const copy: LandingPage = { ...page, id: `p-${Date.now()}`, name: `${page.name} (Copy)`, title: `${page.title || page.name} (Copy)`, status: 'Draft' };
      await api.post('/marketing/pages', copy);
      setPages([copy, ...pages]);
    } catch {
      setPages([{ ...page, id: `p-${Date.now()}`, name: `${page.name} (Copy)`, status: 'Draft' }, ...pages]);
    } finally { setDuplicating(null); }
  }

  function openBuilder(page: LandingPage) {
    setBuilderModal(page);
    const s = page.settings as any;
    setBuilderContent(s?.content || s?.html || `<h1>${page.title || page.name}</h1><br/><p>Start building your landing page here...</p>`);
  }

  async function handleSaveBuilder() {
    if (!builderModal) return;
    setSavingContent(true);
    const updatedContent = { ...((builderModal.settings as any) || {}), content: builderContent, html: builderContent };
    try {
      await api.patch(`/marketing/pages/${builderModal.id}`, { content: updatedContent });
    } catch { /* API may fail for unsaved pages; content is preserved locally */ }
    setPages(pages.map(p => p.id === builderModal.id ? { ...p, settings: updatedContent } : p));
    setBuilderModal(null);
    setSavingContent(false);
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
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Build and publish high-converting landing pages</p>
        </div>
        <button onClick={openCreateBlank}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Page
        </button>
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

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl p-1 w-fit">
        <button
          onClick={() => setView('templates')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${view === 'templates' ? 'bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] shadow-sm' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700'}`}>
          <Layers className="w-4 h-4" /> Templates
        </button>
        <button
          onClick={() => setView('mypages')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${view === 'mypages' ? 'bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] shadow-sm' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700'}`}>
          <Globe className="w-4 h-4" /> My Pages
          {pages.length > 0 && (
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              {pages.length}
            </span>
          )}
        </button>
      </div>

      {/* Template Gallery */}
      {view === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">Choose a template to get started quickly, or create a blank page.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PAGE_TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} onUse={openCreateFromTemplate} />
            ))}
          </div>
        </div>
      )}

      {/* My Pages */}
      {view === 'mypages' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..."
              className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
              <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No landing pages yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Pick a template or create a blank page to get started</p>
              <button onClick={() => setView('templates')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
                <Layers className="w-4 h-4" /> Browse Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((page) => (
                <div key={page.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-4">
                  {/* Accent strip */}
                  <div className="h-1 -mx-5 -mt-5 mb-1 rounded-t-2xl" style={{ backgroundColor: (page.settings as any)?.themeColor || '#4f46e5' }} />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] truncate">{page.name || page.title}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        Landing Page
                      </span>
                      {page.slug && <span className="inline-block mt-1.5 ml-2 text-[10px] text-slate-400">/{page.slug}</span>}
                    </div>
                    <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColors[page.status] || 'bg-slate-100 text-slate-600'}`}>
                      {page.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#a3a3a3]">
                    <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {(page.visits || 0).toLocaleString()} visits</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {page.conversions || 0} conv.</span>
                    {page.created_at && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(page.created_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action row 1 */}
                  <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3 mt-auto">
                    <button onClick={() => openBuilder(page)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setPreviewModal(page)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button onClick={() => setShareModal(page)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-teal-600 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 rounded-lg transition">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                    {page.status === 'Draft' && (
                      <button onClick={() => handlePublish(page.id)} disabled={publishing === page.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                        {publishing === page.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />} Publish
                      </button>
                    )}
                    {page.status === 'Published' && (
                      <a href={`/public/landingpage/${page.id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
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

                  {/* Download row */}
                  <PageDownloadRow page={page} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">
                  {selectedTemplate ? `From Template: ${selectedTemplate.name}` : 'Create Landing Page'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Set the page details, then customize in the editor</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Page Name *</label>
                <input required value={pageName} onChange={e => setPageName(e.target.value)} placeholder="e.g. Summer Sale Landing Page"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Link to Campaign</label>
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                  <option value="">-- No Campaign --</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Theme Color</label>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl">
                    <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                    <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="bg-transparent text-sm text-slate-900 dark:text-[#ededed] outline-none flex-1 font-mono uppercase" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">URL Slug</label>
                  <div className="flex items-center gap-1 p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl focus-within:border-indigo-500">
                    <span className="text-xs text-slate-400">/</span>
                    <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="my-page"
                      className="bg-transparent text-sm text-slate-900 dark:text-[#ededed] outline-none flex-1 placeholder:text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {builderModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 dark:bg-[#0d0d0d]">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#161616] border-b border-slate-200 dark:border-[#1f1f1f] shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setBuilderModal(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Page Builder</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Editing: {builderModal.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setPreviewModal({ ...builderModal, settings: { ...(builderModal.settings as any), content: builderContent } as any }); }}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-[#1f1f1f] text-slate-600 dark:text-slate-400 bg-white dark:bg-[#161616] hover:bg-slate-50 text-xs font-semibold rounded-xl transition">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button onClick={handleSaveBuilder} disabled={savingContent}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-sm">
                {savingContent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {savingContent ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-6 max-w-5xl mx-auto w-full">
            <div className="bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl shadow-sm h-full overflow-hidden flex flex-col">
              {/* ── Rich Editor Toolbar ── */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#111] flex-wrap min-h-[36px]">
                {/* Text style */}
                {([
                  { cmd: 'bold',          label: 'B',  cls: 'font-bold'    },
                  { cmd: 'italic',        label: 'I',  cls: 'italic'       },
                  { cmd: 'underline',     label: 'U',  cls: 'underline'    },
                  { cmd: 'strikeThrough', label: 'S',  cls: 'line-through' },
                ] as const).map(({ cmd, label, cls }) => (
                  <button key={cmd} type="button" title={cmd}
                    onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
                    className={`w-6 h-6 flex items-center justify-center text-xs ${cls} rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-700 dark:text-slate-300 transition`}>
                    {label}
                  </button>
                ))}

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Block format */}
                {(['h1','h2','h3','p'] as const).map(tag => (
                  <button key={tag} type="button"
                    onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, tag); }}
                    className="px-1.5 h-6 text-[10px] font-bold rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-600 dark:text-slate-400 transition uppercase">
                    {tag}
                  </button>
                ))}

                {/* Font size */}
                <select title="Font size"
                  onChange={e => { if (e.target.value) document.execCommand('fontSize', false, e.target.value); e.target.value = ''; }}
                  className="h-6 text-[10px] bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333] rounded text-slate-600 dark:text-slate-400 px-1 outline-none cursor-pointer ml-0.5">
                  <option value="">Sz</option>
                  {([['1','XS'],['2','S'],['3','M'],['4','L'],['5','XL'],['6','2X']] as const).map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Lists + indent */}
                <button type="button" title="Bullet list"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
                  className="w-6 h-6 flex items-center justify-center text-[11px] rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-700 dark:text-slate-300 transition">
                  •≡
                </button>
                <button type="button" title="Numbered list"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
                  className="w-6 h-6 flex items-center justify-center text-[9px] font-bold rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-700 dark:text-slate-300 transition">
                  1≡
                </button>
                <button type="button" title="Indent"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('indent'); }}
                  className="w-6 h-6 flex items-center justify-center text-sm rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-500 transition">
                  ⇥
                </button>
                <button type="button" title="Outdent"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('outdent'); }}
                  className="w-6 h-6 flex items-center justify-center text-sm rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-500 transition">
                  ⇤
                </button>

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Alignment */}
                {([
                  { cmd: 'justifyLeft',   label: '«≡' },
                  { cmd: 'justifyCenter', label: '≡'  },
                  { cmd: 'justifyRight',  label: '≡»' },
                ] as const).map(({ cmd, label }) => (
                  <button key={cmd} type="button" title={cmd}
                    onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
                    className="w-6 h-6 flex items-center justify-center text-[10px] rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-600 dark:text-slate-400 transition">
                    {label}
                  </button>
                ))}

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Font color */}
                <label title="Font color" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-[#222] cursor-pointer transition relative overflow-hidden">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 border-b-2 border-red-500 leading-none pointer-events-none">A</span>
                  <input type="color" defaultValue="#e11d48" title="Text color"
                    onChange={e => document.execCommand('foreColor', false, e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                </label>

                {/* Highlight color */}
                <label title="Highlight" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-[#222] cursor-pointer transition relative overflow-hidden">
                  <span className="text-[10px] font-black bg-yellow-300 text-slate-900 px-0.5 rounded-sm pointer-events-none">H</span>
                  <input type="color" defaultValue="#fef08a" title="Highlight color"
                    onChange={e => document.execCommand('hiliteColor', false, e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                </label>

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Link */}
                <button type="button" title="Insert link"
                  onMouseDown={e => { e.preventDefault(); const url = prompt('URL:'); if (url) document.execCommand('createLink', false, url); }}
                  className="px-1.5 h-6 text-[10px] font-semibold rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition">
                  Link
                </button>
                {/* Remove link */}
                <button type="button" title="Remove link"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('unlink'); }}
                  className="px-1.5 h-6 text-[10px] rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-500 transition">
                  ⊘Lnk
                </button>
                {/* Divider */}
                <button type="button" title="Horizontal divider"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('insertHorizontalRule'); }}
                  className="px-1.5 h-6 text-[10px] rounded hover:bg-slate-200 dark:hover:bg-[#222] text-slate-500 transition">
                  ─ HR
                </button>

                <span className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1 shrink-0" />

                {/* Eraser */}
                <button type="button" title="Clear all formatting"
                  onMouseDown={e => { e.preventDefault(); document.execCommand('removeFormat'); }}
                  className="px-1.5 h-6 text-[10px] font-semibold rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition">
                  Erase
                </button>

                <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-600 shrink-0">HTML</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: builderContent }}
                onInput={e => setBuilderContent((e.currentTarget as HTMLDivElement).innerHTML)}
                className="flex-1 overflow-y-auto p-6 text-base text-slate-800 dark:text-[#ededed] outline-none prose prose-slate dark:prose-invert max-w-none"
                style={{ minHeight: 0 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && <ShareModal page={shareModal} onClose={() => setShareModal(null)} />}

      {/* Preview Modal */}
      {previewModal && <PreviewModal page={previewModal} onClose={() => setPreviewModal(null)} />}
    </div>
  );
}

// ─── Download Row ─────────────────────────────────────────────────────────────

function PageDownloadRow({ page }: { page: LandingPage }) {
  const [busy, setBusy] = useState<'pdf' | 'csv' | 'excel' | null>(null);

  async function fetchAndDownload(type: 'pdf' | 'csv' | 'excel') {
    setBusy(type);
    try {
      await new Promise(r => setTimeout(r, 600));
      if (type === 'pdf') {
        const win = window.open('', '_blank')!;
        const content = (page.settings as any)?.content || '';
        win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${page.name || page.title}</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#111;}h1{font-size:22px;}@media print{button{display:none!important;}}</style>
</head><body><h1>${page.name || page.title}</h1>${content}
<button onclick="window.print()" style="margin-top:24px;padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">Print / Save as PDF</button>
</body></html>`);
        win.document.close();
      } else {
        alert('No submissions data available for this landing page.');
      }
    } catch {
      alert('Could not generate download.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-0.5">Download:</span>
      <button onClick={() => fetchAndDownload('pdf')} disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 disabled:opacity-50 rounded-lg transition border border-red-100 dark:border-red-900/30">
        {busy === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
      </button>
      <button onClick={() => fetchAndDownload('csv')} disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 disabled:opacity-50 rounded-lg transition border border-emerald-100 dark:border-emerald-900/30">
        {busy === 'csv' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} CSV
      </button>
      <button onClick={() => fetchAndDownload('excel')} disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 disabled:opacity-50 rounded-lg transition border border-blue-100 dark:border-blue-900/30">
        {busy === 'excel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Excel
      </button>
    </div>
  );
}
