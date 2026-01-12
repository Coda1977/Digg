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
import { extractResponsesByQuestion } from "@/lib/responseExtraction";

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
  // Rate limiting: temporarily disabled for testing
  // TODO: Re-enable after testing
  // const ip =
  //   req.headers.get("x-forwarded-for") ||
  //   req.headers.get("x-real-ip") ||
  //   "global";
  // const rateLimit = await checkRateLimit(`pdf:${ip}`, "analyze");
  // if (!rateLimit.success) {
  //   return createRateLimitResponse(Math.ceil(rateLimit.resetMs / 1000));
  // }

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

    // Fetch project data (using dev version without auth for testing)
    // TODO: Switch back to api.projects.getById after testing
    const project = await convex.query(api.projects.devGetById, {
      id: projectId as Id<"projects">,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch surveys with messages (using dev version without auth for testing)
    // TODO: Switch back to api.surveys.getByProjectWithMessages after testing
    const surveysWithMessages = await convex.query(
      api.surveys.devGetByProjectWithMessages,
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

    // Build responsesByQuestion using the correct extraction function
    // Map surveys to the expected format with typed messages
    // Also interpolate {{subjectName}} in question text
    const subjectName = project.subjectName;
    const surveysForExtraction = sortedSurveys.map((survey) => ({
      _id: survey._id,
      respondentName: survey.respondentName,
      relationship: survey.relationship,
      messages: survey.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        questionId: m.questionId,
        questionText: m.questionText?.replace(/\{\{subjectName\}\}/g, subjectName),
        ratingValue: m.ratingValue,
      })),
    }));

    const responsesByQuestion = extractResponsesByQuestion(
      surveysForExtraction,
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

