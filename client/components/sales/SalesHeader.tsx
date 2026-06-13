'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Bell, Menu, Search, MessageSquare, Plus, ChevronDown } from 'lucide-react';
import NotificationDropdown from '../shared/NotificationDropdown';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/sales/dashboard': { title: 'Home', subtitle: 'Here\'s your sales overview for today.' },
  '/sales/leads': { title: 'Leads', subtitle: 'Track and manage your leads pipeline.' },
  '/sales/tasks': { title: 'Tasks', subtitle: 'Manage your meetings and follow-up activities.' },
  '/sales/activity': { title: 'Activity', subtitle: 'Log and trace your communication history.' },
  '/sales/profile': { title: 'Profile', subtitle: 'Manage your target metrics and account credentials.' },
};

export default function SalesHeader({ onToggleSidebar, sidebarOpen }: Props) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const meta = Object.entries(PAGE_META).find(([key]) => pathname.startsWith(key))?.[1]
    ?? { title: 'Sales', subtitle: 'Sales executive module' };

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
            <h1 className="text-[20px] font-bold text-[#0F172A] dark:text-[#F9FAFB] leading-tight tracking-tight font-sans">{meta.title}</h1>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl px-3 py-2 w-52 lg:w-64 focus-within:border-[#2563EB] focus-within:bg-white transition group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition shrink-0" />
            <input
              type="text"
              placeholder="Search leads, tasks..."
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <NotificationDropdown />

          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition group hidden sm:flex">
            <MessageSquare className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-700 transition" />
          </button>

          {/* Quick Add */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>

            <AnimatePresence>
              {showQuickAdd && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowQuickAdd(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                  >
                    {[
                      { label: 'Add Lead', href: '/sales/leads' },
                      { label: 'Schedule Task', href: '/sales/tasks' },
                      { label: 'Log Activity', href: '/sales/activity' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowQuickAdd(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:bg-[#161616] font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-50 shadow-sm text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{user?.name || 'Sales Executive'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide text-blue-600 bg-blue-50 whitespace-nowrap">
                {user?.role || 'Sales Executive'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
