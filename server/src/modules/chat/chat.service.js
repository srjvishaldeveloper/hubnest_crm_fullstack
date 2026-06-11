const { query } = require('../../config/database');

async function getOrCreateConversation(tenantId, adminId, superAdminId) {
  // Check if exists
  const existing = await query(
    `SELECT * FROM chat_conversations 
     WHERE admin_id = $1 AND super_admin_id = $2`,
    [adminId, superAdminId]
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }

  // Create new
  const created = await query(
    `INSERT INTO chat_conversations (tenant_id, admin_id, super_admin_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [tenantId, adminId, superAdminId]
  );
  return created.rows[0];
}

async function getConversationsForUser(userId, role) {
  if (role === 'Super Admin') {
    // Super Admin sees all conversations
    const result = await query(
      `SELECT c.*, 
              u.name AS admin_name, 
              u.email AS admin_email,
              t.name AS tenant_name,
              (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.is_read = FALSE) AS unread_count,
              (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time
       FROM chat_conversations c
       JOIN users u ON u.id = c.admin_id
       LEFT JOIN tenants t ON t.id = c.tenant_id
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return result.rows;
  } else {
    // Admin sees only their conversation with Super Admins
    const result = await query(
      `SELECT c.*, 
              u.name AS super_admin_name, 
              u.email AS super_admin_email,
              (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.is_read = FALSE) AS unread_count,
              (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time
       FROM chat_conversations c
       JOIN users u ON u.id = c.super_admin_id
       WHERE c.admin_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

async function getMessages(conversationId, limit = 50) {
  const result = await query(
    `SELECT * FROM chat_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC 
     LIMIT $2`,
    [conversationId, limit]
  );
  return result.rows;
}

async function saveMessage(conversationId, senderId, receiverId, message, messageType = 'text', attachmentUrl = null) {
  const msgResult = await query(
    `INSERT INTO chat_messages (conversation_id, sender_id, receiver_id, message, message_type, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [conversationId, senderId, receiverId, message, messageType, attachmentUrl]
  );

  // Update conversation updated_at timestamp
  await query(
    `UPDATE chat_conversations 
     SET updated_at = NOW() 
     WHERE id = $1`,
    [conversationId]
  );

  return msgResult.rows[0];
}

async function markMessagesAsRead(conversationId, userId) {
  const result = await query(
    `UPDATE chat_messages 
     SET is_read = TRUE 
     WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE
     RETURNING *`,
    [conversationId, userId]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await query(
    `SELECT COUNT(*) AS count FROM chat_messages 
     WHERE receiver_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].count || '0');
}

async function getDashboardMetrics(superAdminId) {
  const [totalChats, unreadCount, recentConversations] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM chat_conversations'),
    query('SELECT COUNT(*) AS count FROM chat_messages WHERE receiver_id = $1 AND is_read = FALSE', [superAdminId]),
    query(
      `SELECT c.id, u.name AS admin_name, t.name AS tenant_name,
              (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              c.updated_at
       FROM chat_conversations c
       JOIN users u ON u.id = c.admin_id
       LEFT JOIN tenants t ON t.id = c.tenant_id
       ORDER BY c.updated_at DESC
       LIMIT 5`
    )
  ]);

  return {
    totalActiveChats: parseInt(totalChats.rows[0].count || '0'),
    unreadMessages: parseInt(unreadCount.rows[0].count || '0'),
    recentConversations: recentConversations.rows
  };
}

module.exports = {
  getOrCreateConversation,
  getConversationsForUser,
  getMessages,
  saveMessage,
  markMessagesAsRead,
  getUnreadCount,
  getDashboardMetrics
};
