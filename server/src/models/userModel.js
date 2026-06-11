const { query } = require('../config/database');

async function findByEmailOrAdminId(emailOrAdminId) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            u.phone, u.photo_url, u.language,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1 OR u.admin_id = $1 OR u.phone = $1
     LIMIT 1`,
    [emailOrAdminId]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            u.phone, u.photo_url, u.language,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            u.phone, u.photo_url, u.language,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE LOWER(u.email) = $1
       AND LOWER(u.email) NOT LIKE 'archived_%'
     ORDER BY u.created_at DESC
     LIMIT 1`,
    [normalizedEmail]
  );
  return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, userId]
  );
}

async function updateStatus(userId, status) {
  await query(
    `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, userId]
  );
}

async function checkEmailExists(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await query(
    `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
    [normalizedEmail]
  );
  return result.rows.length > 0;
}

async function findByPhone(phone) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            u.phone, u.phone_number, u.country_code, u.photo_url, u.language,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.phone_number = $1 OR u.phone = $1
     LIMIT 1`,
    [phone]
  );
  return result.rows[0] || null;
}

async function updatePhoneVerified(userId) {
  await query(
    `UPDATE users SET phone_verified = TRUE, phone_verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}

module.exports = {
  findByEmailOrAdminId,
  findById,
  findByEmail,
  findByPhone,
  updatePassword,
  updateStatus,
  updatePhoneVerified,
  checkEmailExists,
};
