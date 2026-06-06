'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  UserX,
} from 'lucide-react';

const INSIGHTS = [
  {
    icon: TrendingUp,
    text: 'Lead conversion rate is up 18% compared to last month. Consider increasing ad spend on top-performing channels.',
    type: 'positive' as const,
  },
  {
    icon: AlertTriangle,
    text: 'Support SLA risk detected — 3 tickets approaching 24hr breach limit. Recommend assigning 2 more agents.',
    type: 'warning' as const,
  },
  {
    icon: DollarSign,
    text: 'Revenue projected to increase by 12% next quarter based on current pipeline velocity and conversion trends.',
    type: 'positive' as const,
  },
  {
    icon: UserX,
    text: '14 inactive user accounts detected with no login activity in 30+ days. Recommend engagement outreach.',
    type: 'warning' as const,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function AIInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl bg-gradient-to-br from-[#2563EB] via-blue-600 to-blue-800 p-5 sm:p-6 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background decorative circles */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full blur-xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Insights
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">Smart recommendations powered by AI</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </span>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {INSIGHTS.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                className={`p-3.5 rounded-2xl backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                  insight.type === 'positive'
                    ? 'bg-white/10 border-white/10'
                    : 'bg-amber-500/10 border-amber-400/15'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    insight.type === 'positive' ? 'bg-emerald-400/20' : 'bg-amber-400/20'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${
                      insight.type === 'positive' ? 'text-emerald-300' : 'text-amber-300'
                    }`} />
                  </div>
                  <p className="text-[13px] text-white/90 leading-relaxed">{insight.text}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
