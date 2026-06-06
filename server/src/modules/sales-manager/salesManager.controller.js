const { sendSuccess, sendError } = require('../../utils/helpers');
const svc = require('./salesManager.service');

async function getDashboard(req, res) {
  const data = await svc.getManagerDashboard(req.user.tenant_id, req.user.id);
  return sendSuccess(res, data, 'Dashboard data retrieved');
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

async function getTeam(req, res) {
  const members = await svc.getTeamMembers(req.user.tenant_id, req.user.id);
  return sendSuccess(res, { members }, 'Team retrieved');
}

async function getMemberDetail(req, res) {
  const member = await svc.getMemberDetail(req.user.tenant_id, req.user.id, req.params.id);
  if (!member) return sendError(res, 'Team member not found or access denied', 404);
  return sendSuccess(res, { member }, 'Member detail retrieved');
}

async function addExecutive(req, res) {
  const { name, email, employeeId, password, mobile } = req.body;
  if (!name || !email || !employeeId) return sendError(res, 'name, email, and employeeId are required', 400);
  const result = await svc.addExecutive(req.user.tenant_id, req.user.id, { name, email, employeeId, password, mobile });
  return sendSuccess(res, result, 'Sales Executive created and added to team');
}

async function updateMemberTarget(req, res) {
  const result = await svc.updateExecutiveTarget(req.user.tenant_id, req.user.id, req.params.id, req.body);
  return sendSuccess(res, result, 'Target updated');
}

// ─── LEADS ────────────────────────────────────────────────────────────────────

async function listLeads(req, res) {
  const { status, priority, search, assignedTo, page, limit } = req.query;
  const data = await svc.listTeamLeads(req.user.tenant_id, { status, priority, search, assignedTo, page: +page || 1, limit: +limit || 20 });
  return sendSuccess(res, data, 'Leads retrieved');
}

async function getLead(req, res) {
  const lead = await svc.getTeamLeadById(req.user.tenant_id, req.params.id);
  if (!lead) return sendError(res, 'Lead not found', 404);
  return sendSuccess(res, { lead }, 'Lead retrieved');
}

async function createLead(req, res) {
  const lead = await svc.createTeamLead(req.user.tenant_id, req.user.id, req.body);
  return sendSuccess(res, { lead }, 'Lead created');
}

async function updateLead(req, res) {
  const lead = await svc.updateTeamLead(req.user.tenant_id, req.params.id, req.body);
  if (!lead) return sendError(res, 'Lead not found or no changes', 404);
  return sendSuccess(res, { lead }, 'Lead updated');
}

async function assignLead(req, res) {
  const { executiveId, notes } = req.body;
  if (!executiveId) return sendError(res, 'executiveId is required', 400);
  const result = await svc.assignLead(req.user.tenant_id, req.user.id, req.params.id, executiveId, notes);
  return sendSuccess(res, result, 'Lead assigned');
}

async function bulkAssignLeads(req, res) {
  const { leadIds, executiveId } = req.body;
  if (!leadIds?.length || !executiveId) return sendError(res, 'leadIds and executiveId are required', 400);
  const results = await svc.bulkAssignLeads(req.user.tenant_id, req.user.id, leadIds, executiveId);
  return sendSuccess(res, { results }, 'Bulk assignment completed');
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

async function listTasks(req, res) {
  const { status, priority, userId } = req.query;
  const tasks = await svc.listTeamTasks(req.user.tenant_id, { status, priority, userId });
  return sendSuccess(res, { tasks }, 'Tasks retrieved');
}

async function createTask(req, res) {
  const task = await svc.createTeamTask(req.user.tenant_id, req.user.id, req.body);
  return sendSuccess(res, { task }, 'Task created');
}

async function updateTask(req, res) {
  const task = await svc.updateTeamTask(req.user.tenant_id, req.params.id, req.body);
  if (!task) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, { task }, 'Task updated');
}

async function deleteTask(req, res) {
  const deleted = await svc.deleteTeamTask(req.user.tenant_id, req.params.id);
  if (!deleted) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, {}, 'Task deleted');
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

async function getReports(req, res) {
  const data = await svc.getReportsOverview(req.user.tenant_id, req.user.id);
  return sendSuccess(res, data, 'Reports retrieved');
}

// ─── PROFILE & TARGETS ────────────────────────────────────────────────────────

async function getProfile(req, res) {
  const profile = await svc.getManagerProfile(req.user.tenant_id, req.user.id);
  if (!profile) return sendError(res, 'Profile not found', 404);
  return sendSuccess(res, { profile }, 'Profile retrieved');
}

async function updateProfile(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return sendError(res, 'name and email are required', 400);
  const updated = await svc.updateManagerProfile(req.user.tenant_id, req.user.id, { name, email });
  return sendSuccess(res, { profile: updated }, 'Profile updated');
}

async function getTargets(req, res) {
  const targets = await svc.getManagerTargets(req.user.tenant_id, req.user.id);
  return sendSuccess(res, { targets }, 'Targets retrieved');
}

async function updateTargets(req, res) {
  const targets = await svc.updateManagerTargets(req.user.tenant_id, req.user.id, req.body);
  return sendSuccess(res, { targets }, 'Targets updated');
}

module.exports = {
  getDashboard,
  getTeam, getMemberDetail, addExecutive, updateMemberTarget,
  listLeads, getLead, createLead, updateLead, assignLead, bulkAssignLeads,
  listTasks, createTask, updateTask, deleteTask,
  getReports,
  getProfile, updateProfile, getTargets, updateTargets,
};
