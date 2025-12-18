"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useConvex, useMutation, useQuery } from "convex/react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
} from "@/components/editorial";
import { ProjectInsightsPdf } from "@/components/pdf/ProjectInsightsPdf";

type ProjectSummary = {
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
};

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function statusBadgeClass(status: string) {
  const base =
    "inline-flex items-center px-4 py-2 border-3 text-label font-sans font-semibold uppercase tracking-label";
  if (status === "completed") return `${base} border-ink bg-ink text-paper`;
  if (status === "active") return `${base} border-accent-red bg-accent-red text-paper`;
  return `${base} border-ink bg-paper text-ink`;
}

function sentimentBadgeClass(sentiment: string) {
  const base =
    "inline-flex items-center px-4 py-2 border-3 text-label font-sans font-semibold uppercase tracking-label";
  if (sentiment === "negative") return `${base} border-accent-red text-accent-red`;
  if (sentiment === "positive") return `${base} border-ink bg-ink text-paper`;
  return `${base} border-ink text-ink`;
}

async function generateProjectInsights(input: {
  subjectName: string;
  subjectRole?: string;
  projectName?: string;
  templateName?: string;
  interviews: Array<{
    respondentName?: string;
    relationshipLabel?: string;
    transcript: string;
  }>;
}) {
  const res = await fetch("/api/projects/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => null)) as
    | ProjectSummary
    | { error: string }
    | null;

  if (!res.ok) {
    const errorMessage =
      body && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new Error(errorMessage);
  }

  if (
    !body ||
    !("overview" in body) ||
    typeof body.overview !== "string" ||
    !("keyThemes" in body) ||
    !Array.isArray(body.keyThemes)
  ) {
    throw new Error("Bad response from server");
  }

  return body as ProjectSummary;
}

function formatDateTime(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

function fileSafe(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "digg-report";
  return trimmed
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function ProjectAnalysisPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  const convex = useConvex();
  const saveAnalysis = useMutation(api.projects.saveAnalysis);

  const project = useQuery(api.projects.getById, { id: projectId });
  const surveys = useQuery(api.surveys.getByProject, { projectId });

  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null); // null = overall view

  const sortedSurveys = useMemo(() => {
    if (!surveys) return null;
    return [...surveys].sort(
      (a, b) =>
        (b.completedAt ?? b.startedAt ?? 0) - (a.completedAt ?? a.startedAt ?? 0)
    );
  }, [surveys]);

  const stats = useMemo(() => {
    if (!surveys) return null;
    const completed = surveys.filter((s) => s.status === "completed").length;
    const inProgress = surveys.filter((s) => s.status === "in_progress").length;
    return { total: surveys.length, completed, inProgress };
  }, [surveys]);

  const surveysForPdf = useMemo(() => {
    if (!sortedSurveys) return [];
    const relationshipOptions = project?.template?.relationshipOptions ?? [];
    return sortedSurveys.map((survey) => {
      const relationshipLabel =
        relationshipOptions.find((r) => r.id === survey.relationship)?.label ??
        survey.relationship ??
        "Unknown";
      return {
        respondentName: survey.respondentName ?? "Anonymous respondent",
        relationshipLabel,
        status: survey.status,
        completedAt: survey.completedAt ?? undefined,
        summary: survey.summary ?? undefined,
      };
    });
  }, [project?.template?.relationshipOptions, sortedSurveys]);

  async function onGenerateInsights() {
    setInsightsError(null);
    setGeneratingInsights(true);
    try {
      const input = await convex.query(api.projects.getInsightsInput, {
        projectId,
      });
      if (!input) throw new Error("Project not found");
      if (!input.template) throw new Error("Template not found");

      if (input.interviews.length === 0) {
        throw new Error("No completed interviews yet.");
      }

      const interviews = input.interviews.map(({ survey, messages }) => {
        const relationshipLabel =
          input.template?.relationshipOptions.find((r) => r.id === survey.relationship)
            ?.label ??
          survey.relationship ??
          undefined;

        const transcript = messages
          .map(
            (m) =>
              `${m.role === "assistant" ? "Interviewer" : "Respondent"}: ${m.content}`
          )
          .join("\n");

        const truncated =
          transcript.length > 8000
            ? `${transcript.slice(0, 8000)}\n...[truncated]`
            : transcript;

        return {
          respondentName: survey.respondentName ?? undefined,
          relationshipLabel,
          relationshipType: survey.relationship ?? "unknown",
          transcript: truncated,
        };
      });

      // Generate overall analysis
      const analysis = await generateProjectInsights({
        subjectName: input.project.subjectName,
        subjectRole: input.project.subjectRole ?? undefined,
        projectName: input.project.name,
        templateName: input.template.name,
        interviews,
      });

      // Generate segmented analysis by relationship type
      const relationshipGroups = new Map<
        string,
        Array<{ respondentName?: string; relationshipLabel?: string; transcript: string }>
      >();

      interviews.forEach((interview) => {
        const type = interview.relationshipType;
        if (!relationshipGroups.has(type)) {
          relationshipGroups.set(type, []);
        }
        relationshipGroups.get(type)!.push(interview);
      });

      const segmentedAnalysis = await Promise.all(
        Array.from(relationshipGroups.entries())
          .filter(([, group]) => group.length >= 2) // Only analyze groups with 2+ interviews
          .map(async ([relationshipType, group]) => {
            const label =
              input.template?.relationshipOptions.find((r) => r.id === relationshipType)
                ?.label ?? relationshipType;

            const segmentAnalysis = await generateProjectInsights({
              subjectName: input.project.subjectName,
              subjectRole: input.project.subjectRole ?? undefined,
              projectName: `${input.project.name} (${label})`,
              templateName: input.template!.name,
              interviews: group,
            });

            return {
              relationshipType,
              relationshipLabel: label,
              ...segmentAnalysis,
              basedOnSurveyCount: group.length,
            };
          })
      );

      await saveAnalysis({
        projectId,
        analysis: {
          ...analysis,
          basedOnSurveyCount: interviews.length,
        },
        segmentedAnalysis: segmentedAnalysis.length > 0 ? segmentedAnalysis : undefined,
      });
    } catch (err) {
      setInsightsError(
        err instanceof Error ? err.message : "Failed to generate insights"
      );
    } finally {
      setGeneratingInsights(false);
    }
  }

  if (project === undefined || surveys === undefined) {
    return (
      <EditorialSection spacing="lg">
        <div className="animate-pulse max-w-[900px] mx-auto space-y-6">
          <div className="h-4 bg-ink/5 w-40" />
          <div className="h-12 bg-ink/5 w-2/3" />
          <div className="h-4 bg-ink/5 w-full max-w-xl" />
          <RuledDivider weight="thick" spacing="sm" />
          <div className="h-40 bg-ink/5 w-full" />
          <div className="h-40 bg-ink/5 w-full" />
        </div>
      </EditorialSection>
    );
  }

  if (project === null) {
    return (
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto border-l-4 border-accent-red pl-6 py-2 space-y-4">
          <EditorialLabel accent>Not Found</EditorialLabel>
          <h1 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
            Project not found
          </h1>
          <p className="text-body text-ink-soft">
            This project ID doesn&apos;t exist or you don&apos;t have access.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </EditorialSection>
    );
  }

  const analysis = project.analysis ?? null;
  const relationshipOptions = project.template?.relationshipOptions ?? [];
  const pdfFileName = `digg-${fileSafe(project.subjectName)}-${fileSafe(
    project.name
  )}.pdf`;

  return (
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <EditorialLabel>Interviews &amp; analysis</EditorialLabel>
            <span className={statusBadgeClass(project.status)}>
              {formatStatus(project.status)}
            </span>
          </div>

          <EditorialHeadline as="h1" size="lg">
            {project.subjectName}
          </EditorialHeadline>

          {project.subjectRole && (
            <p className="text-body-lg text-ink-soft">{project.subjectRole}</p>
          )}

          <p className="text-body text-ink-soft">
            {project.name}
            {project.template?.name ? ` · ${project.template.name}` : ""}
          </p>

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
              <div className="space-y-2 border-l-4 border-ink pl-6 py-2">
                <div className="font-serif font-bold text-[56px] leading-none tracking-headline">
                  {stats.total}
                </div>
                <div className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  Total interviews
                </div>
              </div>
              <div className="space-y-2 border-l-4 border-ink pl-6 py-2">
                <div className="font-serif font-bold text-[56px] leading-none tracking-headline">
                  {stats.completed}
                </div>
                <div className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  Completed
                </div>
              </div>
              <div className="space-y-2 border-l-4 border-ink pl-6 py-2">
                <div className="font-serif font-bold text-[56px] leading-none tracking-headline">
                  {stats.inProgress}
                </div>
                <div className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  In progress
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href={`/admin/projects/${projectId}`}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Back to project
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Project insights</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Aggregate what people said
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Generate an AI synthesis across completed interviews, then export it to a
              PDF.
            </p>
          </div>

          <div className="border-l-4 border-ink pl-6 py-2 space-y-4">
            <p className="text-body text-ink-soft">
              {analysis ? (
                <>
                  Generated from {analysis.basedOnSurveyCount} completed interviews ·{" "}
                  {formatDateTime(analysis.generatedAt)}
                </>
              ) : (
                <>No insights generated yet.</>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <PDFDownloadLink
                document={
                  <ProjectInsightsPdf
                    projectName={project.name}
                    subjectName={project.subjectName}
                    subjectRole={project.subjectRole ?? undefined}
                    templateName={project.template?.name ?? undefined}
                    analysis={analysis ?? undefined}
                    surveys={surveysForPdf}
                  />
                }
                fileName={pdfFileName}
                className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
              >
                {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
              </PDFDownloadLink>

              <button
                type="button"
                onClick={() => void onGenerateInsights()}
                disabled={generatingInsights}
                className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {generatingInsights
                  ? "Generating..."
                  : analysis
                    ? "Regenerate insights"
                    : "Generate insights"}
              </button>
            </div>

            {insightsError && (
              <p className="text-body text-accent-red" role="alert">
                {insightsError}
              </p>
            )}
          </div>

          {analysis && (
            <div className="space-y-8">
              {project.segmentedAnalysis && project.segmentedAnalysis.length > 0 && (
                <div className="flex flex-wrap gap-3 border-t-3 border-ink pt-6">
                  <button
                    type="button"
                    onClick={() => setActiveSegment(null)}
                    className={
                      activeSegment === null
                        ? "inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-3 border-ink bg-ink text-paper font-medium"
                        : "inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                    }
                  >
                    Overall ({analysis.basedOnSurveyCount})
                  </button>
                  {project.segmentedAnalysis.map((segment) => (
                    <button
                      key={segment.relationshipType}
                      type="button"
                      onClick={() => setActiveSegment(segment.relationshipType)}
                      className={
                        activeSegment === segment.relationshipType
                          ? "inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-3 border-ink bg-ink text-paper font-medium"
                          : "inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                      }
                    >
                      {segment.relationshipLabel} ({segment.basedOnSurveyCount})
                    </button>
                  ))}
                </div>
              )}

              {(() => {
                const activeAnalysis = activeSegment
                  ? project.segmentedAnalysis?.find(
                      (segment) => segment.relationshipType === activeSegment
                    )
                  : analysis;

                if (!activeAnalysis) return null;

                return (
                  <div className="space-y-8 border-t-3 border-ink pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <EditorialLabel>Sentiment</EditorialLabel>
                      <span className={sentimentBadgeClass(activeAnalysis.sentiment)}>
                        {activeAnalysis.sentiment}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <EditorialLabel>Overview</EditorialLabel>
                      <p className="text-body text-ink-soft whitespace-pre-wrap">
                        {activeAnalysis.overview}
                      </p>
                    </div>

                    <div className="grid gap-10 md:grid-cols-2">
                      <div className="space-y-3">
                        <EditorialLabel>Key themes</EditorialLabel>
                        <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                          {activeAnalysis.keyThemes.map((t: string, idx: number) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <EditorialLabel>Specific praise</EditorialLabel>
                        <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                          {activeAnalysis.specificPraise.map((t: string, idx: number) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <EditorialLabel>Areas for improvement</EditorialLabel>
                        <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                          {activeAnalysis.areasForImprovement.map(
                            (t: string, idx: number) => (
                              <li key={idx}>{t}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Interviews</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Transcripts and summaries
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Open transcripts and see (or generate) per-interview summaries. To invite more
              people, use the share link on the project page.
            </p>
          </div>

          {!sortedSurveys || sortedSurveys.length === 0 ? (
            <p className="text-body text-ink-soft">No interviews yet.</p>
          ) : (
            <div className="space-y-8">
              {sortedSurveys.map((survey) => {
                const relationshipLabel =
                  relationshipOptions.find((r) => r.id === survey.relationship)?.label ??
                  survey.relationship ??
                  "Unknown";

                const summaryLabel = survey.summary
                  ? "Summary ready"
                  : survey.status === "completed"
                    ? "Summary not generated"
                    : "Summary available after completion";

                return (
                  <article key={survey._id} className="border-t-3 border-ink pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={statusBadgeClass(survey.status)}>
                            {formatStatus(survey.status)}
                          </span>
                          <p className="text-body font-medium text-ink truncate">
                            {survey.respondentName ?? "Anonymous respondent"}
                          </p>
                        </div>
                        <p className="text-body text-ink-soft truncate">
                          Relationship · {relationshipLabel} · {summaryLabel}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href={`/admin/surveys/${survey._id}`}
                          className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                        >
                          Transcript &amp; summary
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </EditorialSection>
    </div>
  );
}
