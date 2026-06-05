const redis = require('../config/redis');
const env = require('../config/env');
const logger = require('../utils/logger');

const OTP_KEY = (userId) => `otp:${userId}`;
const OTP_ATTEMPTS_KEY = (userId) => `otp_attempts:${userId}`;
const MAX_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeOTP(userId, otp) {
  await redis.setex(OTP_KEY(userId), env.otpExpirySeconds, otp);
  logger.debug(`OTP stored for user ${userId}`);
}

async function getOTP(userId) {
  return redis.get(OTP_KEY(userId));
}

async function verifyOTP(userId, inputOtp) {
  const attemptsKey = OTP_ATTEMPTS_KEY(userId);
  const attempts = parseInt((await redis.get(attemptsKey)) || '0', 10);

  if (attempts >= MAX_ATTEMPTS) {
    throw Object.assign(
      new Error('Maximum OTP attempts exceeded. Please request a new OTP.'),
      { statusCode: 429 }
    );
  }

  const storedOtp = await getOTP(userId);

  if (!storedOtp) {
    throw Object.assign(
      new Error('OTP has expired. Please request a new one.'),
      { statusCode: 400 }
    );
  }

  if (storedOtp !== String(inputOtp)) {
    const newAttempts = attempts + 1;
    const ttl = await redis.ttl(OTP_KEY(userId));
    await redis.setex(attemptsKey, ttl > 0 ? ttl : env.otpExpirySeconds, String(newAttempts));

    const remaining = MAX_ATTEMPTS - newAttempts;
    throw Object.assign(
      new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`),
      { statusCode: 400 }
    );
  }

  return true;
}

async function deleteOTP(userId) {
  await redis.del(OTP_KEY(userId));
  await redis.del(OTP_ATTEMPTS_KEY(userId));
  logger.debug(`OTP cleared for user ${userId}`);
}

async function generateAndStoreOTP(userId) {
  const otp = generateOTP();
  await storeOTP(userId, otp);
  return otp;
}

module.exports = { generateOTP, storeOTP, getOTP, verifyOTP, deleteOTP, generateAndStoreOTP };
