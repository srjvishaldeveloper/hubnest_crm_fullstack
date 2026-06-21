'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Edit2, Save, X, Shield, Lock, Eye, EyeOff,
  Bell, Settings, Activity, Target, TrendingUp, Users, Award, LogOut,
  HelpCircle, MessageSquare, AlertCircle, CheckCircle, Calendar, Clock,
  Monitor, Smartphone, ChevronRight, Sparkles, Star, BarChart3,
} from 'lucide-react';
import { smGetProfile, smUpdateProfile, smGetTargets } from '../../../services/salesManagerService';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../components/shared/ThemeProvider';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  name: string;
  email: string;
  mobile: string;
  employeeId: string;
  department: string;
  location: string;
  address: string;
  emergencyContact: string;
  joinedDate: string;
  avatar: string;
}

interface Targets {
  revenueTarget: number;
  revenueAchieved: number;
  leadsTarget: number;
  leadsConverted: number;
  teamMembers: number;
  activeMembers: number;
  totalLeadsHandled: number;
  totalConversions: number;
  monthlyTrend: number[];
  topPerformers: { name: string; deals: number; revenue: string; rate: number }[];
}

type ActiveTab = 'info' | 'performance' | 'security' | 'settings';

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
const MOCK_PROFILE: Profile = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@hubnest.in',
  mobile: '+91 98765 43210',
  employeeId: 'EMP-2001',
  department: 'Sales',
  location: 'Mumbai, India',
  address: '302, Everest Nagar, Andheri West, Mumbai 400058',
  emergencyContact: '+91 91234 56789',
  joinedDate: '15 Jan 2023',
  avatar: 'RK',
};

const MOCK_TARGETS: Targets = {
  revenueTarget: 50,
  revenueAchieved: 38,
  leadsTarget: 200,
  leadsConverted: 154,
  teamMembers: 8,
  activeMembers: 7,
  totalLeadsHandled: 412,
  totalConversions: 154,
  monthlyTrend: [28, 34, 29, 41, 38, 45, 38],
  topPerformers: [
    { name: 'Arun Menon', deals: 24, revenue: '₹8.2L', rate: 72 },
    { name: 'Deepa Krishnan', deals: 19, revenue: '₹6.7L', rate: 65 },
    { name: 'Farhan Ali', deals: 16, revenue: '₹5.4L', rate: 58 },
    { name: 'Geeta Rao', deals: 14, revenue: '₹4.9L', rate: 54 },
  ],
};

const MOCK_LOGINS = [
  { date: '06 Jun 2026', time: '09:14 AM', device: 'Chrome / Windows', location: 'Mumbai, IN', status: 'success' },
  { date: '05 Jun 2026', time: '10:02 AM', device: 'Safari / iPhone', location: 'Mumbai, IN', status: 'success' },
  { date: '04 Jun 2026', time: '08:55 AM', device: 'Chrome / Windows', location: 'Pune, IN', status: 'success' },
  { date: '03 Jun 2026', time: '02:31 PM', device: 'Firefox / Mac', location: 'Mumbai, IN', status: 'failed' },
  { date: '02 Jun 2026', time: '09:00 AM', device: 'Chrome / Windows', location: 'Mumbai, IN', status: 'success' },
];

const MOCK_SESSIONS = [
  { id: '1', device: 'Chrome / Windows 11', location: 'Mumbai, IN', lastActive: '5 min ago', current: true },
  { id: '2', device: 'Safari / iPhone 15', location: 'Pune, IN', lastActive: '2 hours ago', current: false },
];

