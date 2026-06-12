const bcrypt = require('bcryptjs');
const { findByEmailOrAdminId, findById, findByEmail, findByPhone, updatePassword } = require('../../models/userModel');
const tokenService = require('../../services/tokenService');
const otpService = require('../../services/otpService');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');
const mfaService = require('../../services/mfaService');
const { verifyGoogleToken } = require('../../services/googleAuthService');
const { maskEmail } = require('../../utils/helpers');
const logger = require('../../utils/logger');
const env = require('../../config/env');

const IS_DEV = env.nodeEnv !== 'production';

const ALLOWED_ROLES = new Set([
  'Super Admin',
  'Admin',
  'Sales Manager',
  'Sales Executive',
  'Marketing Head',
  'Marketing Executive',
  'Support Manager',
  'Support Agent',
  'Finance Executive',
  'Finance Manager',
  'Accountant',
  'Auditor'
]);

async function login(emailOrAdminId, password) {
  const user = await findByEmailOrAdminId(emailOrAdminId);

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is inactive or suspended. Contact your administrator.'), { statusCode: 403 });
  }

  if (!ALLOWED_ROLES.has(user.role_name)) {
    throw Object.assign(new Error('Access denied. Insufficient privileges to login.'), { statusCode: 403 });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const otp = await otpService.generateAndStoreOTP(user.id);

  // In dev mode: always print OTP to console for easy testing.
  // In production: email failure is fatal.
  if (IS_DEV) {
    logger.warn(`\n${'='.repeat(50)}\n[DEV] OTP for ${user.email}: ${otp}\n${'='.repeat(50)}`);
  }

  // Send OTP to both email and phone number (if available)
  let otpMethod = 'email';
  try {
    await emailService.sendOTPEmail(user.email, otp, user.name);
    logger.info(`Login OTP email sent for user ${user.id}`);
  } catch (emailErr) {
    logger.error(`Failed to send login OTP email: ${emailErr.message}`);
    if (!IS_DEV) throw emailErr;
  }

  let phone = user.phone;
  try {
    const mfaSettings = await mfaService.getMFASettings(user.id);
    if (mfaSettings && mfaSettings.phone_number) {
      phone = mfaSettings.phone_number;
    }
  } catch (mfaErr) {
    logger.warn(`MFA settings check failed for user ${user.id}: ${mfaErr.message}`);
  }

  if (phone) {
    try {
      const smsResult = await smsService.sendSMS(phone, `Your HubNest CRM verification code is: ${otp}`);
      if (smsResult.success) {
        logger.info(`Login OTP SMS sent to ${phone} for user ${user.id}`);
        otpMethod = 'both';
      }
    } catch (smsErr) {
      logger.error(`Failed to send OTP SMS to ${phone} for user ${user.id}: ${smsErr.message}`);
    }
  }

  // Log login attempt
  try {
    await mfaService.logAuthEvent(user.id, 'login_attempt', {
      metadata: { method: otpMethod },
    });
  } catch (e) { /* audit table may not exist yet */ }

  return {
    userId: user.id,
    maskedEmail: maskEmail(user.email),
    otpMethod,
    message: IS_DEV
      ? 'OTP printed in backend console (dev mode — email not required)'
      : `OTP sent via ${otpMethod}`,
  };
}

