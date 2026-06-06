'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useSuperAdminUIStore } from '../../store/uiStore';
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Plus,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { setShowAddTenantModal } = useSuperAdminUIStore();
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger + Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#0F172A] truncate">
              {greeting}, {user?.name?.split(' ')[0] || 'Super Admin'} 👋
            </h1>
            <p className="text-xs text-[#64748B] hidden sm:block">
              Welcome back to Job Nest CRM
            </p>
          </div>
        </div>

        {/* Right: Search + Actions + Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search (md+) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 w-56 lg:w-72 hover:border-blue-300 hover:bg-white transition-all duration-200 group">
            <Search className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent text-sm text-slate-700 outline-none w-full placeholder:text-slate-400"
            />
            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group">
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Messages */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group hidden sm:flex">
            <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Quick Add */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
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
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/60 rounded-xl shadow-lg py-1 z-20"
                  >
                    <button
                      onClick={() => {
                        setShowQuickAdd(false);
                        setShowAddTenantModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold text-left"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2563EB]" /> Add Tenant
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Avatar */}
          <button className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/60 ml-1">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-blue-400 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-100 shadow-sm">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-[#0F172A]">{user?.name || 'Super Admin'}</span>
              <span className="text-[10px] font-medium text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">{user?.role || 'Super Admin'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
