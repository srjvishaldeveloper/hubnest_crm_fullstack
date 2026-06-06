'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" className="bg-white py-14">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl bg-blue-50/80 border border-blue-100 rounded-[24px] px-8 sm:px-14 py-14 text-center shadow-[0_18px_60px_rgba(37,99,235,0.08)]"
        >
          <p className="text-slate-500 text-base mb-6 max-w-lg mx-auto">
            Join 500+ teams already using Job Nest CRM to close more deals.
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
