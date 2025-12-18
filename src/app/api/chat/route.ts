import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { chatRequestSchema, validateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Parse and validate request body with Zod
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let validatedData;
  try {
    validatedData = validateSchema(chatRequestSchema, json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const { uniqueId, messages, prompt } = validatedData;

  // Rate limiting: 60 requests per minute per survey
  const rateLimit = checkRateLimit(uniqueId, "chat");
  if (!rateLimit.success) {
    return createRateLimitResponse(Math.ceil(rateLimit.resetMs / 1000));
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CONVEX_URL on the server" },
      { status: 500 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY on the server" },
      { status: 500 }
    );
  }

  const anthropic = createAnthropic({ apiKey });
  const convex = new ConvexHttpClient(convexUrl);

  try {
    const surveyData = await convex.query(api.surveys.getByUniqueId, { uniqueId });
    if (!surveyData) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    const system = buildSurveySystemPrompt({
      template: surveyData.template as Doc<"templates">,
      project: surveyData.project as Doc<"projects">,
      relationshipId: surveyData.relationship,
    });

    const model = anthropic("claude-haiku-4-5");
    const result = prompt
      ? await generateText({ model, system, prompt })
      : await generateText({ model, system, messages });

    return NextResponse.json({ text: result.text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}

function buildQuestionsText(template: Doc<"templates">, subjectName: string) {
  const sorted = [...template.questions].sort((a, b) => a.order - b.order);
  return sorted
    .map((q, idx) => {
      const text = q.text.replaceAll("{{subjectName}}", subjectName);
      const meta = q.collectMultiple ? " (collect multiple)" : "";
      return `${idx + 1}. ${text}${meta}`;
    })
    .join("\n");
}

function buildSurveySystemPrompt(args: {
  template: Doc<"templates">;
  project: Doc<"projects">;
  relationshipId?: string;
}) {
  const { template, project, relationshipId } = args;
  const roleText = project.subjectRole ? ` (${project.subjectRole})` : "";
  const relationshipLabel =
    template.relationshipOptions.find((r) => r.id === relationshipId)?.label ??
    relationshipId ??
    "unknown";
  const questionsText = buildQuestionsText(template, project.subjectName);

  const customizedPrompt = template.systemPromptTemplate
    .replaceAll("{{subjectName}}", project.subjectName)
    .replaceAll("{{subjectRole}}", roleText)
    .replaceAll("{{relationship}}", relationshipLabel)
    .replaceAll("{{questions}}", questionsText);

  // Universal context and formatting instruction applied to ALL templates
  const universalInstruction = `

---

CONTEXT:
You are conducting a feedback interview. The person you're speaking with is providing honest, thoughtful feedback about someone or something. This is a real conversation, not a performance or theatrical scene.

FORMATTING REQUIREMENT:
You must respond in plain, natural conversational text only. Do NOT include:
- Stage directions or actions (in asterisks, italics, or parentheses like *nods* or _smiles_)
- Narrative descriptions of your tone, body language, or emotional state
- Markdown headers, dividers, or special formatting
- Any theatrical, script-like, or performative elements

Write only the actual words you would say in a real conversation. Nothing else.`;

  return customizedPrompt + universalInstruction;
}
