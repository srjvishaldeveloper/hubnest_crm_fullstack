'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, Target, TicketCheck, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const AI_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Conversion Prediction',
    desc: 'Predict which leads are most likely to convert using ML models trained on your historical data.',
    stat: '87%',
    statLabel: 'prediction accuracy',
    color: 'from-blue-600 to-cyan-500',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    icon: Target,
    title: 'Lead Scoring',
    desc: 'Automatically score and rank incoming leads so your team focuses on the highest-value prospects first.',
    stat: '3.2×',
    statLabel: 'faster qualification',
    color: 'from-sky-600 to-blue-600',
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
  },
  {
    icon: TicketCheck,
    title: 'Ticket Prioritization',
    desc: 'AI automatically categorizes, tags, and prioritizes support tickets — routing to the right team instantly.',
    stat: '4× faster',
    statLabel: 'ticket resolution',
    color: 'from-emerald-600 to-green-500',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    icon: TrendingUp,
    title: 'Sales Forecasting',
    desc: 'Get accurate revenue forecasts 30, 60 and 90 days out based on pipeline health and team velocity.',
    stat: '±5%',
    statLabel: 'forecast accuracy',
    color: 'from-amber-600 to-orange-500',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
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

  return (
    <section id="ai-insights" className="relative bg-gradient-to-b from-white via-slate-50/50 to-white py-14 px-4 overflow-hidden border-y border-slate-100">
      {/* Light subtle background orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 3 }}
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100/30 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Powered
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            AI-Powered CRM
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 text-slate-500 text-lg max-w-2xl mx-auto"
          >
            Machine learning models trained on millions of CRM interactions to give you a competitive edge that grows smarter every day.
          </motion.p>
        </div>

        {/* Central Brain visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-sky-300/30 scale-150"
              style={{ borderStyle: 'dashed' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-blue-300/20 scale-125"
              style={{ borderStyle: 'dashed' }}
            />
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain className="w-9 h-9 text-white" />
            </div>
            {/* Ping effect */}
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-blue-400/10 rounded-2xl"
            />
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          {AI_FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-white border border-slate-200/80 rounded-2xl p-6 overflow-hidden group hover:shadow-xl hover:border-blue-300/60 transition-all duration-300"
            >
              {/* Gradient line at top */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${feature.color}`} />

              {/* Icon */}
              <div className={`w-11 h-11 ${feature.iconBg} rounded-xl flex items-center justify-center ${feature.iconColor} mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5" />
              </div>

              {/* Stat badge */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-black bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>{feature.stat}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{feature.statLabel}</p>

              <h3 className="font-bold text-slate-900 text-base mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
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
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:-translate-y-0.5"
          >
            Explore all AI features
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
