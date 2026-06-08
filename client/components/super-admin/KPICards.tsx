'use client';

import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Target,
  Ticket,
  Megaphone,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const step = w / (points.length - 1);
  const coords = points
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ');
  const fillCoords = `0,${h} ${coords} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[60px] h-6">
      <polyline points={fillCoords} fill={color} fillOpacity="0.12" stroke="none" />
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const KPIS = [
  {
    label: 'Total Users',
    value: '3,754',
    change: '+8.2%',
    positive: true,
    icon: Users,
    color: '#2563EB',
    bgLight: 'bg-blue-50',
    sparkline: [30, 38, 35, 42, 40, 48, 52, 55],
  },
  {
    label: 'Active Users',
    value: '168',
    change: '+12.5%',
    positive: true,
    icon: UserCheck,
    color: '#10B981',
    bgLight: 'bg-emerald-50',
    sparkline: [20, 28, 32, 30, 38, 42, 45, 50],
  },
  {
    label: 'Total Leads',
    value: '12,846',
    change: '+15.3%',
    positive: true,
    icon: Target,
    color: '#8B5CF6',
    bgLight: 'bg-purple-50',
    sparkline: [40, 45, 50, 48, 55, 60, 65, 72],
  },
  {
    label: 'Open Tickets',
    value: '1,264',
    change: '-3.1%',
    positive: false,
    icon: Ticket,
    color: '#F59E0B',
    bgLight: 'bg-amber-50',
    sparkline: [60, 55, 58, 52, 48, 45, 42, 38],
  },
  {
    label: 'Campaigns',
    value: '38',
    change: '+6.7%',
    positive: true,
    icon: Megaphone,
    color: '#EC4899',
    bgLight: 'bg-pink-50',
    sparkline: [15, 18, 20, 22, 25, 28, 32, 38],
  },
  {
    label: 'Revenue',
    value: '₹24.58L',
    change: '+22.4%',
    positive: true,
    icon: DollarSign,
    color: '#2563EB',
    bgLight: 'bg-indigo-50',
    sparkline: [80, 95, 88, 110, 125, 140, 138, 165],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

export default function KPICards({ data }: { data?: any }) {
  const dynamicKPIS = [
    {
      label: 'Total Users',
      value: data ? data.total_users.toLocaleString() : '0',
      change: '+8.2%',
      positive: true,
      icon: Users,
      color: '#2563EB',
      bgLight: 'bg-blue-50',
      sparkline: [30, 38, 35, 42, 40, 48, 52, 55],
    },
    {
      label: 'Active Users',
      value: data ? data.active_users.toLocaleString() : '0',
      change: '+12.5%',
      positive: true,
      icon: UserCheck,
      color: '#10B981',
      bgLight: 'bg-emerald-50',
      sparkline: [20, 28, 32, 30, 38, 42, 45, 50],
    },
    {
      label: 'Total Leads',
      value: data ? data.total_leads.toLocaleString() : '0',
      change: '+15.3%',
      positive: true,
      icon: Target,
      color: '#8B5CF6',
      bgLight: 'bg-purple-50',
      sparkline: [40, 45, 50, 48, 55, 60, 65, 72],
    },
    {
      label: 'Open Tickets',
      value: data ? data.open_tickets.toLocaleString() : '0',
      change: '-3.1%',
      positive: false,
      icon: Ticket,
      color: '#F59E0B',
      bgLight: 'bg-amber-50',
      sparkline: [60, 55, 58, 52, 48, 45, 42, 38],
    },
    {
      label: 'Campaigns',
      value: data ? data.campaigns.toLocaleString() : '0',
      change: '+6.7%',
      positive: true,
      icon: Megaphone,
      color: '#EC4899',
      bgLight: 'bg-pink-50',
      sparkline: [15, 18, 20, 22, 25, 28, 32, 38],
    },
    {
      label: 'Revenue',
      value: data ? `₹${(data.revenue / 100000).toFixed(2)}L` : '₹0',
      change: '+22.4%',
      positive: true,
      icon: DollarSign,
      color: '#2563EB',
      bgLight: 'bg-indigo-50',
      sparkline: [80, 95, 88, 110, 125, 140, 138, 165],
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4"
    >
      {dynamicKPIS.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.positive ? TrendingUp : TrendingDown;
        return (
          <motion.div
            key={kpi.label}
            variants={item}
            className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${kpi.bgLight} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span
                className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${kpi.positive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-red-600 bg-red-50'
                  }`}
              >
                <TrendIcon className="w-3 h-3" />
                {kpi.change}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0F172A] leading-none tracking-tight">
              {kpi.value}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] sm:text-xs text-[#64748B] leading-tight">
                {kpi.label}
              </p>
              <MiniSparkline points={kpi.sparkline} color={kpi.color} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
