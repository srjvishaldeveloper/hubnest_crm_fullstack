import api from './api';

// ─── Types ───────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, any>;
  limits: Record<string, number>;
}

export interface UsageItem {
  resource: string;
  current_count: number;
  max_allowed: number;
  percentage: number;
  is_unlimited: boolean;
}

export interface CurrentPlan {
  plan: SubscriptionPlan;
  subscription: {
    id: string;
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
  };
}

// ─── API Functions ───────────────────────────────────────────
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const res = await api.get('/subscription/plans');
  return res.data?.data?.plans || [];
}

export async function getCurrentPlan(): Promise<CurrentPlan | null> {
  try {
    const res = await api.get('/subscription/current');
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function getUsageDashboard(): Promise<UsageItem[]> {
  try {
    const res = await api.get('/subscription/usage');
    return res.data?.data?.usage || [];
  } catch {
    return [];
  }
}

export async function upgradePlan(planSlug: string, billingCycle: string = 'monthly'): Promise<any> {
  const res = await api.post('/subscription/upgrade', { planSlug, billingCycle });
  return res.data;
}

// ─── MFA API Functions ───────────────────────────────────────
export async function getMFASettings(): Promise<any> {
  const res = await api.get('/mfa/settings');
  return res.data?.data || {};
}

export async function updateMFASettings(settings: {
  mfaEnabled?: boolean;
  preferredMethod?: string;
  phoneNumber?: string;
}): Promise<any> {
  const res = await api.put('/mfa/settings', settings);
  return res.data?.data || {};
}

export async function sendPhoneVerification(phoneNumber: string): Promise<any> {
  const res = await api.post('/mfa/send-phone-verification', { phoneNumber });
  return res.data;
}

export async function verifyPhone(otp: string): Promise<any> {
  const res = await api.post('/mfa/verify-phone', { otp });
  return res.data;
}

export async function getAuditLog(limit: number = 50): Promise<any[]> {
  const res = await api.get(`/mfa/audit-log?limit=${limit}`);
  return res.data?.data?.logs || [];
}

export async function getLoginStats(): Promise<any> {
  const res = await api.get('/mfa/login-stats');
  return res.data?.data || {};
}
