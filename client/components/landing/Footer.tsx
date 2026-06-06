'use client';

import { motion } from 'framer-motion';
import { BookOpen, BriefcaseBusiness, FileText, Layers3, Briefcase, ArrowUpRight } from 'lucide-react';

const LINKS = {
  Product: {
    icon: Layers3,
    items: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  Company: {
    icon: BriefcaseBusiness,
    items: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  Resources: {
    icon: BookOpen,
    items: [
      { label: 'Help center', href: '#' },
      { label: 'Contact', href: '#cta' },
      { label: 'Status', href: '#' },
      { label: 'API docs', href: '#' },
    ],
  },
  Legal: {
    icon: FileText,
    items: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Compliance', href: '#' },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200/80 bg-[#F8FAFC] pt-14 pb-8">
      <div className="relative mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <motion.div className="mb-3 flex items-center gap-2" whileHover={{ scale: 1.02 }}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Job Nest <span className="font-normal text-slate-400">CRM</span>
              </span>
            </motion.div>
            <p className="max-w-[220px] text-sm leading-relaxed text-slate-500 mb-5">
              Smart CRM for growing businesses.
            </p>
            {/* Social icons placeholder */}
            <div className="flex items-center gap-3">
              {['X', 'In', 'Gh'].map((s) => (
                <a key={s} href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-all duration-200">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, group]) => (
            <div key={category}>
              <div className="mb-4 flex items-center gap-2">
                <group.icon className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-900">{category}</h4>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-600 group"
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
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Job Nest CRM &middot; SRJ Global Tech. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-slate-400 transition hover:text-blue-600">Privacy</a>
            <a href="#" className="text-xs text-slate-400 transition hover:text-blue-600">Terms</a>
            <a href="#" className="text-xs text-slate-400 transition hover:text-blue-600">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
