const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../config/redis');
const { sendError } = require('../utils/helpers');

const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_login',
  points: 10,
  duration: 60,
  blockDuration: 300,
});

const otpLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_otp',
  points: 5,
  duration: 300,
  blockDuration: 300,
});

function makeRateLimitMiddleware(limiter, message) {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    try {
      await limiter.consume(req.ip);
      next();
    } catch (err) {
      const retryAfter = Math.ceil((err.msBeforeNext || 1000) / 1000);
      res.set('Retry-After', String(retryAfter));
      return sendError(res, message, 429);
    }
  };
}

const loginRateLimiter = makeRateLimitMiddleware(
  loginLimiter,
  'Too many login attempts. Please wait before trying again.'
);

const otpRateLimiter = makeRateLimitMiddleware(
  otpLimiter,
  'Too many OTP requests. Please wait 5 minutes before requesting again.'
);

const emailCheckLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_email_check',
  points: 10,
  duration: 60,
  blockDuration: 60,
});

const emailCheckRateLimiter = makeRateLimitMiddleware(
  emailCheckLimiter,
  'Too many check attempts. Please wait 1 minute before trying again.'
);

module.exports = { loginRateLimiter, otpRateLimiter, emailCheckRateLimiter };
