const logger = require('../utils/logger');

let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    logger.warn('Twilio credentials not configured. SMS will not be sent.');
    return null;
  }
  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch (err) {
    logger.error('Failed to initialize Twilio client', { message: err.message });
    return null;
  }
}

// ── DB helper (lazy-require to avoid circular deps) ────────────────────────
async function logSms({ userId = null, phoneNumber, messageType, status, providerSid = null, errorMessage = null, metadata = {} }) {
  try {
    const { query } = require('../config/database');
    await query(
      `INSERT INTO sms_logs (user_id, phone_number, message_type, status, provider, provider_sid, error_message, metadata)
       VALUES ($1, $2, $3, $4, 'twilio', $5, $6, $7)`,
      [userId, phoneNumber, messageType, status, providerSid, errorMessage, JSON.stringify(metadata)]
    );
  } catch (err) {
    logger.warn('Failed to write SMS log', { message: err.message });
  }
}

async function updateSmsLogDelivered(providerSid) {
  try {
    const { query } = require('../config/database');
    await query(
      `UPDATE sms_logs SET status = 'delivered', delivered_at = NOW() WHERE provider_sid = $1`,
      [providerSid]
    );
  } catch (err) {
    logger.warn('Failed to update SMS log delivery', { message: err.message });
  }
}

