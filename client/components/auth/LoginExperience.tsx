'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

type LoginFormState = {
  emailOrAdminId: string;
  password: string;
};

type LoginExperienceProps = {
  form: LoginFormState;
  setForm: Dispatch<SetStateAction<LoginFormState>>;
  error: string;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  onSubmit: (e: FormEvent) => void;
};

function MiniChart() {
  return (
    <svg viewBox="0 0 220 72" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="login-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,60 C28,56 38,42 62,41 C92,40 96,22 122,27 C148,32 150,14 178,15 C194,16 206,10 220,8"
        fill="none"
        stroke="#2563EB"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M0,60 C28,56 38,42 62,41 C92,40 96,22 122,27 C148,32 150,14 178,15 C194,16 206,10 220,8 L220,72 L0,72 Z"
        fill="url(#login-chart-fill)"
      />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mt-10 max-w-xl"
    >
      <div className="absolute -inset-8 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Workspace overview</p>
            <h3 className="font-serif text-2xl text-slate-900">Sales pulse</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Leads', value: '3,754' },
            { icon: BarChart3, label: 'Campaigns', value: '38' },
            { icon: TrendingUp, label: 'Growth', value: '+18%' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <item.icon className="mb-3 h-4 w-4 text-blue-600" />
              <p className="text-[11px] text-slate-400">{item.label}</p>
              <p className="text-sm font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">Revenue trend</p>
            <p className="text-[11px] text-slate-400">Last 7 days</p>
          </div>
          <div className="h-20">
            <MiniChart />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24, y: 16 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute -right-2 bottom-8 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur md:block"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">AI insight</p>
            <p className="text-sm font-semibold text-slate-900">12 hot leads ready</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LoginExperience({
  form,
  setForm,
  error,
  loading,
  showPassword,
  setShowPassword,
  onSubmit,
}: LoginExperienceProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <section className="relative overflow-hidden px-6 py-12 sm:px-10 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.13),transparent_28%)]" />
          <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <Link href="/" className="inline-flex items-center gap-3 group cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-lg shadow-blue-600/20 transition-transform duration-200 group-hover:scale-105">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:text-blue-600">
                  Job Nest <span className="font-medium text-slate-500 transition-colors duration-200 group-hover:text-blue-500">CRM</span>
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Trusted by 500+ Businesses
              </motion.div>

              <motion.h1
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="max-w-2xl font-serif text-5xl leading-[1.06] tracking-tight text-slate-900 sm:text-6xl"
              >
                Manage Your Business <span className="text-blue-600">Smarter</span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="mt-5 max-w-xl text-lg leading-relaxed text-[#64748B]"
              >
                Leads, campaigns, tickets and revenue - all from one platform.
              </motion.p>
            </motion.div>

            <DashboardPreview />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="w-full max-w-md rounded-[24px] border border-white/70 bg-white/86 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h2>
              <p className="mt-1.5 text-sm text-[#64748B]">Sign in to continue to your workspace</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email or User ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.emailOrAdminId}
                    onChange={(e) => setForm((f) => ({ ...f, emailOrAdminId: e.target.value }))}
                    placeholder="you@company.com"
                    autoComplete="username"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <a href="/auth/forgot-password" className="text-xs font-medium text-blue-600 transition hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">secure access</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-5 text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-blue-600">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to home
              </Link>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Job Nest CRM &middot; SRJ Global Tech
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
