import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { chatRequestSchema, validateSchema } from "@/lib/schemas";
import { DIGG_INTERVIEWER_CORE } from "../../../../convex/lib/diggCoreV2";
import { getBuiltInTemplateByType } from "../../../../convex/lib/builtInTemplates";
import { assertNoLegacyPlaceholders } from "../../../../convex/lib/templateValidation";

// Schema for structured AI response
const chatResponseSchema = z.object({
  response: z.string().describe("Your response to the respondent"),
  currentQuestionId: z.string().nullable().describe("The ID of the template question you are currently exploring (e.g., 'strengths', 'improvements'). Set to null if wrapping up or between questions."),
});

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
  const rateLimit = await checkRateLimit(uniqueId, "chat");
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

    const template = surveyData.template as Doc<"templates">;
    const system = buildSurveySystemPrompt({
      template,
      project: surveyData.project as Doc<"projects">,
      relationshipId: surveyData.relationship,
    });

    const model = anthropic("claude-sonnet-4-5-20250929");

    // Use generateObject for structured output with question tracking
    const result = prompt
      ? await generateObject({ model, schema: chatResponseSchema, system, prompt })
      : await generateObject({ model, schema: chatResponseSchema, system, messages });

    // Find the question text for the current question ID
    const currentQuestion = result.object.currentQuestionId
      ? template.questions.find(q => q.id === result.object.currentQuestionId)
      : null;

    return NextResponse.json({
      text: result.object.response,
      questionId: result.object.currentQuestionId,
      questionText: currentQuestion?.text.replaceAll("{{subjectName}}", surveyData.project.subjectName) ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}

/**
 * Build the questions list text from template questions.
 * Includes question IDs for tracking which question is being explored.
 */
function buildQuestionsText(template: Doc<"templates">, subjectName: string) {
  const sorted = [...template.questions].sort((a, b) => a.order - b.order);
  return sorted
    .map((q, idx) => {
      const text = q.text.replaceAll("{{subjectName}}", subjectName);
      const meta = [];
      if (q.collectMultiple) meta.push("collect multiple responses");
      if ("type" in q && q.type === "rating" && "ratingScale" in q && q.ratingScale) {
        meta.push(`RATING SCALE: 1-${q.ratingScale.max}`);
      }
      const metaText = meta.length ? ` (${meta.join(", ")})` : "";
      return `${idx + 1}. [ID: ${q.id}] ${text}${metaText}`;
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
  const templateDescription = template.description?.trim();

  // New unified architecture: DIGG_CORE + persona + auto-injected questions
  // The persona field is used for user-defined style customization
  const personaSource =
    builtInDefinition?.systemPromptTemplate ?? template.systemPromptTemplate;
  assertNoLegacyPlaceholders(personaSource);
  const persona = personaSource?.trim() || "";

  // Check if template has any rating questions
  const hasRatingQuestions = template.questions.some(
    q => "type" in q && q.type === "rating"
  );

  const ratingInstructions = hasRatingQuestions ? `

RATING QUESTION GUIDELINES:
When a respondent provides a numeric rating:
- The number is their rating on the specified scale (e.g., "7" on a 1-10 scale)
- Acknowledge the specific rating value in your response
- Ask adaptive follow-up questions based on their position on the scale

Examples of adaptive follow-ups:
- "A 7 out of 10—what would it take to move from a 7 to a 9?"
- "You rated this a 4. What's holding it back from being higher?"
- "A 9—that's strong! What makes it work so well?"
- "You gave this a 5, right in the middle. What would need to change to push it higher?"

- Use the REFLECT → PROBE methodology: acknowledge the rating, then ask about the gap
- Explore what's working (strengths) and what's missing (improvements)
- Reference the scale endpoints when relevant
- Ask about concrete actions or changes that would move the rating
` : "";

  return `${DIGG_INTERVIEWER_CORE}

---

CONTEXT:
You are interviewing about: ${project.subjectName}${roleText}
The respondent is their: ${relationshipLabel}
${persona ? `\nINTERVIEWER STYLE:\n${persona}` : ""}
${templateDescription ? `\nSURVEY DESCRIPTION:\n${templateDescription}` : ""}

QUESTIONS TO COVER (with IDs for tracking):
${questionsText}${ratingInstructions}

QUESTION TRACKING:
When you respond, always set currentQuestionId to the ID of the question you are currently exploring or asking about. Use the exact ID from the list above (e.g., "strengths", "improvements"). Set it to null only when you are wrapping up the interview or transitioning between questions without asking about a specific topic.

ENDING INSTRUCTION:
When you are wrapping up the interview, include a final sentence that tells the respondent to click the "Finish Survey" button to submit their responses. Do this once at the very end.

START by introducing yourself briefly and asking the first question.`;
}

