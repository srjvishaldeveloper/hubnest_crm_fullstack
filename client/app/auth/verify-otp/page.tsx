'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../../services/auth';
import { useAuthStore } from '../../../store/authStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, KeyRound, BriefcaseBusiness } from 'lucide-react';
import ThemeToggle from '../../../components/shared/ThemeToggle';

const OTP_LENGTH = 6;

function SecurityCard() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mt-10 max-w-xl"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#ffffff]">Two-Factor Authentication</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A verification code has been dispatched. Enter it on the right to securely finalize your login session.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200/50 dark:border-[#1f1f1f]/50 pt-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-[#d4d4d4]">
            <span className="uppercase tracking-wider">Security Level</span>
            <span className="text-orange-500 dark:text-orange-400">High Protection</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-[#161616] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute -right-4 bottom-12 hidden rounded-2xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-4 shadow-xl md:block"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Status</p>
            <p className="text-sm font-bold text-slate-900 dark:text-[#ffffff]">Awaiting Code</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maskedEmail = searchParams.get('email') || '';

  const pendingUserId = useAuthStore((s) => s.pendingUserId);
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [hydrated, setHydrated] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Hydration state syncing to prevent SSR mismatch redirect
  useEffect(() => {
    setHydrated(useAuthStore.persist.hasHydrated());
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => unsub();
  }, []);

  // Safe redirect if hydration is complete, no pending ID, AND no token yet
  useEffect(() => {
    if (!hydrated) return;
    if (!pendingUserId) {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        router.replace('/auth/login');
      }
    }
  }, [hydrated, pendingUserId, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input on mount once hydrated
  useEffect(() => {
    if (hydrated && pendingUserId) {
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [hydrated, pendingUserId]);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp({ userId: pendingUserId!, otp });
      
      // Store tokens in Zustand + localStorage
      loginSuccess(result.accessToken, result.refreshToken, result.user);
      
      // Store token in cookie for middleware
      document.cookie = `accessToken=${result.accessToken}; path=/; max-age=900; SameSite=Lax`;

      // Role-based redirect
      const role = result.user.role;
      const ROLE_DASHBOARDS: Record<string, string> = {
        'Super Admin':        '/super-admin/dashboard',
        'Admin':              '/admin/dashboard',
        'Marketing Head':     '/marketing/dashboard',
        'Marketing Executive':'/marketing/dashboard',
        'Sales Manager':      '/sales-manager/dashboard',
        'Sales Executive':    '/sales/dashboard',
        'Support Manager':    '/support/dashboard',
        'Support Agent':      '/support/dashboard',
        'Finance Executive':  '/finance/dashboard',
      };
      router.replace(ROLE_DASHBOARDS[role] ?? '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'OTP verification failed. Please try again.';
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !pendingUserId) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await authService.resendOtp(pendingUserId);
      setSuccessMsg('A new verification code has been generated and sent.');
      setCountdown(60);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to resend OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || !pendingUserId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] transition-colors duration-200">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        
        {/* Left Side Info Column — hidden on mobile */}
        <section className="relative overflow-hidden px-6 py-12 sm:px-10 lg:px-14 hidden lg:flex items-center bg-slate-50 dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-[#161616]">
          <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-center w-full">
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                HubNest <span className="font-normal text-slate-400">CRM</span>
              </span>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#1f1f1f] bg-white/80 dark:bg-[#111]/80 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shadow-sm w-fit"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
                Two-Factor Verification Active
              </motion.div>

              <motion.h1
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="max-w-2xl font-serif text-5xl leading-[1.06] tracking-tight text-slate-900 dark:text-[#ffffff] sm:text-6xl"
              >
                Verify your <span className="text-orange-500 dark:text-orange-400">identity</span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-400"
              >
                Enter the one-time authorization code below to complete sign-in and access your secure dashboard.
              </motion.p>
            </motion.div>

            <SecurityCard />
          </div>
        </section>

        {/* Right Side Form Column */}
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-[24px] border border-slate-200/80 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6 sm:p-8 shadow-xl backdrop-blur-xl"
          >
            {/* Mobile-only logo */}
            <div className="lg:hidden mb-6 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                HubNest <span className="font-normal text-slate-400">CRM</span>
              </span>
            </div>

            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#ffffff]">Enter OTP</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-slate-900 dark:text-[#ffffff] break-all">{maskedEmail || 'your email'}</span>
                </p>
              </div>
              <ThemeToggle />
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3.5 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* 6-digit input boxes */}
              <div className="flex gap-2 xs:gap-2.5 sm:gap-3 justify-center mb-6">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    disabled={loading}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-[#ffffff] bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#222] rounded-xl focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all disabled:bg-slate-50 dark:bg-[#161616] dark:disabled:bg-[#161616]/50 disabled:text-slate-400"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || digits.join('').length < OTP_LENGTH}
                className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-[#ffffff] shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#ffffff]/40 border-t-[#ffffff]" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-[#222]" />
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Verification Options</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-[#222]" />
            </div>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition"
                  onClick={handleResend}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Request a new one'}
                </button>
              </p>
              
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition justify-center font-bold">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 font-semibold">
              &copy; {new Date().getFullYear()} HubNest CRM &middot; SRJ Global Tech
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
