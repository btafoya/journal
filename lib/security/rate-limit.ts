import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory store for rate limiting when Redis is not available
class MemoryStore {
  private store: Map<string, { count: number; reset: number }> = new Map();

  async increment(key: string, limit: number, window: number): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    // Clean up expired entries
    if (record && now > record.reset) {
      this.store.delete(key);
    }

    const current = this.store.get(key);

    if (!current) {
      this.store.set(key, { count: 1, reset: now + window });
      return { success: true, remaining: limit - 1 };
    }

    if (current.count >= limit) {
      return { success: false, remaining: 0 };
    }

    current.count++;
    return { success: true, remaining: limit - current.count };
  }
}

const memoryStore = new MemoryStore();

// Create rate limiter instances
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Strict rate limit for authentication endpoints (5 requests per 15 minutes)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
    })
  : null;

// Standard rate limit for API endpoints (60 requests per minute)
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
    })
  : null;

// Generous rate limit for read operations (300 requests per minute)
export const readRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '1 m'),
      analytics: true,
    })
  : null;

/**
 * Apply rate limiting to a request
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param type - Type of rate limit to apply
 * @returns Object with success status and remaining requests
 */
export async function rateLimit(
  identifier: string,
  type: 'auth' | 'api' | 'read' = 'api'
): Promise<{ success: boolean; remaining: number; reset?: Date }> {
  const limiter = type === 'auth' ? authRateLimit : type === 'read' ? readRateLimit : apiRateLimit;

  if (limiter) {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset ? new Date(result.reset) : undefined,
    };
  }

  // Fallback to in-memory rate limiting
  const limits = {
    auth: { limit: 5, window: 15 * 60 * 1000 },
    api: { limit: 60, window: 60 * 1000 },
    read: { limit: 300, window: 60 * 1000 },
  };

  const { limit, window } = limits[type];
  return await memoryStore.increment(`${type}:${identifier}`, limit, window);
}

/**
 * Get client identifier from request (IP address or user ID)
 * @param request - Next.js request object
 * @param userId - Optional user ID for authenticated requests
 * @returns Unique identifier string
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';

  return `ip:${ip}`;
}

/**
 * Create rate limit response
 * @param remaining - Remaining requests
 * @param reset - Reset time
 * @returns Response with rate limit headers
 */
export function rateLimitResponse(remaining: number, reset?: Date): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        ...(reset && { 'X-RateLimit-Reset': reset.toISOString() }),
      },
    }
  );
}
