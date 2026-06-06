'use client';

import { motion } from 'framer-motion';

const COMPANIES = ['Northwind', 'Helix', 'Brightline', 'Cascade', 'Vertex', 'Lumen'];

export default function TrustSection() {
  return (
    <section className="bg-blue-50/70 py-10 border-y border-slate-100">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-9">
          Trusted by teams at
        </p>
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
              className="text-xl sm:text-2xl font-semibold text-slate-300 tracking-tight select-none"
            >
              {company}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
