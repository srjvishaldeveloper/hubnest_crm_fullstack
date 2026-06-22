'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'What is HubNest CRM and who is it for?',
    a: 'HubNest CRM is an all-in-one customer relationship and marketing platform built for growing teams. It combines lead management, automated campaigns, AI-driven insights, invoicing, and team collaboration into a single workspace — making it ideal for sales, marketing, and support teams at SMBs and scale-ups.',
  },
  {
    q: 'How does the role-based access control work?',
    a: 'Every user is assigned a role — Super Admin, Admin, Marketing Head, Sales Manager, Sales Executive, Finance Executive, or Support Agent. Each role unlocks a tailored dashboard and a specific set of features. Super Admins can create and manage multiple tenant workspaces, while team-level roles keep data siloed and secure by default.',
  },
  {
    q: 'Can I automate my marketing and sales workflows?',
    a: 'Yes. The Automation Builder lets you visually wire together triggers, conditions, AI nodes, and actions — similar to N8N or Zapier but built natively into your CRM data. Connect to WhatsApp, Email, Meta Ads, Webhooks, Slack, Discord, and more without leaving the platform.',
  },
  {
    q: 'Is there a free trial? Do I need a credit card to start?',
    a: 'HubNest offers a 14-day free trial on all paid plans with no credit card required. You can explore every feature, invite your team, and connect your integrations before committing. Billing only starts when you choose a plan.',
  },
  {
    q: 'How does multi-tenancy work for agencies and franchises?',
    a: 'A Super Admin account can spin up isolated tenant workspaces — each with their own users, data, branding, and integrations. This makes HubNest ideal for agencies managing multiple clients, or enterprises running regional divisions that must stay independent from each other.',
  },
  {
    q: 'What channels does HubNest support for campaigns?',
    a: 'Email (SMTP/transactional), WhatsApp Business API, SMS (Twilio), Meta/Facebook Ads, Instagram DM, Push Notifications, and custom HTTP webhooks. Each channel has a dedicated campaign builder with templates, scheduling, A/B testing, and analytics.',
  },
  {
    q: 'How secure is my data? Where is it stored?',
    a: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Credentials for integrations are stored encrypted per-tenant and never exposed in API responses. We maintain audit logs for all sensitive actions and support OTP-based two-factor authentication out of the box.',
  },
  {
    q: 'Can I import existing contacts and leads?',
    a: 'Yes — HubNest supports CSV bulk import with field mapping, duplicate detection, and list segmentation on import. You can also pull contacts from Meta Lead Ads, Google Sheets, or push them via webhook/API from any external source.',
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        open
          ? 'border-orange-500/30 bg-orange-500/[0.03] dark:bg-orange-500/[0.05] shadow-[0_0_24px_rgba(249,115,22,0.08)]'
          : 'border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0e0e0e] hover:border-slate-300 dark:hover:border-[#2a2a2a]'
      }`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className={`text-sm sm:text-base font-semibold leading-snug transition-colors duration-200 ${open ? 'text-orange-500' : 'text-slate-900 dark:text-[#ededed] group-hover:text-orange-500'}`}>
          {q}
        </span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-orange-500 border-orange-500 rotate-180'
            : 'bg-transparent border-slate-200 dark:border-[#2a2a2a]'
        }`}>
          <ChevronDown size={14} className={open ? 'text-white' : 'text-slate-400 dark:text-[#555]'} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-5">
              <div className="w-full h-px bg-slate-100 dark:bg-[#1a1a1a] mb-4" />
              <p className="text-sm leading-relaxed text-slate-600 dark:text-[#888]">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#080808] transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight mb-4">
            Questions we hear often
          </h2>
          <p className="text-base text-slate-500 dark:text-[#666] max-w-xl mx-auto leading-relaxed">
            Can&apos;t find your answer here? Reach our support team through the chat widget — we typically reply in under 2 hours.
          </p>
        </motion.div>

        {/* Two-column grid on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-5xl mx-auto">
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
