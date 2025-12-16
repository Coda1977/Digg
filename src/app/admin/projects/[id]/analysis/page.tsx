"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

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

function statusBadgeVariant(status: string): "default" | "secondary" {
  return status === "completed" ? "default" : "secondary";
}

export default function ProjectAnalysisPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  const project = useQuery(api.projects.getById, { id: projectId });
  const surveys = useQuery(api.surveys.getByProject, { projectId });

  const projectSharePath = `/p/${projectId}`;

  const sortedSurveys = useMemo(() => {
    if (!surveys) return null;
    return [...surveys].sort(
      (a, b) => (b.completedAt ?? b.startedAt ?? 0) - (a.completedAt ?? a.startedAt ?? 0)
    );
  }, [surveys]);

  const stats = useMemo(() => {
    if (!surveys) return null;
    const completed = surveys.filter((s) => s.status === "completed").length;
    const inProgress = surveys.filter((s) => s.status === "in_progress").length;
    return { total: surveys.length, completed, inProgress };
  }, [surveys]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Interviews &amp; analysis</h1>
          <p className="text-sm text-muted-foreground">
            {project.name} · {project.subjectName}
          </p>
          {stats && (
            <p className="text-xs text-muted-foreground">
              {stats.total} surveys · {stats.completed} completed ·{" "}
              {stats.inProgress} in progress
            </p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project share link</CardTitle>
          <CardDescription>
            Send this one link to a group (each visitor gets a unique survey).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={projectSharePath} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      new URL(projectSharePath, window.location.origin).toString()
                    )
                  }
                >
                  Copy
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={projectSharePath} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interviews</CardTitle>
          <CardDescription>
            Open transcripts and see (or generate) per-interview AI summaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!sortedSurveys || sortedSurveys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No surveys created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedSurveys.map((survey) => {
                const respondentPath = `/survey/${survey.uniqueId}`;
                const relationshipLabel =
                  project.template?.relationshipOptions.find(
                    (r) => r.id === survey.relationship
                  )?.label ??
                  survey.relationship ??
                  "—";
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
                        Relationship: {relationshipLabel} · {summaryLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={respondentPath} target="_blank" rel="noreferrer">
                          Respondent link
                        </a>
                      </Button>
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
