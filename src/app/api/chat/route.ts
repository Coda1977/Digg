import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ChatMessage>;
  return (
    (v.role === "user" || v.role === "assistant") &&
    typeof v.content === "string"
  );
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = json as {
    uniqueId?: unknown;
    messages?: unknown;
    prompt?: unknown;
  };

  const uniqueId = typeof body.uniqueId === "string" ? body.uniqueId : null;
  const prompt = typeof body.prompt === "string" ? body.prompt : undefined;
  const messages = Array.isArray(body.messages)
    ? body.messages.filter(isMessage)
    : null;

  if (!uniqueId || messages === null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

    const model = anthropic("claude-3-5-haiku-latest");
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

  return template.systemPromptTemplate
    .replaceAll("{{subjectName}}", project.subjectName)
    .replaceAll("{{subjectRole}}", roleText)
    .replaceAll("{{relationship}}", relationshipLabel)
    .replaceAll("{{questions}}", questionsText);
}
