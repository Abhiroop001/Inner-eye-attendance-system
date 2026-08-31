import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../config/redis.js';

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  errorMessage?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowSeconds,
    maxRequests,
    keyPrefix,
    errorMessage = 'Too many requests. Please slow down and try again later.',
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown_ip',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientKey = keyGenerator(req);
      const cacheKey = `ratelimit:${keyPrefix}:${clientKey}`;

      const current = await cacheGet(cacheKey);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        res.setHeader('Retry-After', windowSeconds);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: errorMessage,
          },
          requestId: (req as any).id,
        });
        return;
      }

      if (count === 0) {
        await cacheSet(cacheKey, '1', windowSeconds);
      } else {
        await cacheSet(cacheKey, (count + 1).toString(), windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - (count + 1)));

      next();
    } catch (error) {
      // Fail open on rate limiter storage failure unless high security
      next();
    }
  };
}

// Preset standard rate limiters
export const loginRateLimiter = createRateLimiter({
  windowSeconds: 60 * 15, // 15 mins
  maxRequests: 10,
  keyPrefix: 'login',
  errorMessage: 'Maximum login attempts exceeded for this IP. Please try again after 15 minutes.',
});

export const registrationRateLimiter = createRateLimiter({
  windowSeconds: 60 * 15,
  maxRequests: 15,
  keyPrefix: 'register_request',
  errorMessage: 'Too many registration requests. Please try again in 15 minutes.',
});

export const uploadRateLimiter = createRateLimiter({
  windowSeconds: 60 * 5,
  maxRequests: 20,
  keyPrefix: 'upload',
  errorMessage: 'Upload limit reached. Please wait before uploading further documents.',
});

export const aiAssistantRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  keyPrefix: 'ai_assistant',
  errorMessage: 'AI Assistant rate limit reached. Please wait a moment before sending another prompt.',
});
