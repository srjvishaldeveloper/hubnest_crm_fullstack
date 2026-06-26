const svc = require('./orgChat.service');
const logger = require('../../utils/logger');
const { onlineUsers } = require('./orgChat.socket');

async function getDepartments(req, res) {
  try {
    const departments = await svc.getDepartments(req.user.tenant_id);
    res.json(departments);
  } catch (err) {
    logger.error('getDepartments error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getConversations(req, res) {
  try {
    const { id: userId, tenant_id: tenantId, role_name: roleName } = req.user;
    const conversations = await svc.getConversations(tenantId, userId, roleName);
    res.json(conversations);
  } catch (err) {
    logger.error('getConversations error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createConversation(req, res) {
  try {
    const { type, participantIds, departmentId, groupName, peerId, name } = req.body;
    const { id: userId, tenant_id: tenantId } = req.user;

    let conversationId;

    if (type === 'direct') {
      if (!peerId) return res.status(400).json({ error: 'peerId required for direct conversation' });
      conversationId = await svc.findOrCreateDirectConversation(tenantId, userId, peerId);
    } else {
      const pIds = new Set(participantIds || []);
      pIds.add(userId);
      conversationId = await svc.createConversation(
        tenantId, type, userId, Array.from(pIds), departmentId, groupName, name
      );
    }

    res.status(201).json({ success: true, conversationId });
  } catch (err) {
    logger.error('createConversation error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const messages = await svc.getMessages(conversationId, limit, offset);
    res.json(messages);
  } catch (err) {
    logger.error('getMessages error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function editMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const { id: userId } = req.user;
    const updated = await svc.editMessage(messageId, userId, message);
    if (!updated) return res.status(403).json({ error: 'Cannot edit this message' });
    res.json(updated);
  } catch (err) {
    logger.error('editMessage error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { id: userId, role_name: roleName } = req.user;
    const isAdmin = roleName === 'Tenant Admin' || roleName === 'Admin';
    const deleted = await svc.deleteMessage(messageId, userId, isAdmin);
    if (!deleted) return res.status(403).json({ error: 'Cannot delete this message' });
    res.json({ success: true });
  } catch (err) {
    logger.error('deleteMessage error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function pinMessage(req, res) {
  try {
    const { conversationId, messageId } = req.params;
    await svc.pinMessage(conversationId, messageId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('pinMessage error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function unpinMessage(req, res) {
  try {
    const { conversationId, messageId } = req.params;
    await svc.unpinMessage(conversationId, messageId);
    res.json({ success: true });
  } catch (err) {
    logger.error('unpinMessage error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPinnedMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const pinned = await svc.getPinnedMessages(conversationId);
    res.json(pinned);
  } catch (err) {
    logger.error('getPinnedMessages error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendAnnouncement(req, res) {
  try {
    const { message, target, targetId, targetLabel } = req.body;
    const { id: userId, tenant_id: tenantId, role_name: roleName } = req.user;
    if (roleName !== 'Tenant Admin' && roleName !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can send announcements' });
    }
    const announcement = await svc.saveAnnouncement(tenantId, userId, message, target, targetId, targetLabel);
    res.status(201).json(announcement);
  } catch (err) {
    logger.error('sendAnnouncement error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAnnouncements(req, res) {
  try {
    const { tenant_id: tenantId } = req.user;
    const limit = parseInt(req.query.limit) || 30;
    const announcements = await svc.getAnnouncements(tenantId, limit);
    res.json(announcements);
  } catch (err) {
    logger.error('getAnnouncements error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function searchMessages(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const { id: userId, tenant_id: tenantId } = req.user;
    const results = await svc.searchMessages(tenantId, userId, q.trim());
    res.json(results);
  } catch (err) {
    logger.error('searchMessages error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOrganizationUsers(req, res) {
  try {
    const { id: userId, tenant_id: tenantId, role_name: roleName } = req.user;
    const users = await svc.getOrganizationUsers(tenantId, userId, roleName);
    const usersWithStatus = users.map(u => ({ ...u, isOnline: onlineUsers.has(u.id) }));
    res.json(usersWithStatus);
  } catch (err) {
    logger.error('getOrganizationUsers error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Upload a file as base64 data URL — returns a url to store in attachment_url
async function uploadFile(req, res) {
  try {
    const { file_data, file_name, mime_type } = req.body;
    if (!file_data || !file_name) return res.status(400).json({ error: 'file_data and file_name required' });
    const MAX = 15 * 1024 * 1024; // 15 MB limit (base64 is ~33% larger)
    if (file_data.length > MAX * 1.4) return res.status(400).json({ error: 'File too large. Max 15 MB.' });
    // Store the data URL directly — same pattern as avatar/documents
    return res.json({ success: true, url: file_data, name: file_name, mime_type });
  } catch (err) {
    logger.error('uploadFile error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get members of a conversation
async function getConversationMembers(req, res) {
  try {
    const { conversationId } = req.params;
    const { tenant_id: tenantId } = req.user;
    const members = await svc.getConversationMembers(conversationId, tenantId);
    res.json(members);
  } catch (err) {
    logger.error('getConversationMembers error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Add members to an existing group conversation
async function addConversationMembers(req, res) {
  try {
    const { conversationId } = req.params;
    const { userIds } = req.body;
    const { id: requesterId, tenant_id: tenantId } = req.user;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ error: 'userIds array required' });
    await svc.addConversationMembers(conversationId, tenantId, userIds, requesterId);
    res.json({ success: true });
  } catch (err) {
    logger.error('addConversationMembers error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Remove a member from a group conversation
async function removeConversationMember(req, res) {
  try {
    const { conversationId, userId } = req.params;
    const { id: requesterId, role_name: roleName, tenant_id: tenantId } = req.user;
    const isAdmin = roleName === 'Tenant Admin' || roleName === 'Admin';
    // Can remove self, or admin can remove others
    if (userId !== requesterId && !isAdmin) return res.status(403).json({ error: 'Not allowed' });
    await svc.removeConversationMember(conversationId, tenantId, userId);
    res.json({ success: true });
  } catch (err) {
    logger.error('removeConversationMember error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getDepartments,
  getConversations,
  createConversation,
  getMessages,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  sendAnnouncement,
  getAnnouncements,
  searchMessages,
  getOrganizationUsers,
  uploadFile,
  getConversationMembers,
  addConversationMembers,
  removeConversationMember,
};
