import api from './api';

export interface LoginPayload {
  emailOrAdminId: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  maskedEmail: string;
  message: string;
}

export interface VerifyOtpPayload {
  userId: string;
  otp: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  adminId: string;
  role: string;
  permissions: Record<string, Record<string, boolean>>;
  tenantId: string;
  phone?: string;
  photoUrl?: string;
  language?: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<{ data: LoginResponse }>('/auth/login', payload);
  return data.data;
}

async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const { data } = await api.post<{ data: VerifyOtpResponse }>('/auth/verify-otp', payload);
  return data.data;
}

async function resendOtp(userId: string): Promise<LoginResponse> {
  const { data } = await api.post<{ data: LoginResponse }>('/auth/resend-otp', { userId });
  return data.data;
}

async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const { data } = await api.post<{ data: { accessToken: string } }>('/auth/refresh', {
    refreshToken: token,
  });
  return data.data;
}

async function logout(token: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken: token });
}

async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', payload);
  return { message: data.message };
}

async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
  return { message: data.message };
}

export const authService = { login, verifyOtp, resendOtp, refreshToken, logout, forgotPassword, resetPassword };
