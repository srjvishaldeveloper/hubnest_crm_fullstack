const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get MFA settings for a user.
 */
async function getMFASettings(userId) {
  const result = await query(
    `SELECT * FROM user_mfa_settings WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Create or update MFA settings for a user.
 */
async function upsertMFASettings(userId, { mfaEnabled, preferredMethod, phoneNumber, phoneVerified }) {
  const result = await query(
    `INSERT INTO user_mfa_settings (user_id, mfa_enabled, preferred_method, phone_number, phone_verified)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       mfa_enabled = COALESCE($2, user_mfa_settings.mfa_enabled),
       preferred_method = COALESCE($3, user_mfa_settings.preferred_method),
       phone_number = COALESCE($4, user_mfa_settings.phone_number),
       phone_verified = COALESCE($5, user_mfa_settings.phone_verified),
       updated_at = NOW()
     RETURNING *`,
    [userId, mfaEnabled, preferredMethod, phoneNumber, phoneVerified ?? false]
  );
  return result.rows[0];
}

/**
 * Log a login/auth event.
 */
async function logAuthEvent(userId, eventType, { ipAddress, userAgent, metadata } = {}) {
  const { os, browser, deviceType } = parseUserAgent(userAgent);
  try {
    await query(
      `INSERT INTO login_audit_log (user_id, event_type, ip_address, user_agent, device_type, browser, os, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, eventType, ipAddress || null, userAgent || null, deviceType, browser, os, JSON.stringify(metadata || {})]
    );
  } catch (err) {
    logger.error('Failed to log auth event', { userId, eventType, message: err.message });
  }
}

/**
 * Get login audit log for a user.
 */
async function getAuditLog(userId, limit = 50) {
  const result = await query(
    `SELECT id, event_type, ip_address, device_type, browser, os, location, metadata, created_at
     FROM login_audit_log
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Get login stats for a user (for security dashboard).
 */
async function getLoginStats(userId) {
  const [total, recent, failedRecent] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM login_audit_log WHERE user_id = $1 AND event_type = 'login_success'`, [userId]),
    query(`SELECT COUNT(*) AS cnt FROM login_audit_log WHERE user_id = $1 AND event_type = 'login_success' AND created_at >= NOW() - INTERVAL '30 days'`, [userId]),
    query(`SELECT COUNT(*) AS cnt FROM login_audit_log WHERE user_id = $1 AND event_type = 'login_failed' AND created_at >= NOW() - INTERVAL '7 days'`, [userId]),
  ]);
  return {
    totalLogins: parseInt(total.rows[0]?.cnt || '0'),
    loginsLast30Days: parseInt(recent.rows[0]?.cnt || '0'),
    failedAttemptsLast7Days: parseInt(failedRecent.rows[0]?.cnt || '0'),
  };
}

/**
 * Parse user agent string into components.
 */
function parseUserAgent(ua) {
  if (!ua) return { os: 'Unknown', browser: 'Unknown', deviceType: 'Unknown' };

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome') || ua.includes('CriOS')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  let deviceType = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) deviceType = 'Mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) deviceType = 'Tablet';

  return { os, browser, deviceType };
}

module.exports = {
  getMFASettings,
  upsertMFASettings,
  logAuthEvent,
  getAuditLog,
  getLoginStats,
  parseUserAgent,
};
