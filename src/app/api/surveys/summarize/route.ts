import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Summary = {
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
};

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ChatMessage>;
  return (
    (v.role === "user" || v.role === "assistant") &&
    typeof v.content === "string"
  );
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model did not return JSON");
    }
    const candidate = trimmed.slice(start, end + 1);
    return JSON.parse(candidate) as unknown;
  }
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((v) => typeof v === "string");
  return strings.length === value.length ? strings : null;
}

function validateSummary(value: unknown): Summary {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid summary");
  }
  const v = value as Partial<Summary>;

  const overview = typeof v.overview === "string" ? v.overview.trim() : null;
  const keyThemes = asStringArray(v.keyThemes);
  const specificPraise = asStringArray(v.specificPraise);
  const areasForImprovement = asStringArray(v.areasForImprovement);
  const sentiment =
    v.sentiment === "positive" ||
    v.sentiment === "mixed" ||
    v.sentiment === "negative"
      ? v.sentiment
      : null;

  if (
    !overview ||
    !keyThemes ||
    !specificPraise ||
    !areasForImprovement ||
    !sentiment
  ) {
    throw new Error("Summary JSON missing required fields");
  }

  return {
    overview,
    keyThemes,
    sentiment,
    specificPraise,
    areasForImprovement,
  };
}

export async function POST(req: Request) {
  // Rate limiting: 10 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "global";
  const rateLimit = checkRateLimit(`summarize:${ip}`, "summarize");
  if (!rateLimit.success) {
    return createRateLimitResponse(Math.ceil(rateLimit.resetMs / 1000));
  }

  const json = await req.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = json as {
    subjectName?: unknown;
    subjectRole?: unknown;
    relationshipLabel?: unknown;
    messages?: unknown;
  };

  const subjectName =
    typeof body.subjectName === "string" ? body.subjectName.trim() : null;
  const subjectRole =
    typeof body.subjectRole === "string" ? body.subjectRole.trim() : null;
  const relationshipLabel =
    typeof body.relationshipLabel === "string"
      ? body.relationshipLabel.trim()
      : null;

  const messages = Array.isArray(body.messages)
    ? body.messages.filter(isMessage)
    : null;

  if (!subjectName || !messages || messages.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY on the server" },
      { status: 500 }
    );
  }

  const anthropic = createAnthropic({ apiKey });
  const model = anthropic("claude-3-5-haiku-latest");

  const system = `You are an expert feedback analyst.
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
- Be specific and actionable.
- Keep each array 3-7 items max.
- Don't include personally identifying details about the respondent.`;

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
    const parsed = parseJsonObject(result.text);
    const summary = validateSummary(parsed);
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

