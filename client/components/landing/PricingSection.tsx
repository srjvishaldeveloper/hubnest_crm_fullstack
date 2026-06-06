'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    desc: 'For small teams getting started.',
    price: '₹999',
    period: '/mo',
    featured: false,
    cta: 'Choose Starter',
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
    <section id="pricing" className="bg-white py-14">
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
            Simple, scalable pricing
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Pick a plan and upgrade as you grow.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.featured
                  ? 'border-2 border-blue-600 shadow-lg shadow-blue-100'
                  : 'border border-slate-200'
              }`}
            >
              {/* Most Popular badge */}
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-[11px] font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`leading-none tracking-tight ${
                  plan.price === 'Custom'
                    ? 'text-4xl font-serif text-slate-900'
                    : 'text-4xl font-bold text-slate-900'
                }`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-slate-400 text-base ml-1">{plan.period}</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-sm text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth/login"
                className={`block text-center text-sm font-semibold py-3 rounded-xl transition-colors ${
                  plan.featured
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
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