// ── Redis rate-limit helper ────────────────────────────────────────────────
async function checkSmsRateLimit(phoneNumber, limitPerHour = 10) {
  try {
    const redis = require('../config/redis');
    if (!redis) return { allowed: true };

    const key   = `sms_rate:${phoneNumber}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);

    if (count > limitPerHour) {
      logger.warn('SMS rate limit exceeded', { phone: phoneNumber, count });
      return { allowed: false, count };
    }
    return { allowed: true, count };
  } catch (err) {
    logger.warn('SMS rate limit check failed, allowing', { message: err.message });
    return { allowed: true };
  }
}

// ── Normalize phone to E.164 ───────────────────────────────────────────────
function normalizePhone(phone, countryCode = '+91') {
  if (!phone) return null;
  let p = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (p.startsWith('+')) return p;
  if (p.startsWith('00')) return '+' + p.slice(2);
  // Strip leading 0 for local numbers
  if (p.startsWith('0')) p = p.slice(1);
  return countryCode + p;
}

// ── Core: send a raw SMS ───────────────────────────────────────────────────
async function sendSMS(to, body, { userId = null, messageType = 'custom' } = {}) {
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number' };
  }

  const client = getTwilioClient();
  if (!client) {
    logger.warn('SMS not sent — Twilio not configured', { to: normalizedTo });
    await logSms({ userId, phoneNumber: normalizedTo, messageType, status: 'failed', errorMessage: 'Twilio not configured' });
    return { success: false, error: 'Twilio not configured' };
  }

  // Rate limiting
  const rl = await checkSmsRateLimit(normalizedTo);
  if (!rl.allowed) {
    await logSms({ userId, phoneNumber: normalizedTo, messageType, status: 'failed', errorMessage: 'Rate limit exceeded' });
    return { success: false, error: 'SMS rate limit exceeded. Try again later.' };
  }

  try {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber          = process.env.TWILIO_PHONE_NUMBER;

    const payload = { to: normalizedTo, body };
    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (fromNumber) {
      payload.from = fromNumber;
    } else {
      // Use verify service SID as fallback sender (Twilio alphanumeric)
      payload.from = process.env.TWILIO_VERIFY_SERVICE_SID;
    }

    const message = await client.messages.create(payload);
    logger.info('SMS sent', { sid: message.sid, to: normalizedTo, type: messageType });
    await logSms({ userId, phoneNumber: normalizedTo, messageType, status: 'sent', providerSid: message.sid });

    return { success: true, sid: message.sid };
  } catch (err) {
    logger.error('Failed to send SMS', { to: normalizedTo, message: err.message, code: err.code });
    await logSms({ userId, phoneNumber: normalizedTo, messageType, status: 'failed', errorMessage: err.message });
    return { success: false, error: err.message };
  }
}

// ── OTP via Twilio Verify service ─────────────────────────────────────────
async function sendOTPViaSMS(phone, { userId = null, channel = 'sms' } = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { success: false, error: 'Invalid phone number' };

  const client     = getTwilioClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!client || !serviceSid) {
    logger.warn('Twilio Verify not configured', { phone: normalizedPhone });
    await logSms({ userId, phoneNumber: normalizedPhone, messageType: 'otp_login', status: 'failed', errorMessage: 'Twilio Verify not configured' });
    return { success: false, error: 'Twilio Verify not configured' };
  }

  const rl = await checkSmsRateLimit(normalizedPhone);
  if (!rl.allowed) {
    return { success: false, error: 'OTP rate limit exceeded. Try again later.' };
  }

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: normalizedPhone, channel });

    logger.info('Twilio Verify OTP sent', { sid: verification.sid, to: normalizedPhone });
    await logSms({ userId, phoneNumber: normalizedPhone, messageType: 'otp_login', status: 'sent', providerSid: verification.sid });

    return { success: true, sid: verification.sid };
  } catch (err) {
    logger.error('Failed to send Twilio Verify OTP', { to: normalizedPhone, message: err.message });
    await logSms({ userId, phoneNumber: normalizedPhone, messageType: 'otp_login', status: 'failed', errorMessage: err.message });
    return { success: false, error: err.message };
  }
}

// ── Verify OTP via Twilio Verify ──────────────────────────────────────────
async function verifyOTPViaSMS(phone, code) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { success: false, error: 'Invalid phone number' };

  const client     = getTwilioClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!client || !serviceSid) return { success: false, error: 'Twilio Verify not configured' };

  try {
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: normalizedPhone, code });

    if (check.status === 'approved') {
      logger.info('Twilio OTP approved', { to: normalizedPhone });
      return { success: true, status: 'approved' };
    }
    logger.warn('Twilio OTP rejected', { to: normalizedPhone, status: check.status });
    return { success: false, status: check.status, error: 'Invalid or expired OTP' };
  } catch (err) {
    logger.error('Twilio OTP check failed', { to: normalizedPhone, message: err.message });
    return { success: false, error: err.message };
  }
}

// ── Send OTP with email fallback ──────────────────────────────────────────
async function sendOTPWithFallback(phone, email, otp, userName, { userId = null } = {}) {
  if (phone) {
    // Try plain SMS first (uses our Redis OTP, not Twilio Verify)
    const smsResult = await sendSMS(
      phone,
      `Your HubNest CRM verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      { userId, messageType: 'otp_login' }
    );
    if (smsResult.success) return { method: 'sms', success: true };
    logger.warn('SMS OTP failed, falling back to email', { phone, error: smsResult.error });
  }

  if (email) {
    try {
      const emailService = require('./emailService');
      await emailService.sendOTPEmail(email, otp, userName);
      return { method: 'email', success: true };
    } catch (err) {
      logger.error('Email OTP fallback also failed', { email, message: err.message });
      return { method: 'email', success: false, error: err.message };
    }
  }

  return { method: 'none', success: false, error: 'No delivery channel available' };
}

// ── Send credentials via SMS ──────────────────────────────────────────────
async function sendCredentialsSMS(phone, { email, password, adminId, companyName, loginUrl, role, userId = null } = {}) {
  const url = loginUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/auth/login` : 'https://app.hubnestcrm.com/auth/login');
  const body =
    `Welcome to ${companyName}!\n\n` +
    `Your HubNest CRM login credentials:\n` +
    `Email: ${email}\n` +
    (adminId ? `Login ID: ${adminId}\n` : '') +
    `Password: ${password}\n` +
    (role ? `Role: ${role}\n` : '') +
    `\nLogin: ${url}\n\n` +
    `Please change your password after first login.`;

  return sendSMS(phone, body, { userId, messageType: 'credentials' });
}

// ── Send phone verification OTP (for profile phone verification) ──────────
async function sendPhoneVerificationOTP(phone, otp, { userId = null } = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { success: false, error: 'Invalid phone number' };

  return sendSMS(
    normalizedPhone,
    `Your HubNest CRM phone verification code is: ${otp}. Valid for 5 minutes.`,
    { userId, messageType: 'verification' }
  );
}

// ── Get SMS logs from DB ──────────────────────────────────────────────────
async function getSmsLogs({ limit = 50, offset = 0, status = null, messageType = null } = {}) {
  try {
    const { query } = require('../config/database');
    const conditions = [];
    const params     = [];

    if (status) {
      params.push(status);
      conditions.push(`sl.status = $${params.length}`);
    }
    if (messageType) {
      params.push(messageType);
      conditions.push(`sl.message_type = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT sl.id, sl.phone_number, sl.message_type, sl.status, sl.provider,
              sl.provider_sid, sl.sent_at, sl.delivered_at, sl.error_message,
              u.name AS user_name, u.email AS user_email
       FROM sms_logs sl
       LEFT JOIN users u ON u.id = sl.user_id
       ${where}
       ORDER BY sl.sent_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return result.rows;
  } catch (err) {
    logger.error('Failed to get SMS logs', { message: err.message });
    return [];
  }
}

