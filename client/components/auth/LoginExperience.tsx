'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Eye, EyeOff,
  Lock, Mail, Phone, ShieldCheck, Sparkles, TrendingUp, Users,
  Zap, Target, Bell, CheckCircle2, Star,
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
      className="relative w-full max-w-[340px]"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-xl p-5 shadow-2xl shadow-orange-500/10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Live Dashboard</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-0.5 leading-tight">Sales Pulse</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { icon: Users,      label: 'Leads',     value: '3,754', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { icon: BarChart3,  label: 'Campaigns', value: '38',    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: TrendingUp, label: 'Growth',    value: '+18%',  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] p-3">
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Revenue Trend</p>
            <p className="text-[9px] text-slate-400 font-semibold">Last 7 days</p>
          </div>
          <div className="h-16"><MiniChart /></div>
        </div>
      </div>

      {/* Floating AI insight */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -right-6 bottom-8 hidden rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111] p-3 shadow-xl md:flex items-center gap-2.5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-semibold">AI Insight</p>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white">12 hot leads ready</p>
        </div>
      </motion.div>

      {/* Floating notification */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -left-6 top-6 hidden rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111] p-2.5 shadow-xl md:flex items-center gap-2"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
          <Bell className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 pr-1">Deal closed — ₹2.4L</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Feature pills ──────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Target,       text: 'Smart Lead Management',   color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { icon: Zap,          text: 'AI-Powered Automation',   color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { icon: BarChart3,    text: 'Real-time Analytics',     color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { icon: CheckCircle2, text: 'Multi-channel Campaigns', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
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
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition">
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
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
            LEFT SIDE — Branding
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative hidden lg:flex flex-col min-h-screen border-r border-slate-200 dark:border-[#161616] overflow-hidden">

          {/* Left side background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/20 to-amber-50/10 dark:from-[#080808] dark:via-[#0c0c0c] dark:to-[#090909]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* ─── TOP: Logo ───────────────────────────────────────────────── */}
          <div className="relative z-10 px-10 xl:px-14 pt-10 pb-0">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    HubNest <span className="font-light text-slate-400">CRM</span>
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide">by SRJ Global Tech</div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* ─── MIDDLE: Hero content ────────────────────────────────────── */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-14 py-10">

            {/* Trust badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-7 inline-flex items-center gap-2 self-start rounded-full border border-orange-200/60 dark:border-orange-500/20 bg-orange-50/80 dark:bg-orange-500/5 px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted by 500+ Businesses
            </motion.div>

            {/* Hero headline */}
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                className="text-[2.6rem] xl:text-[3.1rem] font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white mb-5">
                Manage Your<br />
                Business{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                    Smarter
                  </span>
                  {/* Underline accent */}
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-40" />
                </span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="text-[0.95rem] leading-relaxed text-slate-500 dark:text-slate-400 mb-8 max-w-[380px]">
                Leads, campaigns, tickets and revenue — all from one intelligent platform built for growing teams.
              </motion.p>

              {/* Feature grid */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="grid grid-cols-2 gap-3 max-w-[380px] mb-12">
                {FEATURES.map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-white/70 dark:bg-[#111]/60 px-3.5 py-3 backdrop-blur-sm shadow-sm">
                    <div className={`w-7 h-7 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                      <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{f.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Dashboard preview */}
            <DashboardPreview />
          </div>

          {/* ─── BOTTOM: Stats bar ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="relative z-10 px-10 xl:px-14 py-8 border-t border-slate-200 dark:border-[#1a1a1a]">
            <div className="flex items-center gap-10">
              {[['10k+', 'Active Users'], ['500+', 'Businesses'], ['99.9%', 'Uptime']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{val}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{label}</p>
                </div>
              ))}
              {/* Star rating */}
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex items-center gap-0.5">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-semibold">4.9 / 5 rating</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT SIDE — Login Form
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 relative">

          {/* Ambient glow behind the card */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-orange-500/[0.04] dark:bg-orange-500/[0.03] blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* ── Login card ───────────────────────────────────────────── */}
            <div className="relative rounded-3xl border border-slate-200/80 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shadow-2xl shadow-slate-300/30 dark:shadow-black/50 overflow-hidden">

              {/* Top accent line */}
              <div className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500" />

              <div className="p-8 sm:p-10">

                {/* Mobile logo */}
                <div className="lg:hidden mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
                    <BriefcaseBusiness className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      HubNest <span className="font-light text-slate-400">CRM</span>
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold">by SRJ Global Tech</p>
                  </div>
                </div>

                {/* Header */}
                <div className="mb-7 flex justify-between items-start">
                  <div>
                    <h2 className="text-[1.6rem] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      Welcome back
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Sign in to your workspace
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Mode tabs */}
                <div className="mb-7 flex rounded-2xl border border-slate-200 dark:border-[#242424] bg-slate-50 dark:bg-[#161616] p-1 gap-1">
                  {([['email', Mail, 'Email', 'Login'], ['phone', Phone, 'Phone', 'OTP']] as const).map(([m, Icon, line1, line2]) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
                        mode === m
                          ? 'bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-[#2a2a2a]'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                      }`}>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
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
                      className="mb-6 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2.5"
                    >
                      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{mode === 'email' ? error : phoneError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form panels */}
                <AnimatePresence mode="wait">
                  {mode === 'email' ? (
                    <motion.div key="email-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={onSubmit} className="space-y-5" noValidate>

                        {/* Email / ID field */}
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">
                            Email, User ID, or Phone
                          </label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-orange-500" />
                            <input
                              type="text"
                              value={form.emailOrAdminId}
                              onChange={(e) => setForm((f) => ({ ...f, emailOrAdminId: e.target.value }))}
                              placeholder="you@company.com or SUPER001"
                              autoComplete="username"
                              className="h-[52px] w-full rounded-xl border-2 border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] px-11 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-orange-500/10 hover:border-slate-300 dark:hover:border-[#333]"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <Link href="/auth/forgot-password" className="text-[12px] font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition">
                              Forgot password?
                            </Link>
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-orange-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={form.password}
                              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="h-[52px] w-full rounded-xl border-2 border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] px-11 pr-12 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-orange-500/10 hover:border-slate-300 dark:hover:border-[#333]"
                              disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                          className="mt-1 h-[52px] w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold shadow-lg shadow-orange-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                          {loading ? (
                            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending OTP...</>
                          ) : (
                            <>Sign In <ArrowRight className="h-4 w-4" /></>
                          )}
                        </button>
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
                    <div className="my-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-[#1f1f1f]" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap px-1">or continue with</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-[#1f1f1f]" />
                    </div>

                    {googleError && (
                      <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-400 text-center font-semibold">
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

                {/* ── Footer link ──────────────────────────────────────── */}
                <div className="mt-7 pt-6 border-t border-slate-100 dark:border-[#1a1a1a] text-center">
                  <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 transition font-semibold">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to home
                  </Link>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <p className="mt-5 text-center text-[11px] text-slate-400 dark:text-slate-600 font-medium">
              &copy; {new Date().getFullYear()} HubNest CRM &middot; SRJ Global Tech &middot; All rights reserved
            </p>
          </motion.div>
        </section>

      </div>
    </main>
  );
}
