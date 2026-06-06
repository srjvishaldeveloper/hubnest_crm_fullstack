'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'Job Nest replaced three tools for us. The dashboard is the cleanest CRM I\'ve used.',
    name: 'Anika Sharma',
    role: 'Head of Sales',
    company: 'Northwind Labs',
    initials: 'AS',
  },
  {
    stars: 5,
    quote: 'Our team finally agrees on a single source of truth for leads and pipeline.',
    name: 'Rahul Mehta',
    role: 'Founder',
    company: 'Brightline',
    initials: 'RM',
  },
  {
    stars: 5,
    quote: 'The role-based controls let us roll it out across regions in a week.',
    name: 'Priya Singh',
    role: 'Ops Director',
    company: 'Helix Group',
    initials: 'PS',
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
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
    <section className="bg-white py-14">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl sm:text-5xl font-serif text-slate-900">
            Loved by teams that ship
          </h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex min-h-[260px] flex-col rounded-[24px] border border-slate-200 bg-white/80 p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 hover:border-blue-200 hover:shadow-[0_24px_64px_rgba(37,99,235,0.12)]"
            >
              <StarRow count={t.stars} />
              <p className="mb-8 flex-1 text-base leading-relaxed text-slate-700">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
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
