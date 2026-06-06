'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';

const WARN_AT_SECONDS = 120; // show warning at 2 minutes remaining

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch {
    return Date.now() + 900 * 1000;
  }
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SessionTimer() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);
  const setTokens = useAuthStore((s) => s.setTokens);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [extending, setExtending] = useState(false);

  // Initialise/reset countdown whenever the access token changes
  useEffect(() => {
    if (!accessToken) return;
    const expiry = getTokenExpiry(accessToken);
    const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
    setSecondsLeft(remaining);
    setShowWarning(remaining <= WARN_AT_SECONDS);
  }, [accessToken]);

  const handleAutoLogout = useCallback(async () => {
    setShowWarning(false);
    await logout();
    router.replace('/auth/login?session=expired');
  }, [logout, router]);

  // Countdown tick
  useEffect(() => {
    if (secondsLeft === null) return;

    if (secondsLeft <= 0) {
      handleAutoLogout();
      return;
    }

    if (secondsLeft <= WARN_AT_SECONDS && !showWarning) {
      setShowWarning(true);
    }

    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, showWarning, handleAutoLogout]);

  const handleExtend = useCallback(async () => {
    if (!refreshToken) return;
    setExtending(true);
    try {
      const result = await authService.refreshToken(refreshToken);
      // setTokens mirrors to localStorage; also update the cookie
      setTokens(result.accessToken, refreshToken);
      document.cookie = `accessToken=${result.accessToken}; path=/; max-age=900; SameSite=Lax`;
      // Recalculate from new token expiry
      const expiry = getTokenExpiry(result.accessToken);
      setSecondsLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
      setShowWarning(false);
    } catch {
      await handleAutoLogout();
    } finally {
      setExtending(false);
    }
  }, [refreshToken, setTokens, handleAutoLogout]);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    await logout();
    router.replace('/auth/login');
  }, [logout, router]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-full max-w-[340px]">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-2xl shadow-amber-100/60 p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">Session expiring soon</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Expires in{' '}
              <span className="font-bold font-mono text-amber-900">
                {secondsLeft !== null ? formatTime(secondsLeft) : '…'}
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed mb-4">
          Your session is about to expire. Click{' '}
          <strong className="font-semibold">Extend Session</strong> to stay logged in.
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-200 bg-white text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
          <button
            onClick={handleExtend}
            disabled={extending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {extending ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0" />
            )}
            {extending ? 'Extending…' : 'Extend Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
