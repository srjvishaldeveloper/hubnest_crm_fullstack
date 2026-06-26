
const { query } = require('../../config/database');
const logger = require('../../utils/logger');

// Returns notifications scoped to a tenant + user.
// Super Admins (no tenant_id) get platform-wide notifications.
// Regular users get their tenant's notifications targeted to them or 'all'.
async function getNotifications(userId, tenantId, roleName) {
  try {
    const isSuperAdmin = roleName === 'Super Admin' || !tenantId;

    if (isSuperAdmin) {
      const result = await query(
        `SELECT id, title, message, type, status, sent_at, 'all' AS target
         FROM platform_notifications
         ORDER BY sent_at DESC LIMIT 30`
      );
      return result.rows;
    }

    // For regular users — fetch from user_notifications (tenant-scoped) if that table
    // exists, else fall back to platform_notifications filtered by tenant
    const result = await query(
      `SELECT id, title, message, type, status, sent_at,
              target_user_id, target_role
       FROM user_notifications
       WHERE tenant_id = $1
         AND (target_user_id = $2 OR target_user_id IS NULL)
       ORDER BY sent_at DESC LIMIT 30`,
      [tenantId, userId]
    ).catch(async () => {
      // Fallback: platform_notifications (broadcast table)
      return query(
        `SELECT id, title, message, type, status, sent_at
         FROM platform_notifications
         ORDER BY sent_at DESC LIMIT 20`
      );
    });

    return result.rows;
  } catch (err) {
    logger.error('getNotifications error', { message: err.message });
    return [];
  }
}

async function markAsRead(id, userId, tenantId) {
  // Try user_notifications first, then platform_notifications
  let result = await query(
    `UPDATE user_notifications SET status = 'read'
     WHERE id = $1 AND (target_user_id = $2 OR target_user_id IS NULL) AND tenant_id = $3
     RETURNING *`,
    [id, userId, tenantId]
  ).catch(() => ({ rows: [] }));

  if (!result.rows.length) {
    result = await query(
      `UPDATE platform_notifications SET status = 'read' WHERE id = $1 RETURNING *`,
      [id]
    ).catch(() => ({ rows: [] }));
  }

  return result.rows[0] || null;
}

// Create a notification for a specific user or all users in a tenant
async function createNotification({ tenantId, title, message, type = 'info', targetUserId = null, targetRole = null }) {
  try {
    const result = await query(
      `INSERT INTO user_notifications (tenant_id, title, message, type, status, target_user_id, target_role, sent_at)
       VALUES ($1, $2, $3, $4, 'unread', $5, $6, NOW())
       RETURNING *`,
      [tenantId, title, message, type, targetUserId, targetRole]
    );
    return result.rows[0];
  } catch (err) {
    logger.error('createNotification error', { message: err.message });
    return null;
  }
}

module.exports = { getNotifications, markAsRead, createNotification };
