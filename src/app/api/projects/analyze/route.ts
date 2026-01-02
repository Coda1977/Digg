import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { parseAiJsonObject } from "@/lib/aiJson";
import { analyzeRequestSchema, analysisSchema, validateSchema } from "@/lib/schemas";
import { PROJECT_ANALYSIS_PROMPT } from "@/lib/reportPrompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limiting: 5 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "global";
  const rateLimit = await checkRateLimit(`analyze:${ip}`, "analyze");
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
  const model = anthropic("claude-sonnet-4-5-20250929");

  const system = PROJECT_ANALYSIS_PROMPT;

  // Calculate coverage breakdown by relationship
  const coverageBreakdown: Record<string, number> = {};
  interviews.forEach((interview) => {
    const relationship = interview.relationshipLabel || "unknown";
    coverageBreakdown[relationship] = (coverageBreakdown[relationship] || 0) + 1;
  });

  const roleText = subjectRole ? ` (${subjectRole})` : "";
  const coverageText = Object.entries(coverageBreakdown)
    .map(([rel, count]) => `${count} ${rel}`)
    .join(", ");

  const headerParts = [
    `Subject: ${subjectName}${roleText}`,
    projectName ? `Project: ${projectName}` : null,
    templateName ? `Protocol: ${templateName}` : null,
    `Total Interviews: ${interviews.length} (${coverageText})`,
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

IMPORTANT: Include coverage in your response:
- totalInterviews: ${interviews.length}
- breakdown: ${JSON.stringify(coverageBreakdown)}
`;

  try {
    const result = await generateText({ model, system, prompt });
    const parsed = parseAiJsonObject(result.text);
    const analysis = validateSchema(analysisSchema, parsed);
    return NextResponse.json(analysis);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Project analysis failed" },
      { status: 500 }
    );
  }
}
