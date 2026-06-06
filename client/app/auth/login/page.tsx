'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import LoginExperience from '../../../components/auth/LoginExperience';
import { authService } from '../../../services/auth';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setPendingUserId = useAuthStore((s) => s.setPendingUserId);

  const [form, setForm] = useState({ emailOrAdminId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      router.push(`/auth/verify-otp?email=${encodeURIComponent(result.maskedEmail)}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
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
    />
  );
}
