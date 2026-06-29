'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Check, Sparkles, TrendingUp, Zap, Shield, BarChart3, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Professional Spring Physics configs
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 130, damping: 20 } 
  },
};

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      title: 'Interactive Pipelines',
      tag: 'Zero Friction',
      tagBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
      desc: 'Drag-and-drop lead stages with automated round-robin assignment and real-time win probability scoring.',
      icon: BarChart3,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      glow: 'from-orange-500/20 via-transparent to-transparent',
      metric: '85% Win Rate',
      metricBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      liveText: 'Live Syncing',
    },
    {
      title: 'Advanced Analytics',
      tag: 'Real-time BI',
      tagBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      desc: 'Gain full visibility into MRR, CAC, net profit forecasts, and live team quota achievement charts.',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      glow: 'from-emerald-500/20 via-transparent to-transparent',
      metric: '3.8x ROI',
      metricBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      liveText: 'Instant BI',
    },
    {
      title: 'Automated AI Insights',
      tag: 'AI Powered',
      tagBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      desc: 'Instant lead qualification, automatic WhatsApp/Meta sync, and intelligent next-best-action coaching.',
      icon: Zap,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      glow: 'from-amber-500/20 via-transparent to-transparent',
      metric: '< 2m Response',
      metricBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      liveText: 'AI Active',
    },
    {
      title: 'SLA-Driven Help Desk',
      tag: 'Enterprise SLA',
      tagBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      desc: 'Multichannel support ticketing with automated priority routing and sub-minute response SLA tracking.',
      icon: Shield,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      glow: 'from-purple-500/20 via-transparent to-transparent',
      metric: '99.99% SLA',
      metricBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      liveText: 'Priority Route',
    },
  ];

  return (
    <section className="relative flex min-h-[94vh] items-center justify-center overflow-hidden bg-slate-50/50 dark:bg-[#070709] py-20 pt-28 md:py-32 transition-colors duration-300">
      {/* ─── STAFF ENG AMBIENT GLOWS & GRIDS ─── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[750px] pointer-events-none overflow-hidden z-0">
        {/* Breathing animated multi-layered radial gradients */}
        <motion.div 
          animate={{ opacity: [0.65, 0.85, 0.65], scale: [1, 1.05, 1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[900px] bg-gradient-to-b from-orange-500/15 via-purple-500/10 to-emerald-500/5 rounded-full blur-[140px] dark:from-orange-500/25 dark:via-purple-500/15 dark:to-emerald-500/10" 
        />
        {/* High-end architect grid pattern */}
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Subtle top horizontal glowing beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[90%] sm:max-w-5xl lg:max-w-[1250px] px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center"
        >
          {/* Top Elite Live Tag */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-8 group relative inline-flex items-center gap-2.5 rounded-full border border-slate-200/90 dark:border-[#222] bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-[#a3a3a3] shadow-xl shadow-slate-500/5 dark:shadow-black/60 transition-all duration-300 hover:border-orange-500/40 dark:hover:border-orange-500/40 cursor-pointer"
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm pointer-events-none" />
            <span className="relative flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="relative text-slate-900 dark:text-[#ededed] font-extrabold tracking-tight">Next-Gen Enterprise Operating System</span>
            <span className="relative text-slate-300 dark:text-[#333]">|</span>
            <span className="relative flex items-center gap-1 text-orange-500 dark:text-orange-400 font-extrabold">
              <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Rated #1 CRM
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform duration-200" />
          </motion.div>

          {/* Main Centered Masterpiece Title */}
          <motion.h1
            variants={itemVariants}
            className="font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem] leading-[1.06] tracking-tight text-slate-900 dark:text-[#ededed] max-w-5xl mx-auto"
          >
            Manage Your Business{' '}
            <span className="relative inline-block text-orange-500 font-black drop-shadow-sm">
              Smarter
              <span className="absolute left-0 bottom-1 w-full h-[6px] bg-orange-500/20 rounded-full blur-[2px] -z-10" />
            </span>{' '}
            With CRM
          </motion.h1>

          {/* Expanded Enterprise Description */}
          <motion.p
            variants={itemVariants}
            className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl leading-relaxed text-slate-600 dark:text-[#737373] font-medium"
          >
            Unify your entire revenue engine. HubNest brings advanced sales automation, omnichannel marketing campaigns, SLA-driven support desks, and real-time pipeline analytics into one elite platform built for high-velocity scaling.
          </motion.p>

          {/* High-Fidelity Bento Grid with Dynamic Hover Physics */}
          <motion.div
            variants={containerVariants}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto text-left"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
                whileHover={{ scale: 1.025, translateY: -6 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-[#222] bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl p-7 shadow-lg shadow-slate-500/5 dark:shadow-black/60 transition-all duration-300 hover:border-slate-300 dark:hover:border-[#333] hover:shadow-2xl dark:hover:shadow-black/90 overflow-hidden"
              >
                {/* Dynamic Hover Ambient Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${f.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                {/* Top Section */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${f.bg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                      <f.icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border uppercase tracking-wider shadow-sm ${f.tagBg}`}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-200">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#737373] mt-2.5 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>

                {/* Mini Animated Visual Bar / Metrics */}
                <div className="relative z-10 mt-8 pt-5 border-t border-slate-100 dark:border-[#1c1c1c] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#666] uppercase tracking-wider">
                      {f.liveText}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${f.metricBg}`}>
                    {f.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium CTAs with Elite Micro-Interactions */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto"
          >
            <div className="relative w-full sm:w-auto group">
              <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 opacity-30 blur-lg group-hover:opacity-100 transition-opacity duration-300" />
              <Link
                href="/auth/login"
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-10 py-4 text-base font-extrabold text-white shadow-xl shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
            <button className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] px-10 py-4 text-base font-bold text-slate-700 dark:text-[#a3a3a3] shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#161616] hover:border-slate-300 dark:hover:border-[#333] hover:text-slate-900 dark:hover:text-[#ededed] active:translate-y-0">
              Book Demo
            </button>
          </motion.div>

          {/* Ultra-Premium Benefit Pill Rack - Fixed max-width to ensure perfect single-line or 2x2 wrapping */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-4xl mx-auto px-4"
          >
            {['No credit card required', '14-day free trial', 'Cancel anytime', 'Setup in < 3 minutes'].map((b) => (
              <div key={b} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/60 dark:border-[#1f1f1f] bg-white/50 dark:bg-[#111]/50 backdrop-blur-md text-xs sm:text-sm text-slate-600 dark:text-[#777] font-bold tracking-wide shadow-sm transition-colors duration-200 hover:border-slate-300 dark:hover:border-[#333]">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <Check className="h-2.5 w-2.5" />
                </div>
                {b}
              </div>
            ))}
          </motion.div>

          {/* Masterpiece Bounded Trust & Metric Bar */}
          <motion.div
            variants={itemVariants}
            className="mt-24 relative w-full max-w-6xl mx-auto rounded-3xl border border-slate-200/90 dark:border-[#222] bg-white/70 dark:bg-[#111]/70 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-slate-500/5 dark:shadow-black/80 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center text-center lg:text-left"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <div className="flex -space-x-4 shrink-0 hover:space-x-1 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-sm font-extrabold text-white shadow-lg select-none">JD</div>
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-extrabold text-white shadow-lg select-none">AS</div>
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-extrabold text-white shadow-lg select-none">MK</div>
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-sm font-extrabold text-white shadow-lg select-none">SR</div>
              </div>
              <div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-[#777] font-semibold leading-relaxed">
                  Join <span className="font-extrabold text-slate-900 dark:text-[#ededed]">12,000+ scaling teams</span> already managing leads smarter.
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-2">
                  <span className="flex text-orange-500 tracking-tighter text-base">★★★★★</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-[#888] bg-slate-100 dark:bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#222]">4.9/5 average on G2 Crowd</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start justify-center border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-[#1c1c1c] pt-8 lg:pt-0 lg:pl-10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-[#ededed] tracking-tight">3.8x</span>
                <TrendingUp className="w-5 h-5 text-emerald-500 animate-bounce" />
              </div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-[#666] uppercase tracking-wider mt-2">Average Quota Attainment</p>
            </div>

            <div className="flex flex-col items-center lg:items-start justify-center border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-[#1c1c1c] pt-8 lg:pt-0 lg:pl-10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-[#ededed] tracking-tight">99.99%</span>
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-[#666] uppercase tracking-wider mt-2">SLA Guarantee & Uptime</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
