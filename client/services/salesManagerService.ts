import { api } from './api';

const BASE = '/sales-manager';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const smGetDashboard = async () => {
  const res = await api.get(`${BASE}/dashboard`);
  return res.data?.data ?? res.data ?? null;
};

// ─── TEAM ─────────────────────────────────────────────────────────────────────
export const smGetTeam = async () => {
  const res = await api.get(`${BASE}/team`);
  return res.data?.data ?? res.data ?? null;
};

export const smGetMember = async (id: string) => {
  const res = await api.get(`${BASE}/team/${id}`);
  return res.data?.data ?? res.data ?? null;
};

export const smAddExecutive = async (data: {
  name: string; email: string; employeeId: string;
  password?: string; mobile?: string;
}) => {
  const res = await api.post(`${BASE}/team/add-executive`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateMemberTarget = async (id: string, data: { targetAmount?: number; targetLeads?: number }) => {
  const res = await api.patch(`${BASE}/team/${id}/target`, data);
  return res.data?.data ?? res.data ?? null;
};

// ─── LEADS ────────────────────────────────────────────────────────────────────
export const smGetLeads = async (params?: {
  status?: string; priority?: string; search?: string;
  assignedTo?: string; page?: number; limit?: number;
}) => {
  const res = await api.get(`${BASE}/leads`, { params });
  return res.data?.data ?? res.data ?? null;
};

export const smGetLead = async (id: string) => {
  const res = await api.get(`${BASE}/leads/${id}`);
  return res.data?.data ?? res.data ?? null;
};

export const smCreateLead = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/leads`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateLead = async (id: string, data: Record<string, unknown>) => {
  const res = await api.patch(`${BASE}/leads/${id}`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smAssignLead = async (id: string, executiveId: string, notes?: string) => {
  const res = await api.patch(`${BASE}/leads/${id}/assign`, { executiveId, notes });
  return res.data?.data ?? res.data ?? null;
};

export const smBulkAssignLeads = async (leadIds: string[], executiveId: string) => {
  const res = await api.post(`${BASE}/leads/bulk-assign`, { leadIds, executiveId });
  return res.data?.data ?? res.data ?? null;
};

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const smGetTasks = async (params?: { status?: string; priority?: string; userId?: string }) => {
  const res = await api.get(`${BASE}/tasks`, { params });
  return res.data?.data ?? res.data ?? null;
};

export const smCreateTask = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/tasks`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateTask = async (id: string, data: Record<string, unknown>) => {
  const res = await api.patch(`${BASE}/tasks/${id}`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smDeleteTask = async (id: string) => {
  const res = await api.delete(`${BASE}/tasks/${id}`);
  return res.data?.data ?? res.data ?? null;
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const smGetReports = async () => {
  const res = await api.get(`${BASE}/reports`);
  return res.data?.data ?? res.data ?? null;
};

// ─── PROFILE & TARGETS ────────────────────────────────────────────────────────
export const smGetProfile = async () => {
  const res = await api.get(`${BASE}/profile`);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateProfile = async (data: { name: string; email: string }) => {
  const res = await api.patch(`${BASE}/profile`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smGetTargets = async () => {
  const res = await api.get(`${BASE}/targets`);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateTargets = async (data: Record<string, unknown>) => {
  const res = await api.patch(`${BASE}/targets`, data);
  return res.data?.data ?? res.data ?? null;
};
