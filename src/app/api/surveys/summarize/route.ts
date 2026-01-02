import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { parseAiJsonObject } from "@/lib/aiJson";
import { summarizeRequestSchema, summarySchema, validateSchema } from "@/lib/schemas";
import { INTERVIEW_SUMMARY_PROMPT } from "@/lib/reportPrompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limiting: 10 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "global";
  const rateLimit = await checkRateLimit(`summarize:${ip}`, "summarize");
  if (!rateLimit.success) {
    return createRateLimitResponse(Math.ceil(rateLimit.resetMs / 1000));
  }

  // Parse and validate request body with Zod
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let validatedData;
  try {
    validatedData = validateSchema(summarizeRequestSchema, json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const { subjectName, subjectRole, relationshipLabel, messages } = validatedData;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY on the server" },
      { status: 500 }
    );
  }

  const anthropic = createAnthropic({ apiKey });
  const model = anthropic("claude-sonnet-4-5-20250929");

  const system = INTERVIEW_SUMMARY_PROMPT;

  const roleText = subjectRole ? ` (${subjectRole})` : "";
  const relText = relationshipLabel ? relationshipLabel : "unknown relationship";
  const transcript = messages
    .map(
      (m) =>
        `${m.role === "assistant" ? "Interviewer" : "Respondent"}: ${m.content}`
    )
    .join("\n");

  const prompt = `Subject: ${subjectName}${roleText}
Relationship: ${relText}

Transcript:
${transcript}
`;

  try {
    const result = await generateText({ model, system, prompt });
    const parsed = parseAiJsonObject(result.text);
    const summary = validateSchema(summarySchema, parsed);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Summary generation failed",
      },
      { status: 500 }
    );
  }
}
