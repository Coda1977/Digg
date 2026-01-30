import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";

// Create a mock query function we can control
const mockQuery = vi.fn();

// Mock the Convex client before importing the route
vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = mockQuery;
  },
}));

// Mock global fetch for Deepgram token endpoint
const originalFetch = globalThis.fetch;

import { GET as deepgramGet } from "@/app/api/deepgram/route";

function makeRequest(surveyId?: string) {
  const url = surveyId
    ? `http://localhost/api/deepgram?surveyId=${surveyId}`
    : "http://localhost/api/deepgram";
  return new Request(url, { method: "GET" });
}

describe("GET /api/deepgram", () => {
  const originalKey = process.env.DEEPGRAM_API_KEY;
  const originalConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
    // Mock the Deepgram token endpoint by default
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "temp-token-abc123",
        expires_in: 120,
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.DEEPGRAM_API_KEY;
    } else {
      process.env.DEEPGRAM_API_KEY = originalKey;
    }
    if (originalConvexUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
    } else {
      process.env.NEXT_PUBLIC_CONVEX_URL = originalConvexUrl;
    }
  });

  it("returns 400 when surveyId is missing", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    const response = await deepgramGet(makeRequest());
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/surveyId/i);
  });

  it("returns 500 when DEEPGRAM_API_KEY is missing", async () => {
    delete process.env.DEEPGRAM_API_KEY;
    mockQuery.mockResolvedValue({ status: "in_progress" });

    const response = await deepgramGet(makeRequest("valid-survey-id"));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/DEEPGRAM_API_KEY/i);
  });

  it("returns 404 when survey is not found", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    mockQuery.mockResolvedValue(null);

    const response = await deepgramGet(makeRequest("nonexistent-survey"));
    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toMatch(/not found/i);
  });

  it("returns 403 when survey is completed", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    mockQuery.mockResolvedValue({ status: "completed" });

    const response = await deepgramGet(makeRequest("completed-survey"));
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toMatch(/completed/i);
  });

  it("returns a temporary token (not the master key) for valid active survey", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    mockQuery.mockResolvedValue({ status: "in_progress" });

    const response = await deepgramGet(makeRequest("valid-survey-id"));
    expect(response.status).toBe(200);
    const payload = await response.json();
    // Should return the temporary token, NOT the master key
    expect(payload.apiKey).toBe("temp-token-abc123");
    expect(payload.apiKey).not.toBe("test-deepgram-key");
  });

  it("returns 500 when Deepgram token generation fails", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    mockQuery.mockResolvedValue({ status: "in_progress" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    }) as unknown as typeof fetch;

    const response = await deepgramGet(makeRequest("valid-survey-id"));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/token/i);
  });
});
