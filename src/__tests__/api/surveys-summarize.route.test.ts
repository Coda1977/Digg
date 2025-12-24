import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";

import { POST as summarizePost } from "@/app/api/surveys/summarize/route";
import { _internal } from "@/lib/ratelimit";

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
    const ip = "203.0.113.55";
    for (let i = 0; i < 10; i += 1) {
      await summarizePost(makeInvalidJsonRequest(ip));
    }

    const response = await summarizePost(makeInvalidJsonRequest(ip));
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.error).toMatch(/Too many requests/i);
  });
});
