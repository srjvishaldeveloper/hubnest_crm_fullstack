'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'Job Nest replaced three tools for us. The dashboard is the cleanest CRM I\'ve used.',
    name: 'Anika Sharma',
    role: 'Head of Sales',
    company: 'Northwind Labs',
    initials: 'AS',
    accent: 'orange',
  },
  {
    stars: 5,
    quote: 'Our team finally agrees on a single source of truth for leads and pipeline.',
    name: 'Rahul Mehta',
    role: 'Founder',
    company: 'Brightline',
    initials: 'RM',
    accent: 'green',
  },
  {
    stars: 5,
    quote: 'The role-based controls let us roll it out across regions in a week.',
    name: 'Priya Singh',
    role: 'Ops Director',
    company: 'Helix Group',
    initials: 'PS',
    accent: 'orange',
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export default function Testimonials() {
  return (
    <section className="bg-slate-100 dark:bg-[#050505] py-20 border-y border-slate-200 dark:border-[#1a1a1a] transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-green-400" />
            Testimonials
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight">
            Loved by teams that ship
          </h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              className={`flex min-h-[260px] flex-col rounded-2xl border bg-white dark:bg-[#111111] p-7 transition-all duration-300 ${
                t.accent === 'orange'
                  ? 'border-slate-200 dark:border-[#1f1f1f] hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]'
                  : 'border-slate-200 dark:border-[#1f1f1f] hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]'
              }`}
            >
              {/* Quote icon */}
              <Quote className="w-5 h-5 text-[#333] mb-3" />
              <StarRow count={t.stars} />
              <p className="mb-8 flex-1 text-base leading-relaxed text-[#a3a3a3]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-900 dark:text-white shadow-lg ${
                  t.accent === 'orange'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'
                    : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/20'
                }`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-[#ededed] text-sm">{t.name}</p>
                  <p className="text-[#555] text-xs mt-0.5">
                    {t.role} &middot; {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
