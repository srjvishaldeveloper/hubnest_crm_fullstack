'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const step = w / (points.length - 1);
  const coords = points
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ');
  const fillCoords = `0,${h} ${coords} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8">
      <polyline points={fillCoords} fill={color} fillOpacity="0.12" stroke="none" />
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const METRICS = [
  {
    label: 'Total Revenue',
    value: '₹24.58L',
    sub: '+22.4% vs last month',
    positive: true,
    points: [80, 95, 88, 110, 125, 140, 138, 165],
    color: '#10b981',
    icon: IndianRupee,
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  {
    label: 'Expenses',
    value: '₹8.12L',
    sub: '+4.1% vs last month',
    positive: false,
    points: [40, 45, 42, 48, 52, 55, 58, 62],
    color: '#f59e0b',
    icon: ArrowDownRight,
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  {
    label: 'Net Profit',
    value: '₹16.46L',
    sub: '+31.2% vs last month',
    positive: true,
    points: [40, 50, 46, 62, 73, 85, 80, 103],
    color: '#2563eb',
    icon: ArrowUpRight,
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FinanceSnapshot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#2563EB]" />
            Revenue Snapshot
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Revenue, Expenses & Profit — current month</p>
        </div>
        <span className="text-xs bg-blue-50 text-[#2563EB] font-semibold px-2.5 py-1 rounded-full">
          June 2026
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {METRICS.map((m) => {
          const Icon = m.icon;
          const TrendIcon = m.positive ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={m.label}
              variants={item}
              className={`${m.bgLight} border ${m.borderColor} rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-300 group`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: `${m.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#64748B]">{m.label}</p>
                <p className="text-xl font-extrabold text-[#0F172A] mt-0.5">{m.value}</p>
              </div>
              <Sparkline points={m.points} color={m.color} />
              <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                m.positive ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
              }`}>
                <TrendIcon className="w-3 h-3" />
                {m.sub.split(' ')[0]}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
