'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, LogIn, TrendingUp, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: LogIn,
    title: 'Login Securely',
    desc: 'Single sign-on with 2FA for every team member.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Zap,
    title: 'Manage Your Team',
    desc: 'Assign roles, set goals and route work automatically.',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: TrendingUp,
    title: 'Monitor & Grow',
    desc: 'Real-time dashboards, AI insights and forecasts.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="bg-gradient-to-b from-white via-slate-50/80 to-white py-14">
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
            How it works
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-md mx-auto">
            Three steps to a CRM your whole team will use.
          </p>
        </motion.div>

        {/* Steps */}
        <div ref={ref} className="relative grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="absolute left-[16%] right-[16%] top-8 hidden h-px origin-left bg-gradient-to-r from-blue-200 via-blue-500 to-emerald-300 md:block"
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
                <div className={`w-16 h-16 ${step.iconBg} rounded-2xl flex items-center justify-center border border-white shadow-lg shadow-slate-200/80`}>
                  <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500">{i + 1}</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
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
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors shadow-sm"
          >
            Start for Free — No Credit Card
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
