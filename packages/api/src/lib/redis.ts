import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from './logger.js';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err: err.message }));

// Convenience helpers
export const redisKeys = {
  session: (userId: string) => `session:${userId}`,
  stockCache: (variantId: string) => `stock:${variantId}`,
  rateLimitAuth: (ip: string) => `rl:auth:${ip}`,
  businessSlug: (slug: string) => `biz:slug:${slug}`,
};
