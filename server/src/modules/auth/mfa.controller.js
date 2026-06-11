const { sendSuccess, sendError } = require('../../utils/helpers');
const { query } = require('../../config/database');
const otpService = require('../../services/otpService');
const smsService = require('../../services/smsService');
const mfaService = require('../../services/mfaService');
const logger = require('../../utils/logger');

/**
 * Get MFA settings for the authenticated user.
 */
async function getMFASettings(req, res) {
  const userId = req.user.id;
  const settings = await mfaService.getMFASettings(userId);
  return sendSuccess(res, {
    mfaEnabled: settings?.mfa_enabled || false,
    preferredMethod: settings?.preferred_method || 'email',
    phoneNumber: settings?.phone_number || null,
    phoneVerified: settings?.phone_verified || false,
  }, 'MFA settings retrieved');
}

/**
 * Update MFA settings.
 */
async function updateMFASettings(req, res) {
  const userId = req.user.id;
  const { mfaEnabled, preferredMethod, phoneNumber } = req.body;

  // Validate method
  const validMethods = ['email', 'sms', 'both'];
  if (preferredMethod && !validMethods.includes(preferredMethod)) {
    return sendError(res, 'Invalid preferred method. Must be email, sms, or both.', 400);
  }

  // If enabling SMS, phone number must be provided
  if ((preferredMethod === 'sms' || preferredMethod === 'both') && !phoneNumber) {
    const existing = await mfaService.getMFASettings(userId);
    if (!existing?.phone_number || !existing?.phone_verified) {
      return sendError(res, 'A verified phone number is required for SMS-based MFA.', 400);
    }
  }

  const updated = await mfaService.upsertMFASettings(userId, {
    mfaEnabled: mfaEnabled !== undefined ? mfaEnabled : true,
    preferredMethod: preferredMethod || 'email',
    phoneNumber: phoneNumber || undefined,
    phoneVerified: undefined, // Don't change verification status here
  });

  await mfaService.logAuthEvent(userId, mfaEnabled ? 'mfa_enabled' : 'mfa_disabled', {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return sendSuccess(res, {
    mfaEnabled: updated.mfa_enabled,
    preferredMethod: updated.preferred_method,
    phoneNumber: updated.phone_number,
    phoneVerified: updated.phone_verified,
  }, 'MFA settings updated');
}

/**
 * Send phone verification OTP.
 */
async function sendPhoneVerification(req, res) {
  const userId = req.user.id;
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return sendError(res, 'Phone number is required', 400);
  }

  // Validate E.164 format
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
    return sendError(res, 'Phone number must be in E.164 format (e.g. +919876543210)', 400);
  }

  const cleanPhone = phoneNumber.replace(/\s/g, '');

  // Generate and store OTP
  const otp = await otpService.generateAndStoreOTP(userId);

  // Send via SMS
  const result = await smsService.sendOTPViaSMS(cleanPhone, otp);

  if (!result.success) {
    logger.warn('Phone verification SMS failed', { userId, error: result.error });
    return sendError(res, 'Failed to send verification SMS. Please try again.', 500);
  }

  // Save phone number (unverified) in MFA settings
  await mfaService.upsertMFASettings(userId, {
    phoneNumber: cleanPhone,
    phoneVerified: false,
  });

  await mfaService.logAuthEvent(userId, 'otp_sent', {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { method: 'sms', phone: cleanPhone },
  });

  return sendSuccess(res, { phoneNumber: cleanPhone }, 'Verification OTP sent to phone');
}

/**
 * Verify phone number with OTP.
 */
async function verifyPhone(req, res) {
  const userId = req.user.id;
  const { otp } = req.body;

  if (!otp) {
    return sendError(res, 'OTP is required', 400);
  }

  try {
    await otpService.verifyOTP(userId, otp);
  } catch (err) {
    await mfaService.logAuthEvent(userId, 'otp_failed', {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method: 'phone_verification' },
    });
    return sendError(res, err.message, err.statusCode || 400);
  }

  // Mark phone as verified
  await mfaService.upsertMFASettings(userId, { phoneVerified: true });
  await otpService.deleteOTP(userId);

  await mfaService.logAuthEvent(userId, 'otp_verified', {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { method: 'phone_verification' },
  });

  return sendSuccess(res, { phoneVerified: true }, 'Phone number verified successfully');
}

/**
 * Get login audit log.
 */
async function getAuditLog(req, res) {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit || '50', 10);
  const logs = await mfaService.getAuditLog(userId, Math.min(limit, 100));
  return sendSuccess(res, { logs }, 'Audit log retrieved');
}

/**
 * Get login statistics.
 */
async function getLoginStats(req, res) {
  const userId = req.user.id;
  const stats = await mfaService.getLoginStats(userId);
  return sendSuccess(res, stats, 'Login stats retrieved');
}

module.exports = {
  getMFASettings,
  updateMFASettings,
  sendPhoneVerification,
  verifyPhone,
  getAuditLog,
  getLoginStats,
};
