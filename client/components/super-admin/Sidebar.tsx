'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  BarChart3,
  ShieldAlert,
  Settings,
  Plug,
  UserCircle,
  LogOut,
  X,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    title: 'MAIN MENU',
    items: [
      { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', href: '/super-admin/users', icon: Users },
      { label: 'Admins', href: '/super-admin/admins', icon: ShieldCheck },
      { label: 'Tenants', href: '/super-admin/tenants', icon: Building2 },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'CRM Control', href: '/super-admin/crm', icon: SlidersHorizontal },
      { label: 'Reports', href: '/super-admin/reports', icon: BarChart3 },
      { label: 'Security', href: '/super-admin/security', icon: ShieldAlert },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Integrations', href: '/super-admin/integrations', icon: Plug },
      { label: 'Settings', href: '/super-admin/settings', icon: Settings },
      { label: 'Profile', href: '/super-admin/profile', icon: UserCircle },
    ]
  },
];

export default function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]';
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col
          bg-white border-r border-slate-200/80
          transition-all duration-300 ease-in-out shadow-sm
          w-[280px] ${sidebarWidth} ${mobileTranslate}`}
      >
        {/* ── Logo Area ───────────────────────────── */}
        <div className={`flex items-center gap-3 px-5 h-[72px] border-b border-slate-100 shrink-0 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className={`${collapsed ? 'lg:hidden' : ''} overflow-hidden`}>
            <p className="text-[#0F172A] font-bold text-[15px] tracking-tight whitespace-nowrap">Job Nest CRM</p>
            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Super Admin
            </span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* ── Navigation ──────────────────────────── */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className={`text-slate-400 text-[11px] font-bold uppercase tracking-wider px-2 mb-1.5 ${collapsed ? 'lg:hidden' : ''}`}>
                {section.title}
              </p>
              {section.items.map((item, index) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={item.label}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                        ${active
                          ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]'
                        }
                        ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className={`flex-1 whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      {active && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* AI Assistant Card */}
          {!collapsed && (
            <div className="mt-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">AI Assistant</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Ask anything about your tenants, admins & system health.</p>
              <button className="w-full mt-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-500/20">
                Ask AI
              </button>
            </div>
          )}
        </nav>

        {/* ── Bottom Profile & Logout ──────────────────────── */}
        <div className="border-t border-slate-100 p-3 shrink-0 space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 ${collapsed ? 'lg:justify-center lg:p-1.5' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-100">
              <span className="text-white font-bold text-xs">{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
            </div>
            <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-[#0F172A] text-xs font-bold truncate leading-tight">{user?.name || 'Super Admin'}</p>
              <span className="inline-block text-[9px] font-extrabold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                {user?.role || 'Super Admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold
              text-red-500 hover:bg-red-50 transition-all duration-200 group
              ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 text-red-500" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
