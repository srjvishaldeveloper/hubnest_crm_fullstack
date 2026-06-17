'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import {
  Home, Users, CheckSquare, Activity, UserCircle, LogOut, X,
  Sparkles, BarChart3, GitBranch, Send, Zap, Briefcase
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
      { title: 'Dashboard', href: '/sales/dashboard', icon: Home },
    ],
  },
  {
    title: 'SALES',
    items: [
      { title: 'Leads', href: '/sales/leads', icon: Users },
      { title: 'Pipeline', href: '/sales/leads/pipeline', icon: GitBranch },
      { title: 'Tasks', href: '/sales/tasks', icon: CheckSquare },
      { title: 'Activity Log', href: '/sales/activity', icon: Activity },
    ],
  },

  {
    title: 'ACCOUNT',
    items: [
      { title: 'Profile & Settings', href: '/sales/profile', icon: UserCircle },
    ],
  },
];

export default function SalesSidebar({ open, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/sales/dashboard' && pathname.startsWith(href));

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
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className={`${collapsed ? 'lg:hidden' : ''} overflow-hidden`}>
            <p className="text-[#0F172A] dark:text-white font-bold text-sm tracking-tight whitespace-nowrap">HubNest CRM</p>
            <span className="inline-flex items-center text-[10px] font-extrabold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
              Sales Executive
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

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
                        ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900/40 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Lead Assistant</p>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Smart insights, follow-up suggestions and win probability scores.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
                className="w-full mt-2 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Ask AI
              </button>
            </div>
          </div>
        )}

        {/* Bottom Profile */}
        <div className="border-t border-slate-100 dark:border-[#333333] p-3 shrink-0 space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-[#2A2A2A] ${collapsed ? 'lg:justify-center lg:p-1.5' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-100 text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-[#0F172A] dark:text-white text-xs font-bold truncate leading-tight">{user?.name || 'Sales User'}</p>
              <span className="inline-block text-[9px] font-extrabold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                {user?.role_name || user?.role || 'Sales Exec'}
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
            { title: 'Home', href: '/sales/dashboard', icon: Home },
            { title: 'Leads', href: '/sales/leads', icon: Users },
            { title: 'Pipeline', href: '/sales/leads/pipeline', icon: GitBranch },
            { title: 'Tasks', href: '/sales/tasks', icon: CheckSquare },
            { title: 'Profile', href: '/sales/profile', icon: UserCircle },
          ].map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1">
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-[#2563EB]' : ''}`}>
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
