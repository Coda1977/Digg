/**
 * Simple in-memory rate limiter using sliding window algorithm
 *
 * Note: Rate limits reset on server restart. For production-grade
 * rate limiting across multiple instances, use Upstash Redis.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up old records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP, survey ID)
   * @param config - Rate limit configuration
   * @returns {success: boolean, remaining: number, resetMs: number}
   */
  check(
    identifier: string,
    config: RateLimitConfig
  ): { success: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create request record
    let record = this.requests.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.requests.set(identifier, record);
    }

    // Remove timestamps outside the current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    // Check if rate limit exceeded
    if (record.timestamps.length >= config.maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const resetMs = oldestTimestamp + config.windowMs - now;
      return {
        success: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }

    // Add current timestamp
    record.timestamps.push(now);

    return {
      success: true,
      remaining: config.maxRequests - record.timestamps.length,
      resetMs: config.windowMs,
    };
  }

  /**
   * Clean up old records to prevent memory leaks
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [identifier, record] of this.requests.entries()) {
      // Remove records with no recent activity
      if (
        record.timestamps.length === 0 ||
        record.timestamps[record.timestamps.length - 1] < now - maxAge
      ) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Clear all rate limit records (useful for testing)
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
const RATE_LIMITS = {
  chat: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },
  summarize: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
  },
  analyze: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 requests per hour
  },
} as const;

/**
 * Check rate limit for an identifier
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
) {
  return rateLimiter.check(identifier, RATE_LIMITS[limitType]);
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": "See documentation",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// Export for testing
export const _internal = {
  rateLimiter,
};
