'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Eye, EyeOff,
  Lock, Mail, Phone, ShieldCheck, Sparkles, TrendingUp, Users,
  Zap, Target, Bell, CheckCircle2, Star, KeyRound, Shield,
  UserCog, AlertTriangle, Fingerprint, RefreshCw,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import ThemeToggle from '../shared/ThemeToggle';

const OTP_LENGTH = 6;

type LoginFormState = { emailOrAdminId: string; password: string };
type LoginMode = 'email' | 'phone';
type PhoneStep  = 'enter_phone' | 'enter_otp';

type LoginExperienceProps = {
  form: LoginFormState;
  setForm: Dispatch<SetStateAction<LoginFormState>>;
  error: string;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  onSubmit: (e: FormEvent) => void;
  onSendPhoneOtp: (phone: string) => Promise<boolean>;
  onLoginWithPhone: (phone: string, otp: string) => Promise<void>;
  phoneError: string;
  phoneLoading: boolean;
  onGoogleLogin: (credential: string) => Promise<void>;
  googleError: string;
};

/* ── Mini sparkline ─────────────────────────────────────────────────────────── */
function MiniChart() {
  return (
    <svg viewBox="0 0 220 72" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,60 C28,56 38,42 62,41 C92,40 96,22 122,27 C148,32 150,14 178,15 C194,16 206,10 220,8"
        fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0,60 C28,56 38,42 62,41 C92,40 96,22 122,27 C148,32 150,14 178,15 C194,16 206,10 220,8 L220,72 L0,72 Z"
        fill="url(#lc-fill)" />
    </svg>
  );
}

