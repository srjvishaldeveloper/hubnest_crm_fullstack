const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const authService = require('./auth.service');
const emailService = require('../../services/emailService');
const { sendSuccess, sendError } = require('../../utils/helpers');
const { query } = require('../../config/database');
const logger = require('../../utils/logger');

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, 'Validation failed', 422, errors.array());
    return false;
  }
  return true;
}

async function login(req, res) {
  if (!validate(req, res)) return;
  const { emailOrAdminId, password } = req.body;
  const result = await authService.login(emailOrAdminId, password);
  return sendSuccess(res, result, result.message);
}

async function verifyOtp(req, res) {
  if (!validate(req, res)) return;
  const { userId, otp } = req.body;
  const result = await authService.verifyOtp(userId, otp);
  return sendSuccess(res, result, 'Login successful');
}

async function refresh(req, res) {
  if (!validate(req, res)) return;
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  return sendSuccess(res, result, 'Token refreshed successfully');
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return sendSuccess(res, {}, 'Logged out successfully');
}

async function forgotPassword(req, res) {
  if (!validate(req, res)) return;
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return sendSuccess(res, result, result.message);
}

async function resetPassword(req, res) {
  if (!validate(req, res)) return;
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);
  return sendSuccess(res, {}, result.message);
}

async function resendOtp(req, res) {
  if (!validate(req, res)) return;
  const { userId } = req.body;
  const result = await authService.resendOtp(userId);
  return sendSuccess(res, result, result.message);
}

async function sendCredentials(req, res) {
  const { to, adminId, tempPassword, companyName, adminName } = req.body;
  if (!to || !adminId || !tempPassword || !companyName || !adminName) {
    return sendError(res, 'Missing required fields', 400);
  }
  await emailService.sendCredentialsEmail(to, adminId, tempPassword, companyName, adminName);
  return sendSuccess(res, {}, 'Credentials email sent successfully');
}

async function createTenant(req, res) {
  const { companyName, companyEmail, adminName, adminEmail, adminPhone, plan, status, adminId, tempPassword, sendCreds } = req.body;

  if (!companyName || !adminName || !adminEmail || !adminId || !tempPassword) {
    return sendError(res, 'Missing required fields', 400);
  }

  // Create a unique schema name, e.g. tenant_acme_1234
  const sanitizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const schemaName = `tenant_${sanitizedCompany}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // 1. Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1 OR admin_id = $2', [adminEmail, adminId]);
    if (userCheck.rows.length > 0) {
      return sendError(res, 'User with this email or Admin ID already exists', 400);
    }

    // 2. Insert the Tenant
    const tenantResult = await query(
      `INSERT INTO tenants (name, schema_name, status) 
       VALUES ($1, $2, 'Active') 
       RETURNING id`,
      [companyName, schemaName]
    );
    const tenantId = tenantResult.rows[0].id;

    // 3. Ensure the 'Admin' role exists in roles table
    let roleResult = await query('SELECT id FROM roles WHERE name = $1', ['Admin']);
    let roleId;
    if (roleResult.rows.length === 0) {
      const adminPermissions = {
        users:    { create: true, read: true, update: true, delete: true },
        roles:    { create: true, read: true, update: true, delete: true },
        jobs:     { create: true, read: true, update: true, delete: true },
        reports:  { create: true, read: true, update: true, delete: true },
        settings: { create: true, read: true, update: true, delete: true },
      };
      const insertRole = await query(
        `INSERT INTO roles (name, permissions) 
         VALUES ($1, $2) 
         RETURNING id`,
        ['Admin', JSON.stringify(adminPermissions)]
      );
      roleId = insertRole.rows[0].id;
    } else {
      roleId = roleResult.rows[0].id;
    }

    // 4. Create the Admin User in users table
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const dbStatus = status === 'Blocked' ? 'Suspended' : (status === 'Inactive' ? 'Inactive' : 'Active');
    await query(
      `INSERT INTO users (tenant_id, role_id, name, email, admin_id, password_hash, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantId,
        roleId,
        adminName,
        adminEmail,
        adminId,
        passwordHash,
        dbStatus
      ]
    );

    // 5. Send Email if requested
    let emailError = null;
    if (sendCreds) {
      try {
        await emailService.sendCredentialsEmail(adminEmail, adminId, tempPassword, companyName, adminName);
      } catch (mailErr) {
        logger.warn('Failed to send credentials email', { message: mailErr.message });
        emailError = mailErr.message;
      }
    }

    return sendSuccess(res, { tenantId, adminId, emailError }, 'Tenant and Admin provisioned successfully in database');
  } catch (err) {
    logger.error('Failed to provision tenant in database', { message: err.message });
    return sendError(res, err.message || 'Failed to provision tenant', 500);
  }
}

