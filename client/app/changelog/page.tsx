'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Gift, Sparkles, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const RELEASES = [
  {
    version: 'v1.2.0',
    date: 'June 2026',
    title: 'Super Admin Portal & AI Insights',
    desc: 'Major upgrade introducing systemic control panels, real-time node monitoring, and automated AI lead insights.',
    icon: Sparkles,
    color: 'text-orange-400',
    bullets: [
      'New dashboard featuring CRM Health and sales conversion reports.',
      'AI Center for credit scoping and customized system instructions.',
      'Role permissions configurations with editable grid matrix.',
      'Active session tracking and global audit event logs.'
    ]
  },
  {
    version: 'v1.1.0',
    date: 'May 2026',
    title: 'Offline Sync & Twilio MFA Security',
    desc: 'Security enhancements and client resiliency layers for high-load operations.',
    icon: ShieldCheck,
    color: 'text-green-400',
    bullets: [
      'IndexedDB browser caching using Dexie.js for offline data saves.',
      'Twilio SMS Two-Factor Authentication with email OTP backups.',
      'Dynamic PDF invoice downloads via customer portal links.',
      'Optimized backend process load handling.'
    ]
  },
  {
    version: 'v1.0.0',
    date: 'April 2026',
    title: 'Initial Release',
    desc: 'Public launch of HubNest CRM platform.',
    icon: Cpu,
    color: 'text-blue-400',
    bullets: [
      'Isolated database scoping per company tenant.',
      'Lead pipeline tracking with priorities and manager assignments.',
      'Marketing campaign tracking and automated ROI calculation.',
      'Finance invoice drafts, templates, and billing configurations.'
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Changelog
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Product Release Timeline
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Track the latest releases, features, security logs, and updates made to the HubNest CRM engine.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] md:max-w-[700px] px-4 relative">
            <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-[#161616]" />
            <div className="space-y-12">
              {RELEASES.map((rel) => (
                <div key={rel.version} className="relative flex gap-8 items-start">
                  <div className={`w-10 h-10 rounded-xl bg-[#111] border border-[#1f1f1f] flex items-center justify-center shrink-0 z-10 ${rel.color}`}>
                    <rel.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className="text-xl font-extrabold text-white">{rel.version}</span>
                      <span className="text-xs text-slate-500 font-bold">&bull; {rel.date}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{rel.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{rel.desc}</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-400">
                      {rel.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
