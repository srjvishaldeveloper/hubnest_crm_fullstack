'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, SlidersHorizontal, BarChart3,
  UserCircle, LogOut, X, Sparkles, ShieldCheck,
  Activity, Layers, Plug, Lock, ScrollText, Settings,
  TrendingUp, Brain, UserCheck, Briefcase, BookOpen,
  CreditCard, Shield, DollarSign, FileText, Receipt,
  Wallet, Building2, MessageSquare, Grid3X3,
  GitBranch, CheckSquare, Send, Zap
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  role?: string;
}

export default function AdminSidebar({ open, collapsed, onClose, role = 'Admin' }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const sidebarWidth = collapsed ? 'md:w-[72px]' : 'md:w-[240px]';
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  const menuSections =
    role === 'Sales Manager'
      ? [
          {
            title: 'MAIN MENU',
            items: [
              { label: 'Home', href: '/sales-manager/dashboard', icon: LayoutDashboard },
              { label: 'Chat', href: '/sales-manager/chat', icon: MessageSquare }
            ],
          },
          {
            title: 'SALES',
            items: [
              { label: 'Leads', href: '/sales-manager/leads', icon: TrendingUp },
              { label: 'Team', href: '/sales-manager/team', icon: Users },
            ],
          },
          {
            title: 'ANALYTICS',
            items: [
              { label: 'Reports', href: '/sales-manager/reports', icon: BarChart3 },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ label: 'Profile', href: '/sales-manager/profile', icon: UserCircle }],
          },
        ]
      : role === 'Sales Executive'
      ? [
          {
            title: 'MAIN MENU',
            items: [
              { label: 'Dashboard', href: '/sales/dashboard', icon: LayoutDashboard },
              { label: 'Chat', href: '/sales-executive/chat', icon: MessageSquare },
            ],
          },
          {
            title: 'SALES',
            items: [
              { label: 'Leads', href: '/sales/leads', icon: TrendingUp },
              { label: 'Pipeline', href: '/sales/leads/pipeline', icon: GitBranch },
              { label: 'Tasks', href: '/sales/tasks', icon: CheckSquare },
              { label: 'Activity Log', href: '/sales/activity', icon: Activity },
            ],
          },
          {
            title: 'MARKETING',
            items: [
              { label: 'Email Campaigns', href: '/marketing/campaigns/email', icon: Send },
              { label: 'Automation', href: '/marketing/automation', icon: Zap },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [
              { label: 'Profile', href: '/sales/profile', icon: UserCircle },
            ],
          },
        ]
      : role === 'Support Agent' || role === 'Support Manager'
      ? [
          {
            title: 'MAIN MENU',
            items: [
              { label: 'Home', href: '/support/dashboard', icon: LayoutDashboard },
              { label: 'Chat', href: '/support/chat', icon: MessageSquare }
            ],
          },
          {
            title: 'SUPPORT',
            items: [
              { label: 'Tickets', href: '/support/tickets', icon: ScrollText },
              { label: 'Customers', href: '/support/customers', icon: Users },
            ],
          },
          {
            title: 'KNOWLEDGE BASE',
            items: [
              { label: 'Knowledge Base', href: '/support/knowledge-base', icon: BookOpen },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ label: 'Profile', href: '/support/profile', icon: UserCircle }],
          },
        ]
      : role === 'Finance Manager' || role === 'Accountant' || role === 'Auditor' || role === 'Finance Executive'
      ? [
          {
            title: 'MAIN MENU',
            items: [
              { label: 'Home', href: '/finance', icon: LayoutDashboard },
              { label: 'Chat', href: '/finance/chat', icon: MessageSquare }
            ],
          },
          {
            title: 'FINANCE',
            items: [
              { label: 'Invoices', href: '/finance/invoices', icon: FileText },
              { label: 'Payments', href: '/finance/payments', icon: CreditCard },
              { label: 'Expenses', href: '/finance/expenses', icon: Receipt },
              { label: 'Vendors', href: '/finance/vendors', icon: Building2 },
            ],
          },
          {
            title: 'ANALYTICS',
            items: [
              { label: 'Analytics', href: '/finance/analytics', icon: BarChart3 },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ label: 'Profile', href: '/admin/profile', icon: UserCircle }],
          },
        ]
      : [
          {
            title: 'MAIN MENU',
            items: [
              { label: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
              { label: 'Users', href: '/admin/users', icon: Users },
              { label: 'Chat', href: '/admin/chat', icon: MessageSquare }
            ],
          },
          {
            title: 'SECURITY & CONTROL',
            items: [
              { label: 'CRM Control', href: '/admin/crm-control', icon: SlidersHorizontal },
              { label: 'Roles & Permissions', href: '/admin/roles', icon: ShieldCheck },
              { label: 'Permission Matrix', href: '/admin/permissions', icon: Grid3X3 },
              { label: 'Teams', href: '/admin/teams', icon: UserCheck },
              { label: 'User Activity', href: '/admin/user-activity', icon: Activity },
              { label: 'Bulk Operations', href: '/admin/bulk-operations', icon: Layers },
            ],
          },
          {
            title: 'SYSTEM',
            items: [
              { label: 'Integrations', href: '/admin/integrations', icon: Plug },
              { label: 'Subscription', href: '/admin/subscription', icon: CreditCard },
              { label: 'Security & MFA', href: '/admin/security', icon: Shield },
              { label: 'Access & Security', href: '/admin/access-security', icon: Lock },
              { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
              { label: 'System Settings', href: '/admin/system-settings', icon: Settings },
            ],
          },
          {
            title: 'AI & INSIGHTS',
            items: [
              { label: 'User Insights', href: '/admin/user-insights', icon: TrendingUp },
              { label: 'AI Recommendations', href: '/admin/ai-recommendations', icon: Brain },
            ],
          },
          {
            title: 'BILLING',
            items: [
              { label: 'Invoices', href: '/admin/billing/invoices', icon: FileText },
            ],
          },
          {
            title: 'REPORTS',
            items: [{ label: 'Reports', href: '/admin/reports', icon: BarChart3 }],
          },
          {
            title: 'ACCOUNT',
            items: [{ label: 'Profile', href: '/admin/profile', icon: UserCircle }],
          },
        ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col
        bg-white dark:bg-[#181818] border-r border-slate-200/80 dark:border-[#333333] transition-all duration-300 ease-in-out shadow-sm
        w-[240px] ${sidebarWidth} ${mobileTranslate}`}
      >
        {/* Logo Section */}
        <div className={`flex items-center gap-3 px-4 h-[72px] border-b border-slate-100 dark:border-[#333333] shrink-0 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className={`${collapsed ? 'md:hidden' : ''} overflow-hidden`}>
            <p className="text-[#0F172A] dark:text-white font-bold text-sm tracking-tight whitespace-nowrap">HubNest CRM</p>
            <span className="inline-flex items-center text-[10px] font-extrabold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
              {role}
            </span>
          </div>
          <button onClick={onClose} className="md:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A2A2A] transition">
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-4">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className={`text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider px-2 mb-1.5 ${collapsed ? 'md:hidden' : ''}`}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const isHomeRoute = ['/finance', '/admin/dashboard', '/sales-manager/dashboard', '/sales-executive/dashboard', '/support/dashboard'].includes(item.href);
                const active = pathname === item.href || (!isHomeRoute && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={item.label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${active
                        ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] hover:text-[#0F172A] dark:text-[#F9FAFB] dark:hover:text-white'
                      }
                      ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
                    <span className={`${collapsed ? 'md:hidden' : ''} truncate`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          {/* AI Assistant Card */}
          {!collapsed && (
            <div className="mt-2 p-4 bg-gradient-to-br from-orange-500 to-yellow-500 border border-orange-400 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-4 h-4 text-orange-50" />
                <p className="text-[11px] font-bold text-orange-50 uppercase tracking-wider">AI Assistant</p>
              </div>
              <p className="text-xs text-orange-100 leading-relaxed">Ask anything about CRM metrics & security rules.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
                className="w-full mt-3 py-2 bg-white text-orange-600 hover:bg-orange-50 text-sm font-bold rounded-lg transition-colors shadow-sm shadow-orange-500/20 cursor-pointer"
              >
                Ask AI
              </button>
            </div>
          )}
        </div>

        {/* Bottom Profile & Logout */}
        <div className="border-t border-slate-100 dark:border-[#333333] p-3 shrink-0 space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-[#202020] ${collapsed ? 'md:justify-center md:p-1.5' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-100 dark:ring-blue-500/20">
              <span className="text-white font-bold text-xs">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
            <div className={`overflow-hidden ${collapsed ? 'md:hidden' : ''}`}>
              <p className="text-[#0F172A] dark:text-white text-xs font-bold truncate leading-tight">{user?.name || 'User'}</p>
              <span className="inline-block text-[9px] font-extrabold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                {role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold
              text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group
              ${collapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 text-red-500" />
            <span className={collapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
