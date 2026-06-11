'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Zap, Building2 } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    desc: 'For small teams getting started.',
    price: '₹999',
    period: '/mo',
    featured: false,
    cta: 'Choose Starter',
    icon: Check,
    features: [
      'Up to 5 users',
      '1,000 leads',
      'Email support',
      'Basic reports',
    ],
  },
  {
    name: 'Pro',
    desc: 'For growing businesses.',
    price: '₹2,499',
    period: '/mo',
    featured: true,
    cta: 'Choose Pro',
    icon: Zap,
    features: [
      'Up to 25 users',
      'Unlimited leads',
      'Campaigns + Tickets',
      'AI insights',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    desc: 'For multi-tenant operations.',
    price: 'Custom',
    period: '',
    featured: false,
    cta: 'Choose Enterprise',
    icon: Building2,
    features: [
      'Unlimited users',
      'Custom roles',
      'Dedicated CSM',
      'SLA + SSO',
      'On-prem option',
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-[#F8FAFC] dark:bg-[#0a0a0a] py-20 transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight">
            Simple, scalable pricing
          </h2>
          <p className="mt-4 text-slate-600 dark:text-[#737373] text-lg">
            Pick a plan and upgrade as you grow.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mt-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className={`relative rounded-2xl flex flex-col transition-all duration-300 ${
                plan.featured
                  ? 'bg-white dark:bg-[#111111] border-2 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.12)] pt-10 px-8 pb-8'
                  : 'bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#1f1f1f] hover:border-slate-300 dark:hover:border-[#2a2a2a] hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] shadow-sm dark:shadow-none p-8'
              }`}
            >
              {/* Most Popular badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-orange-500 text-slate-900 dark:text-white text-xs font-black px-5 py-1.5 rounded-full whitespace-nowrap border-2 border-[#111] shadow-lg shadow-orange-500/40">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Gradient top line for featured */}
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500 to-green-400 rounded-t-2xl" />
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#ededed]">{plan.name}</h3>
                <p className="text-slate-600 dark:text-[#737373] text-sm mt-1">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`leading-none tracking-tight text-slate-900 dark:text-[#ededed] ${
                  plan.price === 'Custom'
                    ? 'text-4xl font-bold'
                    : 'text-4xl font-black'
                }`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-slate-500 dark:text-[#555] text-base ml-1">{plan.period}</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.featured ? 'bg-orange-500/20' : 'bg-green-500/15'}`}>
                      <Check className={`w-2.5 h-2.5 ${plan.featured ? 'text-orange-400' : 'text-green-400'}`} />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-[#a3a3a3]">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth/login"
                className={`block text-center text-sm font-bold py-3 rounded-xl transition-all duration-200 ${
                  plan.featured
                    ? 'bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5'
                    : 'bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#222] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] hover:text-slate-900 dark:hover:text-[#ededed] hover:border-slate-300 dark:hover:border-[#333]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
