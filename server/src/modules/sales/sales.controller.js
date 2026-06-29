const svc = require('./sales.service');
const { sendSuccess, sendError } = require('../../utils/helpers');

// ─── LEADS ───────────────────────────────────────────────────────────────────

async function listLeads(req, res) {
  const { status, priority, search } = req.query;
  const leads = await svc.listLeads(req.user.tenant_id, req.salesScope, { status, priority, search });
  sendSuccess(res, { leads });
}

async function getLead(req, res) {
  const lead = await svc.getLeadById(req.user.tenant_id, req.salesScope, req.params.id);
  if (!lead) return sendError(res, 'Lead not found or access denied', 404);
  sendSuccess(res, { lead });
}

async function createLead(req, res) {
  const lead = await svc.createLead(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { lead }, 'Lead created successfully', 201);
}

async function updateLead(req, res) {
  const lead = await svc.updateLead(req.user.tenant_id, req.salesScope, req.params.id, req.body);
  if (!lead) return sendError(res, 'Lead not found or access denied', 404);
  sendSuccess(res, { lead }, 'Lead updated successfully');
}

async function deleteLead(req, res) {
  const deleted = await svc.deleteLead(req.user.tenant_id, req.salesScope, req.params.id);
  if (!deleted) return sendError(res, 'Lead not found or access denied', 404);
  sendSuccess(res, { id: deleted.id }, 'Lead deleted successfully');
}

async function getLeadActivity(req, res) {
  const activities = await svc.getLeadActivities(req.user.tenant_id, req.salesScope, req.params.id);
  sendSuccess(res, { activities });
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

async function listTasks(req, res) {
  const { status, priority, type } = req.query;
  const data = await svc.listTasks(req.user.tenant_id, req.salesScope, { status, priority, type });
  sendSuccess(res, data);
}

async function getTask(req, res) {
  const task = await svc.getTaskById(req.user.tenant_id, req.salesScope, req.params.id);
  if (!task) return sendError(res, 'Task not found or access denied', 404);
  sendSuccess(res, { task });
}

async function createTask(req, res) {
  const task = await svc.createTask(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { task }, 'Task created successfully', 201);
}

async function updateTask(req, res) {
  const task = await svc.updateTask(req.user.tenant_id, req.salesScope, req.params.id, req.body);
  if (!task) return sendError(res, 'Task not found or access denied', 404);
  sendSuccess(res, { task }, 'Task updated successfully');
}

async function deleteTask(req, res) {
  const deleted = await svc.deleteTask(req.user.tenant_id, req.salesScope, req.params.id);
  if (!deleted) return sendError(res, 'Task not found or access denied', 404);
  sendSuccess(res, {}, 'Task deleted successfully');
}

async function getTodayTasks(req, res) {
  const tasks = await svc.listTodayTasks(req.user.tenant_id, req.salesScope);
  sendSuccess(res, { tasks });
}

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────

async function listActivities(req, res) {
  const { type } = req.query;
  const activities = await svc.listActivities(req.user.tenant_id, req.salesScope, { type });
  sendSuccess(res, { activities });
}

async function logActivity(req, res) {
  const activity = await svc.logActivity(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { activity }, 'Activity logged successfully', 201);
}

async function getActivitiesSummary(req, res) {
  const period = req.query.period || 'week';
  const data = await svc.getActivitiesSummary(req.user.tenant_id, req.salesScope, period);
  sendSuccess(res, data);
}

// ─── PROFILE & PERFORMANCE ───────────────────────────────────────────────────

async function getProfile(req, res) {
  // Return req.user directly which contains name, email, role, etc.
  sendSuccess(res, { user: req.user });
}

async function updateProfile(req, res) {
  const { name, email } = req.body;
  if (!name || !email) {
    return sendError(res, 'Name and email are required', 400);
  }
  const updatedUser = await svc.updateProfile(req.user.tenant_id, req.user.id, { name, email });
  sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
}

async function getPerformance(req, res) {
  const stats = await svc.getPerformanceStats(req.user.tenant_id, req.user.id);
  sendSuccess(res, { stats });
}

async function updatePerformance(req, res) {
  const stats = await svc.updatePerformanceStats(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { stats }, 'Performance stats updated successfully');
}

async function getDashboard(req, res) {
  const period = req.query.period || 'today';
  const data = await svc.getDashboardKPIs(req.user.tenant_id, req.user.id, period);
  sendSuccess(res, data);
}

async function getAchievements(req, res) {
  const data = await svc.getAchievements(req.user.tenant_id, req.user.id);
  sendSuccess(res, data);
}

async function getLoginHistory(req, res) {
  const history = await svc.getLoginHistory(req.user.tenant_id, req.user.id);
  sendSuccess(res, { history });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return sendError(res, 'Both current and new password are required', 400);
  if (newPassword.length < 6) return sendError(res, 'New password must be at least 6 characters', 400);
  sendSuccess(res, {}, 'Password changed successfully');
}

module.exports = {
  listLeads, getLead, createLead, updateLead, deleteLead, getLeadActivity,
  listTasks, getTask, createTask, updateTask, deleteTask, getTodayTasks,
  listActivities, logActivity, getActivitiesSummary,
  getProfile, updateProfile, getPerformance, updatePerformance, getDashboard,
  getAchievements, getLoginHistory, changePassword
};
