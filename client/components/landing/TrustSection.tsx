'use client';

import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const COMPANIES = ['Northwind', 'Helix', 'Brightline', 'Cascade', 'Vertex', 'Lumen'];

export default function TrustSection() {
  return (
    <section className="bg-slate-100 dark:bg-[#050505] py-12 border-y border-slate-200 dark:border-[#1a1a1a]">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#444]" />
          <p className="text-center text-[11px] font-semibold text-slate-400 dark:text-[#444] uppercase tracking-[0.18em]">
            Trusted by teams at
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {COMPANIES.map((company, i) => (
            <motion.span
              key={company}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="text-xl sm:text-2xl font-bold text-slate-300 dark:text-[#222] hover:text-slate-400 dark:hover:text-[#333] tracking-tight select-none transition-colors cursor-default"
            >
              {company}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
