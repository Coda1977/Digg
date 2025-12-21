import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * API route to provide Deepgram API key to authenticated clients
 * In production, you might want to add authentication here
 */
export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Return the API key
  // Note: In production, you should add authentication here to prevent abuse
  return NextResponse.json({ apiKey });
}
