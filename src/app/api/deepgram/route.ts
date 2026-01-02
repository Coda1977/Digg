import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

/**
 * API route to provide Deepgram API key to authenticated survey sessions.
 * Validates that the survey exists and is active before returning the key.
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

    // Return the API key for valid, active surveys
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("Error validating survey:", error);
    return NextResponse.json(
      { error: "Failed to validate survey" },
      { status: 500 }
    );
  }
}
