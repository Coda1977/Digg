"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Summary = {
  overview: string;
  keyThemes: string[];
  sentiment: "positive" | "mixed" | "negative";
  specificPraise: string[];
  areasForImprovement: string[];
};

type UiMessage = {
  role: "assistant" | "user";
  content: string;
};

function statusBadgeVariant(status: string): "default" | "secondary" {
  return status === "completed" ? "default" : "secondary";
}

async function requestSurveySummary(input: {
  subjectName: string;
  subjectRole?: string | null;
  relationshipLabel?: string | null;
  messages: UiMessage[];
}) {
  const res = await fetch("/api/surveys/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => null)) as Summary | { error: string } | null;
  if (!res.ok) {
    const errorMessage =
      body && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new Error(errorMessage);
  }

  if (!body || typeof body !== "object") {
    throw new Error("Bad response from server");
  }

  return body as Summary;
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
        subjectRole: survey.project.subjectRole ?? null,
        relationshipLabel,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (survey === null) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Survey not found</CardTitle>
          <CardDescription>
            This survey ID doesn&apos;t exist or you don&apos;t have access.
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

  const canGenerateSummary =
    survey.status === "completed" && uiMessages && uiMessages.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Interview</h1>
          <p className="text-sm text-muted-foreground">
            {survey.project.name} · {survey.project.subjectName}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(survey.status)}>{survey.status}</Badge>
            <p className="text-xs text-muted-foreground truncate">
              {survey.respondentName ?? "Anonymous respondent"}
              {relationshipLabel ? ` · ${relationshipLabel}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/projects/${survey.project._id}`}>Back to project</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Respondent link</CardTitle>
          <CardDescription>
            This is the public link the respondent used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {respondentLink && (
            <div className="flex gap-2">
              <Input readOnly value={respondentLink} />
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(respondentLink)}
              >
                Copy
              </Button>
              <Button asChild type="button" variant="outline">
                <a href={respondentLink} target="_blank" rel="noreferrer">
                  Open
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">AI summary</CardTitle>
          <CardDescription>
            Generates a structured summary (themes, praise, improvements) from the transcript.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => void onGenerateSummary()}
              disabled={!canGenerateSummary || summaryBusy}
            >
              {survey.summary ? "Regenerate summary" : "Generate summary"}
            </Button>
            {!canGenerateSummary && (
              <p className="text-xs text-muted-foreground">
                Available after the interview is completed.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryError && (
            <div className="text-sm text-destructive" role="alert">
              {summaryError}
            </div>
          )}

          {!survey.summary ? (
            <p className="text-sm text-muted-foreground">
              No summary saved yet.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Overview</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {survey.summary.overview}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Key themes</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {survey.summary.keyThemes.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sentiment</p>
                  <p className="text-sm text-muted-foreground">
                    {survey.summary.sentiment}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Specific praise</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {survey.summary.specificPraise.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Areas for improvement</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {survey.summary.areasForImprovement.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Transcript</CardTitle>
          <CardDescription>Raw interview messages in order.</CardDescription>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onCopyTranscript}>
              {copied ? "Copied" : "Copy transcript"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!survey.messages || survey.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            survey.messages.map((m) => (
              <div
                key={m._id}
                className={
                  m.role === "assistant"
                    ? "flex justify-start"
                    : "flex justify-end"
                }
              >
                <div
                  className={
                    m.role === "assistant"
                      ? "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
                      : "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
