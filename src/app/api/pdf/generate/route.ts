/**
 * PDF Generation API Route
 *
 * Generates PDFs server-side using Puppeteer.
 * This replaces the client-side @react-pdf/renderer approach.
 */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { checkRateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { generatePdfFromHtml } from "@/lib/pdf/puppeteerClient";
import { renderPdfHtml } from "@/lib/pdf/htmlRenderer";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout for PDF generation

// Lazy-initialized Convex client
let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

export async function POST(req: Request) {
  // Rate limiting: reuse "analyze" limit (5 per hour per IP)
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "global";
  const rateLimit = await checkRateLimit(`pdf:${ip}`, "analyze");
  if (!rateLimit.success) {
    return createRateLimitResponse(Math.ceil(rateLimit.resetMs / 1000));
  }

  // Parse request body
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId } = json as { projectId?: string };
  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const convex = getConvexClient();

    // Fetch project data
    const project = await convex.query(api.projects.getById, {
      id: projectId as Id<"projects">,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch surveys with messages
    const surveysWithMessages = await convex.query(
      api.surveys.getByProjectWithMessages,
      { projectId: projectId as Id<"projects"> }
    );

    // Get relationship options from template
    const relationshipOptions = project.template?.relationshipOptions || [];

    // Process surveys for PDF
    const completedSurveys = surveysWithMessages.filter(
      (s) => s.status === "completed"
    );

    // Sort surveys by completion time
    const sortedSurveys = [...completedSurveys].sort((a, b) => {
      const aTime = a.completedAt || 0;
      const bTime = b.completedAt || 0;
      return aTime - bTime;
    });

    // Build surveysForPdf
    const surveysForPdf = sortedSurveys.map((survey) => {
      const relationshipLabel =
        relationshipOptions.find((r) => r.id === survey.relationship)?.label ||
        survey.relationship ||
        "Unknown";
      return {
        respondentName: survey.respondentName || "Anonymous respondent",
        relationshipLabel,
        status: survey.status,
        completedAt: survey.completedAt ?? undefined,
        summary: survey.summary ?? undefined,
      };
    });

    // Build responsesByQuestion (simplified - the full extraction is complex)
    // For now, we'll pass the data that's already in project.analysis
    const responsesByQuestion = await extractResponsesByQuestion(
      sortedSurveys,
      relationshipOptions,
      project.template?.questions || []
    );

    // Build transcripts
    const transcripts = sortedSurveys
      .filter((s) => s.messages && s.messages.length > 0)
      .map((survey) => {
        const relationshipLabel =
          relationshipOptions.find((r) => r.id === survey.relationship)
            ?.label ||
          survey.relationship ||
          "Unknown";
        return {
          respondentName: survey.respondentName || "Anonymous",
          relationshipLabel,
          messages: survey.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        };
      })
      .sort((a, b) => {
        const aOrder = getRelationshipOrder(a.relationshipLabel);
        const bOrder = getRelationshipOrder(b.relationshipLabel);
        return aOrder - bOrder;
      });

    // Build coverage text
    const coverageText = getCoverageText(surveysForPdf);

    // Build segmented analysis - map flat structure to nested structure expected by PDF templates
    const segmentedAnalysisForPdf = project.segmentedAnalysis?.map(
      (segment) => {
        const relationshipLabel =
          relationshipOptions.find((r) => r.id === segment.relationshipType)
            ?.label ||
          segment.relationshipType ||
          "Unknown";
        return {
          relationshipType: segment.relationshipType,
          relationshipLabel,
          analysis: {
            summary: segment.summary,
            strengths: segment.strengths,
            improvements: segment.improvements,
            narrative: segment.narrative,
          },
        };
      }
    );

    // Render HTML
    const html = await renderPdfHtml({
      projectName: project.name,
      subjectName: project.subjectName,
      subjectRole: project.subjectRole ?? undefined,
      templateName: project.template?.name ?? undefined,
      analysis: project.analysis ?? undefined,
      segmentedAnalysis: segmentedAnalysisForPdf,
      responsesByQuestion,
      transcripts,
      coverageText,
    });

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePdfFromHtml(html, {
      subjectName: project.subjectName,
      projectName: project.name,
    });

    // Create filename
    const fileName = `digg-${fileSafe(project.subjectName)}-${fileSafe(project.name)}.pdf`;

    // Return PDF - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF_ERROR]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PDF generation failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Make a string safe for use in filenames
 */
function fileSafe(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "digg-report";
  return trimmed
    .replace(/[^a-z0-9\u0590-\u05FF]+/gi, "-") // Allow Hebrew chars
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Get relationship order for sorting
 */
function getRelationshipOrder(label: string): number {
  const order: Record<string, number> = {
    Manager: 1,
    Supervisor: 2,
    "Direct Report": 3,
    Peer: 4,
    Colleague: 5,
    Client: 6,
    Other: 99,
  };
  return order[label] || 50;
}

/**
 * Build coverage text from surveys
 */
function getCoverageText(
  surveys: Array<{ relationshipLabel: string }>
): string {
  const counts: Record<string, number> = {};
  surveys.forEach((s) => {
    counts[s.relationshipLabel] = (counts[s.relationshipLabel] || 0) + 1;
  });

  const parts = Object.entries(counts).map(
    ([label, count]) => `${count} ${label}${count !== 1 ? "s" : ""}`
  );

  const total = surveys.length;
  return `${total} interview${total !== 1 ? "s" : ""}: ${parts.join(", ")}`;
}

/**
 * Extract responses organized by question
 * Simplified version - full logic is in responseExtraction.ts
 */
async function extractResponsesByQuestion(
  surveys: Array<{
    _id: string;
    respondentName?: string;
    relationship?: string;
    messages: Array<{
      role: string;
      content: string;
      questionId?: string;
      questionText?: string;
      ratingValue?: number;
    }>;
  }>,
  relationshipOptions: Array<{ id: string; label: string }>,
  templateQuestions: Array<{
    id: string;
    text: string;
    type?: string;
    ratingScale?: {
      max: number;
      lowLabel?: string;
      highLabel?: string;
    };
  }>
): Promise<
  Array<{
    questionId: string;
    questionText: string;
    questionType?: "text" | "rating";
    ratingScale?: {
      max: number;
      lowLabel?: string;
      highLabel?: string;
    };
    responses: Array<{
      surveyId: string;
      respondentName: string;
      relationshipId: string;
      relationshipLabel: string;
      content: string;
      ratingValue?: number;
    }>;
    ratingStats?: {
      average: number;
      distribution: Record<number, number>;
    };
  }>
> {
  // Build a map of questions
  const questionMap = new Map<
    string,
    {
      questionId: string;
      questionText: string;
      questionType?: "text" | "rating";
      ratingScale?: {
        max: number;
        lowLabel?: string;
        highLabel?: string;
      };
      responses: Array<{
        surveyId: string;
        respondentName: string;
        relationshipId: string;
        relationshipLabel: string;
        content: string;
        ratingValue?: number;
      }>;
      ratingStats?: {
        average: number;
        distribution: Record<number, number>;
      };
    }
  >();

  // Initialize from template questions
  templateQuestions.forEach((q) => {
    questionMap.set(q.id, {
      questionId: q.id,
      questionText: q.text,
      questionType: q.type as "text" | "rating" | undefined,
      ratingScale: q.ratingScale,
      responses: [],
    });
  });

  // Process each survey's messages
  surveys.forEach((survey) => {
    const relationshipLabel =
      relationshipOptions.find((r) => r.id === survey.relationship)?.label ||
      survey.relationship ||
      "Unknown";

    survey.messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.questionId) {
        let question = questionMap.get(msg.questionId);

        // If question not in template, create it
        if (!question && msg.questionText) {
          question = {
            questionId: msg.questionId,
            questionText: msg.questionText,
            responses: [],
          };
          questionMap.set(msg.questionId, question);
        }

        if (question) {
          question.responses.push({
            surveyId: survey._id,
            respondentName: survey.respondentName || "Anonymous",
            relationshipId: survey.relationship || "",
            relationshipLabel,
            content: msg.content,
            ratingValue: msg.ratingValue,
          });
        }
      }
    });
  });

  // Convert to array and calculate stats
  const result = Array.from(questionMap.values());

  // Calculate rating stats for rating questions
  result.forEach((q) => {
    if (q.questionType === "rating" && q.ratingScale) {
      const validRatings = q.responses
        .map((r) => r.ratingValue)
        .filter((v): v is number => v !== undefined && v > 0);

      if (validRatings.length > 0) {
        const sum = validRatings.reduce((a, b) => a + b, 0);
        const average = sum / validRatings.length;

        const distribution: Record<number, number> = {};
        validRatings.forEach((v) => {
          const rounded = Math.round(v);
          distribution[rounded] = (distribution[rounded] || 0) + 1;
        });

        q.ratingStats = { average, distribution };
      }
    }
  });

  // Sort responses by relationship
  result.forEach((q) => {
    q.responses.sort((a, b) => {
      const aOrder = getRelationshipOrder(a.relationshipLabel);
      const bOrder = getRelationshipOrder(b.relationshipLabel);
      return aOrder - bOrder;
    });
  });

  return result;
}
