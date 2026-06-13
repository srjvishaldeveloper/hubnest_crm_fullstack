'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Menu, Search, Plus, ChevronDown, MessageSquare, LogOut, Megaphone, Users, Target, LayoutTemplate, Workflow } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeToggle from '../shared/ThemeToggle';
import NotificationDropdown from '../shared/NotificationDropdown';

interface Props {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  // ── Top-level pages ──────────────────────────────────────────────────────────
  '/marketing/dashboard':   { title: 'Dashboard',          subtitle: 'Marketing performance overview' },
  '/marketing/automation':  { title: 'Automation',         subtitle: 'Manage automated marketing workflows' },
  '/marketing/ai-studio':   { title: 'AI Studio',          subtitle: 'AI-powered content and campaign generation' },
  '/marketing/analytics':   { title: 'Analytics & Reports',subtitle: 'Deep dive into campaign performance data' },
  '/marketing/profile':     { title: 'Profile',            subtitle: 'Manage your account and preferences' },

  // ── Campaigns ────────────────────────────────────────────────────────────────
  '/marketing/campaigns/automation': { title: 'Campaign Automation',  subtitle: 'Set up trigger-based campaign sequences' },
  '/marketing/campaigns/ab-testing': { title: 'A/B Testing',          subtitle: 'Split-test campaigns to optimise performance' },
  '/marketing/campaigns/scheduler':  { title: 'Campaign Scheduler',   subtitle: 'Plan and schedule campaigns by date and time' },
  '/marketing/campaigns/budget':     { title: 'Campaign Budget',      subtitle: 'Allocate and track spend across campaigns' },
  '/marketing/campaigns/whatsapp':   { title: 'WhatsApp Campaigns',   subtitle: 'Reach contacts via WhatsApp messaging' },
  '/marketing/campaigns/email':      { title: 'Email Campaigns',      subtitle: 'Design and send email campaigns' },
  '/marketing/campaigns/sms':        { title: 'SMS Campaigns',        subtitle: 'Send targeted SMS messages to your audience' },
  '/marketing/campaigns/meta':       { title: 'Meta Messenger',       subtitle: 'Run campaigns through Meta Messenger' },
  '/marketing/campaigns/push':       { title: 'Push Notifications',   subtitle: 'Send browser and app push notifications' },
  '/marketing/campaigns/create':     { title: 'Create Campaign',      subtitle: 'Launch a new marketing campaign' },
  '/marketing/campaigns':            { title: 'All Campaigns',        subtitle: 'Manage and track all your campaigns' },

  // ── Builders ─────────────────────────────────────────────────────────────────
  '/marketing/landing-pages': { title: 'Landing Pages',    subtitle: 'Build and publish high-converting landing pages' },
  '/marketing/forms':         { title: 'Form Builder',     subtitle: 'Create custom lead capture and survey forms' },
  '/marketing/templates':     { title: 'Template Library', subtitle: 'Browse and manage reusable campaign templates' },
  '/marketing/media':         { title: 'Media Library',    subtitle: 'Organise images, videos, and brand assets' },

  // ── Contacts & Data ───────────────────────────────────────────────────────────
  '/marketing/contacts/import':   { title: 'Import Center',      subtitle: 'Import contacts from CSV, CRM, or integrations' },
  '/marketing/contacts/segments': { title: 'Audience Segments',  subtitle: 'Build and refine targeted audience segments' },
  '/marketing/contacts/lists':    { title: 'Contact Lists',      subtitle: 'Manage your subscriber and contact lists' },

  // ── Analytics sub-pages ───────────────────────────────────────────────────────
  '/marketing/analytics/campaigns': { title: 'Campaign Analytics', subtitle: 'Performance metrics for each campaign' },
  '/marketing/analytics/audience':  { title: 'Audience Analytics', subtitle: 'Understand your audience demographics and behaviour' },
  '/marketing/analytics/funnel':    { title: 'Funnel Analytics',   subtitle: 'Visualise conversion funnels and drop-off points' },
  '/marketing/analytics/roi':       { title: 'ROI Analytics',      subtitle: 'Measure return on investment across channels' },

