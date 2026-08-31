import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// In-memory fallback cache if Redis instance is not reachable
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

function formatRedisUrl(rawUrl: string, token?: string): string {
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    const cleanHost = rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (token) {
      return `rediss://default:${token}@${cleanHost}:6379`;
    }
    return `redis://${cleanHost}:6379`;
  }
  return rawUrl;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    const connectionUrl = formatRedisUrl(env.REDIS_URL, env.REDIS_TOKEN);

    redisClient = new Redis(connectionUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times: number) {
        if (times > 3) {
          isRedisAvailable = false;
          return null; // Stop retrying on initial offline
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Redis connected successfully to:', redisClient?.options.host || 'remote');
    });

    redisClient.on('error', (err: any) => {
      isRedisAvailable = false;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ Redis connection notice:', err.message || 'using memory fallback');
      }
    });
  }

  return redisClient;
}

export async function initRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
    isRedisAvailable = true;
    console.log('✅ Redis initialized and ready');
  } catch (err) {
    isRedisAvailable = false;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (e) {
      isRedisAvailable = false;
    }
  }

  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch (e) {
      isRedisAvailable = false;
    }
  }

  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

export async function cacheDel(key: string): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (e) {
      isRedisAvailable = false;
    }
  }
  memoryStore.delete(key);
}

export async function acquireLock(lockKey: string, ttlSeconds = 10): Promise<boolean> {
  const fullKey = `lock:${lockKey}`;
  if (isRedisAvailable && redisClient) {
    try {
      const result = await redisClient.set(fullKey, 'locked', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (e) {
      isRedisAvailable = false;
    }
  }

  const existing = memoryStore.get(fullKey);
  if (existing && (!existing.expiresAt || Date.now() < existing.expiresAt)) {
    return false;
  }
  memoryStore.set(fullKey, { value: 'locked', expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function releaseLock(lockKey: string): Promise<void> {
  await cacheDel(`lock:${lockKey}`);
}

export async function cacheFlush(): Promise<{ flushedKeysCount: number }> {
  let count = 0;
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys('*');
      count = keys.length;
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (e) {
      try {
        await redisClient.flushdb();
      } catch (err) {}
    }
  }
  count = Math.max(count, memoryStore.size);
  memoryStore.clear();
  return { flushedKeysCount: count };
}