async function verifyOtp(userId, otp, ipAddress = null, userAgent = null) {
  await otpService.verifyOTP(userId, otp);

  const user = await findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    roleId: user.role_id,
    role: user.role_name,
    roleName: user.role_name,
    schemaName: user.schema_name,
  };

  const accessToken = tokenService.generateAccessToken(tokenPayload);
  const refreshToken = tokenService.generateRefreshToken({ userId: user.id });

  await tokenService.saveRefreshToken(user.id, refreshToken, ipAddress, userAgent);
  await otpService.deleteOTP(userId);

  // Log successful login
  try {
    await mfaService.logAuthEvent(user.id, 'login_success', {
      ipAddress,
      userAgent,
    });
  } catch (e) { /* audit table may not exist yet */ }

  logger.info(`User authenticated: ${user.id}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      adminId: user.admin_id,
      role: user.role_name,
      permissions: user.permissions,
      tenantId: user.tenant_id,
    },
  };
}

async function resendOtp(userId) {
  const user = await findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is inactive or suspended.'), { statusCode: 403 });
  }

  const otp = await otpService.generateAndStoreOTP(user.id);

  if (IS_DEV) {
    logger.warn(`\n${'='.repeat(50)}\n[DEV] Resend OTP for ${user.email}: ${otp}\n${'='.repeat(50)}`);
  }

  try {
    await emailService.sendOTPEmail(user.email, otp, user.name);
    logger.info(`Resend OTP email sent for user ${user.id}`);
  } catch (emailErr) {
    if (!IS_DEV) throw emailErr;
    logger.warn(`[DEV] Email sending failed — use the OTP printed above. Error: ${emailErr.message}`);
  }

  return {
    userId: user.id,
    maskedEmail: maskEmail(user.email),
    message: IS_DEV
      ? 'OTP printed in backend console (dev mode — email not required)'
      : 'A new OTP has been sent to your registered email address',
  };
}

async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const stored = await tokenService.findRefreshToken(refreshToken);
  if (!stored) {
    throw Object.assign(new Error('Refresh token is invalid or has been revoked'), { statusCode: 401 });
  }

  const user = await findById(decoded.userId);
  if (!user || user.status !== 'Active') {
    throw Object.assign(new Error('User not found or account inactive'), { statusCode: 401 });
  }

  const accessToken = tokenService.generateAccessToken({
    userId: user.id,
    tenantId: user.tenant_id,
    roleId: user.role_id,
    role: user.role_name,
    roleName: user.role_name,
    schemaName: user.schema_name,
  });

  return { accessToken };
}

async function logout(refreshToken) {
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
  logger.info('User logged out');
}

async function forgotPassword(email) {
  const user = await findByEmail(email);

  // Always return the same message to prevent email enumeration
  if (!user || user.status !== 'Active') {
    return { message: 'If an account with this email exists, an OTP has been sent.' };
  }

  const otp = await otpService.generateAndStoreOTP(user.id);

  if (IS_DEV) {
    logger.warn(`\n${'='.repeat(50)}\n[DEV] Password reset OTP for ${user.email}: ${otp}\n${'='.repeat(50)}`);
  }

  try {
    await emailService.sendPasswordResetEmail(user.email, otp, user.name);
  } catch (emailErr) {
    if (!IS_DEV) throw emailErr;
    logger.warn(`[DEV] Reset email failed — use OTP above. Error: ${emailErr.message}`);
  }

  logger.info(`Password reset OTP sent for user ${user.id}`);

  return {
    userId: user.id,
    message: 'If an account with this email exists, an OTP has been sent.',
  };
}

async function resetPassword(email, otp, newPassword) {
  const user = await findByEmail(email);
  if (!user) {
    throw Object.assign(new Error('Invalid request'), { statusCode: 400 });
  }

  await otpService.verifyOTP(user.id, otp);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updatePassword(user.id, passwordHash);
  await otpService.deleteOTP(user.id);
  await tokenService.revokeAllUserTokens(user.id);

  logger.info(`Password reset completed for user ${user.id}`);

  return { message: 'Password reset successful. Please login with your new password.' };
}

// ── Phone-based OTP login ──────────────────────────────────────────────────
// ── Phone OTP helpers (Fast2SMS flow) ─────────────────────────────────────

// Redis key helpers — phone-scoped, separate from userId-based OTP keys
const PHONE_OTP_KEY      = (phone) => `phone_otp:${phone}`;
const PHONE_OTP_REQ_KEY  = (phone) => `phone_otp_req:${phone}`;
const PHONE_OTP_TRY_KEY  = (phone) => `phone_otp_try:${phone}`;
const PHONE_OTP_TTL      = 300;  // 5 minutes
const PHONE_OTP_REQ_TTL  = 600;  // 10 minute window for rate limit
const MAX_OTP_REQUESTS   = 3;    // max sends per 10 min
const MAX_OTP_TRIES      = 3;    // max verify attempts per OTP

async function sendPhoneOtp(phone) {
  // Validate 10-digit Indian number (accepts bare 10 digits or +91 prefixed)
  const bare = phone.replace(/\s+/g, '').replace(/^(\+91|91)/, '');
  if (!/^\d{10}$/.test(bare)) {
    throw Object.assign(new Error('Enter a valid 10-digit Indian mobile number'), { statusCode: 400 });
  }

  const normalizedPhone = `+91${bare}`;

  const user = await findByPhone(normalizedPhone);
  if (!user) {
    throw Object.assign(new Error('No account found with this phone number'), { statusCode: 404 });
  }
  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is inactive or suspended. Contact your administrator.'), { statusCode: 403 });
  }
  if (!ALLOWED_ROLES.has(user.role_name)) {
    throw Object.assign(new Error('Access denied. Insufficient privileges to login.'), { statusCode: 403 });
  }

  // Rate limit: max 3 OTP sends per phone per 10 minutes
  const redis = require('../../config/redis');
  const reqCount = parseInt((await redis.get(PHONE_OTP_REQ_KEY(bare))) || '0', 10);
  if (reqCount >= MAX_OTP_REQUESTS) {
    throw Object.assign(
      new Error('Too many OTP requests. Please wait 10 minutes before trying again.'),
      { statusCode: 429 }
    );
  }
  const newReqCount = await redis.incr(PHONE_OTP_REQ_KEY(bare));
  if (newReqCount === 1) await redis.expire(PHONE_OTP_REQ_KEY(bare), PHONE_OTP_REQ_TTL);

  // Generate OTP, store in Redis
  const crypto = require('crypto');
  const otp = crypto.randomInt(100000, 999999).toString();
  await redis.set(PHONE_OTP_KEY(bare), otp, 'EX', PHONE_OTP_TTL);
  // Clear previous attempt counter when fresh OTP is issued
  await redis.del(PHONE_OTP_TRY_KEY(bare));

  // Send via Fast2SMS
  await smsService.sendOTPFast2SMS(bare, otp);

  try {
    await mfaService.logAuthEvent(user.id, 'otp_sent', { metadata: { method: 'phone_fast2sms' } });
  } catch (e) { /* audit optional */ }

  logger.info(`Phone OTP sent via Fast2SMS to ${bare}`);

  return {
    userId: user.id,
    maskedPhone: maskPhone(normalizedPhone),
    message: 'OTP sent to your phone number',
  };
}

async function loginWithPhone(phone, otp, ipAddress = null, userAgent = null) {
  const bare = phone.replace(/\s+/g, '').replace(/^(\+91|91)/, '');
  if (!/^\d{10}$/.test(bare)) {
    throw Object.assign(new Error('Enter a valid 10-digit Indian mobile number'), { statusCode: 400 });
  }
  const normalizedPhone = `+91${bare}`;

  const user = await findByPhone(normalizedPhone);
  if (!user) {
    throw Object.assign(new Error('Invalid phone number or OTP'), { statusCode: 401 });
  }

  const redis = require('../../config/redis');

  // Check attempt limit (max 3 wrong OTPs before lockout)
  const tryKey  = PHONE_OTP_TRY_KEY(bare);
  const tries   = parseInt((await redis.get(tryKey)) || '0', 10);
  if (tries >= MAX_OTP_TRIES) {
    throw Object.assign(
      new Error('Too many failed attempts. Please request a new OTP.'),
      { statusCode: 429 }
    );
  }

  // Fetch stored OTP
  const stored = await redis.get(PHONE_OTP_KEY(bare));
  if (!stored) {
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { statusCode: 400 });
  }

  if (String(otp).trim() !== stored) {
    // Increment attempt counter with same TTL as the OTP key
    const ttl = await redis.ttl(PHONE_OTP_KEY(bare));
    await redis.set(tryKey, String(tries + 1), 'EX', ttl > 0 ? ttl : PHONE_OTP_TTL);
    const remaining = MAX_OTP_TRIES - (tries + 1);
    throw Object.assign(
      new Error(`Invalid OTP.${remaining > 0 ? ` ${remaining} attempt(s) remaining.` : ' Please request a new OTP.'}`),
      { statusCode: 400 }
    );
  }

  // OTP matched — clean up keys
  await redis.del(PHONE_OTP_KEY(bare));
  await redis.del(PHONE_OTP_TRY_KEY(bare));

  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    roleId: user.role_id,
    role: user.role_name,
    roleName: user.role_name,
    schemaName: user.schema_name,
  };

  const accessToken  = tokenService.generateAccessToken(tokenPayload);
  const refreshToken = tokenService.generateRefreshToken({ userId: user.id });

  await tokenService.saveRefreshToken(user.id, refreshToken, ipAddress, userAgent);

  try {
    await mfaService.logAuthEvent(user.id, 'login_success', { ipAddress, userAgent, metadata: { method: 'phone_fast2sms' } });
  } catch (e) { /* audit optional */ }

  logger.info(`Phone OTP login successful (Fast2SMS): ${user.id}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      adminId: user.admin_id,
      role: user.role_name,
      permissions: user.permissions,
      tenantId: user.tenant_id,
    },
  };
}

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  const visible = phone.slice(-4);
  return phone.slice(0, phone.length - 8).replace(/./g, '*') + '****' + visible;
}

