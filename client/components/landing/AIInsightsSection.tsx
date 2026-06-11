'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Brain, Target, TicketCheck, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const AI_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Conversion Prediction',
    desc: 'Predict which leads are most likely to convert using ML models trained on your historical data.',
    stat: '87%',
    statLabel: 'prediction accuracy',
    statColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    topLine: 'from-orange-500 to-orange-400',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.14)]',
    borderHover: 'hover:border-orange-500/30',
  },
  {
    icon: Target,
    title: 'Lead Scoring',
    desc: 'Automatically score and rank incoming leads so your team focuses on the highest-value prospects first.',
    stat: '3.2×',
    statLabel: 'faster qualification',
    statColor: 'text-green-400',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    topLine: 'from-green-500 to-green-400',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.14)]',
    borderHover: 'hover:border-green-500/30',
  },
  {
    icon: TicketCheck,
    title: 'Ticket Prioritization',
    desc: 'AI automatically categorizes, tags, and prioritizes support tickets — routing to the right team instantly.',
    stat: '4× faster',
    statLabel: 'ticket resolution',
    statColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    topLine: 'from-orange-500 to-amber-400',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.14)]',
    borderHover: 'hover:border-orange-500/30',
  },
  {
    icon: TrendingUp,
    title: 'Sales Forecasting',
    desc: 'Get accurate revenue forecasts 30, 60 and 90 days out based on pipeline health and team velocity.',
    stat: '±5%',
    statLabel: 'forecast accuracy',
    statColor: 'text-green-400',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    topLine: 'from-green-600 to-emerald-400',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.14)]',
    borderHover: 'hover:border-green-500/30',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function AIInsightsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="ai-insights" className="relative bg-white dark:bg-[#050505] py-20 px-4 overflow-hidden border-y border-slate-200 dark:border-[#1a1a1a] transition-colors duration-200">
      {/* Background glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, delay: 3 }}
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Powered
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-[#ededed] tracking-tight leading-tight"
          >
            AI-Powered CRM
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 text-slate-600 dark:text-[#737373] text-lg max-w-2xl mx-auto"
          >
            Machine learning models trained on millions of CRM interactions to give you a
            competitive edge that grows smarter every day.
          </motion.p>
        </div>

        {/* Central Brain visual */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex justify-center mb-10"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-orange-500/20 scale-150"
                style={{ borderStyle: 'dashed' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-green-500/15 scale-125"
                style={{ borderStyle: 'dashed' }}
              />
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Brain className="w-9 h-9 text-slate-900 dark:text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-orange-400/10 rounded-2xl"
              />
            </div>
          </motion.div>
        )}

        {/* Feature cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {AI_FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#1f1f1f] shadow-sm dark:shadow-none rounded-2xl p-6 overflow-hidden group transition-all duration-300 ${feature.glow} ${feature.borderHover}`}
            >
              {/* Gradient line at top */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${feature.topLine}`} />

              {/* Icon */}
              <div className={`w-11 h-11 ${feature.iconBg} rounded-xl flex items-center justify-center ${feature.iconColor} mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5" />
              </div>

              {/* Stat */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-black ${feature.statColor}`}>{feature.stat}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#555] mb-4">{feature.statLabel}</p>

              <h3 className="font-bold text-slate-900 dark:text-[#ededed] text-base mb-2">{feature.title}</h3>
              <p className="text-slate-600 dark:text-[#737373] text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
          >
            Explore all AI features
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
