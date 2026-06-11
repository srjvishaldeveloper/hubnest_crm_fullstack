'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  MonitorSmartphone,
  LogIn,
  TrendingUp,
} from 'lucide-react';

/* ── Department Distribution ──────────────── */
const DEPT_DATA = [
  { name: 'Sales', value: 480, color: '#3B82F6' },
  { name: 'Support', value: 320, color: '#F59E0B' },
  { name: 'Marketing', value: 240, color: '#EC4899' },
  { name: 'Engineering', value: 180, color: '#8B5CF6' },
  { name: 'HR', value: 120, color: '#10B981' },
];

/* ── System Usage ─────────────────────────── */
const USAGE_DATA = [
  { name: 'Mon', api: 2400, page: 1800 },
  { name: 'Tue', api: 2800, page: 2100 },
  { name: 'Wed', api: 3200, page: 2400 },
  { name: 'Thu', api: 2900, page: 2200 },
  { name: 'Fri', api: 3600, page: 2800 },
  { name: 'Sat', api: 1800, page: 1200 },
  { name: 'Sun', api: 1400, page: 900 },
];

/* ── Login Trends ─────────────────────────── */
const LOGIN_DATA = [
  { day: 'Mon', logins: 820, failed: 24 },
  { day: 'Tue', logins: 950, failed: 18 },
  { day: 'Wed', logins: 1100, failed: 32 },
  { day: 'Thu', logins: 980, failed: 15 },
  { day: 'Fri', logins: 1250, failed: 28 },
  { day: 'Sat', logins: 540, failed: 12 },
  { day: 'Sun', logins: 380, failed: 8 },
];

/* ── Tenant Growth ────────────────────────── */
const TENANT_DATA = [
  { month: 'Jan', tenants: 42 },
  { month: 'Feb', tenants: 48 },
  { month: 'Mar', tenants: 55 },
  { month: 'Apr', tenants: 62 },
  { month: 'May', tenants: 71 },
  { month: 'Jun', tenants: 84 },
];

const tooltipStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  fontSize: '12px',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function AnalyticsGrid() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* ── Department Distribution ─────────── */}
      <motion.div variants={item} className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8B5CF6]" />
            Department Distribution
          </h3>
          <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Users across departments</p>
        </div>
        <div className="relative">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={DEPT_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={2} stroke="white">
                {DEPT_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
          {DEPT_DATA.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-[#64748B] dark:text-[#9CA3AF] truncate">{d.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── System Usage ───────────────────── */}
      <motion.div variants={item} className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-[#F59E0B]" />
            System Usage
          </h3>
          <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF] mt-0.5">API calls & page views</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={USAGE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="api" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={10} />
            <Bar dataKey="page" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Login Trends ───────────────────── */}
      <motion.div variants={item} className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm flex items-center gap-2">
            <LogIn className="w-4 h-4 text-emerald-500" />
            Login Trends
          </h3>
          <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Login attempts this week</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={LOGIN_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="logins" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Tenant Growth ──────────────────── */}
      <motion.div variants={item} className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
              Tenant Growth
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF] mt-0.5">New tenants per month</p>
          </div>
          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 rounded-full">+18.3%</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={TENANT_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="tenants" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
