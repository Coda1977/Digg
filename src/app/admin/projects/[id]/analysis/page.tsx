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
  EditorialButton,
  EditorialBreadcrumbs,
  StatusBadge,
  buttonVariants,
} from "@/components/editorial";
import { summarySchema, analysisSchema, type Summary, type Analysis } from "@/lib/schemas";
import { postJson } from "@/lib/http";
import { ProjectInsightsPdf } from "@/components/pdf/ProjectInsightsPdf";
import { sortByRelationship } from "@/lib/relationshipOrder";
import {
  extractResponsesByQuestion,
  getCoverageStats,
} from "@/lib/responseExtraction";

async function generateInterviewSummary(input: {
  subjectName: string;
  subjectRole?: string;
  relationshipLabel?: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<Summary> {
  return postJson("/api/surveys/summarize", input, summarySchema);
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
}): Promise<Analysis> {
  return postJson("/api/projects/analyze", input, analysisSchema);
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
  const saveSummary = useMutation(api.surveys.saveSummary);

  const project = useQuery(api.projects.getById, { id: projectId });
  const surveys = useQuery(api.surveys.getByProject, { projectId });
  const surveysWithMessages = useQuery(api.surveys.getByProjectWithMessages, { projectId });

  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null); // null = overall view
  const [generatingSummaries, setGeneratingSummaries] = useState(false);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  const [rawFeedbackExpanded, setRawFeedbackExpanded] = useState(false);
  const [showAllTranscripts, setShowAllTranscripts] = useState(false);

  // For pagination - show first 10 transcripts by default
  const TRANSCRIPTS_PER_PAGE = 10;

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
    const completedWithoutSummary = surveys.filter((s) => s.status === "completed" && !s.summary).length;

    // NEW: Calculate freshness - how many interviews completed after last analysis
    let newSinceAnalysis = 0;
    const analysisGeneratedAt = project?.analysis?.generatedAt;
    if (analysisGeneratedAt) {
      newSinceAnalysis = surveys.filter(
        (s) => s.status === "completed" && (s.completedAt ?? 0) > analysisGeneratedAt
      ).length;
    }

    return {
      total: surveys.length,
      completed,
      inProgress,
      completedWithoutSummary,
      newSinceAnalysis
    };
  }, [surveys, project?.analysis?.generatedAt]);

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

  // NEW: Extract responses by question for PDF
  const responsesByQuestion = useMemo(() => {
    if (!surveysWithMessages || !project?.template) return undefined;
    const completedSurveys = surveysWithMessages.filter(
      (s) => s.status === "completed" && s.messages.length > 0
    );
    if (completedSurveys.length === 0) return undefined;

    return extractResponsesByQuestion(
      completedSurveys,
      project.template.relationshipOptions,
      project.template.questions
    );
  }, [surveysWithMessages, project?.template]);

  // NEW: Prepare transcripts for PDF
  const transcripts = useMemo(() => {
    if (!surveysWithMessages || !project?.template) return undefined;
    const completedSurveys = surveysWithMessages.filter(
      (s) => s.status === "completed" && s.messages.length > 0
    );
    if (completedSurveys.length === 0) return undefined;

    const relationshipOptions = project.template.relationshipOptions;
    return sortByRelationship(
      completedSurveys.map((survey) => {
        const relationshipLabel =
          relationshipOptions.find((r) => r.id === survey.relationship)?.label ??
          survey.relationship ??
          "Unknown";
        return {
          respondentName: survey.respondentName ?? "Anonymous",
          relationshipLabel,
          messages: survey.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        };
      }),
      (t) => {
        const survey = completedSurveys.find(
          (s) => (s.respondentName ?? "Anonymous") === t.respondentName
        );
        return survey?.relationship ?? "other";
      }
    );
  }, [surveysWithMessages, project?.template]);

  // NEW: Generate coverage text for PDF
  const coverageText = useMemo(() => {
    if (!surveysWithMessages || !project?.template) return undefined;
    const completedSurveys = surveysWithMessages.filter(
      (s) => s.status === "completed" && s.messages.length > 0
    );
    if (completedSurveys.length === 0) return undefined;

    const stats = getCoverageStats(completedSurveys, project.template.relationshipOptions);
    return `${stats.totalInterviews} interview${stats.totalInterviews === 1 ? "" : "s"}: ${stats.breakdownText}`;
  }, [surveysWithMessages, project?.template]);

  // NEW: Prepare segmented analysis for PDF
  const segmentedAnalysisForPdf = useMemo(() => {
    if (!project?.segmentedAnalysis) return undefined;
    const relationshipOptions = project?.template?.relationshipOptions ?? [];

    return project.segmentedAnalysis.map((segment) => {
      const relationshipLabel =
        relationshipOptions.find((r) => r.id === segment.relationshipType)?.label ??
        segment.relationshipType;

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
    });
  }, [project?.segmentedAnalysis, project?.template?.relationshipOptions]);

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

      // Check how many summaries are missing
      const missingSummaryCount = input.interviews.filter(({ survey }) => !survey.summary).length;

      if (missingSummaryCount > 0) {
        throw new Error(`${missingSummaryCount} interview(s) are missing summaries. Please generate all interview summaries first, or wait for them to complete.`);
      }

      // Use summaries instead of raw transcripts (map-reduce approach)
      const interviews = input.interviews.map(({ survey }) => {
        const relationshipLabel =
          input.template?.relationshipOptions.find((r) => r.id === survey.relationship)
            ?.label ??
          survey.relationship ??
          undefined;

        // Use the interview summary if available
        const summaryText = survey.summary
          ? `Overview: ${survey.summary.overview}\n\nKey Themes: ${survey.summary.keyThemes.join(", ")}\n\nPraise: ${survey.summary.specificPraise.join("; ")}\n\nAreas for Improvement: ${survey.summary.areasForImprovement.join("; ")}\n\nSentiment: ${survey.summary.sentiment}`
          : "Summary not yet generated for this interview.";

        return {
          respondentName: survey.respondentName ?? undefined,
          relationshipLabel,
          relationshipType: survey.relationship ?? "unknown",
          transcript: summaryText,  // Using summary instead of full transcript
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
        analysis,
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

  async function onGenerateAllSummaries() {
    if (!project || !surveys) return;

    setSummariesError(null);
    setGeneratingSummaries(true);

    try {
      const completedSurveysWithoutSummary = surveys.filter(
        (s) => s.status === "completed" && !s.summary
      );

      if (completedSurveysWithoutSummary.length === 0) {
        setSummariesError("All completed interviews already have summaries.");
        return;
      }

      // Generate summaries in parallel (with some rate limiting consideration)
      const summaryPromises = completedSurveysWithoutSummary.map(async (survey) => {
        // Fetch messages for this survey
        const surveyData = await convex.query(api.surveys.getById, { id: survey._id });
        if (!surveyData || !surveyData.messages || surveyData.messages.length === 0) {
          return null;
        }

        const relationshipLabel =
          project.template?.relationshipOptions.find((r) => r.id === survey.relationship)
            ?.label ?? survey.relationship ?? "colleague";

        const messages = surveyData.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Generate summary
        const summary = await generateInterviewSummary({
          subjectName: project.subjectName,
          subjectRole: project.subjectRole ?? undefined,
          relationshipLabel,
          messages,
        });

        // Save summary
        await saveSummary({ surveyId: survey._id, summary });

        return summary;
      });

      await Promise.all(summaryPromises);

    } catch (err) {
      setSummariesError(
        err instanceof Error ? err.message : "Failed to generate summaries"
      );
    } finally {
      setGeneratingSummaries(false);
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
            <EditorialButton asChild variant="outline">
              <Link href="/admin">
                Back to dashboard
              </Link>
            </EditorialButton>
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
          <EditorialBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Projects", href: "/admin" },
              { label: project.name, href: `/admin/projects/${projectId}` },
              { label: "Analysis" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <EditorialLabel>Interviews &amp; analysis</EditorialLabel>
            <StatusBadge status={project.status as "active" | "closed"} />
          </div>

          <EditorialHeadline as="h1" size="lg">
            {project.subjectName}
          </EditorialHeadline>

          {project.subjectRole && (
            <p className="text-body-lg text-ink-soft">{project.subjectRole}</p>
          )}

          <p className="text-body text-ink-soft">
            {project.name}
            {project.template?.name ? ` - ${project.template.name}` : ""}
          </p>

          {stats && (
            <>
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

              {/* NEW: Coverage breakdown display */}
              {coverageText && stats.completed > 0 && (
                <div className="border-l-4 border-ink pl-6 py-3 mt-6">
                  <div className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft mb-1">
                    Coverage
                  </div>
                  <p className="text-body text-ink-soft">{coverageText}</p>
                </div>
              )}
            </>
          )}
        </div>
      </EditorialSection>

      {/* Section Navigation TOC */}
      <div className="sticky top-[73px] z-30 bg-paper border-b border-ink/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-[900px] mx-auto py-3 flex flex-wrap items-center gap-4">
            <span className="text-label font-semibold uppercase tracking-wider text-ink-soft">Jump to:</span>
            <a href="#insights" className="text-body font-medium text-ink hover:text-accent-red transition-colors">Insights</a>
            {responsesByQuestion && responsesByQuestion.length > 0 && (
              <a href="#raw-feedback" className="text-body font-medium text-ink hover:text-accent-red transition-colors">
                Raw Feedback ({responsesByQuestion.reduce((sum, q) => sum + q.responses.length, 0)})
              </a>
            )}
            <a href="#transcripts" className="text-body font-medium text-ink hover:text-accent-red transition-colors">
              Transcripts ({sortedSurveys?.length ?? 0})
            </a>
          </div>
        </div>
      </div>

      <RuledDivider weight="thick" spacing="sm" />

      {stats && stats.completedWithoutSummary > 0 && (
        <EditorialSection spacing="md">
          <div className="max-w-[900px] mx-auto space-y-8">
            <div className="space-y-3">
              <EditorialLabel accent>Action Needed</EditorialLabel>
              <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                Generate interview summaries
              </h2>
              <p className="text-body text-ink-soft max-w-2xl">
                {stats.completedWithoutSummary} completed interview(s) are missing summaries. Generate them first before creating project insights.
              </p>
            </div>

            <div className="border-l-4 border-accent-red pl-6 py-2 space-y-4">
              <EditorialButton
                type="button"
                onClick={() => void onGenerateAllSummaries()}
                disabled={generatingSummaries}
                variant="primary"
              >
                {generatingSummaries
                  ? `Generating ${stats.completedWithoutSummary} summaries...`
                  : `Generate ${stats.completedWithoutSummary} missing summaries`}
              </EditorialButton>

              {summariesError && (
                <p className="text-body text-accent-red" role="alert">
                  {summariesError}
                </p>
              )}
            </div>
          </div>
        </EditorialSection>
      )}

      {stats && stats.completedWithoutSummary > 0 && <RuledDivider weight="thick" spacing="sm" />}

      <EditorialSection spacing="md" id="insights">
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

          {(() => {
            // Prerequisites for generating insights
            const hasCompletedInterviews = stats && stats.completed > 0;
            const allSummariesGenerated = stats && stats.completedWithoutSummary === 0;
            const canGenerateInsights = hasCompletedInterviews && allSummariesGenerated;
            const canDownloadPdf = !!analysis;

            return (
              <div className="border-l-4 border-ink pl-6 py-2 space-y-4">
                {/* Prerequisite warnings - shown ABOVE actions */}
                {!hasCompletedInterviews && (
                  <div className="p-3 bg-ink/5 border-l-4 border-ink-soft">
                    <p className="text-body text-ink-soft">
                      Complete at least one interview to generate insights.
                    </p>
                  </div>
                )}
                {hasCompletedInterviews && !allSummariesGenerated && stats && (
                  <div className="p-3 bg-accent-red/5 border-l-4 border-accent-red">
                    <p className="text-body text-accent-red">
                      Generate all interview summaries first ({stats.completedWithoutSummary} missing).
                      Use the button in the &quot;Action Needed&quot; section above.
                    </p>
                  </div>
                )}

                {/* Coverage and freshness info */}
                {analysis ? (
                  <div className="space-y-2">
                    <p className="text-body text-ink-soft">
                      {analysis.coverage ? (
                        <>
                          Generated from {analysis.coverage.totalInterviews} completed interview
                          {analysis.coverage.totalInterviews === 1 ? "" : "s"}
                          {coverageText && ` (${coverageText})`} -{" "}
                        </>
                      ) : (
                        <>Generated - </>
                      )}
                      {new Date(analysis.generatedAt).toLocaleString()}
                    </p>
                    {stats && stats.newSinceAnalysis > 0 && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 border-2 border-accent-red bg-accent-red/5 rounded">
                        <span className="text-label font-sans font-semibold uppercase tracking-label text-accent-red">
                          Warning: Stale
                        </span>
                        <span className="text-body text-ink-soft">
                          {stats.newSinceAnalysis} new interview
                          {stats.newSinceAnalysis === 1 ? "" : "s"} since last analysis
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-body text-ink-soft">
                    {hasCompletedInterviews ? (
                      <>
                        Ready to generate insights from {stats?.completed} completed interview
                        {stats?.completed === 1 ? "" : "s"}
                        {coverageText && ` (${coverageText})`}
                      </>
                    ) : (
                      <>No completed interviews yet.</>
                    )}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {canDownloadPdf ? (
                    <PDFDownloadLink
                      document={
                        <ProjectInsightsPdf
                          projectName={project.name}
                          subjectName={project.subjectName}
                          subjectRole={project.subjectRole ?? undefined}
                          templateName={project.template?.name ?? undefined}
                          analysis={analysis ?? undefined}
                          segmentedAnalysis={segmentedAnalysisForPdf}
                          responsesByQuestion={responsesByQuestion}
                          transcripts={transcripts}
                          coverageText={coverageText}
                          surveys={surveysForPdf}
                        />
                      }
                      fileName={pdfFileName}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
                    </PDFDownloadLink>
                  ) : (
                    <EditorialButton
                      type="button"
                      variant="outline"
                      disabled
                      title="Generate insights first to download PDF"
                    >
                      Download PDF
                    </EditorialButton>
                  )}

                  <EditorialButton
                    type="button"
                    onClick={() => void onGenerateInsights()}
                    disabled={generatingInsights || !canGenerateInsights}
                    variant="primary"
                    title={!canGenerateInsights ? "Complete prerequisites above first" : undefined}
                  >
                    {generatingInsights
                      ? "Generating..."
                      : analysis
                        ? "Regenerate insights"
                        : "Generate insights"}
                  </EditorialButton>
                </div>

                {insightsError && (
                  <p className="text-body text-accent-red" role="alert">
                    {insightsError}
                  </p>
                )}
              </div>
            );
          })()}

          {analysis && (
            <div className="space-y-8">
              {project.segmentedAnalysis && project.segmentedAnalysis.length > 0 && (
                <div className="flex flex-wrap gap-3 border-t-3 border-ink pt-6">
                  <EditorialButton
                    type="button"
                    onClick={() => setActiveSegment(null)}
                    variant={activeSegment === null ? "primary" : "outline"}
                    size="small"
                  >
                    Overall {analysis.coverage && `(${analysis.coverage.totalInterviews})`}
                  </EditorialButton>
                  {project.segmentedAnalysis.map((segment) => (
                    <EditorialButton
                      key={segment.relationshipType}
                      type="button"
                      onClick={() => setActiveSegment(segment.relationshipType)}
                      variant={
                        activeSegment === segment.relationshipType
                          ? "primary"
                          : "outline"
                      }
                      size="small"
                    >
                      {segment.relationshipLabel} ({segment.basedOnSurveyCount})
                    </EditorialButton>
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
                    {activeAnalysis.summary && (
                      <div className="space-y-3">
                        <EditorialLabel>Summary</EditorialLabel>
                        <p className="text-body text-ink-soft whitespace-pre-wrap">
                          {activeAnalysis.summary}
                        </p>
                      </div>
                    )}

                    {activeAnalysis.narrative && (
                      <div className="space-y-3">
                        <EditorialLabel>Narrative</EditorialLabel>
                        <p className="text-body text-ink-soft whitespace-pre-wrap italic">
                          {activeAnalysis.narrative}
                        </p>
                      </div>
                    )}

                    {activeAnalysis.strengths && activeAnalysis.strengths.length > 0 && (
                      <div className="space-y-3">
                        <EditorialLabel>Strengths</EditorialLabel>
                        <div className="space-y-4">
                          {activeAnalysis.strengths.map((strength: Analysis["strengths"][number], idx: number) => (
                          <div key={idx} className="border-l-4 border-ink pl-4 space-y-2">
                            <p className="text-body font-medium text-ink">{strength.point}</p>
                            {strength.quote && (
                              <p className="text-body-sm text-ink-soft italic">
                                &quot;{strength.quote}&quot;
                              </p>
                            )}
                            {strength.frequency && (
                              <p className="text-label uppercase text-ink-soft">
                                Mentioned by {strength.frequency} respondent
                                {strength.frequency === 1 ? "" : "s"}
                              </p>
                            )}
                          </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeAnalysis.improvements && activeAnalysis.improvements.length > 0 && (
                      <div className="space-y-3">
                        <EditorialLabel>Areas for improvement</EditorialLabel>
                        <div className="space-y-5">
                          {activeAnalysis.improvements.map((improvement: Analysis["improvements"][number], idx: number) => (
                          <div key={idx} className="border-l-4 border-accent-red pl-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-body font-medium text-ink">{improvement.point}</p>
                              <span className={`text-label uppercase px-2 py-1 rounded ${
                                improvement.priority === "high"
                                  ? "bg-accent-red/10 text-accent-red"
                                  : improvement.priority === "medium"
                                  ? "bg-yellow-500/10 text-yellow-700"
                                  : "bg-ink-soft/10 text-ink-soft"
                              }`}>
                                {improvement.priority}
                              </span>
                            </div>
                            <div className="pl-3 space-y-2">
                              <p className="text-body-sm text-ink">
                                <span className="font-semibold">Action: </span>
                                {improvement.action}
                              </p>
                              {improvement.quote && (
                                <p className="text-body-sm text-ink-soft italic">
                                  &quot;{improvement.quote}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      {/* Raw Feedback Section - Collapsible */}
      {responsesByQuestion && responsesByQuestion.length > 0 && (
        <>
          <EditorialSection spacing="md" id="raw-feedback">
            <div className="max-w-[900px] mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-3">
                  <EditorialLabel>Raw feedback</EditorialLabel>
                  <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                    What people said
                  </h2>
                  <p className="text-body text-ink-soft max-w-2xl">
                    Responses organized by interview questions, ordered by relationship type.
                  </p>
                </div>
                <EditorialButton
                  type="button"
                  onClick={() => setRawFeedbackExpanded(!rawFeedbackExpanded)}
                  variant="outline"
                  size="small"
                >
                  {rawFeedbackExpanded ? "Collapse" : `Show all (${responsesByQuestion.reduce((sum, q) => sum + q.responses.length, 0)} responses)`}
                </EditorialButton>
              </div>

              {rawFeedbackExpanded && (
                <>
                  {coverageText && (
                    <div className="border-l-4 border-ink pl-6 py-2">
                      <p className="text-body text-ink-soft">Based on {coverageText}</p>
                    </div>
                  )}

                  <div className="space-y-10">
                    {responsesByQuestion.map((question, qIdx) => (
                      <div key={question.questionId} className="space-y-4">
                        <div className="space-y-2">
                          <EditorialLabel>Question {qIdx + 1}</EditorialLabel>
                          <h3 className="font-serif font-bold text-headline-sm leading-tight">
                            {question.questionText}
                          </h3>
                        </div>

                        {/* Rating Statistics */}
                        {question.questionType === "rating" && question.ratingStats && (
                          <div className="bg-ink/5 px-6 py-4 space-y-4">
                            <div className="space-y-2">
                              <p className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                                Rating Statistics
                              </p>
                              <div className="flex items-baseline gap-3">
                                <span className="font-serif text-[2.5rem] font-bold text-ink">
                                  {question.ratingStats.average.toFixed(1)}
                                </span>
                                <span className="text-body text-ink-soft">
                                  average rating
                                </span>
                              </div>
                            </div>

                            {/* Distribution */}
                            <div className="space-y-2">
                              <p className="text-label font-sans font-medium uppercase tracking-label text-ink-soft">
                                Distribution
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {Object.entries(question.ratingStats.distribution)
                                  .sort(([a], [b]) => Number(a) - Number(b))
                                  .map(([rating, count]) => (
                                    <div
                                      key={rating}
                                      className="flex items-center gap-2 px-3 py-2 bg-paper border-2 border-ink"
                                    >
                                      <span className="font-sans font-bold text-ink">
                                        {rating}
                                      </span>
                                      <span className="text-ink-lighter">×</span>
                                      <span className="font-sans text-ink-soft">
                                        {count}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t-3 border-ink pt-4 space-y-5">
                          {question.responses.map((response, rIdx) => (
                            <div key={`${response.surveyId}-${rIdx}`} className="space-y-2">
                              <p className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                                {response.relationshipLabel} - {response.respondentName}
                              </p>
                              <p className="text-body text-ink-soft pl-4 border-l-2 border-ink-soft/30">
                                {response.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!rawFeedbackExpanded && (
                <div className="border-l-4 border-ink-soft pl-6 py-2">
                  <p className="text-body text-ink-soft">
                    {responsesByQuestion.length} questions with {responsesByQuestion.reduce((sum, q) => sum + q.responses.length, 0)} total responses. Click &quot;Show all&quot; to view.
                  </p>
                </div>
              )}
            </div>
          </EditorialSection>

          <RuledDivider weight="thick" spacing="sm" />
        </>
      )}

      <EditorialSection spacing="md" id="transcripts">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
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
            {sortedSurveys && sortedSurveys.length > TRANSCRIPTS_PER_PAGE && (
              <EditorialButton
                type="button"
                onClick={() => setShowAllTranscripts(!showAllTranscripts)}
                variant="outline"
                size="small"
              >
                {showAllTranscripts ? "Show fewer" : `Show all ${sortedSurveys.length}`}
              </EditorialButton>
            )}
          </div>

          {!sortedSurveys || sortedSurveys.length === 0 ? (
            <p className="text-body text-ink-soft">No interviews yet.</p>
          ) : (
            <>
              <div className="space-y-8">
                {(showAllTranscripts ? sortedSurveys : sortedSurveys.slice(0, TRANSCRIPTS_PER_PAGE)).map((survey) => {
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
                            <StatusBadge status={survey.status as "completed" | "in_progress" | "not_started"} />
                            <p className="text-body font-medium text-ink truncate">
                              {survey.respondentName ?? "Anonymous respondent"}
                            </p>
                          </div>
                          <p className="text-body text-ink-soft truncate">
                            Relationship - {relationshipLabel} - {summaryLabel}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <EditorialButton asChild variant="outline" size="small">
                            <Link href={`/admin/surveys/${survey._id}`}>
                              Transcript &amp; summary
                            </Link>
                          </EditorialButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!showAllTranscripts && sortedSurveys.length > TRANSCRIPTS_PER_PAGE && (
                <div className="border-l-4 border-ink-soft pl-6 py-2 flex items-center justify-between">
                  <p className="text-body text-ink-soft">
                    Showing {TRANSCRIPTS_PER_PAGE} of {sortedSurveys.length} interviews.
                  </p>
                  <EditorialButton
                    type="button"
                    onClick={() => setShowAllTranscripts(true)}
                    variant="ghost"
                    size="small"
                  >
                    Show all
                  </EditorialButton>
                </div>
              )}
            </>
          )}
        </div>
      </EditorialSection>
    </div>
  );
}