// ── Google OAuth login ────────────────────────────────────────────────────────
async function loginWithGoogle(idToken, ipAddress = null, userAgent = null) {
  if (!env.googleClientId) {
    throw Object.assign(new Error('Google OAuth is not configured on this server'), { statusCode: 503 });
  }

  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.emailVerified) {
    throw Object.assign(new Error('Google account email is not verified'), { statusCode: 401 });
  }

  // The DB is the sole gatekeeper — if this email exists with an Active status and
  // a valid RBAC role, they are authorised. No separate env allowlist needed.
  const user = await findByEmail(googleUser.email);
  if (!user) {
    throw Object.assign(
      new Error('No CRM account found for this Google email. Contact your administrator.'),
      { statusCode: 404 }
    );
  }

  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is inactive or suspended. Contact your administrator.'), { statusCode: 403 });
  }

  if (!ALLOWED_ROLES.has(user.role_name)) {
    throw Object.assign(new Error('Access denied. Insufficient privileges to login.'), { statusCode: 403 });
  }

  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    roleId: user.role_id,
    role: user.role_name,
    roleName: user.role_name,
    schemaName: user.schema_name,
  };

  const accessToken  = tokenService.generateAccessToken(tokenPayload);
  const refreshToken = tokenService.generateRefreshToken({ userId: user.id });

  await tokenService.saveRefreshToken(user.id, refreshToken, ipAddress, userAgent);

  try {
    await mfaService.logAuthEvent(user.id, 'login_success', {
      ipAddress,
      userAgent,
      metadata: { method: 'google_oauth' },
    });
  } catch (e) { /* audit optional */ }

  logger.info(`Google OAuth login: ${user.id} (${user.email})`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      adminId: user.admin_id,
      role: user.role_name,
      permissions: user.permissions,
      tenantId: user.tenant_id,
    },
  };
}

module.exports = { login, verifyOtp, resendOtp, refreshAccessToken, logout, forgotPassword, resetPassword, sendPhoneOtp, loginWithPhone, loginWithGoogle };
