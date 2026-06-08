const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const authService = require('./auth.service');
const emailService = require('../../services/emailService');
const { sendSuccess, sendError } = require('../../utils/helpers');
const { query } = require('../../config/database');
const logger = require('../../utils/logger');
const { checkEmailExists } = require('../../models/userModel');

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
  logger.info(`Login attempt: emailOrAdminId=${emailOrAdminId}, password=${password}`);
  const result = await authService.login(emailOrAdminId, password);
  return sendSuccess(res, result, result.message);
}

async function verifyOtp(req, res) {
  if (!validate(req, res)) return;
  const { userId, otp } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const result = await authService.verifyOtp(userId, otp, ip, userAgent);
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
  const { to, adminId, tempPassword, companyName, adminName, type } = req.body;
  if (!to || !adminId || !tempPassword || !companyName || !adminName) {
    return sendError(res, 'Missing required fields', 400);
  }
  await emailService.sendCredentialsEmail(to, adminId, tempPassword, companyName, adminName, type || 'create_tenant');
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
    // 1. Check if email already exists
    const emailExists = await checkEmailExists(adminEmail);
    if (emailExists) {
      return sendError(res, "This email is already registered in the system. Please use a different email address.", 409);
    }

    // Check if Admin ID exists
    const adminCheck = await query('SELECT id FROM users WHERE admin_id = $1', [adminId]);
    if (adminCheck.rows.length > 0) {
      return sendError(res, 'User with this Admin ID already exists', 400);
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
        await emailService.sendCredentialsEmail(adminEmail, adminId, tempPassword, companyName, adminName, 'create_tenant');
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
      await emailService.sendCredentialsEmail(email, adminId, tempPassword, companyName, name, 'reset_tenant');
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

async function getTenantAdmins(req, res) {
  try {
    const result = await query(
      `SELECT u.id, u.admin_id, u.name, u.email, u.status, u.created_at,
              t.name AS company
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN tenants t ON t.id = u.tenant_id
       WHERE r.name = 'Admin'`
    );
    const admins = result.rows.map(r => ({
      id: r.id,
      adminId: r.admin_id,
      name: r.name,
      email: r.email,
      phone: '',
      company: r.company,
      plan: 'Enterprise',
      status: r.status === 'Suspended' ? 'Blocked' : r.status,
      joinedDate: new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Never logged in',
      avatar: r.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'T',
    }));
    return sendSuccess(res, { admins }, 'Admins retrieved successfully');
  } catch (err) {
    logger.error('Failed to retrieve tenant admins', { message: err.message });
    return sendError(res, err.message || 'Failed to retrieve admins', 500);
  }
}

async function createUser(req, res) {
  const { name, email, employeeId, role, department, password, sendCreds } = req.body;
  const tenantId = req.user.tenant_id;

  if (!name || !email || !employeeId || !role) {
    return sendError(res, 'Missing required fields', 400);
  }

  try {
    // 1. Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return sendError(res, "This email is already registered in the system. Please use a different email address.", 409);
    }

    // Check if Employee ID exists
    const empCheck = await query('SELECT id FROM users WHERE admin_id = $1', [employeeId]);
    if (empCheck.rows.length > 0) {
      return sendError(res, 'User with this Employee ID already exists', 400);
    }

    // 2. Resolve Role
    let roleResult = await query('SELECT id FROM roles WHERE name = $1', [role]);
    let roleId;
    if (roleResult.rows.length === 0) {
      const defaultPermissions = {
        users:    { create: false, read: true, update: false, delete: false },
        jobs:     { create: true, read: true, update: true, delete: false },
        reports:  { create: false, read: true, update: false, delete: false },
        settings: { create: false, read: true, update: false, delete: false },
      };
      const insertRole = await query(
        `INSERT INTO roles (name, permissions) 
         VALUES ($1, $2) 
         RETURNING id`,
        [role, JSON.stringify(defaultPermissions)]
      );
      roleId = insertRole.rows[0].id;
    } else {
      roleId = roleResult.rows[0].id;
    }

    // 3. Create User
    const passwordHash = await bcrypt.hash(password || 'Tenant@123!', 12);
    const result = await query(
      `INSERT INTO users (tenant_id, role_id, name, email, admin_id, password_hash, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Active') RETURNING id`,
      [tenantId, roleId, name, email, employeeId, passwordHash]
    );
    const userId = result.rows[0].id;

    // 4. Send Email if requested
    if (sendCreds) {
      try {
        const tenantCheck = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
        const companyName = tenantCheck.rows[0]?.name || 'Client CRM';
        await emailService.sendCredentialsEmail(email, employeeId, password || 'Tenant@123!', companyName, name, 'create_user');
      } catch (mailErr) {
        logger.warn('Failed to send credentials email', { message: mailErr.message });
      }
    }

    return sendSuccess(res, { id: userId, employeeId }, 'User created successfully');
  } catch (err) {
    logger.error('Failed to create user in database', { message: err.message });
    return sendError(res, err.message || 'Failed to create user', 500);
  }
}

async function getUsers(req, res) {
  const tenantId = req.user.tenant_id;
  try {
    const result = await query(
      `SELECT u.id, u.admin_id, u.name, u.email, u.status, u.created_at,
              r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.tenant_id = $1`,
      [tenantId]
    );

    const getDept = (roleName) => {
      if (['Admin', 'Super Admin'].includes(roleName)) return 'Management';
      if (['Sales Executive', 'Sales Manager'].includes(roleName)) return 'Sales';
      if (['Marketing Executive', 'Marketing Head'].includes(roleName)) return 'Marketing';
      if (['Support Agent', 'Support Manager'].includes(roleName)) return 'Support';
      if (['Finance Executive'].includes(roleName)) return 'Finance';
      return 'Management'; // Default/Fallback
    };

    const users = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      employeeId: r.admin_id || '',
      role: r.role_name,
      department: getDept(r.role_name),
      status: r.status === 'Suspended' ? 'Blocked' : r.status,
      joinedDate: new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Never',
      avatar: r.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U',
      leadsHandled: 0,
      loginDays: 0,
      actionsPerformed: 0,
      conversionRate: '0%',
      dealsClosed: 0,
      revenueGenerated: '$0'
    }));

    return sendSuccess(res, { users }, 'Users retrieved successfully');
  } catch (err) {
    logger.error('Failed to retrieve tenant users', { message: err.message });
    return sendError(res, err.message || 'Failed to retrieve users', 500);
  }
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const tenantId = req.user.tenant_id;

  try {
    const check = await query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (check.rows.length === 0) {
      return sendError(res, 'User not found or access denied', 404);
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    return sendSuccess(res, { id }, 'User deleted successfully');
  } catch (err) {
    logger.error('Failed to delete user', { message: err.message });
    return sendError(res, err.message || 'Failed to delete user', 500);
  }
}

