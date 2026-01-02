/**
 * Rate limiter using Convex for persistent storage.
 *
 * This implementation stores rate limit records in Convex, ensuring
 * rate limits persist across serverless cold starts and work correctly
 * in distributed environments like Vercel.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

type LimitType = "chat" | "summarize" | "analyze";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

// Lazy-initialized Convex client
let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

/**
 * Check rate limit for an identifier using Convex persistent storage.
 * This is async because it makes a database call.
 */
export async function checkRateLimit(
  identifier: string,
  limitType: LimitType
): Promise<RateLimitResult> {
  try {
    const client = getConvexClient();
    const result = await client.mutation(api.rateLimits.checkRateLimit, {
      identifier,
      limitType,
    });
    return result;
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("Rate limit check failed:", error);
    return {
      success: true,
      remaining: 1,
      resetMs: 0,
    };
  }
}

/**
 * Create a rate limit response (429 Too Many Requests)
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
