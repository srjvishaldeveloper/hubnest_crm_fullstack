'use client';

import { motion } from 'framer-motion';
import {
  Plug,
  MessageCircle,
  Mail,
  Smartphone,
  Phone,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const INTEGRATIONS = [
  { name: 'WhatsApp API', icon: MessageCircle, status: 'connected' as const, description: 'Business messaging' },
  { name: 'Email Service', icon: Mail, status: 'connected' as const, description: 'SMTP & Transactional' },
  { name: 'SMS Gateway', icon: Smartphone, status: 'warning' as const, description: 'OTP & Notifications' },
  { name: 'Calling API', icon: Phone, status: 'disconnected' as const, description: 'VoIP Integration' },
  { name: 'Payment Gateway', icon: CreditCard, status: 'connected' as const, description: 'Razorpay / Stripe' },
  { name: 'Google Workspace', icon: Globe, status: 'connected' as const, description: 'Calendar & Drive' },
];

const statusConfig = {
  connected: { label: 'Connected', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  disconnected: { label: 'Disconnected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', border: 'border-amber-200' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function IntegrationsPanel() {
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
            <Plug className="w-4 h-4 text-[#2563EB]" />
            Integrations
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Third-party service connections</p>
        </div>
        <button className="text-xs text-[#2563EB] font-semibold hover:underline">Manage</button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const config = statusConfig[integration.status];
          const StatusIcon = config.icon;
          return (
            <motion.div
              key={integration.name}
              variants={item}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                <Icon className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">{integration.name}</p>
                <p className="text-[11px] text-[#94A3B8]">{integration.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-2 h-2 rounded-full ${config.dot} ${integration.status === 'connected' ? 'animate-pulse-status' : ''}`} />
                <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
