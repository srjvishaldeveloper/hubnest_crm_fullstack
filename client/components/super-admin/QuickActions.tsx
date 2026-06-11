'use client';

import { motion } from 'framer-motion';
import {
  UserPlus,
  ShieldPlus,
  Building2,
  Megaphone,
  FileBarChart,
  ScrollText,
  Zap,
} from 'lucide-react';

const ACTIONS = [
  { label: 'Add User', icon: UserPlus, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30' },
  { label: 'Add Admin', icon: ShieldPlus, color: '#8B5CF6', bg: 'bg-purple-50 dark:bg-purple-900/20', hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30' },
  { label: 'Create Tenant', icon: Building2, color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
  { label: 'Launch Campaign', icon: Megaphone, color: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-900/20', hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30' },
  { label: 'Generate Report', icon: FileBarChart, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30' },
  { label: 'View Logs', icon: ScrollText, color: '#64748B', bg: 'bg-slate-50 dark:bg-slate-800/40', hover: 'hover:bg-slate-100 dark:hover:bg-slate-700/40' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card dark:bg-[#111111] rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Actions
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Frequently used actions</p>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              variants={item}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl ${action.bg} ${action.hover} border border-transparent hover:border-slate-200 dark:hover:border-[#333] transition-all duration-200 group cursor-pointer`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-[#1a1a1a] shadow-sm group-hover:shadow-md transition-shadow">
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E5E7EB] text-center leading-tight">{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
