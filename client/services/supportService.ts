import { api } from './api';

const BASE = '/support';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const supportGetDashboard = async () => {
  const res = await api.get(`${BASE}/dashboard`);
  return res.data.data;
};

// ─── TICKETS ──────────────────────────────────────────────────────────────────
export const supportGetTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedAgentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/tickets`, { params });
  return res.data.data;
};

export const supportGetTicket = async (id: string) => {
  const res = await api.get(`${BASE}/tickets/${id}`);
  return res.data.data;
};

export const supportCreateTicket = async (data: {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  assignedAgentId?: string;
}) => {
  const res = await api.post(`${BASE}/tickets`, data);
  return res.data.data;
};

export const supportUpdateTicket = async (id: string, data: {
  status?: string;
  priority?: string;
  category?: string;
  assigned_agent_id?: string | null;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
}) => {
  const res = await api.patch(`${BASE}/tickets/${id}`, data);
  return res.data.data;
};

export const supportAddMessage = async (id: string, data: {
  message: string;
  isInternalNote?: boolean;
}) => {
  const res = await api.post(`${BASE}/tickets/${id}/messages`, data);
  return res.data.data;
};

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const supportGetCustomers = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get(`${BASE}/customers`, { params });
  return res.data.data;
};

export const supportGetCustomer = async (id: string) => {
  const res = await api.get(`${BASE}/customers/${id}`);
  return res.data.data;
};

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
export const supportGetArticles = async (params?: {
  category?: string;
  status?: string;
  search?: string;
}) => {
  const res = await api.get(`${BASE}/knowledge-base`, { params });
  return res.data.data;
};

export const supportGetArticle = async (id: string) => {
  const res = await api.get(`${BASE}/knowledge-base/${id}`);
  return res.data.data;
};

export const supportCreateArticle = async (data: {
  title: string;
  content: string;
  category: string;
  status?: string;
}) => {
  const res = await api.post(`${BASE}/knowledge-base`, data);
  return res.data.data;
};

export const supportUpdateArticle = async (id: string, data: {
  title?: string;
  content?: string;
  category?: string;
  status?: string;
}) => {
  const res = await api.patch(`${BASE}/knowledge-base/${id}`, data);
  return res.data.data;
};

export const supportRateArticle = async (id: string, isLike: boolean) => {
  const res = await api.post(`${BASE}/knowledge-base/${id}/rate`, { isLike });
  return res.data.data;
};

export const supportAddKbComment = async (id: string, comment: string) => {
  const res = await api.post(`${BASE}/knowledge-base/${id}/comments`, { comment });
  return res.data.data;
};

export const supportGetKbAnalytics = async () => {
  const res = await api.get(`${BASE}/knowledge-base/analytics`);
  return res.data.data;
};

// ─── ADVANCED TICKETS ─────────────────────────────────────────────────────────
export const supportBulkUpdateTickets = async (ticketIds: string[], updateData: any) => {
  const res = await api.post(`${BASE}/tickets/bulk`, { ticketIds, updateData });
  return res.data.data;
};

export const supportEscalateTicket = async (id: string, reason: string) => {
  const res = await api.post(`${BASE}/tickets/${id}/escalate`, { reason });
  return res.data.data;
};

export const supportAssignTicket = async (id: string, assignedAgentId: string) => {
  const res = await api.post(`${BASE}/tickets/${id}/assign`, { assignedAgentId });
  return res.data.data;
};

// ─── ADVANCED CUSTOMERS ───────────────────────────────────────────────────────
export const supportCreateCustomer = async (data: any) => {
  const res = await api.post(`${BASE}/customers`, data);
  return res.data.data;
};

export const supportUpdateCustomer = async (id: string, data: any) => {
  const res = await api.patch(`${BASE}/customers/${id}`, data);
  return res.data.data;
};

export const supportAddCustomerNote = async (id: string, note: string) => {
  const res = await api.post(`${BASE}/customers/${id}/notes`, { note });
  return res.data.data;
};

export const supportBulkUpdateCustomers = async (customerIds: string[], updateData: any) => {
  const res = await api.post(`${BASE}/customers/bulk`, { customerIds, updateData });
  return res.data.data;
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const supportGetProfile = async () => {
  const res = await api.get(`${BASE}/profile`);
  return res.data.data;
};

export const supportUpdateProfile = async (data: any) => {
  const res = await api.patch(`${BASE}/profile`, data);
  return res.data.data;
};
