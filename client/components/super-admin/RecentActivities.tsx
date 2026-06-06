'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  UserPlus,
  Target,
  Megaphone,
  Ticket,
  ShieldCheck,
  Building2,
} from 'lucide-react';

const ACTIVITIES = [
  { icon: UserPlus, text: 'New user Sarah Johnson registered', time: '2 min ago', color: '#2563EB', bg: 'bg-blue-50' },
  { icon: Target, text: 'Lead "Acme Corp" moved to negotiation stage', time: '15 min ago', color: '#8B5CF6', bg: 'bg-purple-50' },
  { icon: Megaphone, text: 'Campaign "Summer Sale 2026" launched', time: '1 hour ago', color: '#EC4899', bg: 'bg-pink-50' },
  { icon: Ticket, text: 'Ticket #4821 resolved by Admin Mike', time: '2 hours ago', color: '#10B981', bg: 'bg-emerald-50' },
  { icon: ShieldCheck, text: 'Admin role assigned to Alex Turner', time: '3 hours ago', color: '#F59E0B', bg: 'bg-amber-50' },
  { icon: Building2, text: 'New tenant "TechStart Inc" created', time: '5 hours ago', color: '#6366F1', bg: 'bg-indigo-50' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

export default function RecentActivities() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#64748B]" />
            Recent Activity
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Latest events across the platform</p>
        </div>
        <button className="text-xs text-[#2563EB] font-semibold hover:underline">View All</button>
      </div>

      {/* Timeline */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative"
      >
        {/* Vertical connector line */}
        <div className="absolute left-[18px] top-3 bottom-3 w-[2px] bg-slate-100 rounded-full" />

        <div className="space-y-4">
          {ACTIVITIES.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                className="relative flex items-start gap-3 pl-1 group"
              >
                <div className={`relative z-10 w-9 h-9 ${a.bg} rounded-xl flex items-center justify-center shrink-0 ring-4 ring-white group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-[#0F172A] leading-snug group-hover:text-[#2563EB] transition-colors">{a.text}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
