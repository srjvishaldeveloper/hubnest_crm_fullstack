'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Menu, Search, Bell, Plus, X, Command, MessageSquare, BookOpen, ChevronDown, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import NotificationDropdown from './NotificationDropdown';
import { useChatStore } from '../../store/chatStore';
import ChatDrawer from './ChatDrawer';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  role?: string;
}

export default function AdminHeader({ onToggleSidebar, sidebarOpen, role = 'Admin' }: AdminHeaderProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const { setIsOpen, unreadTotal, initSocket } = useChatStore();

  useEffect(() => {
    if (role === 'Admin') {
      initSocket();
    }
  }, [role, initSocket]);

  // Dynamic Page Title & Subtitle based on path
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Welcome back to HubNest CRM';

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
  } else if (pathname.includes('/admin/subscription')) {
    pageTitle = 'Subscription & Usage';
    pageSubtitle = 'Monitor plan usage and manage your subscription';
  } else if (pathname.includes('/admin/security')) {
    pageTitle = 'Security & MFA';
    pageSubtitle = 'Manage multi-factor authentication and login activity';
  } else if (pathname.includes('/admin/dashboard')) {
    pageTitle = 'Home';
    pageSubtitle = 'Overview of system status and performance metrics';
  } else if (pathname.includes('/finance/invoices')) {
    pageTitle = 'Invoices';
    pageSubtitle = 'Manage and track all invoices';
  } else if (pathname.includes('/finance/payments')) {
    pageTitle = 'Payments';
    pageSubtitle = 'Track payment transactions';
  } else if (pathname.includes('/finance/expenses')) {
    pageTitle = 'Expenses';
    pageSubtitle = 'Manage and approve expenses';
  } else if (pathname.includes('/finance/vendors')) {
    pageTitle = 'Vendors';
    pageSubtitle = 'Manage vendor directory';
  } else if (pathname.includes('/finance/analytics')) {
    pageTitle = 'Financial Analytics';
    pageSubtitle = 'Revenue, cash flow, and financial insights';
  } else if (pathname.includes('/finance')) {
    pageTitle = 'Finance';
    pageSubtitle = 'Financial overview and department metrics';
  } else if (pathname.includes('/support')) {
    pageTitle = 'Support';
    pageSubtitle = 'Manage tickets, customers, and knowledge base';
  }

  const badgeColor = 'text-[#2563EB] bg-blue-50';

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#1A1A1A] border-b border-slate-200 dark:border-[#333333] px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Page Title/Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button onClick={onToggleSidebar} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] hover:text-slate-700 dark:hover:text-white transition shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0F172A] dark:text-white leading-tight font-sans tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Search + Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search bar */}
          <div 
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#333333] rounded-xl px-3 py-2 w-52 lg:w-64 hover:border-slate-300 dark:hover:border-[#444] focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#2A2A2A] transition group cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0 group-focus-within:text-blue-500 transition" />
            <input readOnly type="text" placeholder="Search anything..." className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-pointer" />
            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-[#a3a3a3] bg-slate-100 dark:bg-[#161616] border border-slate-200 dark:border-[#1f1f1f] px-1.5 py-0.5 rounded-md shrink-0">
              ⌘K
            </kbd>
          </div>

          <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} role="tenant-admin" />

          {/* Bell Icon */}
          <NotificationDropdown />

          {/* Chat Icon (Only for Org Admin) */}
          {role === 'Admin' && (
            <>
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2A2A2A] transition group hidden sm:flex"
                title="Super Admin Support Chat"
              >
                <MessageSquare className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition" />
                {unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[22px] h-[22px] px-1.5 bg-[#2563EB] text-[9px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#1A1A1A]">
                    {unreadTotal}
                  </span>
                )}
              </button>
              <ChatDrawer />
            </>
          )}
          {/* Docs Icon */}
          <Link href="/docs" className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2A2A2A] transition group hidden sm:flex" title="Documentation">
            <BookOpen className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition" />
          </Link>
          {/* Theme Toggle */}
          <ThemeToggle />

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
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#333333] rounded-xl shadow-lg py-1 z-20"
                  >
                    {(role === 'Admin' || role === 'Super Admin') && (
                      <>
                        <Link
                          href="/admin/users?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add New User
                        </Link>
                        <Link
                          href="/admin/crm-control"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Manage CRM Controls
                        </Link>
                        <Link
                          href="/admin/roles"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Configure Roles
                        </Link>
                      </>
                    )}
                    {(role === 'Sales Manager' || role === 'Sales Executive') && (
                      <>
                        <Link
                          href="/sales-manager/team?add=true"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Sales Executive
                        </Link>
                        <Link
                          href="/sales-manager/leads?add=true"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Lead
                        </Link>
                      </>
                    )}
                    {(role === 'Support Manager' || role === 'Support Agent') && (
                      <>
                        <Link
                          href="/support/tickets?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Create Ticket
                        </Link>
                      </>
                    )}
                    {(role === 'Finance Executive' || role === 'Finance Manager' || role === 'Accountant') && (
                      <>
                        <Link
                          href="/finance/invoices?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Create Invoice
                        </Link>
                        <Link
                          href="/finance/payments?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Record Payment
                        </Link>
                        <Link
                          href="/finance/expenses?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Expense
                        </Link>
                        <Link
                          href="/finance/vendors?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Vendor
                        </Link>
                      </>
                    )}
                    {!['Admin', 'Super Admin', 'Sales Manager', 'Sales Executive', 'Support Manager', 'Support Agent', 'Finance Executive', 'Finance Manager', 'Accountant'].includes(role) && (
                      <>
                        <Link
                          href="/admin/users?action=add"
                          onClick={() => setShowQuickAdd(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#2A2A2A] font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add New User
                        </Link>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-[#333333] ml-1"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-50 dark:ring-blue-500/20 shadow-sm text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{user?.name || 'Admin'}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide ${badgeColor} dark:bg-blue-500/10 dark:text-blue-400 whitespace-nowrap`}>
                  {role}
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
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#333] rounded-xl shadow-lg py-1 z-20"
                  >
                    <Link href={`/${role === 'Admin' ? 'admin' : 'superadmin'}/profile`} onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] font-semibold transition">Profile</Link>
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
