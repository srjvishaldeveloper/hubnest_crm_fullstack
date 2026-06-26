'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/auth';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import { KeyRound, ShieldAlert, ArrowLeft } from 'lucide-react';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      setMessage(res.message);
      setStep('otp');
    } catch (err: unknown) {
      const data = (err as any)?.response?.data;
      if (data?.errors && data.errors.length > 0) {
        setError(data.errors.map((e: any) => e.msg).join(' '));
      } else {
        setError(data?.message || 'Request failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, otp, newPassword });
      setMessage(res.message);
      setStep('done');
    } catch (err: unknown) {
      const data = (err as any)?.response?.data;
      if (data?.errors && data.errors.length > 0) {
        setError(data.errors.map((e: any) => e.msg).join(' '));
      } else {
        setError(data?.message || 'Reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-[#ededed] flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#1f1f1f] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 dark:bg-[#161616] px-5 sm:px-8 py-5 sm:py-7 flex items-center justify-between border-b border-slate-200/80 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-[#ffffff] shadow-lg shadow-orange-500/20">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-[#ffffff] uppercase">HubNest CRM</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Recovery</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="px-5 sm:px-8 py-6 sm:py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}
          {message && step !== 'done' && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
              {message}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#ffffff]">Forgot Password</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Enter your registered email to receive a reset OTP.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#d4d4d4] uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full h-[48px] px-4 border border-slate-200 dark:border-[#222] rounded-xl text-sm text-slate-900 dark:text-[#ffffff] bg-white dark:bg-[#161616] focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-[#ffffff] font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#ffffff]">Reset Password</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Enter the OTP sent to your email and choose a new password.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#d4d4d4] uppercase tracking-wider mb-2">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP"
                  className="w-full h-[48px] px-4 border border-slate-200 dark:border-[#222] rounded-xl text-slate-900 dark:text-[#ffffff] bg-white dark:bg-[#161616] focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 tracking-widest text-center text-lg font-black placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#d4d4d4] uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number, special char"
                  className="w-full h-[48px] px-4 border border-slate-200 dark:border-[#222] rounded-xl text-sm text-slate-900 dark:text-[#ffffff] bg-white dark:bg-[#161616] focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#d4d4d4] uppercase tracking-wider mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-[48px] px-4 border border-slate-200 dark:border-[#222] rounded-xl text-sm text-slate-900 dark:text-[#ffffff] bg-white dark:bg-[#161616] focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-[#ffffff] font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#ffffff]">Password Reset Successful</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{message}</p>
              </div>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full h-[48px] bg-orange-500 hover:bg-orange-600 text-[#ffffff] font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <div className="px-8 pb-6 text-center border-t border-slate-200/50 dark:border-[#1f1f1f]/50 pt-5">
          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-semibold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} HubNest CRM &bull; SRJ Global Tech
          </p>
        </div>
      </div>
    </div>
  );
}
