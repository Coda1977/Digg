"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { Input } from "@/components/ui/input";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
} from "@/components/editorial";
import {
  formatEnumLabel,
  sentimentBadgeClass,
  statusBadgeClass,
} from "@/lib/editorialBadges";
import { postJson } from "@/lib/http";
import { summarySchema, type Summary } from "@/lib/schemas";

type UiMessage = {
  role: "assistant" | "user";
  content: string;
};

async function requestSurveySummary(input: {
  subjectName: string;
  subjectRole?: string;
  relationshipLabel?: string;
  messages: UiMessage[];
}): Promise<Summary> {
  return postJson("/api/surveys/summarize", input, summarySchema);
}

export default function AdminSurveyDetailPage() {
  const params = useParams();
  const surveyId = params.id as Id<"surveys">;

  const survey = useQuery(api.surveys.getById, { id: surveyId });
  const saveSummary = useMutation(api.surveys.saveSummary);

  const [origin, setOrigin] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const respondentLink = useMemo(() => {
    if (!survey) return null;
    const base = origin || "";
    return base ? `${base}/survey/${survey.uniqueId}` : `/survey/${survey.uniqueId}`;
  }, [origin, survey]);

  const relationshipLabel = useMemo(() => {
    if (!survey) return null;
    if (!survey.relationship) return null;
    return (
      survey.template.relationshipOptions.find((r) => r.id === survey.relationship)
        ?.label ?? survey.relationship
    );
  }, [survey]);

  const uiMessages = useMemo<UiMessage[] | null>(() => {
    if (!survey?.messages) return null;
    return survey.messages.map((m) => ({ role: m.role, content: m.content }));
  }, [survey?.messages]);

  async function onCopyTranscript() {
    if (!survey || !survey.messages) return;

    const text = survey.messages
      .map((m) => `${m.role === "assistant" ? "Assistant" : "Respondent"}: ${m.content}`)
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onGenerateSummary() {
    if (!survey) return;
    if (!uiMessages) return;
    if (summaryBusy) return;

    setSummaryError(null);
    setSummaryBusy(true);
    try {
      const summary = await requestSurveySummary({
        subjectName: survey.project.subjectName,
        subjectRole: survey.project.subjectRole ?? undefined,
        relationshipLabel: relationshipLabel ?? undefined,
        messages: uiMessages,
      });
      await saveSummary({ surveyId, summary });
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setSummaryBusy(false);
    }
  }

  if (survey === undefined) {
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

  if (survey === null) {
    return (
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto border-l-4 border-accent-red pl-6 py-2 space-y-4">
          <EditorialLabel accent>Not Found</EditorialLabel>
          <h1 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
            Interview not found
          </h1>
          <p className="text-body text-ink-soft">
            This interview ID doesn&apos;t exist or you don&apos;t have access.
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

  const canGenerateSummary =
    survey.status === "completed" && uiMessages && uiMessages.length > 0;

  const respondentName = survey.respondentName ?? "Anonymous respondent";
  const subjectName = survey.project.subjectName;

  return (
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <EditorialLabel>Interview</EditorialLabel>
            <span className={statusBadgeClass(survey.status)}>
              {formatEnumLabel(survey.status)}
            </span>
            {relationshipLabel && (
              <span className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                {relationshipLabel}
              </span>
            )}
          </div>

          <EditorialHeadline as="h1" size="lg">
            {respondentName}
          </EditorialHeadline>

          <p className="text-body text-ink-soft">
            {survey.project.name} · {subjectName}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href={`/admin/projects/${survey.project._id}/analysis`}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors"
            >
              Back to interviews &amp; analysis
            </Link>
            <Link
              href={`/admin/projects/${survey.project._id}`}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Back to project
            </Link>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Interview link</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              One-person link
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              This link opens this exact interview (useful to resend or resume). For a link
              you can share broadly, use the project share link on the project page.
            </p>
          </div>

          {respondentLink && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={respondentLink}
                className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(respondentLink)}
                  className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                >
                  Copy
                </button>
                <a
                  href={respondentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                >
                  Open
                </a>
              </div>
            </div>
          )}
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>AI summary</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Structured synthesis
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Generates themes, praise, and improvements based on the transcript.
            </p>
          </div>

          <div className="border-l-4 border-ink pl-6 py-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                {survey.summary ? (
                  <p className="text-body text-ink-soft">
                    Summary saved. Regenerate if you want an updated take.
                  </p>
                ) : (
                  <p className="text-body text-ink-soft">No summary saved yet.</p>
                )}

                {!canGenerateSummary && (
                  <p className="text-body text-ink-soft">
                    Available after the interview is completed.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void onGenerateSummary()}
                disabled={!canGenerateSummary || summaryBusy}
                className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {summaryBusy
                  ? "Generating..."
                  : survey.summary
                    ? "Regenerate summary"
                    : "Generate summary"}
              </button>
            </div>

            {summaryError && (
              <p className="text-body text-accent-red" role="alert">
                {summaryError}
              </p>
            )}
          </div>

          {survey.summary && (
            <div className="space-y-8 border-t-3 border-ink pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <EditorialLabel>Sentiment</EditorialLabel>
                <span className={sentimentBadgeClass(survey.summary.sentiment)}>
                  {survey.summary.sentiment}
                </span>
              </div>

              <div className="space-y-3">
                <EditorialLabel>Overview</EditorialLabel>
                <p className="text-body text-ink-soft whitespace-pre-wrap">
                  {survey.summary.overview}
                </p>
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-3">
                  <EditorialLabel>Key themes</EditorialLabel>
                  <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                    {survey.summary.keyThemes.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <EditorialLabel>Specific praise</EditorialLabel>
                  <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                    {survey.summary.specificPraise.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <EditorialLabel>Areas for improvement</EditorialLabel>
                  <ul className="list-disc pl-5 text-body text-ink-soft space-y-2">
                    {survey.summary.areasForImprovement.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-3">
              <EditorialLabel>Transcript</EditorialLabel>
              <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                Raw interview messages
              </h2>
              <p className="text-body text-ink-soft max-w-2xl">
                Full transcript in order (assistant questions and respondent answers).
              </p>
            </div>

            <button
              type="button"
              onClick={() => void onCopyTranscript()}
              className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              {copied ? "Copied" : "Copy transcript"}
            </button>
          </div>

          {!survey.messages || survey.messages.length === 0 ? (
            <p className="text-body text-ink-soft">No messages yet.</p>
          ) : (
            <div className="space-y-8">
              {survey.messages.map((m) => (
                <div
                  key={m._id}
                  className={
                    m.role === "assistant"
                      ? "border-l-4 border-ink pl-6 py-2"
                      : "bg-ink text-paper p-6 sm:ml-[60px]"
                  }
                >
                  <p
                    className={
                      m.role === "assistant"
                        ? "text-label font-sans font-semibold uppercase tracking-label text-ink-soft"
                        : "text-label font-sans font-semibold uppercase tracking-label text-ink-lighter"
                    }
                  >
                    {m.role === "assistant" ? "AI Interviewer" : "Respondent"}
                  </p>
                  <div
                    className={
                      m.role === "assistant"
                        ? "mt-3 text-body-lg text-ink whitespace-pre-wrap leading-relaxed"
                        : "mt-3 text-body-lg text-paper whitespace-pre-wrap leading-relaxed"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </EditorialSection>
    </div>
  );
}
