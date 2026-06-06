'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  Menu, Search, Bell, MessageSquare, Plus, ChevronDown,
} from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  role?: string;
}

export default function AdminHeader({ onToggleSidebar, sidebarOpen, role = 'Admin' }: AdminHeaderProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  // Dynamic Page Title & Subtitle based on path
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Welcome back to Job Nest CRM';

  if (pathname.includes('/admin/users')) {
    pageTitle = 'Users';
    pageSubtitle = 'Manage team accounts, permissions, and status';
  } else if (pathname.includes('/admin/crm-control')) {
    pageTitle = 'CRM Control';
    pageSubtitle = 'Configure workflows, sales pipeline, and support SLAs';
  } else if (pathname.includes('/admin/reports')) {
    pageTitle = 'Reports & Analytics';
    pageSubtitle = 'Generate performance reports and custom summaries';
  } else if (pathname.includes('/admin/profile')) {
    pageTitle = 'Profile Settings';
    pageSubtitle = 'Update personal details, active sessions, and security';
  } else if (pathname.includes('/admin/roles')) {
    pageTitle = 'Roles & Permissions';
    pageSubtitle = 'Configure global security policies and user access levels';
  } else if (pathname.includes('/admin/dashboard')) {
    pageTitle = 'Home';
    pageSubtitle = 'Overview of system status and performance metrics';
  }

  const badgeColor = 'text-[#2563EB] bg-blue-50';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Page Title/Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button onClick={onToggleSidebar} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight font-sans tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Search + Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-52 lg:w-64 hover:border-slate-300 focus-within:border-blue-500 focus-within:bg-white transition group">
            <Search className="w-4 h-4 text-slate-400 shrink-0 group-focus-within:text-blue-500 transition" />
            <input type="text" placeholder="Search anything..." className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400" />
          </div>

          {/* Bell Icon */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition group">
            <Bell className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-700 transition" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white" />
          </button>

          {/* Chat Icon */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition group hidden sm:flex">
            <MessageSquare className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-700 transition" />
          </button>

          {/* Quick Add Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>

            <AnimatePresence>
              {showQuickAdd && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowQuickAdd(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
                  >
                    {role === 'Sales Manager' ? (
                      <>
                        <Link
                          href="/sales-manager/team?add=true"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Sales Executive
                        </Link>
                        <Link
                          href="/sales-manager/leads?add=true"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Lead
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/admin/users"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add New User
                        </Link>
                        <Link
                          href="/admin/crm-control"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Manage CRM Controls
                        </Link>
                        <Link
                          href="/admin/roles"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Configure Roles
                        </Link>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <button className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-50 shadow-sm text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-[#0F172A]">{user?.name || 'Admin'}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide ${badgeColor} whitespace-nowrap`}>
                {role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
