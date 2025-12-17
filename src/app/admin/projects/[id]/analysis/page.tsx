"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useConvex, useMutation, useQuery } from "convex/react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectInsightsPdf } from "@/components/pdf/ProjectInsightsPdf";
import { cn } from "@/lib/utils";

type AnalysisSegment = {
  relationshipType: string;
  relationshipLabel: string;
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
  basedOnSurveyCount: number;
  generatedAt: number;
};

type ProjectSummary = {
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
};

function statusBadgeVariant(status: string): "default" | "secondary" {
  return status === "completed" ? "default" : "secondary";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (project === null) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Project not found</CardTitle>
          <CardDescription>
            This project ID doesn&apos;t exist or you don&apos;t have access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const analysis = project.analysis ?? null;
  const pdfFileName = `digg-${fileSafe(project.subjectName)}-${fileSafe(
    project.name
  )}.pdf`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Interviews &amp; analysis</h1>
          <p className="text-sm text-muted-foreground">
            {project.name} - {project.subjectName}
          </p>
          {stats && (
            <p className="text-xs text-muted-foreground">
              {stats.total} interviews - {stats.completed} completed - {stats.inProgress}{" "}
              in progress
            </p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project insights</CardTitle>
          <CardDescription>
            Aggregate analysis across completed interviews for this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {analysis ? (
                <>
                  Generated from {analysis.basedOnSurveyCount} completed interviews -{" "}
                  {formatDateTime(analysis.generatedAt)}
                </>
              ) : (
                <>No insights generated yet.</>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
              </PDFDownloadLink>

              <Button
                type="button"
                size="sm"
                onClick={() => void onGenerateInsights()}
                disabled={generatingInsights}
              >
                {generatingInsights
                  ? "Generating..."
                  : analysis
                  ? "Regenerate insights"
                  : "Generate insights"}
              </Button>
            </div>
          </div>

          {insightsError && (
            <p className="text-sm text-destructive" role="alert">
              {insightsError}
            </p>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Segment Tabs */}
              {project.segmentedAnalysis && project.segmentedAnalysis.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b pb-3">
                  <Button
                    variant={activeSegment === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSegment(null)}
                  >
                    Overall ({analysis.basedOnSurveyCount})
                  </Button>
                  {project.segmentedAnalysis.map((segment) => (
                    <Button
                      key={segment.relationshipType}
                      variant={activeSegment === segment.relationshipType ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveSegment(segment.relationshipType)}
                    >
                      {segment.relationshipLabel} ({segment.basedOnSurveyCount})
                    </Button>
                  ))}
                </div>
              )}

              {/* Display active analysis */}
              {(() => {
                const activeAnalysis = activeSegment
                  ? project.segmentedAnalysis?.find(
                      (s) => s.relationshipType === activeSegment
                    )
                  : analysis;

                if (!activeAnalysis) return null;

                return (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Sentiment: {activeAnalysis.sentiment}</Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Overview</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activeAnalysis.overview}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Key themes</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {activeAnalysis.keyThemes.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Specific praise</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {activeAnalysis.specificPraise.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <h3 className="text-sm font-medium">Areas for improvement</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {activeAnalysis.areasForImprovement.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interviews</CardTitle>
          <CardDescription>
            Open transcripts and see (or generate) per-interview AI summaries. To invite more
            people, use the share link on the project page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!sortedSurveys || sortedSurveys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedSurveys.map((survey) => {
                const relationshipLabel =
                  project.template?.relationshipOptions.find(
                    (r) => r.id === survey.relationship
                  )?.label ??
                  survey.relationship ??
                  "Unknown";

                const summaryLabel = survey.summary
                  ? `Summary ready`
                  : survey.status === "completed"
                  ? "Summary not generated"
                  : "Summary available after completion";

                return (
                  <div
                    key={survey._id}
                    className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant(survey.status)}>
                          {survey.status}
                        </Badge>
                        <p className="text-sm font-medium truncate">
                          {survey.respondentName ?? "Anonymous respondent"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Relationship: {relationshipLabel} - {summaryLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm">
                        <Link href={`/admin/surveys/${survey._id}`}>
                          Transcript &amp; summary
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

