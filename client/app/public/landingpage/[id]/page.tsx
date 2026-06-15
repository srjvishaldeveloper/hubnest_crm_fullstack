'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Send, Globe } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface PublicLandingPage {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  status: string;
  seo_title?: string;
  seo_description?: string;
  settings?: {
    content?: string;
    template?: string;
    themeColor?: string;
    submitText?: string;
    successMessage?: string;
    redirectUrl?: string;
    accent_color?: string;
  };
}

type Status = 'loading' | 'ready' | 'not_found' | 'error';

export default function PublicLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<PublicLandingPage | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE}/marketing/pages/${id}/public`)
      .then(async (res) => {
        if (res.status === 404) { setStatus('not_found'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const p: PublicLandingPage = json.data?.page || json.page || json.data || json;
        if (!p?.id) { setStatus('not_found'); return; }
        setPage(p);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading page…</span>
        </div>
      </div>
    );
  }

  if (status === 'not_found' || (page && page.status === 'Draft')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-50 dark:ring-amber-900/10">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-[#ededed]">Page Not Available</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">
            This landing page is not published or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-500">Unable to load this page. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!page) return null;

  const accent = page.settings?.themeColor || page.settings?.accent_color || '#4f46e5';
  const rawContent = page as any;
  const content = page.settings?.content || (rawContent.settings as any)?.html || rawContent.content?.html || rawContent.content?.content || '';
  const title = page.title || page.name;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans">
      {/* SEO-friendly head title via document title */}
      <title>{page.seo_title || title}</title>

      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      {/* Hero header */}
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
            <p className="mt-3 text-base text-slate-500 dark:text-[#a3a3a3] max-w-2xl mx-auto leading-relaxed">
              {page.seo_description}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {content ? (
          <div
            className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-8"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-12 text-center">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-[#a3a3a3] font-medium">This page has no content yet.</p>
          </div>
        )}
      </main>

      {/* Footer branding */}
      <footer className="py-8 text-center">
        <p className="text-[11px] font-medium text-slate-400 dark:text-[#666]">
          Powered by <span className="font-bold text-slate-900 dark:text-[#ededed]">HubNest CRM</span>
        </p>
      </footer>
    </div>
  );
}
