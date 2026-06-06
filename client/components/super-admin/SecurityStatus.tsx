'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Monitor,
  Ban,
  Gauge,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const METRICS = [
  { icon: Lock, label: 'Failed Logins', value: '47', status: 'warning', color: '#F59E0B', bg: 'bg-amber-50' },
  { icon: Monitor, label: 'Active Sessions', value: '328', status: 'healthy', color: '#10B981', bg: 'bg-emerald-50' },
  { icon: Ban, label: 'Blocked IPs', value: '12', status: 'critical', color: '#EF4444', bg: 'bg-red-50' },
  { icon: Gauge, label: 'Security Score', value: '94%', status: 'healthy', color: '#2563EB', bg: 'bg-blue-50' },
];

const EVENTS = [
  { text: 'Brute force attempt blocked from 203.0.113.42', time: '5 min ago', severity: 'critical' as const },
  { text: 'Admin Mike logged in from new device', time: '1 hour ago', severity: 'warning' as const },
  { text: 'SSL certificate renewed successfully', time: '3 hours ago', severity: 'healthy' as const },
  { text: 'Firewall rules updated (v2.4.1)', time: '6 hours ago', severity: 'healthy' as const },
];

const statusBadge = {
  healthy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  critical: 'text-red-700 bg-red-50 border-red-200',
};

const statusLabel = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
};

const statusIcon = {
  healthy: CheckCircle,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SecurityStatus() {
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
            <Shield className="w-4 h-4 text-[#2563EB]" />
            Security Panel
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Security metrics & recent events</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge.healthy}`}>
          System Healthy
        </span>
      </div>

      {/* Metrics Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
      >
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              variants={item}
              className={`${m.bg} rounded-2xl p-3 text-center hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <p className="text-lg font-extrabold text-[#0F172A]">{m.value}</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">{m.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Security Events */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Recent Events</p>
        <div className="space-y-2">
          {EVENTS.map((e, i) => {
            const SeverityIcon = statusIcon[e.severity];
            return (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <SeverityIcon className={`w-4 h-4 shrink-0 ${
                  e.severity === 'critical' ? 'text-red-500' : e.severity === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <p className="text-sm text-[#0F172A] flex-1 group-hover:text-[#2563EB] transition-colors">{e.text}</p>
                <span className="text-[11px] text-[#94A3B8] shrink-0">{e.time}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[e.severity]}`}>
                  {statusLabel[e.severity]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
