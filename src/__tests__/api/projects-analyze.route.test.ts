import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";

import { POST as analyzePost } from "@/app/api/projects/analyze/route";
import { _internal } from "@/lib/ratelimit";

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
    _internal.rateLimiter.clear();
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalAnthropicKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  });

  afterAll(() => {
    _internal.rateLimiter.destroy();
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
    const ip = "203.0.113.42";
    for (let i = 0; i < 5; i += 1) {
      await analyzePost(makeInvalidJsonRequest(ip));
    }

    const response = await analyzePost(makeInvalidJsonRequest(ip));
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.error).toMatch(/Too many requests/i);
  });
});
