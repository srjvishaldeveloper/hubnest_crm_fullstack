const { query, pool } = require('../../config/database');

async function getDepartments(tenantId) {
  const result = await query(
    `SELECT id, name FROM org_departments WHERE tenant_id = $1 ORDER BY name ASC`,
    [tenantId]
  );
  return result.rows;
}

async function getConversations(tenantId, userId, roleName) {
  let sql, params;
  const isAdmin = roleName === 'Tenant Admin' || roleName === 'Admin';

  if (isAdmin) {
    sql = `
      SELECT c.id, c.type, c.name, c.created_at,
        dg.group_name,
        dg.department_id,
        d.name AS department_name,
        lm.message AS last_message,
        lm.sender_name AS last_message_sender,
        lm.created_at AS last_message_at,
        (SELECT COUNT(*) FROM org_messages m WHERE m.conversation_id = c.id AND m.is_deleted = FALSE) AS message_count,
        (SELECT COUNT(*) FROM org_messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id != $2
            AND m.id NOT IN (SELECT message_id FROM org_message_reads WHERE user_id = $2)
        ) AS unread_count
      FROM org_conversations c
      LEFT JOIN org_department_groups dg ON dg.conversation_id = c.id
      LEFT JOIN org_departments d ON d.id = dg.department_id
      LEFT JOIN LATERAL (
        SELECT m.message, u.name AS sender_name, m.created_at
        FROM org_messages m JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = c.id AND m.is_deleted = FALSE
        ORDER BY m.created_at DESC LIMIT 1
      ) lm ON TRUE
      WHERE c.tenant_id = $1
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `;
    params = [tenantId, userId];
  } else {
    sql = `
      SELECT c.id, c.type, c.name, c.created_at,
        dg.group_name,
        dg.department_id,
        d.name AS department_name,
        lm.message AS last_message,
        lm.sender_name AS last_message_sender,
        lm.created_at AS last_message_at,
        (SELECT COUNT(*) FROM org_messages m WHERE m.conversation_id = c.id AND m.is_deleted = FALSE) AS message_count,
        (SELECT COUNT(*) FROM org_messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id != $2
            AND m.id NOT IN (SELECT message_id FROM org_message_reads WHERE user_id = $2)
        ) AS unread_count,
        -- For direct chats, get the other participant's info
        (SELECT u.id FROM org_conversation_participants p
          JOIN users u ON u.id = p.user_id
          WHERE p.conversation_id = c.id AND p.user_id != $2 LIMIT 1
        ) AS peer_id,
        (SELECT u.name FROM org_conversation_participants p
          JOIN users u ON u.id = p.user_id
          WHERE p.conversation_id = c.id AND p.user_id != $2 LIMIT 1
        ) AS peer_name,
        (SELECT r.name FROM org_conversation_participants p
          JOIN users u ON u.id = p.user_id
          JOIN roles r ON r.id = u.role_id
          WHERE p.conversation_id = c.id AND p.user_id != $2 LIMIT 1
        ) AS peer_role
      FROM org_conversations c
      JOIN org_conversation_participants p ON c.id = p.conversation_id
      LEFT JOIN org_department_groups dg ON dg.conversation_id = c.id
      LEFT JOIN org_departments d ON d.id = dg.department_id
      LEFT JOIN LATERAL (
        SELECT m.message, u.name AS sender_name, m.created_at
        FROM org_messages m JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = c.id AND m.is_deleted = FALSE
        ORDER BY m.created_at DESC LIMIT 1
      ) lm ON TRUE
      WHERE c.tenant_id = $1 AND p.user_id = $2
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `;
    params = [tenantId, userId];
  }

  const result = await query(sql, params);
  return result.rows;
}

