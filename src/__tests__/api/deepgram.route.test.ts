import { describe, it, expect, afterEach } from "vitest";

import { GET as deepgramGet } from "@/app/api/deepgram/route";

describe("GET /api/deepgram", () => {
  const originalKey = process.env.DEEPGRAM_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.DEEPGRAM_API_KEY;
    } else {
      process.env.DEEPGRAM_API_KEY = originalKey;
    }
  });

  it("returns 500 when DEEPGRAM_API_KEY is missing", async () => {
    delete process.env.DEEPGRAM_API_KEY;
    const response = await deepgramGet();
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toMatch(/DEEPGRAM_API_KEY/i);
  });

  it("returns apiKey when configured", async () => {
    process.env.DEEPGRAM_API_KEY = "test-deepgram-key";
    const response = await deepgramGet();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.apiKey).toBe("test-deepgram-key");
  });
});
