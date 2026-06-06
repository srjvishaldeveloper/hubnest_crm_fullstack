'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Menu, Bell, Search, Plus, ChevronDown, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/marketing/dashboard': { title: 'Home', subtitle: 'Marketing performance overview' },
  '/marketing/campaigns': { title: 'Campaigns', subtitle: 'Manage and track your advertising campaigns' },
  '/marketing/leads': { title: 'Leads', subtitle: 'Track and manage marketing-generated leads' },
  '/marketing/analytics': { title: 'Analytics', subtitle: 'Deep dive into campaign performance data' },
  '/marketing/profile': { title: 'Profile', subtitle: 'Manage your account and preferences' },
};

export default function MarketingHeader({ onToggleSidebar, sidebarOpen }: Props) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const meta = Object.entries(PAGE_META).find(([key]) => pathname.startsWith(key))?.[1]
    ?? { title: 'Marketing', subtitle: 'Marketing module' };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight tracking-tight">{meta.title}</h1>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-52 lg:w-64 focus-within:border-[#4F46E5] focus-within:bg-white transition group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#4F46E5] transition shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns, leads..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition group">
            <Bell className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-700 transition" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4F46E5] rounded-full ring-2 ring-white" />
          </button>

          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition group hidden sm:flex">
            <MessageSquare className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-700 transition" />
          </button>

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
                    className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                  >
                    {[
                      { label: 'New Campaign', href: '/marketing/campaigns' },
                      { label: 'View Leads', href: '/marketing/leads' },
                      { label: 'View Analytics', href: '/marketing/analytics' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowQuickAdd(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
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
          <button className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-violet-50 shadow-sm text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-[#0F172A]">{user?.name || 'Marketing User'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide text-[#4F46E5] bg-violet-50 whitespace-nowrap">
                {user?.role || 'Marketing Head'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