async function findOrCreateDirectConversation(tenantId, userId, peerId) {
  // Check if direct conversation already exists between userId and peerId
  const existing = await query(
    `SELECT c.id FROM org_conversations c
     JOIN org_conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $2
     JOIN org_conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $3
     WHERE c.tenant_id = $1 AND c.type = 'direct'
     LIMIT 1`,
    [tenantId, userId, peerId]
  );

  if (existing.rows.length > 0) return existing.rows[0].id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const convResult = await client.query(
      `INSERT INTO org_conversations (tenant_id, type, created_by) VALUES ($1, 'direct', $2) RETURNING id`,
      [tenantId, userId]
    );
    const conversationId = convResult.rows[0].id;
    await client.query(
      `INSERT INTO org_conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3) ON CONFLICT DO NOTHING`,
      [conversationId, userId, peerId]
    );
    await client.query('COMMIT');
    return conversationId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createConversation(tenantId, type, createdBy, participantIds, departmentId = null, groupName = null, name = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const convResult = await client.query(
      `INSERT INTO org_conversations (tenant_id, type, created_by, name) VALUES ($1, $2, $3, $4) RETURNING id`,
      [tenantId, type, createdBy, name]
    );
    const conversationId = convResult.rows[0].id;

    for (const pId of participantIds) {
      await client.query(
        `INSERT INTO org_conversation_participants (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [conversationId, pId]
      );
    }

    if ((type === 'department' || type === 'group') && departmentId && groupName) {
      await client.query(
        `INSERT INTO org_department_groups (tenant_id, department_id, conversation_id, group_name)
         VALUES ($1, $2, $3, $4)`,
        [tenantId, departmentId, conversationId, groupName]
      );
    }

    await client.query('COMMIT');
    return conversationId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function saveMessage(conversationId, senderId, message, type = 'text', attachmentUrl = null) {
  const result = await query(
    `INSERT INTO org_messages (conversation_id, sender_id, message, type, attachment_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [conversationId, senderId, message, type, attachmentUrl]
  );
  return result.rows[0];
}

async function editMessage(messageId, senderId, newMessage) {
  const result = await query(
    `UPDATE org_messages SET message = $1, is_edited = TRUE
     WHERE id = $2 AND sender_id = $3 AND is_deleted = FALSE
     RETURNING *`,
    [newMessage, messageId, senderId]
  );
  return result.rows[0] || null;
}

async function deleteMessage(messageId, senderId, isAdmin = false) {
  const sql = isAdmin
    ? `UPDATE org_messages SET is_deleted = TRUE WHERE id = $1 RETURNING *`
    : `UPDATE org_messages SET is_deleted = TRUE WHERE id = $1 AND sender_id = $2 RETURNING *`;
  const params = isAdmin ? [messageId] : [messageId, senderId];
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function getMessages(conversationId, limit = 50, offset = 0) {
  const result = await query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.message, m.type,
            m.attachment_url, m.is_edited, m.is_deleted, m.created_at,
            u.name AS sender_name, u.photo_url AS sender_photo,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('reaction', r.reaction, 'user_id', r.user_id))
              FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS reactions
     FROM org_messages m
     JOIN users u ON m.sender_id = u.id
     LEFT JOIN org_message_reactions r ON r.message_id = m.id
     WHERE m.conversation_id = $1
     GROUP BY m.id, u.name, u.photo_url
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return result.rows.reverse();
}

async function markMessagesAsRead(conversationId, userId) {
  const unread = await query(
    `SELECT id FROM org_messages WHERE conversation_id = $1 AND sender_id != $2 AND is_deleted = FALSE`,
    [conversationId, userId]
  );
  for (const row of unread.rows) {
    await query(
      `INSERT INTO org_message_reads (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [row.id, userId]
    );
  }
}

async function addReaction(messageId, userId, reaction) {
  // Toggle: if exists remove, else insert
  const existing = await query(
    `SELECT id FROM org_message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
    [messageId, userId, reaction]
  );
  if (existing.rows.length > 0) {
    await query(
      `DELETE FROM org_message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
      [messageId, userId, reaction]
    );
    return 'removed';
  }
  await query(
    `INSERT INTO org_message_reactions (message_id, user_id, reaction) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [messageId, userId, reaction]
  );
  return 'added';
}

async function pinMessage(conversationId, messageId, userId) {
  await query(
    `INSERT INTO org_pinned_messages (conversation_id, message_id, pinned_by)
     VALUES ($1, $2, $3) ON CONFLICT (conversation_id, message_id) DO NOTHING`,
    [conversationId, messageId, userId]
  );
}

async function unpinMessage(conversationId, messageId) {
  await query(
    `DELETE FROM org_pinned_messages WHERE conversation_id = $1 AND message_id = $2`,
    [conversationId, messageId]
  );
}

async function getPinnedMessages(conversationId) {
  const result = await query(
    `SELECT m.id, m.message, m.type, m.created_at, m.sender_id,
            u.name AS sender_name, p.pinned_at, pb.name AS pinned_by_name
     FROM org_pinned_messages p
     JOIN org_messages m ON m.id = p.message_id
     JOIN users u ON u.id = m.sender_id
     JOIN users pb ON pb.id = p.pinned_by
     WHERE p.conversation_id = $1
     ORDER BY p.pinned_at DESC`,
    [conversationId]
  );
  return result.rows;
}

async function saveAnnouncement(tenantId, senderId, message, target, targetId, targetLabel) {
  const result = await query(
    `INSERT INTO org_announcements (tenant_id, sender_id, message, target, target_id, target_label)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenantId, senderId, message, target, targetId || null, targetLabel || null]
  );
  return result.rows[0];
}

async function getAnnouncements(tenantId, limit = 30) {
  const result = await query(
    `SELECT a.*, u.name AS sender_name, u.photo_url AS sender_photo
     FROM org_announcements a
     JOIN users u ON u.id = a.sender_id
     WHERE a.tenant_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [tenantId, limit]
  );
  return result.rows;
}

async function searchMessages(tenantId, userId, searchTerm) {
  const result = await query(
    `SELECT m.id, m.conversation_id, m.message, m.created_at,
            u.name AS sender_name, c.type AS conversation_type,
            COALESCE(dg.group_name, c.name) AS conversation_name
     FROM org_messages m
     JOIN users u ON u.id = m.sender_id
     JOIN org_conversations c ON c.id = m.conversation_id
     JOIN org_conversation_participants p ON p.conversation_id = c.id AND p.user_id = $2
     LEFT JOIN org_department_groups dg ON dg.conversation_id = c.id
     WHERE c.tenant_id = $1
       AND m.is_deleted = FALSE
       AND m.message ILIKE $3
     ORDER BY m.created_at DESC
     LIMIT 50`,
    [tenantId, userId, `%${searchTerm}%`]
  );
  return result.rows;
}

// Chat visibility rules:
//  - Super Admin (no tenant_id): can only see and message Admins/Tenant Admins
//  - Regular users: can see all active users in their tenant EXCEPT Super Admins
async function getOrganizationUsers(tenantId, requestingUserId, requestingRole) {
  const isSuperAdmin = requestingRole === 'Super Admin' || !tenantId;

  if (isSuperAdmin) {
    // Super Admin can only talk to Admins / Tenant Admins
    const result = await query(
      `SELECT u.id, u.name, u.email, u.photo_url, r.name AS role_name,
              u.department_id, d.name AS department_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN org_departments d ON u.department_id = d.id
       WHERE u.status = 'Active'
         AND u.id != $1
         AND (LOWER(r.name) IN ('tenant admin', 'admin'))
       ORDER BY u.name ASC`,
      [requestingUserId]
    );
    return result.rows;
  }

  // Regular users: everyone in their tenant except Super Admins
  const result = await query(
    `SELECT u.id, u.name, u.email, u.photo_url, r.name AS role_name,
            u.department_id, d.name AS department_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN org_departments d ON u.department_id = d.id
     WHERE u.tenant_id = $1
       AND u.status = 'Active'
       AND u.id != $2
       AND LOWER(r.name) NOT IN ('super admin', 'superadmin')
     ORDER BY u.name ASC`,
    [tenantId, requestingUserId]
  );
  return result.rows;
}

async function getConversationMembers(conversationId, tenantId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.photo_url, r.name AS role_name,
            cp.joined_at, cp.is_admin AS is_group_admin
     FROM org_conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE cp.conversation_id = $1 AND u.tenant_id = $2 AND u.status = 'Active'
     ORDER BY u.name ASC`,
    [conversationId, tenantId]
  );
  return result.rows;
}

async function addConversationMembers(conversationId, tenantId, userIds, requesterId) {
  // Verify conversation belongs to tenant
  const conv = await query(
    `SELECT id FROM org_conversations WHERE id = $1`, [conversationId]
  );
  if (!conv.rows[0]) throw new Error('Conversation not found');

  for (const uid of userIds) {
    await query(
      `INSERT INTO org_conversation_participants (conversation_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [conversationId, uid]
    );
  }
}

async function removeConversationMember(conversationId, tenantId, userId) {
  await query(
    `DELETE FROM org_conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
}

module.exports = {
  getDepartments,
  getConversations,
  findOrCreateDirectConversation,
  createConversation,
  saveMessage,
  editMessage,
  deleteMessage,
  getMessages,
  markMessagesAsRead,
  addReaction,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  saveAnnouncement,
  getAnnouncements,
  searchMessages,
  getOrganizationUsers,
  getConversationMembers,
  addConversationMembers,
  removeConversationMember,
};
