'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useSuperAdminUIStore } from '../../store/uiStore';
import {
  Menu,
  Search,
  MessageSquare,
  Plus,
  ChevronDown,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import GlobalSearch from '../shared/GlobalSearch';
import { useChatStore } from '../../store/chatStore';
import ChatDrawer from '../shared/ChatDrawer';
import NotificationDropdown from '../shared/NotificationDropdown';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { setShowAddTenantModal } = useSuperAdminUIStore();
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const { setIsOpen, unreadTotal, initSocket } = useChatStore();

  // Initialize socket for real-time notifications
  useEffect(() => {
    if (user?.role === 'Super Admin') {
      initSocket();
    }
  }, [user, initSocket]);


  return (
    <>
      <header className="sticky top-0 z-20 bg-card/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-[#1f1f1f] px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Hamburger + Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="p-2 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#1C2230] hover:text-slate-700 dark:hover:text-[#F9FAFB] transition-all duration-200 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB] truncate">
                {greeting}, {user?.name?.split(' ')[0] || 'Super Admin'} 👋
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] hidden sm:block">
                Welcome back to Job Nest CRM
              </p>
            </div>
          </div>

          {/* Right: Search + Actions + Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Search (md+) */}
            <div 
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-[#111111] border border-slate-200/60 dark:border-[#222] rounded-xl px-3 py-2 w-56 lg:w-72 hover:border-amber-300 dark:hover:border-amber-500 hover:bg-white dark:hover:bg-[#161616] transition-all duration-200 group cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-400 dark:text-[#6B7280] shrink-0 group-hover:text-[#F59E0B] transition-colors" />
              <input
                type="text"
                readOnly
                placeholder="Search anything..."
                className="bg-transparent text-sm text-slate-700 dark:text-[#F9FAFB] outline-none w-full placeholder:text-slate-400 dark:placeholder:text-[#6B7280] cursor-pointer"
              />
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-[#a3a3a3] bg-slate-100 dark:bg-[#161616] border border-slate-200 dark:border-[#1f1f1f] px-1.5 py-0.5 rounded-md shrink-0">
                ⌘K
              </kbd>
            </div>

            <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} role="super-admin" />

            {/* Notifications */}
            <NotificationDropdown />

            {/* Messages */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1C2230] transition-all duration-200 group hidden sm:flex"
              title="Internal Chat"
            >
              <MessageSquare className="w-5 h-5 text-slate-500 dark:text-[#9CA3AF] group-hover:text-slate-700 dark:group-hover:text-[#F9FAFB] transition-colors" />
              {unreadTotal > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-5.5 h-5.5 px-1.5 bg-amber-500 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-card dark:border-[#0a0a0a]">
                  {unreadTotal}
                </span>
              ) : null}
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Quick Add */}
            <div className="relative">
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Quick Add</span>
              </button>

              <AnimatePresence>
                {showQuickAdd && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowQuickAdd(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-card dark:bg-[#111111] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl shadow-lg py-1 z-20"
                    >
                      <button
                        onClick={() => {
                          setShowQuickAdd(false);
                          setShowAddTenantModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-[#9CA3AF] hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#1C2230] font-semibold text-left"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F59E0B]" /> Add Tenant
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <button className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/60 dark:border-[#252B36] ml-1">
              <div className="w-9 h-9 bg-gradient-to-br from-[#F59E0B] to-amber-400 rounded-full flex items-center justify-center shrink-0 ring-2 ring-amber-100 dark:ring-amber-900/30 shadow-sm">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{user?.name || 'Super Admin'}</span>
                <span className="text-[10px] font-medium text-[#F59E0B] dark:text-[#FBBF24] bg-amber-50 dark:bg-[#F59E0B]/15 px-1.5 py-0.5 rounded whitespace-nowrap">{user?.role || 'Super Admin'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>
          </div>
        </div>
      </header>
      <ChatDrawer />
    </>
  );
}
