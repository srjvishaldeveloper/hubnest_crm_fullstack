'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Megaphone, TicketCheck, Sparkles, DollarSign, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Lead Management',
    desc: 'Capture, qualify and convert leads in one organized pipeline.',
    accent: 'orange',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]',
    border: 'hover:border-orange-500/30',
  },
  {
    icon: Megaphone,
    title: 'Campaign Tracking',
    desc: 'Plan campaigns and measure ROI across every channel.',
    accent: 'green',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.12)]',
    border: 'hover:border-green-500/30',
  },
  {
    icon: TicketCheck,
    title: 'Support Tickets',
    desc: 'Resolve customer issues with SLA-aware routing.',
    accent: 'orange',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]',
    border: 'hover:border-orange-500/30',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    desc: 'Smart suggestions that surface what to do next.',
    accent: 'green',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.12)]',
    border: 'hover:border-green-500/30',
  },
  {
    icon: DollarSign,
    title: 'Finance Tracking',
    desc: 'Track revenue, payments and cheques in real time.',
    accent: 'orange',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]',
    border: 'hover:border-orange-500/30',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Granular permissions for every team and tenant.',
    accent: 'green',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.12)]',
    border: 'hover:border-green-500/30',
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
    <section id="features" className="bg-[#F5F7FB] dark:bg-[#0a0a0a] py-20 transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#222] text-slate-600 dark:text-[#737373] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] leading-tight tracking-tight">
            Everything your team needs
          </h2>
          <p className="mt-4 text-slate-600 dark:text-[#737373] text-lg max-w-xl mx-auto">
            One platform for sales, marketing, support and finance.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`group cursor-default rounded-2xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6 transition-all duration-300 shadow-sm dark:shadow-none ${f.glow} ${f.border}`}
            >
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${f.iconBg} transition-transform group-hover:scale-110`}>
                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-[#ededed] text-base mb-2">{f.title}</h3>
              <p className="text-slate-600 dark:text-[#737373] text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
