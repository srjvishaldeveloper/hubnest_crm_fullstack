'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, LogIn, TrendingUp, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: LogIn,
    title: 'Login Securely',
    desc: 'Single sign-on with 2FA for every team member.',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    numBg: 'bg-orange-500/20 text-orange-400',
    connectorColor: 'from-orange-500/50 via-green-500/50 to-green-500/50',
  },
  {
    icon: Zap,
    title: 'Manage Your Team',
    desc: 'Assign roles, set goals and route work automatically.',
    iconBg: 'bg-green-500/10 border border-green-500/20',
    iconColor: 'text-green-400',
    numBg: 'bg-green-500/20 text-green-400',
    connectorColor: '',
  },
  {
    icon: TrendingUp,
    title: 'Monitor & Grow',
    desc: 'Real-time dashboards, AI insights and forecasts.',
    iconBg: 'bg-orange-500/10 border border-orange-500/20',
    iconColor: 'text-orange-400',
    numBg: 'bg-orange-500/20 text-orange-400',
    connectorColor: '',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="bg-white dark:bg-[#0a0a0a] py-20 transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-slate-600 dark:text-[#737373] text-lg max-w-md mx-auto">
            Three steps to a CRM your whole team will use.
          </p>
        </motion.div>

        {/* Steps */}
        <div ref={ref} className="relative grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {/* Connector line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="absolute left-[16%] right-[16%] top-8 hidden h-px origin-left bg-gradient-to-r from-orange-500/40 via-green-500/40 to-orange-500/40 md:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 + 0.1, duration: 0.6, ease: 'easeOut' }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className={`w-16 h-16 ${step.iconBg} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${step.numBg} border border-white dark:border-[#222] rounded-full flex items-center justify-center`}>
                  <span className="text-[10px] font-black">{i + 1}</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-[#ededed] mb-2">{step.title}</h3>
              <p className="text-slate-600 dark:text-[#737373] text-sm leading-relaxed max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 text-center"
        >
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
          >
            Start for Free — No Credit Card
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
