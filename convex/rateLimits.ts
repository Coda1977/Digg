import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Rate limit configurations for different endpoints.
 * These match the configurations in src/lib/ratelimit.ts
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

type LimitType = keyof typeof RATE_LIMITS;

/**
 * Check and record a rate limit request.
 * Uses sliding window algorithm with persistent storage.
 *
 * Returns: { success: boolean, remaining: number, resetMs: number }
 */
export const checkRateLimit = mutation({
  args: {
    identifier: v.string(),
    limitType: v.union(
      v.literal("chat"),
      v.literal("summarize"),
      v.literal("analyze")
    ),
  },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.limitType as LimitType];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();

    // Filter timestamps to only include those within the current window
    const currentTimestamps = existing
      ? existing.timestamps.filter((ts) => ts > windowStart)
      : [];

    // Check if rate limit exceeded
    if (currentTimestamps.length >= config.maxRequests) {
      const oldestTimestamp = currentTimestamps[0];
      const resetMs = oldestTimestamp + config.windowMs - now;
      return {
        success: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }

    // Add current timestamp
    const newTimestamps = [...currentTimestamps, now];

    // Update or create the record
    if (existing) {
      await ctx.db.patch(existing._id, {
        timestamps: newTimestamps,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        identifier: args.identifier,
        timestamps: newTimestamps,
        updatedAt: now,
      });
    }

    return {
      success: true,
      remaining: config.maxRequests - newTimestamps.length,
      resetMs: config.windowMs,
    };
  },
});

/**
 * Clean up old rate limit records.
 * Call this periodically (e.g., via cron) to prevent table bloat.
 */
export const cleanupOldRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours (covers longest window)
    const cutoff = now - maxAge;

    // Get all records that haven't been updated recently
    const allRecords = await ctx.db.query("rateLimits").collect();

    let deletedCount = 0;
    for (const record of allRecords) {
      if (record.updatedAt < cutoff) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});