// ─── SVG Semi-circle Gauge ────────────────────────────────────────────────────
function GaugeChart({ value, max, color, label, sublabel }: {
  value: number; max: number; color: string; label: string; sublabel: string;
}) {
  const pct = Math.min(value / max, 1);
  const r = 54;
  const cx = 70;
  const cy = 70;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const sweepAngle = totalArc * pct;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(startAngle + sweepAngle);
  const y2 = cy + r * Math.sin(startAngle + sweepAngle);
  const largeArc = sweepAngle > Math.PI ? 1 : 0;
  const bgX2 = cx + r * Math.cos(endAngle);
  const bgY2 = cy + r * Math.sin(endAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* background arc */}
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`} fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
        {/* value arc */}
        {pct > 0 && (
          <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0F172A">
          {value}{typeof max === 'number' && max <= 100 ? '%' : ''}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#64748B">{sublabel}</text>
      </svg>
      <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-1">{label}</p>
      <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF]">Target: {max}{max <= 100 ? '%' : ''}</p>
    </div>
  );
}

// ─── Sparkline SVG ───────────────────────────────────────────────────────────
function Sparkline({ data, color = '#2563EB' }: { data: number[]; color?: string }) {
  const w = 260; const h = 50;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts.join(' ')} />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
    </svg>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-[#2563EB]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesManagerProfilePage() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILE);
  const [targets, setTargets] = useState<Targets>(MOCK_TARGETS);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Profile>(MOCK_PROFILE);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [notifications, setNotifications] = useState({
    loginAlerts: true,
    leadAlerts: true,
    taskReminders: false,
    weeklyReport: true,
  });
  const [language, setLanguage] = useState('English');
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prof, tgt] = await Promise.all([smGetProfile(), smGetTargets()]);
        if (prof) {
          // Normalize backend shape → Profile shape
          const normalized: Profile = {
            name: prof.name || '',
            email: prof.email || '',
            mobile: prof.mobile || prof.phone || '',
            employeeId: prof.employeeId || prof.admin_id || '',
            department: prof.department || 'Sales',
            location: prof.location || '',
            address: prof.address || '',
            emergencyContact: prof.emergencyContact || prof.emergency_contact || '',
            joinedDate: prof.created_at
              ? new Date(prof.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '',
            avatar: (prof.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'SM',
          };
          setProfile(normalized);
          setEditForm(normalized);
        }
        if (tgt) {
          // Normalize manager_targets row → Targets shape
          const normalized: Targets = {
            revenueTarget: parseFloat(tgt.revenue_target || tgt.revenueTarget || 50),
            revenueAchieved: parseFloat(tgt.revenue_achieved || tgt.revenueAchieved || 0),
            leadsTarget: parseInt(tgt.leads_target || tgt.leadsTarget || 200),
            leadsConverted: parseInt(tgt.leads_converted || tgt.leadsConverted || 0),
            teamMembers: parseInt(tgt.teamTotal ?? MOCK_TARGETS.teamMembers),
            activeMembers: parseInt(tgt.teamActive ?? MOCK_TARGETS.activeMembers),
            totalLeadsHandled: MOCK_TARGETS.totalLeadsHandled,
            totalConversions: MOCK_TARGETS.totalConversions,
            monthlyTrend: MOCK_TARGETS.monthlyTrend,
            topPerformers: MOCK_TARGETS.topPerformers,
          };
          setTargets(normalized);
        }
      } catch {
        // use mock fallback silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await smUpdateProfile({ name: editForm.name, email: editForm.email });
      setProfile({ ...editForm });
      setIsEditing(false);
    } catch {
      setProfile({ ...editForm });
      setIsEditing(false);
    } finally {
      setSavingProfile(false);
    }
  }

  // profile completeness
  const filledFields = [profile.name, profile.email, profile.mobile, profile.address, profile.emergencyContact].filter(Boolean).length;
  const completeness = Math.round((filledFields / 5) * 100);

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { key: 'performance', label: 'Performance', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const displayName = user?.name || profile.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Title ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">My Profile</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Manage your account information, performance and settings</p>
      </motion.div>

      {/* ── Profile Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563EB 100%)' }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EA580C)' }}
            >
              {profile.avatar || displayName.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white shadow" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                {profile.employeeId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <Star className="w-3 h-3" /> Sales Manager
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-xs font-medium">
                <Users className="w-3.5 h-3.5" /> {profile.department} Department
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-blue-200 text-xs">
                <MapPin className="w-3.5 h-3.5" /> {profile.location}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-xs">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Joined {profile.joinedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => { setIsEditing(true); setActiveTab('info'); }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a8a] text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
              <MessageSquare className="w-4 h-4" /> Message Team
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Team Summary Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Members', value: targets.teamMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Active Members', value: targets.activeMembers, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Leads Handled', value: targets.totalLeadsHandled, icon: Target, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Total Conversions', value: targets.totalConversions, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + idx * 0.04 }}
            className={`bg-white rounded-2xl border ${card.border} p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} flex-shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{card.value}</p>
              <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] leading-tight">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tab Navigation ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 dark:border-[#1f1f1f] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50'
                  : 'border-transparent text-[#64748B] dark:text-[#9CA3AF] hover:text-[#0F172A] dark:text-[#F9FAFB] hover:bg-slate-50 dark:bg-[#161616]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            {/* ──── PERSONAL INFO ──── */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Personal Information</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Your personal and contact details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <Save className="w-4 h-4" /> {savingProfile ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); setEditForm({ ...profile }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-[#64748B] dark:text-[#9CA3AF] text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Full Name', key: 'name' as keyof Profile, icon: <User className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" />, type: 'text' },
                    { label: 'Email Address', key: 'email' as keyof Profile, icon: <Mail className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" />, type: 'email' },
                    { label: 'Mobile Number', key: 'mobile' as keyof Profile, icon: <Phone className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" />, type: 'tel' },
                    { label: 'Department', key: 'department' as keyof Profile, icon: <Users className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" />, type: 'text' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">{field.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">{field.icon}</span>
                        <input
                          type={field.type}
                          value={editForm[field.key]}
                          onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F172A] dark:text-[#F9FAFB] outline-none transition-all ${
                            isEditing
                              ? 'border-[#2563EB] bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20'
                              : 'border-slate-200 bg-slate-50 dark:bg-[#161616] cursor-default'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3"><MapPin className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" /></span>
                      <textarea
                        rows={2}
                        value={editForm.address}
                        onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F172A] dark:text-[#F9FAFB] outline-none transition-all resize-none ${
                          isEditing
                            ? 'border-[#2563EB] bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50 dark:bg-[#161616] cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">Emergency Contact</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2"><AlertCircle className="w-4 h-4 text-[#64748B] dark:text-[#9CA3AF]" /></span>
                      <input
                        type="tel"
                        value={editForm.emergencyContact}
                        onChange={e => setEditForm(f => ({ ...f, emergencyContact: e.target.value }))}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F172A] dark:text-[#F9FAFB] outline-none transition-all ${
                          isEditing
                            ? 'border-[#2563EB] bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50 dark:bg-[#161616] cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Profile Completeness */}
                <div className="p-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span className="text-sm font-semibold text-violet-800">AI Profile Score</span>
                    </div>
                    <span className="text-sm font-bold text-violet-700">{completeness}%</span>
                  </div>
                  <div className="w-full bg-violet-200 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completeness}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-2.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7C3AED, #A855F7)' }}
                    />
                  </div>
                  <p className="text-xs text-violet-600 mt-1.5">
                    {completeness < 100
                      ? `Complete your profile to improve visibility. ${5 - filledFields} field(s) remaining.`
                      : '🎉 Your profile is 100% complete!'}
                  </p>
                </div>
              </div>
            )}

            {/* ──── PERFORMANCE ──── */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Performance Overview</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Revenue & leads vs targets for this quarter</p>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/60 p-5 flex flex-col items-center">
                    <GaugeChart
                      value={Math.round((targets.revenueAchieved / targets.revenueTarget) * 100)}
                      max={100}
                      color="#2563EB"
                      label="Revenue Achievement"
                      sublabel={`₹${targets.revenueAchieved}L / ₹${targets.revenueTarget}L`}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs text-blue-700 font-medium">₹{targets.revenueAchieved}L achieved of ₹{targets.revenueTarget}L target</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/60 p-5 flex flex-col items-center">
                    <GaugeChart
                      value={Math.round((targets.leadsConverted / targets.leadsTarget) * 100)}
                      max={100}
                      color="#059669"
                      label="Leads Conversion"
                      sublabel={`${targets.leadsConverted} / ${targets.leadsTarget}`}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs text-emerald-700 font-medium">{targets.leadsConverted} converted of {targets.leadsTarget} target leads</p>
                    </div>
                  </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Monthly Revenue Trend</h4>
                    <span className="text-xs text-[#64748B] dark:text-[#9CA3AF]">(Last 7 months, ₹L)</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <Sparkline data={targets.monthlyTrend} color="#2563EB" />
                    <div className="text-right">
                      <p className="text-xs text-emerald-600 font-semibold">↑ +18%</p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF]">vs last period</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                      <span key={m} className="text-[10px] text-[#94A3B8] dark:text-[#6B7280]">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Top Performers Under Management</h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {targets.topPerformers.map((p, idx) => (
                      <div key={p.name} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:bg-[#161616]/50 transition-colors">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-blue-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{p.name}</p>
                          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">{p.deals} deals • {p.revenue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{p.rate}%</p>
                          <p className="text-[10px] text-[#94A3B8] dark:text-[#6B7280]">conversion</p>
                        </div>
                        <div className="w-20">
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{ width: `${p.rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── SECURITY ──── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Security Settings</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Manage your password, 2FA and active sessions</p>
                </div>

                {/* Change Password */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Change Password</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Current Password', key: 'current' as const, show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                      { label: 'New Password', key: 'newPw' as const, show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                      { label: 'Confirm New Password', key: 'confirm' as const, show: showConfirmPw, toggle: () => setShowConfirmPw(v => !v) },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">{field.label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-[#94A3B8] dark:text-[#6B7280]" /></span>
                          <input
                            type={field.show ? 'text' : 'password'}
                            value={pwForm[field.key]}
                            onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={field.toggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#6B7280] hover:text-[#64748B] dark:text-[#9CA3AF]"
                          >
                            {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="mt-2 px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>

                {/* 2FA */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">Two-Factor Authentication</p>
                      <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Toggle value={twoFA} onChange={() => setTwoFA(v => !v)} />
                </div>

                {/* Login History */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Recent Login History</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                          {['Date', 'Time', 'Device', 'Location', 'Status'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#94A3B8] dark:text-[#6B7280] uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_LOGINS.map((log, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-[#161616]/50 transition-colors">
                            <td className="px-4 py-3 text-xs font-medium text-[#0F172A] dark:text-[#F9FAFB]">{log.date}</td>
                            <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#9CA3AF]">{log.time}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#9CA3AF]">
                                {log.device.includes('iPhone') ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                                {log.device}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#9CA3AF]">
                              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {log.location}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                              }`}>
                                {log.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {log.status === 'success' ? 'Success' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Active Sessions</h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {MOCK_SESSIONS.map(session => (
                      <div key={session.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:bg-[#161616]/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            {session.device.includes('iPhone') ? <Smartphone className="w-4 h-4 text-blue-600" /> : <Monitor className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{session.device}</p>
                              {session.current && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Current</span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">{session.location} • {session.lastActive}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                            <LogOut className="w-3.5 h-3.5" /> Force Logout
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── SETTINGS ──── */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Account Settings</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Customize your notification and display preferences</p>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Notification Preferences</h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[
                      { key: 'loginAlerts' as const, label: 'Login Alerts', desc: 'Get notified when someone logs in to your account' },
                      { key: 'leadAlerts' as const, label: 'Lead Alerts', desc: 'Receive alerts when new leads are assigned' },
                      { key: 'taskReminders' as const, label: 'Task Reminders', desc: 'Get reminded about upcoming tasks and deadlines' },
                      { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Receive a weekly performance summary every Monday' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{item.label}</p>
                          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          value={notifications[item.key]}
                          onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Language & Region</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">Language</label>
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] dark:text-[#F9FAFB] bg-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        {['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'].map(l => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5">Theme</label>
                      <div className="flex gap-2">
                        {['Light', 'Dark', 'System'].map(t => {
                          const isSelected = globalTheme === t.toLowerCase();
                          return (
                            <button
                              key={t}
                              onClick={() => setGlobalTheme(t.toLowerCase() as any)}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm shadow-blue-500/20'
                                  : 'bg-slate-50 dark:bg-[#161616] text-[#64748B] dark:text-[#9CA3AF] border-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] dark:bg-zinc-900 dark:border-zinc-800'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── AI Insights Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden border border-violet-200"
        style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)' }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-violet-900">AI Insights</h3>
              <p className="text-xs text-violet-600">Powered by HubNest Intelligence</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, text: 'Your team\'s conversion rate improved by 12% this month. Arun Menon is your star performer with 72% conversion — consider assigning him complex leads.', color: 'text-emerald-700', bg: 'bg-emerald-50/80' },
              { icon: AlertCircle, text: 'Revenue is at 76% of quarterly target. At the current pace, you\'ll need to close 3 more deals this week to hit the ₹50L goal.', color: 'text-amber-700', bg: 'bg-amber-50/80' },
              { icon: Users, text: '1 team member (Geeta Rao) has a lower-than-average conversion rate. Consider scheduling a performance review and providing targeted training resources.', color: 'text-blue-700', bg: 'bg-blue-50/80' },
            ].map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${insight.bg} border border-white/60`}>
                <insight.icon className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                <p className={`text-xs leading-relaxed ${insight.color}`}>{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Help & Support ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Help & Support</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: AlertCircle, title: 'Raise a Ticket', desc: 'Report an issue or bug to the support team', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', btnColor: 'bg-red-600 hover:bg-red-700' },
            { icon: MessageSquare, title: 'Contact Admin', desc: 'Get in touch with your system administrator', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', btnColor: 'bg-[#2563EB] hover:bg-blue-700' },
            { icon: HelpCircle, title: 'Help Center', desc: 'Browse FAQs, guides and documentation', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', btnColor: 'bg-emerald-600 hover:bg-emerald-700' },
          ].map(card => (
            <div key={card.title} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">{card.title}</h4>
              <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1 mb-4 leading-relaxed">{card.desc}</p>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 ${card.btnColor} text-white text-xs font-semibold rounded-lg transition-colors shadow-sm`}>
                Open <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Session Control / Logout ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-red-200/60 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Sign Out</p>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Sign out of your current session. You will need to log in again.</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/20"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </motion.div>
    </div>
  );
}