// ── Get SMS stats for dashboard widget ───────────────────────────────────
async function getSmsStats() {
  try {
    const { query } = require('../config/database');
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '24 hours')                    AS sent_today,
        COUNT(*) FILTER (WHERE status = 'delivered' AND sent_at >= NOW() - INTERVAL '24 hours') AS delivered_today,
        COUNT(*) FILTER (WHERE status = 'failed' AND sent_at >= NOW() - INTERVAL '24 hours')    AS failed_today,
        COUNT(*) FILTER (WHERE message_type = 'otp_login' AND sent_at >= NOW() - INTERVAL '24 hours') AS otp_today,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE status = 'delivered') /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('sent','delivered')), 0), 1
        ) AS delivery_rate
      FROM sms_logs
    `);
    return result.rows[0];
  } catch (err) {
    logger.error('Failed to get SMS stats', { message: err.message });
    return { sent_today: 0, delivered_today: 0, failed_today: 0, otp_today: 0, delivery_rate: 0 };
  }
}

// ── Get/update SMS settings ───────────────────────────────────────────────
async function getSmsSettings() {
  try {
    const { query } = require('../config/database');
    const result = await query('SELECT * FROM sms_settings LIMIT 1');
    return result.rows[0] || null;
  } catch (err) {
    logger.error('Failed to get SMS settings', { message: err.message });
    return null;
  }
}

async function updateSmsSettings(settings, updatedBy = null) {
  try {
    const { query } = require('../config/database');
    const { otp_expiry_secs, max_otp_attempts, rate_limit_per_hour, is_enabled, templates, sender_id } = settings;

    await query(
      `UPDATE sms_settings SET
         otp_expiry_secs     = COALESCE($1, otp_expiry_secs),
         max_otp_attempts    = COALESCE($2, max_otp_attempts),
         rate_limit_per_hour = COALESCE($3, rate_limit_per_hour),
         is_enabled          = COALESCE($4, is_enabled),
         templates           = COALESCE($5, templates),
         sender_id           = COALESCE($6, sender_id),
         updated_at          = NOW(),
         updated_by          = $7`,
      [otp_expiry_secs, max_otp_attempts, rate_limit_per_hour, is_enabled,
       templates ? JSON.stringify(templates) : null, sender_id, updatedBy]
    );
    return { success: true };
  } catch (err) {
    logger.error('Failed to update SMS settings', { message: err.message });
    return { success: false, error: err.message };
  }
}

// ── Test SMS (send a test message from admin panel) ───────────────────────
async function sendTestSMS(phone, message, { userId = null } = {}) {
  return sendSMS(phone, message || 'This is a test message from HubNest CRM.', { userId, messageType: 'custom' });
}

module.exports = {
  sendSMS,
  sendOTPViaSMS,
  verifyOTPViaSMS,
  sendOTPWithFallback,
  sendCredentialsSMS,
  sendPhoneVerificationOTP,
  getSmsLogs,
  getSmsStats,
  getSmsSettings,
  updateSmsSettings,
  sendTestSMS,
  normalizePhone,
  logSms,
  updateSmsLogDelivered,
};