  // ── Platform ──────────────────────────────────────────────────────────────────
  '/marketing/integrations':  { title: 'Integrations',   subtitle: 'Connect third-party tools and services' },
  '/marketing/subscriptions': { title: 'Subscriptions',  subtitle: 'Manage your plan and billing' },
  '/marketing/webhooks':      { title: 'Webhooks & APIs',subtitle: 'Configure webhooks and API access' },
  '/marketing/settings':      { title: 'Settings',       subtitle: 'Configure your marketing workspace' },

  // ── Leads ────────────────────────────────────────────────────────────────────
  '/marketing/leads/assign':   { title: 'Lead Assignment', subtitle: 'Distribute incoming leads to sales executives' },
  '/marketing/leads/segments': { title: 'Lead Segments',   subtitle: 'Group and filter leads by criteria' },
  '/marketing/leads':          { title: 'Leads',           subtitle: 'Track and manage marketing-generated leads' },

  // ── Reports ──────────────────────────────────────────────────────────────────
  '/marketing/reports': { title: 'Reports', subtitle: 'Generate and export detailed marketing reports' },
};

export default function MarketingHeader({ onToggleSidebar, sidebarOpen }: Props) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  // Dynamic route meta — check before static lookup
  let dynamicMeta: { title: string; subtitle: string } | null = null;
  if (/^\/marketing\/leads\/[^/]+$/.test(pathname) && !pathname.endsWith('/assign') && !pathname.endsWith('/segments')) {
    dynamicMeta = { title: 'Lead Detail', subtitle: 'View and manage individual lead information' };
  } else if (/^\/marketing\/campaigns\/[^/]+$/.test(pathname) &&
    !['email','whatsapp','sms','meta','push','ab-testing','scheduler','budget','automation','create'].includes(pathname.split('/').pop() || '')) {
    dynamicMeta = { title: 'Campaign Detail', subtitle: 'View and manage campaign settings and metrics' };
  }

  // Sort keys longest-first so more specific paths match before their parents.
  const sortedEntries = Object.entries(PAGE_META).sort(([a], [b]) => b.length - a.length);
  const meta =
    dynamicMeta ??
    sortedEntries.find(([key]) => pathname === key || pathname.startsWith(key + '/'))?.[1] ??
    { title: 'Marketing', subtitle: 'Marketing module' };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0F172A] dark:text-[#F9FAFB] leading-tight tracking-tight">
              {meta.title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-52 lg:w-64 focus-within:border-[#4F46E5] focus-within:bg-white dark:focus-within:bg-slate-800 transition group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#4F46E5] transition shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns, contacts..."
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none w-full placeholder:text-slate-400"
            />
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Messages */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group hidden sm:flex">
            <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Quick Add */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#4F46E5] hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>

            <AnimatePresence>
              {showQuickAdd && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowQuickAdd(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20"
                  >
                    {[
                      { label: 'New Campaign',       href: '/marketing/campaigns/create'   },
                      { label: 'New Email Campaign',  href: '/marketing/campaigns/email'    },
                      { label: 'New WhatsApp Campaign',href: '/marketing/campaigns/whatsapp'},
                      { label: 'New SMS Campaign',    href: '/marketing/campaigns/sms'      },
                      { label: 'View All Campaigns',  href: '/marketing/campaigns'          },
                      { label: 'View Analytics',      href: '/marketing/analytics'          },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowQuickAdd(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#4F46E5]" />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700 ml-1"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-violet-50 dark:ring-violet-900/30 shadow-sm text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB]">
                  {user?.name || 'Marketing User'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide text-[#4F46E5] bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400 whitespace-nowrap">
                  {user?.role || 'Marketing Head'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20"
                  >
                    <Link href="/marketing/profile" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold transition">Profile</Link>
                    <button onClick={() => { setShowProfileMenu(false); useAuthStore.getState().logout(); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold transition flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
