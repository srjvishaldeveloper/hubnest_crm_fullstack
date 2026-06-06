'use client';

import { motion } from 'framer-motion';
import {
  Target,
  Headphones,
  Megaphone,
  IndianRupee,
} from 'lucide-react';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function ProgressBar({ label, value, max, color }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#64748B] font-medium">{label}</span>
        <span className="text-xs font-bold text-[#0F172A]">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const CARDS = [
  {
    title: 'Lead Pipeline',
    icon: Target,
    iconColor: '#8B5CF6',
    iconBg: 'bg-purple-50',
    items: [
      { label: 'New', value: 4280, max: 12846, color: '#8B5CF6' },
      { label: 'Qualified', value: 5120, max: 12846, color: '#6D28D9' },
      { label: 'Converted', value: 3446, max: 12846, color: '#4C1D95' },
    ],
  },
  {
    title: 'Support Overview',
    icon: Headphones,
    iconColor: '#F59E0B',
    iconBg: 'bg-amber-50',
    items: [
      { label: 'Open', value: 342, max: 1847, color: '#F59E0B' },
      { label: 'Pending', value: 518, max: 1847, color: '#D97706' },
      { label: 'Resolved', value: 987, max: 1847, color: '#10B981' },
    ],
  },
  {
    title: 'Campaign Performance',
    icon: Megaphone,
    iconColor: '#EC4899',
    iconBg: 'bg-pink-50',
    items: [
      { label: 'Active', value: 12, max: 38, color: '#EC4899' },
      { label: 'Completed', value: 22, max: 38, color: '#DB2777' },
      { label: 'ROI Avg', value: 340, max: 500, color: '#10B981' },
    ],
  },
  {
    title: 'Finance Overview',
    icon: IndianRupee,
    iconColor: '#2563EB',
    iconBg: 'bg-blue-50',
    items: [
      { label: 'Revenue', value: 2458, max: 3000, color: '#2563EB' },
      { label: 'Pending', value: 345, max: 3000, color: '#F59E0B' },
      { label: 'Collections', value: 2113, max: 3000, color: '#10B981' },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function CRMHealth() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            variants={item}
            className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${card.iconBg} rounded-2xl flex items-center justify-center`}>
                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
              <h3 className="font-bold text-[#0F172A] text-sm">{card.title}</h3>
            </div>
            <div className="space-y-3">
              {card.items.map((it) => (
                <ProgressBar key={it.label} {...it} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
