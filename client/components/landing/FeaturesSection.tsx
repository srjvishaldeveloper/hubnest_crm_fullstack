'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Megaphone, TicketCheck, Sparkles, DollarSign, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Lead Management',
    desc: 'Capture, qualify and convert leads in one organized pipeline.',
    iconBg: 'from-blue-600 to-sky-400',
  },
  {
    icon: Megaphone,
    title: 'Campaign Tracking',
    desc: 'Plan campaigns and measure ROI across every channel.',
    iconBg: 'from-sky-500 to-cyan-400',
  },
  {
    icon: TicketCheck,
    title: 'Support Tickets',
    desc: 'Resolve customer issues with SLA-aware routing.',
    iconBg: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    desc: 'Smart suggestions that surface what to do next.',
    iconBg: 'from-amber-500 to-orange-400',
  },
  {
    icon: DollarSign,
    title: 'Finance Tracking',
    desc: 'Track revenue, payments and cheques in real time.',
    iconBg: 'from-teal-500 to-blue-400',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Granular permissions for every team and tenant.',
    iconBg: 'from-violet-500 to-fuchsia-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="bg-white py-14">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl sm:text-5xl font-serif text-slate-900 leading-tight">
            Everything your team needs
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            One platform for sales, marketing, support and finance.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group cursor-default rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-blue-300/80 hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)]"
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.iconBg} shadow-lg shadow-blue-600/15`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
