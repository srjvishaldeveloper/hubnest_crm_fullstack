'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Rocket } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" className="bg-white dark:bg-[#0a0a0a] py-20 transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-4xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none rounded-3xl px-8 sm:px-14 py-14 text-center overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-green-500/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-6">
            <Rocket className="w-6 h-6 text-orange-400" />
          </div>

          <h2 className="relative text-3xl sm:text-4xl font-bold text-slate-900 dark:text-[#ededed] mb-4 tracking-tight">
            Ready to grow faster?
          </h2>
          <p className="relative text-slate-600 dark:text-[#737373] text-base mb-8 max-w-lg mx-auto font-medium">
            Join 500+ teams already using HubNest CRM to close more deals.
          </p>

          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#222] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] hover:border-slate-300 dark:hover:border-[#333] text-slate-600 dark:text-[#a3a3a3] hover:text-slate-900 dark:hover:text-[#ededed] font-semibold px-7 py-3.5 rounded-xl text-sm transition-all"
            >
              Book a Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
