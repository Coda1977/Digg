import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { POST as analyzePost } from "@/app/api/projects/analyze/route";
import * as ratelimit from "@/lib/ratelimit";

// Mock the rate limiter module
vi.mock("@/lib/ratelimit", async () => {
  const actual = await vi.importActual<typeof ratelimit>("@/lib/ratelimit");
  return {
    ...actual,
    checkRateLimit: vi.fn(),
  };
});

const VALID_ANALYZE_BODY = {
  subjectName: "Jamie Doe",
  subjectRole: "Engineer",
  projectName: "Q4 Review",
  templateName: "360 Feedback",
  interviews: [{ respondentName: "Sam", relationshipLabel: "Peer", transcript: "Strong collaborator." }],
};

function makeJsonRequest(body: unknown, ip = "203.0.113.10") {
  return new Request("http://localhost/api/projects/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest(ip = "203.0.113.10") {
  return new Request("http://localhost/api/projects/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: "{",
  });
}

describe("POST /api/projects/analyze", () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: allow requests
    vi.mocked(ratelimit.checkRateLimit).mockResolvedValue({
      success: true,
      remaining: 4,
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
    const response = await analyzePost(makeInvalidJsonRequest());
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/Invalid JSON/i);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    const response = await analyzePost(makeJsonRequest(VALID_ANALYZE_BODY));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/ANTHROPIC_API_KEY/i);
  });

  it("rate limits after 5 requests per hour", async () => {
    // Mock rate limit exceeded
    vi.mocked(ratelimit.checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      resetMs: 1800000,
    });

    const response = await analyzePost(makeInvalidJsonRequest("203.0.113.42"));
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.error).toMatch(/Too many requests/i);
  });
});
