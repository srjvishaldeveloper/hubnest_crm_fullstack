'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, CircleDollarSign, TrendingUp, Users, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

function RevenueChart() {
  return (
    <svg viewBox="0 0 300 70" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
        <filter id="rev-glow" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M0,60 C40,55 60,42 90,38 C120,34 140,48 170,36 C195,25 225,18 255,12 C272,9 285,11 300,8"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#rev-glow)"
      />
      <path
        d="M0,60 C40,55 60,42 90,38 C120,34 140,48 170,36 C195,25 225,18 255,12 C272,9 285,11 300,8 L300,70 L0,70 Z"
        fill="url(#rev-fill)"
      />
    </svg>
  );
}

function PipelineChart() {
  const bars = [
    { label: 'New', h: '85%' },
    { label: 'Qual', h: '65%' },
    { label: 'Prop', h: '48%' },
    { label: 'Neg', h: '32%' },
    { label: 'Won', h: '20%' },
  ];

  return (
    <div className="flex h-14 items-end gap-2">
      {bars.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-orange-600 to-orange-400 shadow-sm shadow-orange-500/20"
            style={{ height: b.h }}
          />
          <span className="text-[9px] leading-none text-[#555]">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardMockup() {
  const kpis = [
    { label: 'Leads', value: '3,754', change: '+18%', icon: Users },
    { label: 'Tickets', value: '1,264', change: '+4.5%', icon: TrendingUp },
    { label: 'Revenue', value: '₹24.58L', change: '+16%', icon: CircleDollarSign },
  ];

  return (
    <div className="relative">
      {/* Blurred background glow */}
      <div className="absolute -inset-8 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />
      <div className="absolute -inset-4 rounded-full bg-green-500/5 blur-2xl pointer-events-none" />

      {/* Floating Award Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute -right-4 -top-6 z-10 hidden sm:flex items-center gap-1.5 rounded-full border border-[#222] bg-[#111] px-4 py-2 text-xs font-bold text-orange-400 shadow-lg shadow-orange-500/10"
      >
        <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
        <span>Rated #1 CRM Workspace</span>
      </motion.div>

      {/* Floating Conversion Card */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute -left-10 bottom-28 z-10 hidden xl:flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111]/90 p-4 shadow-xl backdrop-blur-md w-52 hover:scale-105 transition-transform duration-300"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-[#555] font-semibold tracking-wide uppercase">Conversion</p>
          <p className="text-sm font-extrabold text-[#ededed]">24.8% <span className="text-green-400 font-semibold text-xs ml-1">+4.2%</span></p>
        </div>
      </motion.div>

      {/* Floating AI Insight Card */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute -right-12 bottom-16 z-10 hidden xl:flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111]/90 p-4 shadow-xl backdrop-blur-md w-56 hover:scale-105 transition-transform duration-300"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] text-[#555] font-semibold tracking-wide uppercase">AI Insights</p>
          <p className="text-xs font-bold text-[#ededed] leading-tight">12 hot leads ready for contact</p>
        </div>
      </motion.div>

      {/* Main mockup card */}
      <div className="relative overflow-hidden rounded-[24px] border border-[#1f1f1f] bg-[#111]/90 shadow-[0_28px_80px_rgba(0,0,0,0.6)] ring-1 ring-[#222]/60 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_32px_96px_rgba(249,115,22,0.08)]">
        <div className="border-b border-[#1a1a1a] bg-[#111]/80 px-5 pb-3 pt-5">
          <p className="mb-1 text-[11px] text-[#555]">Activity Overview</p>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-[#ededed]">CRM Workspace</h3>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 px-5 py-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-3 hover:border-orange-500/20 transition-colors">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <k.icon className="h-3.5 w-3.5" />
              </div>
              <p className="mb-1 text-[10px] text-[#555]">{k.label}</p>
              <p className="text-sm font-bold leading-tight text-[#ededed]">{k.value}</p>
              <p className="mt-1 flex items-center gap-0.5 text-[10px] text-green-400">
                <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                {k.change}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#a3a3a3]">Revenue</p>
            <p className="text-[10px] text-[#555]">Last 7 days</p>
          </div>
          <div className="h-16">
            <RevenueChart />
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#a3a3a3]">Lead Pipeline</p>
            <p className="text-[10px] text-[#555]">This week</p>
          </div>
          <PipelineChart />
        </div>
      </div>
    </div>
  );
}

const heroChildren = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: 'easeOut' as const } },
};

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-white dark:bg-[#0a0a0a] py-16 pt-24 md:py-20 lg:py-24 transition-colors duration-200">
      <div className="relative mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1.15fr] lg:gap-16 xl:gap-24 2xl:gap-32">
          
          {/* Left Text Column */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center pr-2"
          >
            <motion.div
              variants={heroChildren}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222] bg-white/80 dark:bg-[#111]/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#737373] shadow-sm w-fit"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Trusted by 500+ Businesses Worldwide
            </motion.div>

            <motion.h1
              variants={heroChildren}
              className="font-bold text-5xl sm:text-6xl xl:text-[4.85rem] leading-[1.05] tracking-tight text-slate-900 dark:text-[#ededed]"
            >
              Manage Your
              <br />
              Business <span className="bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent font-black">Smarter</span>
              <br />
              With CRM
            </motion.h1>

            <motion.p variants={heroChildren} className="mt-8 max-w-xl text-lg md:text-xl leading-relaxed text-slate-600 dark:text-[#737373]">
              Manage leads, campaigns, tickets, teams and revenue from a single powerful platform built for growing businesses.
            </motion.p>

            {/* Added highlight features grid with refined spacing */}
            <motion.div variants={heroChildren} className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7 max-w-xl">
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] leading-none">Interactive Pipeline</p>
                  <p className="text-[11px] text-slate-600 dark:text-[#555] mt-1 leading-normal">Drag-and-drop lead boards</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-400 shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] leading-none">Advanced Analytics</p>
                  <p className="text-[11px] text-slate-600 dark:text-[#555] mt-1 leading-normal">ROI & forecasting charts</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] leading-none">AI Leads Insights</p>
                  <p className="text-[11px] text-slate-600 dark:text-[#555] mt-1 leading-normal">Automated conversions</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-400 shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] leading-none">Smart Support Tickets</p>
                  <p className="text-[11px] text-slate-600 dark:text-[#555] mt-1 leading-normal">SLA-aware client routing</p>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={heroChildren} className="mt-12 flex flex-col gap-4 sm:flex-row max-w-md">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-7 py-4 text-sm font-bold text-slate-900 dark:text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] px-7 py-4 text-sm font-semibold text-slate-600 dark:text-[#a3a3a3] transition-all hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#161616] hover:border-slate-300 dark:hover:border-[#333] hover:text-slate-900 dark:hover:text-[#ededed]">
                Book Demo
              </button>
            </motion.div>

            {/* Benefit Checkmarks */}
            <motion.div variants={heroChildren} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#555] font-semibold">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  {b}
                </div>
              ))}
            </motion.div>

            {/* Bottom rating block */}
            <motion.div variants={heroChildren} className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-slate-200 dark:border-[#1a1a1a] pt-8">
              <div className="flex -space-x-3.5">
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[#111] bg-orange-500 flex items-center justify-center text-[10px] font-extrabold text-slate-900 dark:text-white shadow-sm select-none">JD</div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[#111] bg-green-500 flex items-center justify-center text-[10px] font-extrabold text-slate-900 dark:text-white shadow-sm select-none">AS</div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[#111] bg-orange-600 flex items-center justify-center text-[10px] font-extrabold text-slate-900 dark:text-white shadow-sm select-none">MK</div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[#111] bg-green-600 flex items-center justify-center text-[10px] font-extrabold text-slate-900 dark:text-white shadow-sm select-none">SR</div>
              </div>
              <div className="text-xs text-slate-500 dark:text-[#555] font-semibold leading-relaxed">
                Join <span className="font-extrabold text-slate-700 dark:text-[#a3a3a3]">12,000+ scaling teams</span> already managing leads.
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex text-orange-400 tracking-tighter">★★★★★</span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-[#444]">4.9/5 average on G2 Crowd</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Mockup Column */}
          {mounted && (
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
              className="animate-float lg:pl-6 xl:pl-16 2xl:pl-24"
            >
              <DashboardMockup />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
