import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";

import { POST as chatPost } from "@/app/api/chat/route";
import { _internal } from "@/lib/ratelimit";

const VALID_CHAT_BODY = {
  uniqueId: "survey_123",
  messages: [{ role: "user", content: "Hello there" }],
};

function makeJsonRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest() {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
}

describe("POST /api/chat", () => {
  const originalConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    _internal.rateLimiter.clear();
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalConvexUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
    } else {
      process.env.NEXT_PUBLIC_CONVEX_URL = originalConvexUrl;
    }

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
    const response = await chatPost(makeInvalidJsonRequest());
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/Invalid JSON/i);
  });

  it("returns 400 for schema violations", async () => {
    const response = await chatPost(
      makeJsonRequest({
        uniqueId: "survey_123",
        messages: [{ role: "user", content: "" }],
      })
    );
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/Validation failed/i);
  });

  it("returns 500 when Convex URL is missing", async () => {
    const response = await chatPost(makeJsonRequest(VALID_CHAT_BODY));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/NEXT_PUBLIC_CONVEX_URL/i);
  });

  it("rate limits after 60 requests per survey", async () => {
    for (let i = 0; i < 60; i += 1) {
      await chatPost(makeJsonRequest(VALID_CHAT_BODY));
    }

    const response = await chatPost(makeJsonRequest(VALID_CHAT_BODY));
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.error).toMatch(/Too many requests/i);
  });
});
