import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

/**
 * API route to provide a short-lived Deepgram token to authenticated survey sessions.
 * Validates that the survey exists and is active, then generates a temporary JWT
 * via Deepgram's /v1/auth/grant endpoint instead of exposing the master API key.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const surveyId = url.searchParams.get("surveyId");

  // Require surveyId parameter
  if (!surveyId) {
    return NextResponse.json(
      { error: "Missing surveyId parameter" },
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Validate that the survey exists and is active
  try {
    const convex = new ConvexHttpClient(convexUrl);
    const survey = await convex.query(api.surveys.getByUniqueId, {
      uniqueId: surveyId,
    });

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Only allow voice input for surveys that are in progress
    // (not completed or not started without a relationship set)
    if (survey.status === "completed") {
      return NextResponse.json(
        { error: "Survey is already completed" },
        { status: 403 }
      );
    }

    // Generate a short-lived temporary token instead of exposing the master key.
    // TTL of 120 seconds is enough for a single voice recording session.
    const tokenResponse = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 120 }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "[DEEPGRAM] Failed to generate temporary token:",
        tokenResponse.status,
        await tokenResponse.text().catch(() => "")
      );
      return NextResponse.json(
        { error: "Failed to generate voice session token" },
        { status: 500 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
    };

    // Return the short-lived token (not the master key)
    return NextResponse.json({ apiKey: tokenData.access_token });
  } catch (error) {
    console.error("Error validating survey:", error);
    return NextResponse.json(
      { error: "Failed to validate survey" },
      { status: 500 }
    );
  }
}
