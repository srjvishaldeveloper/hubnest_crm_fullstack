const { query } = require('../config/database');

async function findByEmailOrAdminId(emailOrAdminId) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1 OR u.admin_id = $1
     LIMIT 1`,
    [emailOrAdminId]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
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
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,
    [email]
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

module.exports = { findByEmailOrAdminId, findById, findByEmail, updatePassword, updateStatus };
