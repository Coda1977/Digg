import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { parseAiJsonObject } from "@/lib/aiJson";
import { analyzeRequestSchema, summarySchema, validateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limiting: 5 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "global";
  const rateLimit = checkRateLimit(`analyze:${ip}`, "analyze");
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
    validatedData = validateSchema(analyzeRequestSchema, json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const { subjectName, subjectRole, projectName, templateName, interviews } = validatedData;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY on the server" },
      { status: 500 }
    );
  }

  const anthropic = createAnthropic({ apiKey });
  const model = anthropic("claude-3-5-haiku-latest");

  const system = `You are an expert 360-feedback analyst.
Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "overview": string,
  "keyThemes": string[],
  "sentiment": "positive" | "mixed" | "negative",
  "specificPraise": string[],
  "areasForImprovement": string[]
}

Guidelines:
- Aggregate across all interviews; focus on patterns and repeated signals.
- Be specific and actionable.
- Keep each array 3-7 items max.
- Do not include personally identifying details about respondents.`;

  const roleText = subjectRole ? ` (${subjectRole})` : "";
  const headerParts = [
    `Subject: ${subjectName}${roleText}`,
    projectName ? `Project: ${projectName}` : null,
    templateName ? `Protocol: ${templateName}` : null,
    `Interviews: ${interviews.length}`,
  ].filter(Boolean);

  const interviewText = interviews
    .map((i, idx) => {
      const who = i.respondentName ? i.respondentName : `Respondent ${idx + 1}`;
      const rel = i.relationshipLabel ? ` (${i.relationshipLabel})` : "";
      return `--- Interview ${idx + 1}: ${who}${rel} ---\n${i.transcript}`;
    })
    .join("\n\n");

  const prompt = `${headerParts.join("\n")}

Interviews:
${interviewText}
`;

  try {
    const result = await generateText({ model, system, prompt });
    const parsed = parseAiJsonObject(result.text);
    const summary = validateSchema(summarySchema, parsed);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Project analysis failed" },
      { status: 500 }
    );
  }
}
