
const svc = require('./notifications.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

async function getNotifications(req, res) {
  try {
    const { id: userId, tenant_id: tenantId, role_name: roleName } = req.user;
    const data = await svc.getNotifications(userId, tenantId, roleName);
    return sendSuccess(res, data, 'Notifications fetched successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const { id: userId, tenant_id: tenantId } = req.user;
    const data = await svc.markAsRead(id, userId, tenantId);
    if (!data) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, data, 'Notification marked as read');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = { getNotifications, markAsRead };
