'use client';

import { BookOpen, BriefcaseBusiness, FileText, Layers3, Briefcase, ArrowUpRight, Mail } from 'lucide-react';

const LINKS = {
  Product: {
    icon: Layers3,
    items: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  Company: {
    icon: BriefcaseBusiness,
    items: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
    ],
  },
  Resources: {
    icon: BookOpen,
    items: [
      { label: 'Help center', href: '/help-center' },
      { label: 'Contact', href: '/#cta' },
      { label: 'Status', href: '/status' },
      { label: 'API docs', href: '/docs' },
    ],
  },
  Legal: {
    icon: FileText,
    items: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Compliance', href: '/compliance' },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#050505] transition-colors duration-200 pt-14 pb-8">
      <div className="relative mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Briefcase className="w-4 h-4 text-slate-900 dark:text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-[#ededed] tracking-tight">
                HubNest <span className="font-normal text-slate-500 dark:text-[#555]">CRM</span>
              </span>
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-slate-500 dark:text-[#555] mb-5">
              Smart CRM for growing businesses.
            </p>
            {/* Social icons */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:support@jobnestcrm.com"
                title="Email Support"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none hover:bg-orange-500/10 hover:border-orange-500/30 flex items-center justify-center text-slate-400 dark:text-[#444] hover:text-orange-400 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none hover:bg-green-500/10 hover:border-green-500/30 flex items-center justify-center text-slate-400 dark:text-[#444] hover:text-green-400 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none hover:bg-orange-500/10 hover:border-orange-500/30 flex items-center justify-center text-slate-400 dark:text-[#444] hover:text-orange-400 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none hover:bg-green-500/10 hover:border-green-500/30 flex items-center justify-center text-slate-400 dark:text-[#444] hover:text-green-400 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none hover:bg-orange-500/10 hover:border-orange-500/30 flex items-center justify-center text-slate-400 dark:text-[#444] hover:text-orange-400 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, group]) => (
            <div key={category}>
              <div className="mb-4 flex items-center gap-2">
                <group.icon className={`h-4 w-4 ${['Product', 'Resources', 'Legal'].includes(category) ? 'text-orange-400' : 'text-green-400'}`} />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-[#ededed]">{category}</h4>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-[#777] transition-colors hover:text-slate-900 dark:hover:text-[#ededed] group"
                    >
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1a1a1a] pt-6 sm:flex-row">
          <p className="text-xs text-slate-500 dark:text-[#444]">
            &copy; {new Date().getFullYear()} HubNest CRM &middot; SRJ Global Tech. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="text-xs text-slate-500 dark:text-[#444] transition hover:text-orange-500 dark:hover:text-orange-400">Privacy</a>
            <a href="/terms" className="text-xs text-slate-500 dark:text-[#444] transition hover:text-orange-500 dark:hover:text-orange-400">Terms</a>
            <a href="/privacy" className="text-xs text-slate-500 dark:text-[#444] transition hover:text-orange-500 dark:hover:text-orange-400">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
