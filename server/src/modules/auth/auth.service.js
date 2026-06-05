const bcrypt = require('bcryptjs');
const { findByEmailOrAdminId, findById, findByEmail, updatePassword } = require('../../models/userModel');
const tokenService = require('../../services/tokenService');
const otpService = require('../../services/otpService');
const emailService = require('../../services/emailService');
const { maskEmail } = require('../../utils/helpers');
const logger = require('../../utils/logger');
const env = require('../../config/env');

const IS_DEV = env.nodeEnv !== 'production';

const ALLOWED_ROLES = new Set(['Admin', 'Super Admin']);

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

  try {
    await emailService.sendOTPEmail(user.email, otp, user.name);
    logger.info(`Login OTP email sent for user ${user.id}`);
  } catch (emailErr) {
    if (!IS_DEV) throw emailErr; // production: email is required
    logger.warn(`[DEV] Email sending failed — use the OTP printed above. Error: ${emailErr.message}`);
  }

  return {
    userId: user.id,
    maskedEmail: maskEmail(user.email),
    message: IS_DEV
      ? 'OTP printed in backend console (dev mode — email not required)'
      : 'OTP sent to your registered email address',
  };
}

async function verifyOtp(userId, otp) {
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

  await tokenService.saveRefreshToken(user.id, refreshToken);
  await otpService.deleteOTP(userId);

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

module.exports = { login, verifyOtp, resendOtp, refreshAccessToken, logout, forgotPassword, resetPassword };
