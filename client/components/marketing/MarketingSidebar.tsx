'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Image from 'next/image';
import {
  BarChart3,
  Home,
  Megaphone,
  Users,
  LineChart,
  UserCircle,
  LogOut,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Workflow,
  Layout,
  Mail,
  MessageSquare,
  PhoneCall,
  Globe,
  Code,
  Import,
  FolderHeart,
  Image,
  Settings,
  Bell,
  Calendar,
  DollarSign,
  Zap,
  Cpu,
  FlaskConical,
  Heart,
  Webhook,
  Plug,
  FileText,
  ListFilter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

interface SubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SectionItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  key?: string;
  subItems?: SubItem[];
}

export default function MarketingSidebar({ open, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    campaigns: true,
    builders: true,
    data: true,
    leads: true,
    analytics: false,
    platform: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyOpen = prev[section];
      // Close all, then open the clicked one (unless it was already open)
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [section]: !isCurrentlyOpen };
    });
  };

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const sidebarWidth = collapsed ? 'md:w-[72px]' : 'md:w-[240px]';
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  const sections: SectionItem[] = [
    {
      title: 'Dashboard',
      href: '/marketing/dashboard',
      icon: Home,
    },
    {
      title: 'Campaigns',
      icon: Megaphone,
      key: 'campaigns',
      subItems: [
        { label: 'All Campaigns',        href: '/marketing/campaigns',            icon: Megaphone       },
        { label: 'Email Campaigns',       href: '/marketing/campaigns/email',      icon: Mail            },
        { label: 'WhatsApp Campaigns',    href: '/marketing/campaigns/whatsapp',   icon: MessageSquare   },
        { label: 'SMS Campaigns',         href: '/marketing/campaigns/sms',        icon: PhoneCall       },
        { label: 'Meta Messenger',        href: '/marketing/campaigns/meta',       icon: Globe           },
        { label: 'Push Notifications',    href: '/marketing/campaigns/push',       icon: Bell            },
        { label: 'A/B Testing',           href: '/marketing/campaigns/ab-testing', icon: FlaskConical    },
        { label: 'Campaign Scheduler',    href: '/marketing/campaigns/scheduler',  icon: Calendar        },
        { label: 'Campaign Budget',       href: '/marketing/campaigns/budget',     icon: DollarSign      },
        { label: 'Campaign Automation',   href: '/marketing/campaigns/automation', icon: Zap             },
      ],
    },
    {
      title: 'Builders',
      icon: Layout,
      key: 'builders',
      subItems: [
        { label: 'Landing Pages',   href: '/marketing/landing-pages', icon: FileText    },
        { label: 'Form Builder',    href: '/marketing/forms',         icon: Code        },
        { label: 'Template Library',href: '/marketing/templates',     icon: FolderHeart },
        { label: 'Media Library',   href: '/marketing/media',         icon: Image       },
      ],
    },
    {
      title: 'Contacts & Data',
      icon: Users,
      key: 'data',
      subItems: [
        { label: 'Contact Lists',      href: '/marketing/contacts/lists',    icon: ListFilter },
        { label: 'Audience Segments',  href: '/marketing/contacts/segments', icon: Sparkles   },
        { label: 'Import Center',      href: '/marketing/contacts/import',   icon: Import     },
      ],
    },
    {
      title: 'Leads',
      icon: Users,
      key: 'leads',
      subItems: [
        { label: 'All Leads',       href: '/marketing/leads',          icon: Users       },
        { label: 'Lead Segments',   href: '/marketing/leads/segments', icon: ListFilter  },
        { label: 'Lead Assignment', href: '/marketing/leads/assign',   icon: UserCircle  },
      ],
    },
    {
      title: 'Automation',
      href: '/marketing/automation',
      icon: Workflow,
    },
    {
      title: 'AI Studio',
      href: '/marketing/ai-studio',
      icon: Cpu,
    },
    {
      title: 'Analytics',
      icon: LineChart,
      key: 'analytics',
      subItems: [
        { label: 'Overview',           href: '/marketing/analytics',           icon: BarChart3    },
        { label: 'Campaign Analytics', href: '/marketing/analytics/campaigns', icon: Megaphone    },
        { label: 'Audience Insights',  href: '/marketing/analytics/audience',  icon: Users        },
        { label: 'Funnel Analysis',    href: '/marketing/analytics/funnel',    icon: LineChart    },
        { label: 'ROI Report',         href: '/marketing/analytics/roi',       icon: DollarSign   },
        { label: 'Reports',            href: '/marketing/reports',             icon: FileText     },
      ],
    },
    {
      title: 'Platform',
      icon: Settings,
      key: 'platform',
      subItems: [
        { label: 'Integrations',   href: '/marketing/integrations',  icon: Plug    },
        { label: 'Subscriptions',  href: '/marketing/subscriptions', icon: Heart   },
        { label: 'Webhooks & APIs',href: '/marketing/webhooks',      icon: Webhook },
        { label: 'Settings',       href: '/marketing/settings',      icon: Settings},
      ],
    },
    {
      title: 'Team Chat',
      href: '/marketing/chat',
      icon: MessageSquare,
    },
    {
      title: 'Profile',
      href: '/marketing/profile',
      icon: UserCircle,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col
          bg-white dark:bg-[#0F172A] transition-all duration-300 ease-in-out
          border-r border-slate-200 dark:border-slate-800
          w-[240px] ${sidebarWidth} ${mobileTranslate}`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 h-[72px] border-b border-slate-200 dark:border-slate-800 shrink-0 ${
            collapsed ? 'md:justify-center md:px-0' : ''
          }`}
        >
          <Image src="/images/Logo Image.png" alt="HubNest CRM" width={100} height={36} className={`object-contain shrink-0 ${collapsed ? 'md:w-9 md:h-9' : ''}`} />
          <div className={`${collapsed ? 'md:hidden' : 'hidden'} overflow-hidden`}>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Marketing Hub
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden ml-auto p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          {sections.map((section) => {
            if (section.subItems) {
              const isExpanded = expandedSections[section.key!];
              const Icon = section.icon;
              const hasActiveSub = section.subItems.some((item) => pathname === item.href);

              return (
                <div key={section.key} className="space-y-1">
                  <button
                    onClick={() => !collapsed && toggleSection(section.key!)}
                    title={section.title}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group
                      ${
                        hasActiveSub && collapsed
                          ? 'bg-indigo-600 dark:bg-[#2563EB] text-white shadow-lg'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          hasActiveSub ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <span className={`${collapsed ? 'md:hidden' : ''} truncate`}>{section.title}</span>
                    </div>
                    {!collapsed &&
                      (isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      ))}
                  </button>

                  {!collapsed && isExpanded && (
                    <div className="pl-6 space-y-0.5 pr-1 border-l border-slate-100 dark:border-slate-800/80 ml-5">
                      {section.subItems.map((subItem) => {
                        const active = pathname === subItem.href;
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                              active
                                ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const active = pathname === section.href;
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href!}
                  onClick={onClose}
                  title={section.title}
                  className={`flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group
                    ${
                      active
                        ? 'bg-indigo-600 dark:bg-[#2563EB] text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }
                    ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      active ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className={`${collapsed ? 'md:hidden' : ''} truncate`}>{section.title}</span>
                </Link>
              );
            }
          })}
        </nav>

        {/* AI Co-Pilot Promo Card */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-slate-900/60 border border-violet-200/50 dark:border-violet-800/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  AI Co-Pilot
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Instantly design templates, build workflow nodes, and write email copy.
              </p>
              <Link
                href="/marketing/ai-studio"
                className="block text-center w-full mt-2.5 py-1.5 bg-indigo-600 dark:bg-[#2563EB] hover:bg-indigo-700 dark:hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                Open AI Studio
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Profile & Logout */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 shrink-0 space-y-2">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 ${
              collapsed ? 'md:justify-center md:p-1.5' : ''
            }`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 ring-2 ring-slate-200 dark:ring-slate-700">
              <span className="text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'M'}
              </span>
            </div>
            <div className={`overflow-hidden ${collapsed ? 'md:hidden' : ''}`}>
              <p className="text-slate-900 dark:text-white text-xs font-bold truncate leading-tight">
                {user?.name || 'Marketing Head'}
              </p>
              <span className="inline-block text-[9px] font-extrabold text-indigo-600 dark:text-blue-400 bg-indigo-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 leading-none">
                {user?.role || 'Marketing Head'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
              text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group
              ${collapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-red-500 dark:text-red-400" />
            <span className={collapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