async function resetTenantAdmin(req, res) {
  const { adminId, name, email, phone, tempPassword } = req.body;

  if (!adminId || !name || !email || !tempPassword) {
    return sendError(res, 'Missing required fields', 400);
  }

  try {
    // 1. Find user by adminId
    const userCheck = await query('SELECT id, tenant_id FROM users WHERE admin_id = $1', [adminId]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'Admin account not found', 404);
    }
    const userId = userCheck.rows[0].id;
    const tenantId = userCheck.rows[0].tenant_id;

    // Get company name
    const tenantCheck = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
    const companyName = tenantCheck.rows[0]?.name || 'Your Company';

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // 3. Update User
    await query(
      `UPDATE users 
       SET name = $1, email = $2, password_hash = $3, updated_at = NOW() 
       WHERE id = $4`,
      [name, email, passwordHash, userId]
    );

    // 4. Send credentials email
    let emailError = null;
    try {
      await emailService.sendCredentialsEmail(email, adminId, tempPassword, companyName, name);
    } catch (mailErr) {
      logger.warn('Failed to send credentials email during reset', { message: mailErr.message });
      emailError = mailErr.message;
    }

    return sendSuccess(res, { adminId, emailError }, 'Admin credentials updated successfully');
  } catch (err) {
    logger.error('Failed to reset admin credentials in database', { message: err.message });
    return sendError(res, err.message || 'Failed to reset admin credentials', 500);
  }
}

async function blockTenantAdmin(req, res) {
  const { adminId, status } = req.body;
  if (!adminId || !status) {
    return sendError(res, 'Missing required fields', 400);
  }
  const dbStatus = status === 'Blocked' ? 'Suspended' : (status === 'Inactive' ? 'Inactive' : 'Active');
  try {
    const userCheck = await query('SELECT id, tenant_id FROM users WHERE admin_id = $1', [adminId]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'Admin account not found', 404);
    }
    const userId = userCheck.rows[0].id;
    const tenantId = userCheck.rows[0].tenant_id;

    await query('UPDATE users SET status = $1 WHERE id = $2', [dbStatus, userId]);
    const tenantStatus = status === 'Blocked' ? 'Suspended' : (status === 'Inactive' ? 'Inactive' : 'Active');
    await query('UPDATE tenants SET status = $1 WHERE id = $2', [tenantStatus, tenantId]);

    return sendSuccess(res, { adminId, status }, `Status updated to ${status} successfully`);
  } catch (err) {
    logger.error('Failed to update tenant status in database', { message: err.message });
    return sendError(res, err.message || 'Failed to update status', 500);
  }
}

async function deleteTenantAdmin(req, res) {
  const { adminId } = req.body;
  if (!adminId) {
    return sendError(res, 'Missing required fields', 400);
  }
  try {
    const userCheck = await query('SELECT tenant_id FROM users WHERE admin_id = $1', [adminId]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'Admin account not found', 404);
    }
    const tenantId = userCheck.rows[0].tenant_id;

    await query('DELETE FROM tenants WHERE id = $1', [tenantId]);

    return sendSuccess(res, { adminId }, 'Tenant and Admin deleted successfully');
  } catch (err) {
    logger.error('Failed to delete tenant and admin from database', { message: err.message });
    return sendError(res, err.message || 'Failed to delete tenant', 500);
  }
}

module.exports = { 
  login, 
  verifyOtp, 
  resendOtp, 
  refresh, 
  logout, 
  forgotPassword, 
  resetPassword, 
  sendCredentials, 
  createTenant, 
  resetTenantAdmin,
  blockTenantAdmin,
  deleteTenantAdmin
};
