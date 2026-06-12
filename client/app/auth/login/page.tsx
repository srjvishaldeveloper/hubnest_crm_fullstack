'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import LoginExperience from '../../../components/auth/LoginExperience';
import { authService } from '../../../services/auth';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setPendingUserId = useAuthStore((s) => s.setPendingUserId);
  const loginSuccess     = useAuthStore((s) => s.loginSuccess);

  const [form, setForm]             = useState({ emailOrAdminId: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone login state
  const [phoneError, setPhoneError]     = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Google OAuth state
  const [googleError, setGoogleError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.emailOrAdminId.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({
        emailOrAdminId: form.emailOrAdminId.trim(),
        password: form.password,
      });
      setPendingUserId(result.userId);
      router.push(`/auth/verify-otp?email=${encodeURIComponent(result.maskedEmail)}&method=email`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPhoneOtp(phone: string): Promise<boolean> {
    setPhoneError('');
    
    // Fast2SMS accepts bare 10-digit Indian numbers (with optional +91/91 prefix)
    const normalized = phone.trim().replace(/\s+/g, '').replace(/^(\+91|91)/, '');
    if (!/^\d{10}$/.test(normalized)) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      return false;
    }

    setPhoneLoading(true);
    try {
      const result = await authService.sendPhoneOtp(phone);
      setPendingUserId(result.userId);
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send OTP. Please check your phone number.';
      setPhoneError(msg);
      return false;
    } finally {
      setPhoneLoading(false);
    }
  }

  const ROLE_DASHBOARDS: Record<string, string> = {
    'Super Admin':         '/super-admin/dashboard',
    'Admin':               '/admin/dashboard',
    'Marketing Head':      '/marketing/dashboard',
    'Marketing Executive': '/marketing/dashboard',
    'Sales Manager':       '/sales-manager/dashboard',
    'Sales Executive':     '/sales/dashboard',
    'Support Manager':     '/support/dashboard',
    'Support Agent':       '/support/dashboard',
    'Finance Executive':   '/finance/dashboard',
  };

  async function handleLoginWithPhone(phone: string, otp: string) {
    setPhoneError('');
    setPhoneLoading(true);
    try {
      const result = await authService.loginWithPhone(phone, otp);
      loginSuccess(result.accessToken, result.refreshToken, result.user);
      document.cookie = `accessToken=${result.accessToken}; path=/; max-age=900; SameSite=Lax`;
      router.replace(ROLE_DASHBOARDS[result.user.role] ?? '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'OTP verification failed. Please try again.';
      setPhoneError(msg);
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleGoogleLogin(credential: string) {
    setGoogleError('');
    try {
      const result = await authService.googleLogin(credential);
      loginSuccess(result.accessToken, result.refreshToken, result.user);
      document.cookie = `accessToken=${result.accessToken}; path=/; max-age=900; SameSite=Lax`;
      router.replace(ROLE_DASHBOARDS[result.user.role] ?? '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Google login failed. Make sure your account is registered in HubNest CRM.';
      setGoogleError(msg);
    }
  }

  return (
    <LoginExperience
      form={form}
      setForm={setForm}
      error={error}
      loading={loading}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      onSubmit={handleSubmit}
      onSendPhoneOtp={handleSendPhoneOtp}
      onLoginWithPhone={handleLoginWithPhone}
      phoneError={phoneError}
      phoneLoading={phoneLoading}
      onGoogleLogin={handleGoogleLogin}
      googleError={googleError}
    />
  );
}