async function toggleBlockUser(req, res) {
  const { id, status } = req.body;
  const tenantId = req.user.tenant_id;

  if (!id || !status) {
    return sendError(res, 'Missing required fields', 400);
  }

  const dbStatus = status === 'Blocked' ? 'Suspended' : (status === 'Inactive' ? 'Inactive' : 'Active');

  try {
    const check = await query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (check.rows.length === 0) {
      return sendError(res, 'User not found or access denied', 404);
    }

    await query('UPDATE users SET status = $1 WHERE id = $2', [dbStatus, id]);
    return sendSuccess(res, { id, status }, 'User status updated successfully');
  } catch (err) {
    logger.error('Failed to update user status', { message: err.message });
    return sendError(res, err.message || 'Failed to update user status', 500);
  }
}

async function resetUserPassword(req, res) {
  const { id } = req.params;
  const tenantId = req.user.tenant_id;

  try {
    const userCheck = await query('SELECT id, name, email, admin_id FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'User not found or access denied', 404);
    }
    const user = userCheck.rows[0];

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `Temp@${randomDigits}`;

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);

    const tenantCheck = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
    const companyName = tenantCheck.rows[0]?.name || 'Job Nest CRM';

    await emailService.sendCredentialsEmail(user.email, user.admin_id, tempPassword, companyName, user.name, 'reset_user');

    return sendSuccess(res, { id, email: user.email }, 'Password has been successfully reset and credentials sent to email.');
  } catch (err) {
    logger.error('Failed to reset user password', { message: err.message });
    return sendError(res, err.message || 'Failed to reset user password', 500);
  }
}

async function checkEmail(req, res) {
  const { email } = req.query;
  if (!email) {
    return sendError(res, 'email query parameter is required', 400);
  }
  try {
    const exists = await checkEmailExists(email);
    return sendSuccess(res, { available: !exists }, 'Email availability checked');
  } catch (err) {
    logger.error('Email check failed', { message: err.message });
    return sendError(res, err.message || 'Failed to check email', 500);
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT u.id, u.name, u.email, u.admin_id, u.status, u.phone, u.photo_url, u.language,
              r.name AS role, t.name AS company
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, { user: result.rows[0] }, 'Profile retrieved successfully');
  } catch (err) {
    logger.error('Failed to get profile', { message: err.message });
    return sendError(res, err.message, 500);
  }
}

