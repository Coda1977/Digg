import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { POST as summarizePost } from "@/app/api/surveys/summarize/route";
import * as ratelimit from "@/lib/ratelimit";

// Mock the rate limiter module
vi.mock("@/lib/ratelimit", async () => {
  const actual = await vi.importActual<typeof ratelimit>("@/lib/ratelimit");
  return {
    ...actual,
    checkRateLimit: vi.fn(),
  };
});

const VALID_SUMMARY_BODY = {
  subjectName: "Jamie Doe",
  subjectRole: "Engineer",
  relationshipLabel: "Peer",
  messages: [
    { role: "user", content: "Great at cross-team communication." },
    { role: "assistant", content: "Can you share a specific example?" },
  ],
};

function makeJsonRequest(body: unknown, ip = "203.0.113.20") {
  return new Request("http://localhost/api/surveys/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest(ip = "203.0.113.20") {
  return new Request("http://localhost/api/surveys/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: "{",
  });
}

describe("POST /api/surveys/summarize", () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: allow requests
    vi.mocked(ratelimit.checkRateLimit).mockResolvedValue({
      success: true,
      remaining: 9,
      resetMs: 3600000,
    });
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalAnthropicKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await summarizePost(makeInvalidJsonRequest());
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/Invalid JSON/i);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    const response = await summarizePost(makeJsonRequest(VALID_SUMMARY_BODY));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/ANTHROPIC_API_KEY/i);
  });

  it("rate limits after 10 requests per hour", async () => {
    // Mock rate limit exceeded
    vi.mocked(ratelimit.checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      resetMs: 1800000,
    });

    const response = await summarizePost(makeInvalidJsonRequest("203.0.113.55"));
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.error).toMatch(/Too many requests/i);
  });
});
