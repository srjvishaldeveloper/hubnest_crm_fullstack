'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import {
  Home, Users, BarChart3, UserCircle, LogOut, X,
  Sparkles, Briefcase, ClipboardList, Shield, TrendingUp,
  Kanban, CheckSquare, Activity as ActivityIcon, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: 'MAIN MENU',
    items: [
      { title: 'Home', href: '/sales-manager/dashboard', icon: Home },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { title: 'Leads', href: '/sales-manager/leads', icon: Users },
      { title: 'Pipeline', href: '/sales-manager/leads?tab=pipeline', icon: Kanban },
      { title: 'Team', href: '/sales-manager/team', icon: ClipboardList },
      { title: 'Reports', href: '/sales-manager/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'WORKFLOW & CHAT',
    items: [
      { title: 'Tasks', href: '/sales-manager/tasks', icon: CheckSquare },
      { title: 'Activity', href: '/sales-manager/activity', icon: ActivityIcon },
      { title: 'Team Chat', href: '/sales-manager/chat', icon: MessageSquare },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { title: 'Profile', href: '/sales-manager/profile', icon: UserCircle },
    ],
  },
];

export default function SalesManagerSidebar({ open, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const isActive = (href: string) => {
    if (href === '/sales-manager/dashboard') return pathname === href;
    if (href.includes('?tab=pipeline')) return pathname === '/sales-manager/leads' && typeof window !== 'undefined' && window.location.search.includes('tab=pipeline');
    if (href === '/sales-manager/leads') return pathname === '/sales-manager/leads' && (typeof window === 'undefined' || !window.location.search.includes('tab=pipeline'));
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]';
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col
        bg-white dark:bg-[#181818] border-r border-slate-200/80 dark:border-[#333333]
        transition-all duration-300 ease-in-out shadow-sm
        w-[240px] ${sidebarWidth} ${mobileTranslate}`}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-[72px] border-b border-slate-100 dark:border-[#333333] shrink-0 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#4f46e5] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className={`${collapsed ? 'lg:hidden' : ''} overflow-hidden`}>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap truncate w-40" title={(user as any)?.company || 'HubNest CRM'}>
              {(user as any)?.company || 'HubNest CRM'}
            </p>
            <span className="inline-flex items-center text-[10px] font-extrabold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
              Sales Manager
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RBAC badge */}
        {!collapsed && (
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">RBAC Secured · Manager Access</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className={`text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider px-2 mb-1.5 ${collapsed ? 'lg:hidden' : ''}`}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onClose} title={item.title}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${active
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#4f46e5] text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] hover:text-[#0F172A] dark:hover:text-white'}
                      ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
                    <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-[#2563EB]'}`} />
                    <span className={`${collapsed ? 'lg:hidden' : ''} truncate`}>{item.title}</span>
                    {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-70" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* AI Card */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-blue-950/40 dark:to-slate-900/40 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Team Insights</p>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Performance alerts, lead scoring & revenue forecasts.</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Team up 18% this week</span>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
                className="w-full mt-2 py-1.5 bg-gradient-to-r from-[#2563EB] to-[#4f46e5] hover:opacity-90 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Ask AI Manager
              </button>
            </div>
          </div>
        )}

        {/* Bottom Profile */}
        <div className="border-t border-slate-100 dark:border-[#333333] p-3 shrink-0 space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-[#2A2A2A] ${collapsed ? 'lg:justify-center lg:p-1.5' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-100 text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-[#0F172A] dark:text-white text-xs font-bold truncate leading-tight">{user?.name || 'Sales Manager'}</p>
              <span className="inline-block text-[9px] font-extrabold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                Manager
              </span>
            </div>
          </div>
          <button onClick={handleLogout} title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all group ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#181818] border-t border-slate-200 dark:border-[#333333] z-50">
        <div className="flex items-center justify-around h-16">
          {[
            { title: 'Home', href: '/sales-manager/dashboard', icon: Home },
            { title: 'Leads', href: '/sales-manager/leads', icon: Users },
            { title: 'Team', href: '/sales-manager/team', icon: ClipboardList },
            { title: 'Reports', href: '/sales-manager/reports', icon: BarChart3 },
            { title: 'Profile', href: '/sales-manager/profile', icon: UserCircle },
          ].map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1">
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-gradient-to-r from-[#2563EB] to-[#4f46e5]' : ''}`}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <span className={`text-[9px] font-semibold ${active ? 'text-[#2563EB]' : 'text-slate-400'}`}>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
