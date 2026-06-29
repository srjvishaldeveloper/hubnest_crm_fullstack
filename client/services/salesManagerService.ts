import { api } from './api';

const BASE = '/sales-manager';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const smGetDashboard = async (timeFilter: string = 'Monthly') => {
  const res = await api.get(`${BASE}/dashboard`, { params: { timeFilter } });
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

export const smGetActivities = async (params?: Record<string, unknown>) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const res = await api.get(`/sales-manager/activities${query}`);
  return res.data?.data?.activities || [];
};

export const smCreateActivity = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/activities`, data);
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
export const smGetReports = async (timeFilter: string = 'Month') => {
  const res = await api.get(`${BASE}/reports`, { params: { timeFilter } });
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

// ─── NEW MANAGER ACTIONS & PIPELINE ──────────────────────────────────────────
export const smGetPipeline = async () => {
  const res = await api.get(`${BASE}/pipeline`);
  return res.data?.data ?? res.data ?? null;
};

export const smDeleteLead = async (id: string) => {
  const res = await api.delete(`${BASE}/leads/${id}`);
  return res.data?.data ?? res.data ?? null;
};

export const smBulkDeleteLeads = async (leadIds: string[]) => {
  const res = await api.post(`${BASE}/leads/bulk-delete`, { leadIds });
  return res.data?.data ?? res.data ?? null;
};

export const smEscalateLead = async (id: string, reason?: string) => {
  const res = await api.patch(`${BASE}/leads/${id}/escalate`, { reason });
  return res.data?.data ?? res.data ?? null;
};

export const smRemoveMember = async (id: string) => {
  const res = await api.delete(`${BASE}/team/${id}`);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateMemberStatus = async (id: string, status: string) => {
  const res = await api.patch(`${BASE}/team/${id}/status`, { status });
  return res.data?.data ?? res.data ?? null;
};

export const smBroadcast = async (data: { message: string; priority?: string }) => {
  const res = await api.post(`${BASE}/team/broadcast`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smApprove = async (data: { requestId: string; type: string; decision: string; notes?: string }) => {
  const res = await api.post(`${BASE}/team/approve`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdatePassword = async (data: Record<string, unknown>) => {
  const res = await api.patch(`${BASE}/profile/password`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateSettings = async (data: Record<string, unknown>) => {
  const res = await api.patch(`${BASE}/profile/settings`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUploadDoc = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/profile/document`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smGetSessions = async () => {
  const res = await api.get(`${BASE}/profile/sessions`);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateProfilePicture = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/profile/picture`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smUpdateCoverPicture = async (data: Record<string, unknown>) => {
  const res = await api.post(`${BASE}/profile/cover`, data);
  return res.data?.data ?? res.data ?? null;
};

export const smGetNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data?.data ?? res.data ?? null;
};

