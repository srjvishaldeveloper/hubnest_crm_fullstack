const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redis = new Redis(env.redisUrl, {
  retryStrategy: (times) => Math.min(times * 100, 10000),
  enableReadyCheck: true,
  maxRetriesPerRequest: 1,
  lazyConnect: false,
  enableOfflineQueue: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.error('Redis error', { message: err.message }));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));
redis.on('close', () => logger.warn('Redis connection closed'));

module.exports = redis;
