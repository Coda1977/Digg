import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { chatRequestSchema, validateSchema } from "@/lib/schemas";
import { DIGG_INTERVIEWER_CORE } from "../../../../convex/lib/diggCoreV2";
import { getBuiltInTemplateByType } from "../../../../convex/lib/builtInTemplates";
import { assertNoLegacyPlaceholders } from "../../../../convex/lib/templateValidation";

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

    const model = anthropic("claude-3-5-haiku-20241022");
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

/**
 * Build the questions list text from template questions.
 */
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

/**
 * Build the complete system prompt for a survey.
 *
 * Architecture:
 * 1. DIGG_INTERVIEWER_CORE - Universal methodology and format rules
 * 2. Context - Subject name, role, relationship
 * 3. Persona - User-defined interviewer style (optional)
 * 4. Questions - Auto-injected from template
 */
function buildSurveySystemPrompt(args: {
  template: Doc<"templates">;
  project: Doc<"projects">;
  relationshipId?: string;
}) {
  const { template, project, relationshipId } = args;
  // Built-ins must always use V2 persona-only prompts, even if DB content is stale.
  const builtInDefinition = getBuiltInTemplateByType(template.type);
  const roleText = project.subjectRole ? ` (${project.subjectRole})` : "";
  const relationshipLabel =
    template.relationshipOptions.find((r) => r.id === relationshipId)?.label ??
    relationshipId ??
    "colleague";
  const questionsText = buildQuestionsText(template, project.subjectName);

  // New unified architecture: DIGG_CORE + persona + auto-injected questions
  // The persona field is used for user-defined style customization
  const personaSource =
    builtInDefinition?.systemPromptTemplate ?? template.systemPromptTemplate;
  assertNoLegacyPlaceholders(personaSource);
  const persona = personaSource?.trim() || "";

  return `${DIGG_INTERVIEWER_CORE}

---

CONTEXT:
You are interviewing about: ${project.subjectName}${roleText}
The respondent is their: ${relationshipLabel}
${persona ? `\nINTERVIEWER STYLE:\n${persona}` : ""}

QUESTIONS TO COVER:
${questionsText}

START by introducing yourself briefly and asking the first question.`;
}

