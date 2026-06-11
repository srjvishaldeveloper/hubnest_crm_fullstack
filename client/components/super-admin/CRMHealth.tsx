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
        <span className="text-xs text-[#64748B] dark:text-[#9CA3AF] font-medium">{label}</span>
        <span className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{value.toLocaleString()}</span>
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

interface CRMHealthProps {
  leadPipeline?: { new: number; contacted: number; interested: number; negotiation: number; converted: number };
  supportOverview?: { open: number; in_progress: number; resolved: number };
  campaignPerformance?: { active: number; leads: number; roi: string };
  financeOverview?: { revenue: number; pending: number; collected: number };
}

export default function CRMHealth({ leadPipeline, supportOverview, campaignPerformance, financeOverview }: CRMHealthProps) {
  const safeLeadTotal = leadPipeline ? Object.values(leadPipeline).reduce((a, b) => a + b, 0) || 1 : 12846;
  const safeSupportTotal = supportOverview ? Object.values(supportOverview).reduce((a, b) => a + b, 0) || 1 : 1847;
  
  const dynamicCards = [
    {
      title: 'Lead Pipeline',
      icon: Target,
      iconColor: '#8B5CF6',
      iconBg: 'bg-purple-50',
      items: [
        { label: 'New', value: leadPipeline?.new || 0, max: safeLeadTotal, color: '#8B5CF6' },
        { label: 'Contacted', value: leadPipeline?.contacted || 0, max: safeLeadTotal, color: '#6D28D9' },
        { label: 'Converted', value: leadPipeline?.converted || 0, max: safeLeadTotal, color: '#4C1D95' },
      ],
    },
    {
      title: 'Support Overview',
      icon: Headphones,
      iconColor: '#F59E0B',
      iconBg: 'bg-amber-50',
      items: [
        { label: 'Open', value: supportOverview?.open || 0, max: safeSupportTotal, color: '#F59E0B' },
        { label: 'In Progress', value: supportOverview?.in_progress || 0, max: safeSupportTotal, color: '#D97706' },
        { label: 'Resolved', value: supportOverview?.resolved || 0, max: safeSupportTotal, color: '#10B981' },
      ],
    },
    {
      title: 'Campaign Performance',
      icon: Megaphone,
      iconColor: '#EC4899',
      iconBg: 'bg-pink-50',
      items: [
        { label: 'Active', value: campaignPerformance?.active || 0, max: Math.max(38, campaignPerformance?.active || 0), color: '#EC4899' },
        { label: 'Leads', value: campaignPerformance?.leads || 0, max: Math.max(500, campaignPerformance?.leads || 0), color: '#DB2777' },
        { label: 'ROI Avg', value: parseInt(campaignPerformance?.roi?.replace(/[^0-9]/g, '') || '0', 10), max: 100, color: '#10B981' },
      ],
    },
    {
      title: 'Finance Overview',
      icon: IndianRupee,
      iconColor: '#F59E0B',
      iconBg: 'bg-amber-50',
      items: [
        { label: 'Revenue', value: financeOverview?.revenue || 0, max: Math.max(3000, financeOverview?.revenue || 0), color: '#F59E0B' },
        { label: 'Pending', value: financeOverview?.pending || 0, max: Math.max(3000, financeOverview?.revenue || 0), color: '#F59E0B' },
        { label: 'Collections', value: financeOverview?.collected || 0, max: Math.max(3000, financeOverview?.revenue || 0), color: '#10B981' },
      ],
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {dynamicCards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            variants={item}
            className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${card.iconBg} rounded-2xl flex items-center justify-center`}>
                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
              <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm">{card.title}</h3>
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
