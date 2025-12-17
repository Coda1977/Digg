import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

type Summary = {
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
};

type InterviewInput = {
  respondentName?: string;
  relationshipLabel?: string;
  transcript: string;
};

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
    v.sentiment === "positive" || v.sentiment === "mixed" || v.sentiment === "negative"
      ? v.sentiment
      : null;

  if (!overview || !keyThemes || !specificPraise || !areasForImprovement || !sentiment) {
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
  // Rate limiting: 5 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "global";
  const rateLimit = checkRateLimit(`analyze:${ip}`, "analyze");
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
    projectName?: unknown;
    templateName?: unknown;
    interviews?: unknown;
  };

  const subjectName =
    typeof body.subjectName === "string" ? body.subjectName.trim() : null;
  const subjectRole =
    typeof body.subjectRole === "string" ? body.subjectRole.trim() : null;
  const projectName =
    typeof body.projectName === "string" ? body.projectName.trim() : null;
  const templateName =
    typeof body.templateName === "string" ? body.templateName.trim() : null;

  const interviews: InterviewInput[] | null = Array.isArray(body.interviews)
    ? (body.interviews
        .map((i): InterviewInput | null => {
          if (!i || typeof i !== "object") return null;
          const v = i as Partial<InterviewInput>;
          const transcript =
            typeof v.transcript === "string" ? v.transcript.trim() : null;
          if (!transcript) return null;
          return {
            transcript,
            respondentName:
              typeof v.respondentName === "string" ? v.respondentName.trim() : undefined,
            relationshipLabel:
              typeof v.relationshipLabel === "string"
                ? v.relationshipLabel.trim()
                : undefined,
          };
        })
        .filter((i): i is InterviewInput => i !== null))
    : null;

  if (!subjectName || !interviews || interviews.length === 0) {
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
    const parsed = parseJsonObject(result.text);
    const summary = validateSummary(parsed);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Project analysis failed" },
      { status: 500 }
    );
  }
}

