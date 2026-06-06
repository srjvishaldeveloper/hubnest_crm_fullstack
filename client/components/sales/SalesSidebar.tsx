'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import {
  Home, Users, CheckSquare, Activity, UserCircle, LogOut, X, Sparkles, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export default function SalesSidebar({ open, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]';
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  const menuItems = [
    { title: 'Home', href: '/sales/dashboard', icon: Home },
    { title: 'Leads', href: '/sales/leads', icon: Users },
    { title: 'Tasks', href: '/sales/tasks', icon: CheckSquare },
    { title: 'Activity', href: '/sales/activity', icon: Activity },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col
        bg-[#0F172A] transition-all duration-300 ease-in-out border-r border-slate-800
        w-[240px] ${sidebarWidth} ${mobileTranslate}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-[72px] border-b border-slate-800 shrink-0 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className={`${collapsed ? 'lg:hidden' : ''} overflow-hidden`}>
            <p className="text-white font-bold text-sm tracking-tight font-sans">Job Nest CRM</p>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Exec</span>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto p-1.5 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {/* Main Menu */}
          <div className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            )}
            {menuItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={item.title}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${active
                      ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                    ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className={`${collapsed ? 'lg:hidden' : ''} truncate`}>{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* System Section */}
          <div className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">System</p>
            )}
            <Link
              href="/sales/profile"
              onClick={onClose}
              title="Profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${pathname === '/sales/profile'
                  ? 'bg-[#2563EB] text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <UserCircle className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${pathname === '/sales/profile' ? 'text-white' : 'text-slate-400'}`} />
              <span className={`${collapsed ? 'lg:hidden' : ''} truncate`}>Profile</span>
            </Link>
          </div>
        </nav>

        {/* AI Promo Card */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/70 to-slate-900/70 border border-blue-800/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI Lead Assistant</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Get smart lead insights and follow-up recommendations.</p>
              <button className="w-full mt-2.5 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition shadow-sm">
                Ask AI
              </button>
            </div>
          </div>
        )}

        {/* Bottom Profile & Logout */}
        <div className="border-t border-slate-800 p-3 shrink-0 space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 ${collapsed ? 'lg:justify-center lg:p-1.5' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 ring-2 ring-slate-700 text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-white text-xs font-bold truncate leading-tight">{user?.name || 'Sales User'}</p>
              <span className="inline-block text-[9px] font-extrabold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                {user?.role || 'Sales Executive'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold
              text-red-400 hover:bg-red-500/10 transition-all group
              ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-red-400" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {[
            { title: 'Home', href: '/sales/dashboard', icon: Home },
            { title: 'Leads', href: '/sales/leads', icon: Users },
            { title: 'Tasks', href: '/sales/tasks', icon: CheckSquare },
            { title: 'Activity', href: '/sales/activity', icon: Activity },
            { title: 'Profile', href: '/sales/profile', icon: UserCircle },
          ].map((item) => {
            const active = pathname === item.href || (item.href !== '/sales/dashboard' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1">
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-[#2563EB]' : ''}`}>
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-[#6B7280]'}`} />
                </div>
                <span className={`text-[9px] font-semibold transition-colors ${active ? 'text-blue-400' : 'text-[#6B7280]'}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