/* ── Dashboard preview card ─────────────────────────────────────────────────── */
function DashboardPreview() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-full max-w-[420px]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-2xl p-6 shadow-[0_20px_50px_rgba(249,115,22,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

        {/* Top Floating Pill / Deal Closed Notification */}
        <div className="mb-6 flex items-center justify-between bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Deal closed — ₹2.4L</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Enterprise Software Package</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* 3 Stats Columns */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: Users,      label: 'Leads',     value: '3,754', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
            { icon: BarChart3,  label: 'Campaigns', value: '38',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
            { icon: TrendingUp, label: 'Growth',    value: '+18%',  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/90 dark:bg-white/[0.02] p-4 hover:bg-white transition shadow-sm hover:shadow">
              <div className={`w-8 h-8 rounded-xl ${item.bg} border flex items-center justify-center mb-3 shadow-sm`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">{item.label}</p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Trend Mini Chart */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/90 dark:bg-white/[0.02] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Revenue Velocity</p>
              <p className="text-[10px] text-slate-400 font-medium">Real-time pipeline ingestion</p>
            </div>
            <span className="text-[10px] font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200">Last 7 days</span>
          </div>
          <div className="h-16"><MiniChart /></div>
        </div>
      </div>

      {/* Floating AI insight widget */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -right-6 bottom-12 hidden rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-[#161616] p-4 shadow-2xl md:flex items-center gap-3.5 z-20"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Insight Engine</p>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white">12 hot leads ready to close</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Security & RBAC info strip ─────────────────────────────────────────────── */
function SecurityStrip() {
  const items = [
    { icon: Shield,      text: 'RBAC Access',      sub: 'Role-based control',    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-100 dark:border-blue-500/20' },
    { icon: Fingerprint, text: 'MFA Enabled',       sub: 'OTP + 2FA verified',   color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
    { icon: ShieldCheck, text: 'AES-256 Secure',    sub: 'Bank-grade encryption',color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-emerald-100 dark:border-emerald-500/20' },
    { icon: UserCog,     text: 'Role Dashboards',   sub: 'Per-role access',      color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-100 dark:border-violet-500/20' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 mt-6">
      {items.map((i) => (
        <div key={i.text} className={`flex items-center gap-3.5 rounded-2xl border ${i.border} bg-white/80 dark:bg-[#161616]/80 px-4 py-3.5 shadow-sm backdrop-blur-md hover:shadow-md transition-all group`}>
          <div className={`w-10 h-10 rounded-2xl ${i.bg} border ${i.border} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
            <i.icon className={`h-4.5 w-4.5 ${i.color}`} />
          </div>
          <div>
            <span className={`text-xs font-black ${i.color} block leading-tight tracking-wide uppercase`}>{i.text}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 block">{i.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Feature pills ──────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Target,       text: 'Smart Lead Management',   color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
  { icon: Zap,          text: 'AI-Powered Automation',   color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20' },
  { icon: BarChart3,    text: 'Real-time Analytics',     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
  { icon: CheckCircle2, text: 'Multi-channel Campaigns', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
];

/* ── Department roles info ───────────────────────────────────────────────────── */
const ROLE_INFO = [
  { role: 'Admin',            color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  { role: 'Sales Manager',    color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  { role: 'Sales Executive',  color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
  { role: 'Marketing Head',   color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  { role: 'Finance Manager',  color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { role: 'Support Agent',    color: '#EA580C', bg: 'rgba(234,88,12,0.08)' },
];

/* ── OTP Input ──────────────────────────────────────────────────────────────── */
function OtpInput({ digits, onChange, onKeyDown, onPaste, disabled, inputRefs }: {
  digits: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center mb-6">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          disabled={disabled}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#1a1a1a] border-2 border-slate-200 dark:border-[#2a2a2a] rounded-xl focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/* ── Phone Login Panel ──────────────────────────────────────────────────────── */
function PhoneLoginPanel({ onSendPhoneOtp, onLoginWithPhone, phoneError, phoneLoading }: {
  onSendPhoneOtp: (phone: string) => Promise<boolean>;
  onLoginWithPhone: (phone: string, otp: string) => Promise<void>;
  phoneError: string;
  phoneLoading: boolean;
}) {
  const [step, setStep]     = useState<PhoneStep>('enter_phone');
  const [phone, setPhone]   = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (step === 'enter_otp') setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [step]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    const ok = await onSendPhoneOtp(phone.trim());
    if (ok) { setStep('enter_otp'); setCountdown(60); setSuccessMsg('OTP sent to your phone number.'); }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) return;
    await onLoginWithPhone(phone.trim(), otp);
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits]; next[index] = value.slice(-1); setDigits(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    if (countdown > 0 || phoneLoading) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    const ok = await onSendPhoneOtp(phone.trim());
    if (ok) { setCountdown(60); setSuccessMsg('A new OTP has been sent.'); }
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'enter_phone' ? (
        <motion.form key="phone-step" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" autoComplete="tel"
                className="h-[52px] w-full rounded-xl border-2 border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] px-11 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-orange-500/10"
                disabled={phoneLoading} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Enter 10-digit mobile number (e.g. 9876543210)</p>
          </div>
          <button type="submit" disabled={phoneLoading || !phone.trim()}
            className="h-[52px] w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-60 disabled:hover:translate-y-0">
            {phoneLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending...</> : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
          </button>
          {/* Forgot Password for phone mode too */}
          <div className="text-center pt-1">
            <Link href="/auth/forgot-password" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 transition">
              <KeyRound className="h-3 w-3" /> Forgot password? Reset via email
            </Link>
          </div>
        </motion.form>
      ) : (
        <motion.form key="otp-step" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} onSubmit={handleVerifyOtp} noValidate>
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">{successMsg}</div>
          )}
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-digit code sent to <span className="font-bold text-slate-900 dark:text-white">{phone}</span>
          </p>
          <OtpInput digits={digits} onChange={handleDigitChange} onKeyDown={handleKeyDown} onPaste={handlePaste} disabled={phoneLoading} inputRefs={inputRefs} />
          <button type="submit" disabled={phoneLoading || digits.join('').length < OTP_LENGTH}
            className="h-[52px] w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
            {phoneLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Verifying...</> : <>Verify & Sign In <ArrowRight className="h-4 w-4" /></>}
          </button>
          <div className="mt-5 flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setStep('enter_phone'); setDigits(Array(OTP_LENGTH).fill('')); setSuccessMsg(''); }}
              className="text-slate-500 dark:text-slate-400 hover:text-orange-500 transition font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Change number
            </button>
            <button type="button" disabled={countdown > 0 || phoneLoading} onClick={handleResend}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition inline-flex items-center gap-1">
              {countdown > 0 ? <><RefreshCw className="h-3 w-3" /> {countdown}s</> : 'Resend OTP'}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/* ── Main LoginExperience ───────────────────────────────────────────────────── */
export default function LoginExperience({
  form, setForm, error, loading, showPassword, setShowPassword, onSubmit,
  onSendPhoneOtp, onLoginWithPhone, phoneError, phoneLoading, onGoogleLogin, googleError,
}: LoginExperienceProps) {
  const [mode, setMode] = useState<LoginMode>('email');
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#080808] text-slate-900 dark:text-[#ededed] transition-colors duration-200 relative overflow-hidden">

      {/* Global ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-orange-500/6 dark:bg-orange-500/4 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[420px] h-[420px] rounded-full bg-blue-500/5 dark:bg-blue-500/3 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[380px] h-[380px] rounded-full bg-violet-500/5 dark:bg-violet-500/3 blur-[120px]" />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[58%_42%]">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT SIDE — Branding & UI Screenshot Structure
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative hidden lg:flex flex-col min-h-screen border-r border-slate-200 dark:border-[#161616] overflow-hidden">

          {/* Left side background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/20 to-amber-50/10 dark:from-[#080808] dark:via-[#0c0c0c] dark:to-[#090909]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* ─── TOP: Logo ───────────────────────────────────────────────── */}
          <div className="relative z-10 px-10 xl:px-16 pt-12 pb-0">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/" className="inline-flex items-center gap-3.5 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    HubNest <span className="font-light text-slate-400">CRM</span>
                  </span>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-wider">by SRJ Global Tech</div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* ─── MIDDLE: Hero content matching screenshot exactly ──────────── */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-16 py-12 max-w-[620px]">

            {/* Trust badge pill */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 self-start rounded-full border border-orange-300 dark:border-orange-500/30 bg-orange-50/90 dark:bg-orange-500/10 px-4 py-2 text-xs font-black text-orange-600 dark:text-orange-400 backdrop-blur-md shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Trusted by 500+ Businesses - RBAC Secured
            </motion.div>

            {/* Hero headline */}
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                className="text-[2.8rem] xl:text-[3.4rem] font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white mb-6">
                Manage Your<br />
                Business{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                    Smarter
                  </span>
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[4px] rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-80 shadow-sm" />
                </span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="text-base leading-relaxed text-slate-500 dark:text-slate-400 mb-10 max-w-[460px]">
                Leads, campaigns, tickets and revenue — all from one intelligent platform built for growing teams.
              </motion.p>

              {/* 2x2 Feature grid */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="grid grid-cols-2 gap-3.5 max-w-[480px] mb-8">
                {FEATURES.map((f) => (
                  <div key={f.text} className="flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-[#1f1f1f] bg-white dark:bg-[#111]/80 px-4 py-3.5 backdrop-blur-md shadow-sm hover:shadow-md transition-all group">
                    <div className={`w-10 h-10 rounded-2xl ${f.bg} border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <f.icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{f.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* 2x2 Security strip */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="max-w-[480px]">
                <SecurityStrip />
              </motion.div>
            </motion.div>

            {/* Dashboard preview floating card */}
            <div className="mt-12">
              <DashboardPreview />
            </div>
          </div>

          {/* ─── BOTTOM: Stats bar ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="relative z-10 px-10 xl:px-16 py-8 border-t border-slate-200 dark:border-[#1a1a1a]">
            <div className="flex items-center gap-12">
              {[['10k+', 'Active Users'], ['500+', 'Businesses'], ['99.9%', 'Uptime']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{val}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">{label}</p>
                </div>
              ))}
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-bold">4.9 / 5 rating</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT SIDE — Login Form
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12 relative overflow-y-auto">

          {/* Ambient glow behind the card */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-orange-500/[0.05] dark:bg-orange-500/[0.04] blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]"
          >
            {/* ── Login card ───────────────────────────────────────────── */}
            <div className="relative rounded-3xl border border-slate-200/90 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shadow-2xl shadow-slate-300/40 dark:shadow-black/60 overflow-hidden">

              {/* Top accent line */}
              <div className="h-[4px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

              <div className="p-8 sm:p-11">

                {/* Mobile logo */}
                <div className="lg:hidden mb-6 flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                      HubNest <span className="font-light text-slate-400">CRM</span>
                    </span>
                    <p className="text-[11px] text-slate-400 font-bold">by SRJ Global Tech</p>
                  </div>
                </div>

                {/* Security badge row — mobile only */}
                <div className="lg:hidden mb-6 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400 shadow-sm">
                    <Shield className="h-3 w-3" /> RBAC Access
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-1.5 text-[11px] font-black text-blue-700 dark:text-blue-400 shadow-sm">
                    <Fingerprint className="h-3 w-3" /> MFA Enabled
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:text-orange-400 shadow-sm">
                    <ShieldCheck className="h-3 w-3" /> AES-256 Secure
                  </span>
                </div>

                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h2 className="text-[1.75rem] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      Welcome back
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Sign in to your workspace
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Mode tabs */}
                <div className="mb-7 flex rounded-2xl border border-slate-200 dark:border-[#242424] bg-slate-50 dark:bg-[#161616] p-1.5 gap-1.5 shadow-inner">
                  {([['email', Mail, 'Email', 'Login'], ['phone', Phone, 'Phone', 'OTP']] as const).map(([m, Icon, line1, line2]) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all duration-200 ${
                        mode === m
                          ? 'bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white shadow-md border border-slate-200/90 dark:border-[#2a2a2a]'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                      }`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {line1} {line2}
                    </button>
                  ))}
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {(mode === 'email' ? error : phoneError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3.5 text-sm text-red-700 dark:text-red-400 flex items-start gap-3 shadow-sm"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold block mb-0.5">Login Failed</span>
                        <span className="font-medium text-xs">{mode === 'email' ? error : phoneError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form panels */}
                <AnimatePresence mode="wait">
                  {mode === 'email' ? (
                    <motion.div key="email-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={onSubmit} className="space-y-6" noValidate>

                        {/* Email / ID field */}
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Email, Employee ID, or Phone
                          </label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-orange-500" />
                            <input
                              type="text"
                              value={form.emailOrAdminId}
                              onChange={(e) => setForm((f) => ({ ...f, emailOrAdminId: e.target.value }))}
                              placeholder="you@company.com or EMP001"
                              autoComplete="username"
                              className="h-[54px] w-full rounded-2xl border-2 border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] px-12 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-orange-500/10 hover:border-slate-300 dark:hover:border-[#333] font-semibold"
                              disabled={loading}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-normal">
                            Works for all departments — Admin, Sales, Finance, Support, Marketing
                          </p>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <Link href="/auth/forgot-password"
                              className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition rounded-lg px-2 py-0.5 hover:bg-orange-50 dark:hover:bg-orange-500/10">
                              <KeyRound className="h-3.5 w-3.5" /> Forgot password?
                            </Link>
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-orange-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={form.password}
                              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="h-[54px] w-full rounded-2xl border-2 border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] px-12 pr-12 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-orange-500/10 hover:border-slate-300 dark:hover:border-[#333] font-semibold"
                              disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={loading}
                          className="mt-2 h-[54px] w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-extrabold shadow-xl shadow-orange-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                          {loading ? (
                            <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing In...</>
                          ) : (
                            <>Sign In <ArrowRight className="h-5 w-5" /></>
                          )}
                        </button>

                        {/* Forgot password standalone CTA matching screenshot exactly */}
                        <div className="pt-1">
                          <Link href="/auth/forgot-password"
                            className="group w-full flex items-center justify-center gap-2 rounded-2xl border border-orange-200/80 dark:border-orange-500/30 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 px-5 py-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/30 dark:hover:to-amber-950/20 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all shadow-sm hover:shadow-md">
                            <KeyRound className="h-4 w-4 shrink-0 group-hover:rotate-12 transition-transform text-orange-500" />
                            <span>Reset password for any department</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div key="phone-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <PhoneLoginPanel onSendPhoneOtp={onSendPhoneOtp} onLoginWithPhone={onLoginWithPhone} phoneError={phoneError} phoneLoading={phoneLoading} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Google OAuth ─────────────────────────────────────── */}
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                  <>
                    <div className="my-6 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-[#1f1f1f]" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold whitespace-nowrap px-1">or continue with</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-[#1f1f1f]" />
                    </div>

                    {googleError && (
                      <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3.5 text-xs text-red-700 dark:text-red-400 text-center font-bold shadow-sm">
                        {googleError}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={(cred) => { if (cred.credential) onGoogleLogin(cred.credential); }}
                        onError={() => {}}
                        useOneTap={false}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                      />
                    </div>
                  </>
                )}

                {/* ── RBAC Role Info Accordion ─────────────────────────── */}
                <div className="mt-6 rounded-2xl border border-slate-100 dark:border-[#1f1f1f] overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowRoleInfo(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCog className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">All Departments Supported</span>
                    </div>
                    <motion.div animate={{ rotate: showRoleInfo ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="h-4 w-4 text-slate-400 rotate-90" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {showRoleInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 py-4 grid grid-cols-2 gap-2 bg-white dark:bg-[#0d0d0d]">
                          {ROLE_INFO.map((r) => (
                            <div key={r.role}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-slate-100 dark:border-white/5 shadow-sm"
                              style={{ background: r.bg }}>
                              <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: r.color }} />
                              <span className="text-[11px] font-extrabold" style={{ color: r.color }}>{r.role}</span>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-500/5 border-t border-amber-100 dark:border-amber-500/20">
                          <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1.5 leading-snug">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>Each role gets a dedicated dashboard with RBAC-controlled permissions</span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Footer link ──────────────────────────────────────── */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#1a1a1a] text-center">
                  <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 transition font-bold">
                    <ArrowLeft className="h-4 w-4" /> Back to home
                  </Link>
                </div>
              </div>
            </div>

            {/* Copyright + security note */}
            <div className="mt-6 text-center space-y-1.5">
              <p className="text-xs text-slate-400 dark:text-slate-600 font-bold">
                &copy; {new Date().getFullYear()} HubNest CRM &middot; SRJ Global Tech &middot; All rights reserved
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-600 inline-flex items-center gap-1.5 justify-center font-semibold">
                <Lock className="h-3 w-3 text-slate-400" /> Secured with AES-256 encryption · Role-based access control · OTP verified
              </p>
            </div>
          </motion.div>
        </section>

      </div>
    </main>
  );
}
