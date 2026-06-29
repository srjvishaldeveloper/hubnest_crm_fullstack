import { api } from './api';

const BASE = '/finance';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const financeGetDashboard = async (timeFilter?: string) => {
  const params = timeFilter ? { timeFilter } : undefined;
  const res = await api.get(`${BASE}/dashboard`, { params });
  return res.data.data;
};

export const financeGetPaymentStats = async (timeFilter?: string) => {
  const params = timeFilter ? { timeFilter } : undefined;
  const res = await api.get(`${BASE}/payment-stats`, { params });
  return res.data.data;
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
export const financeGetAnalytics = async () => {
  const res = await api.get(`${BASE}/analytics`);
  return res.data.data;
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export const financeGetInvoices = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/invoices`, { params });
  return res.data.data;
};

export const financeGetInvoice = async (id: string) => {
  const res = await api.get(`${BASE}/invoices/${id}`);
  return res.data.data;
};

export const financeCreateInvoice = async (data: {
  invoice_number: string;
  customer_name: string;
  amount: number;
  tax?: number;
  total?: number;
  status?: string;
  due_date: string;
  // Extended Indian GST fields (stored as metadata in notes column via JSON)
  meta?: Record<string, unknown>;
}) => {
  const res = await api.post(`${BASE}/invoices`, data);
  return res.data.data;
};

export const financeUpdateInvoice = async (id: string, data: {
  invoice_number?: string;
  customer_name?: string;
  amount?: number;
  tax?: number;
  total?: number;
  status?: string;
  due_date?: string;
  paid_date?: string;
}) => {
  const res = await api.patch(`${BASE}/invoices/${id}`, data);
  return res.data.data;
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const financeGetPayments = async (params?: {
  status?: string;
  method?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/payments`, { params });
  return res.data.data;
};

export const financeCreatePayment = async (data: {
  invoice_id?: string;
  amount: number;
  method?: string;
  reference?: string;
  status?: string;
  paid_at?: string;
}) => {
  const res = await api.post(`${BASE}/payments`, data);
  return res.data.data;
};

export const financeDeletePayment = async (id: string) => {
  const res = await api.delete(`${BASE}/payments/${id}`);
  return res.data.data;
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const financeGetExpenses = async (params?: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/expenses`, { params });
  return res.data.data;
};

export const financeCreateExpense = async (data: {
  category?: string;
  description: string;
  amount: number;
  vendor_id?: string;
  status?: string;
  expense_date?: string;
}) => {
  const res = await api.post(`${BASE}/expenses`, data);
  return res.data.data;
};

export const financeUpdateExpense = async (id: string, data: {
  category?: string;
  description?: string;
  amount?: number;
  vendor_id?: string;
  approved_by?: string;
  status?: string;
  expense_date?: string;
}) => {
  const res = await api.patch(`${BASE}/expenses/${id}`, data);
  return res.data.data;
};

export const financeDeleteExpense = async (id: string) => {
  const res = await api.delete(`${BASE}/expenses/${id}`);
  return res.data.data;
};

// ─── VENDORS ──────────────────────────────────────────────────────────────────
export const financeGetVendors = async (params?: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/vendors`, { params });
  return res.data.data;
};

export const financeGetVendor = async (id: string) => {
  const res = await api.get(`${BASE}/vendors/${id}`);
  return res.data.data;
};

export const financeCreateVendor = async (data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  status?: string;
}) => {
  const res = await api.post(`${BASE}/vendors`, data);
  return res.data.data;
};

export const financeUpdateVendor = async (id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  status?: string;
}) => {
  const res = await api.patch(`${BASE}/vendors/${id}`, data);
  return res.data.data;
};

// ─── PAYROLL ──────────────────────────────────────────────────────────────────
export const financeGetPayroll = async (params?: {
  status?: string;
  pay_period?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/payroll`, { params });
  return res.data.data;
};

export const financeGetPayrollDashboard = async () => {
  const res = await api.get(`${BASE}/payroll/dashboard`);
  return res.data?.data || res.data;
};

export const financeUpdatePayrollStatus = async (id: string, data: { status: string; payment_method?: string; payment_ref?: string }) => {
  const res = await api.post(`${BASE}/payroll/${id}/pay`, data);
  return res.data?.data || res.data;
};

export const financeCreatePayrollEmployee = async (data: any) => {
  const res = await api.post(`${BASE}/payroll/employee`, data);
  return res.data?.data || res.data;
};

export const financeGetComplianceDashboard = async () => {
  const res = await api.get(`${BASE}/compliance/dashboard`);
  return res.data.data;
};

export const financeGetProfileDashboard = async () => {
  const res = await api.get(`${BASE}/profile/dashboard`);
  return res.data.data;
};

// ─── TAX RECORDS ──────────────────────────────────────────────────────────────
export const financeGetTaxRecords = async (params?: {
  status?: string;
  tax_type?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/tax-records`, { params });
  return res.data.data;
};