async function updateProfile(req, res) {
  const { name, phone, photo_url, language } = req.body;
  const userId = req.user.id;
  try {
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           photo_url = COALESCE($3, photo_url),
           language = COALESCE($4, language),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, admin_id, phone, photo_url, language`,
      [name, phone, photo_url, language, userId]
    );
    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, { user: result.rows[0] }, 'Profile updated successfully');
  } catch (err) {
    logger.error('Failed to update profile', { message: err.message });
    return sendError(res, err.message, 500);
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  if (!currentPassword || !newPassword) {
    return sendError(res, 'Current password and new password are required', 400);
  }
  try {
    // 1. Fetch user's current password hash
    const userCheck = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }
    const { password_hash } = userCheck.rows[0];

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, password_hash);
    if (!isMatch) {
      return sendError(res, 'Incorrect current password', 400);
    }

    // 3. Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    logger.error('Failed to change password', { message: err.message });
    return sendError(res, err.message, 500);
  }
}

function parseUserAgent(ua) {
  if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser' };
  
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows PC';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('Linux')) os = 'Linux PC';
  
  let browser = 'Unknown Browser';
  if (ua.includes('Brave')) browser = 'Brave';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome') || ua.includes('CriOS')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Postman')) browser = 'Postman';
  
  return { os, browser };
}

async function getActiveSessions(req, res) {
  const userId = req.user.id;
  const { currentRefreshToken } = req.query;
  const currentIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const currentUA = req.headers['user-agent'] || '';
  
  try {
    const result = await query(
      `SELECT id, token, ip_address, user_agent, created_at, expires_at 
       FROM refresh_tokens 
       WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW() 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    const sessions = result.rows.map((row, idx) => {
      let ua = row.user_agent;
      let ip = row.ip_address;
      const isCurrent = row.token === currentRefreshToken;
      
      if (!ua) {
        if (isCurrent) {
          ua = currentUA;
        } else {
          const mockUAs = [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
          ];
          ua = mockUAs[idx % mockUAs.length];
        }
      }
      
      if (!ip) {
        if (isCurrent) {
          ip = currentIp;
        } else {
          ip = `192.168.1.${10 + (idx * 3)}`;
        }
      }
      
      // Clean up IP formats
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1') || ip.includes('::ffff:127.0.0.1')) {
        ip = '127.0.0.1 (This PC)';
      }
      
      const { os, browser } = parseUserAgent(ua);
      
      return {
        id: row.id,
        token: row.token,
        device: `${os} • ${browser}`,
        ip: ip,
        createdAt: row.created_at,
        expiresAt: row.expires_at
      };
    });
    
    return sendSuccess(res, { sessions }, 'Active sessions retrieved successfully');
  } catch (err) {
    logger.error('Failed to get active sessions', { message: err.message });
    return sendError(res, err.message, 500);
  }
}

async function logoutOtherDevices(req, res) {
  const userId = req.user.id;
  const { currentRefreshToken } = req.body;
  if (!currentRefreshToken) {
    return sendError(res, 'Current refresh token is required', 400);
  }
  try {
    await query(
      `UPDATE refresh_tokens 
       SET revoked = TRUE 
       WHERE user_id = $1 AND token != $2 AND revoked = FALSE`,
      [userId, currentRefreshToken]
    );
    return sendSuccess(res, null, 'Logged out from all other devices successfully');
  } catch (err) {
    logger.error('Failed to log out other devices', { message: err.message });
    return sendError(res, err.message, 500);
  }
}

async function revokeSession(req, res) {
  const userId = req.user.id;
  const { sessionId } = req.body;
  if (!sessionId) {
    return sendError(res, 'Session ID is required', 400);
  }
  try {
    await query(
      `UPDATE refresh_tokens 
       SET revoked = TRUE 
       WHERE user_id = $1 AND id = $2 AND revoked = FALSE`,
      [userId, sessionId]
    );
    return sendSuccess(res, null, 'Session revoked successfully');
  } catch (err) {
    logger.error('Failed to revoke session', { message: err.message });
    return sendError(res, err.message, 500);
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
  deleteTenantAdmin,
  getTenantAdmins,
  createUser,
  getUsers,
  deleteUser,
  toggleBlockUser,
  resetUserPassword,
  checkEmail,
  getProfile,
  updateProfile,
  changePassword,
  getActiveSessions,
  logoutOtherDevices,
  revokeSession
};
