'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Database,
  HardDrive,
  FolderArchive,
  Mail,
  KeyRound,
  Activity,
} from 'lucide-react';

const SERVICES = [
  { name: 'API Status', icon: Server, status: 'operational' as const, latency: '42ms', uptime: '99.98%' },
  { name: 'Database', icon: Database, status: 'operational' as const, latency: '8ms', uptime: '99.99%' },
  { name: 'Redis', icon: HardDrive, status: 'operational' as const, latency: '2ms', uptime: '99.97%' },
  { name: 'Storage', icon: FolderArchive, status: 'degraded' as const, latency: '120ms', uptime: '99.85%' },
  { name: 'Email Service', icon: Mail, status: 'operational' as const, latency: '180ms', uptime: '99.92%' },
  { name: 'OTP Service', icon: KeyRound, status: 'operational' as const, latency: '95ms', uptime: '99.94%' },
];

const statusConfig = {
  operational: { label: 'Operational', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  degraded: { label: 'Degraded', dotColor: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  down: { label: 'Down', dotColor: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SystemStatus() {
  const allOperational = SERVICES.every((s) => s.status === 'operational');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#F59E0B]" />
            System Status
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Infrastructure health & performance</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          allOperational
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            : 'text-amber-700 bg-amber-50 border border-amber-200'
        }`}>
          {allOperational ? 'All Systems Operational' : 'Partial Degradation'}
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const config = statusConfig[service.status];
          return (
            <motion.div
              key={service.name}
              variants={item}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-[#1f1f1f] hover:border-slate-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#161616] flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                <Icon className="w-5 h-5 text-[#64748B] dark:text-[#9CA3AF] group-hover:text-[#F59E0B] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{service.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#94A3B8] dark:text-[#6B7280]">{service.latency}</span>
                  <span className="text-[10px] text-[#94A3B8] dark:text-[#6B7280]">•</span>
                  <span className="text-[10px] text-[#94A3B8] dark:text-[#6B7280]">{service.uptime} uptime</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse-status`} />
                <span className={`text-[10px] font-semibold ${config.textColor}`}>{config.label}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
