const svc = require('./chat.service');
const { sendSuccess, sendError } = require('../../utils/helpers');
const { query } = require('../../config/database');

// RBAC Gate: Only Admin and Super Admin roles can access
function checkChatPermission(user) {
  return user.role_name === 'Super Admin' || user.role_name === 'Admin' || user.role_name === 'Tenant Admin';
}

async function listConversations(req, res) {
  if (!checkChatPermission(req.user)) {
    return sendError(res, 'Access denied: Unauthorized role for internal chat', 403);
  }
  const conversations = await svc.getConversationsForUser(req.user.id, req.user.role_name);
  sendSuccess(res, { conversations });
}

async function startConversation(req, res) {
  if (!checkChatPermission(req.user)) {
    return sendError(res, 'Access denied: Unauthorized role for internal chat', 403);
  }

  let adminId, superAdminId;
  const tenantId = req.user.tenant_id;

  if (req.user.role_name === 'Super Admin') {
    // Super Admin starts chat with a specific Admin
    adminId = req.body.adminId;
    superAdminId = req.user.id;
    if (!adminId) return sendError(res, 'adminId is required', 400);
  } else {
    // Admin starts chat with a Super Admin (fetch a Super Admin from DB if not provided)
    adminId = req.user.id;
    if (req.body.superAdminId) {
      superAdminId = req.body.superAdminId;
    } else {
      const superAdmins = await query("SELECT id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Super Admin' LIMIT 1");
      if (!superAdmins.rows[0]) {
        return sendError(res, 'No Super Admin available to contact', 404);
      }
      superAdminId = superAdmins.rows[0].id;
    }
  }

  const conversation = await svc.getOrCreateConversation(tenantId, adminId, superAdminId);
  sendSuccess(res, { conversation }, 'Conversation loaded', 201);
}

async function listMessages(req, res) {
  if (!checkChatPermission(req.user)) {
    return sendError(res, 'Access denied: Unauthorized role for internal chat', 403);
  }

  const { conversationId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;

  // Security check: verify this user belongs to the conversation
  const conv = await query('SELECT * FROM chat_conversations WHERE id = $1', [conversationId]);
  if (!conv.rows[0]) {
    return sendError(res, 'Conversation not found', 404);
  }

  const conversation = conv.rows[0];
  if (req.user.role_name !== 'Super Admin' && conversation.admin_id !== req.user.id) {
    return sendError(res, 'Access denied: Unauthorized access to this conversation', 403);
  }

  const messages = await svc.getMessages(conversationId, limit);
  sendSuccess(res, { messages });
}

async function readMessages(req, res) {
  if (!checkChatPermission(req.user)) {
    return sendError(res, 'Access denied: Unauthorized role for internal chat', 403);
  }
  const { conversationId } = req.params;
  await svc.markMessagesAsRead(conversationId, req.user.id);
  sendSuccess(res, {}, 'Messages marked as read');
}

async function getUnreadCount(req, res) {
  if (!checkChatPermission(req.user)) {
    return sendError(res, 'Access denied: Unauthorized role for internal chat', 403);
  }
  const count = await svc.getUnreadCount(req.user.id);
  sendSuccess(res, { count });
}

async function getDashboardMetrics(req, res) {
  if (req.user.role_name !== 'Super Admin') {
    return sendError(res, 'Access denied: Super Admin only dashboard stats', 403);
  }
  const metrics = await svc.getDashboardMetrics(req.user.id);
  sendSuccess(res, metrics);
}

module.exports = {
  listConversations,
  startConversation,
  listMessages,
  readMessages,
  getUnreadCount,
  getDashboardMetrics
};
