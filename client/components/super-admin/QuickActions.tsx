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
  { label: 'Add User', icon: UserPlus, color: '#2563EB', bg: 'bg-blue-50', hover: 'hover:bg-blue-100' },
  { label: 'Add Admin', icon: ShieldPlus, color: '#8B5CF6', bg: 'bg-purple-50', hover: 'hover:bg-purple-100' },
  { label: 'Create Tenant', icon: Building2, color: '#10B981', bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100' },
  { label: 'Launch Campaign', icon: Megaphone, color: '#EC4899', bg: 'bg-pink-50', hover: 'hover:bg-pink-100' },
  { label: 'Generate Report', icon: FileBarChart, color: '#F59E0B', bg: 'bg-amber-50', hover: 'hover:bg-amber-100' },
  { label: 'View Logs', icon: ScrollText, color: '#64748B', bg: 'bg-slate-50', hover: 'hover:bg-slate-100' },
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
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Actions
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Frequently used actions</p>
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
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl ${action.bg} ${action.hover} border border-transparent hover:border-slate-200 transition-all duration-200 group cursor-pointer`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:shadow-md transition-shadow">
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-semibold text-[#0F172A] text-center leading-tight">{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
