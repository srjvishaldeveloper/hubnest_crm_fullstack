const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redis = require('../config/redis');
const { sendError } = require('../utils/helpers');

// Memory fallback limiters (used when Redis is unavailable)
const loginLimiterMemory = new RateLimiterMemory({ points: 10, duration: 60, blockDuration: 300 });
const otpLimiterMemory   = new RateLimiterMemory({ points: 5,  duration: 300, blockDuration: 300 });
const emailLimiterMemory = new RateLimiterMemory({ points: 10, duration: 60,  blockDuration: 60 });

function isRedisReady() {
  return redis.status === 'ready';
}

const loginLimiterRedis = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_login',
  points: 10,
  duration: 60,
  blockDuration: 300,
});

const otpLimiterRedis = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_otp',
  points: 5,
  duration: 300,
  blockDuration: 300,
});

const emailCheckLimiterRedis = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_email_check',
  points: 10,
  duration: 60,
  blockDuration: 60,
});

function makeRateLimitMiddleware(redisLimiter, memoryLimiter, message) {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const limiter = isRedisReady() ? redisLimiter : memoryLimiter;

    try {
      await limiter.consume(req.ip);
      next();
    } catch (err) {
      // err can be a RateLimiterRes (points exhausted) or a real Error (Redis failure)
      if (err && typeof err.msBeforeNext === 'number') {
        // Rate limit hit
        const retryAfter = Math.ceil(err.msBeforeNext / 1000);
        res.set('Retry-After', String(retryAfter));
        return sendError(res, message, 429);
      }
      // Redis operational error mid-consume — fall through to memory limiter
      try {
        await memoryLimiter.consume(req.ip);
        next();
      } catch (memErr) {
        if (memErr && typeof memErr.msBeforeNext === 'number') {
          const retryAfter = Math.ceil(memErr.msBeforeNext / 1000);
          res.set('Retry-After', String(retryAfter));
          return sendError(res, message, 429);
        }
        next(); // worst case — allow through
      }
    }
  };
}

const loginRateLimiter = makeRateLimitMiddleware(
  loginLimiterRedis,
  loginLimiterMemory,
  'Too many login attempts. Please wait before trying again.'
);

const otpRateLimiter = makeRateLimitMiddleware(
  otpLimiterRedis,
  otpLimiterMemory,
  'Too many OTP requests. Please wait 5 minutes before requesting again.'
);

const emailCheckRateLimiter = makeRateLimitMiddleware(
  emailCheckLimiterRedis,
  emailLimiterMemory,
  'Too many check attempts. Please wait 1 minute before trying again.'
);

module.exports = { loginRateLimiter, otpRateLimiter, emailCheckRateLimiter };
