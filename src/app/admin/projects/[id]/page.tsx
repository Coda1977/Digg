"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function statusBadgeVariant(status: string): "default" | "secondary" {
  return status === "completed" ? "default" : "secondary";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as Id<"projects">;
  const project = useQuery(api.projects.getById, { id: projectId });

  const createSurvey = useMutation(api.surveys.createFromProject);
  const closeProject = useMutation(api.projects.close);
  const reopenProject = useMutation(api.projects.reopen);
  const removeProject = useMutation(api.projects.remove);

  const [origin, setOrigin] = useState("");
  const [newSurveyLink, setNewSurveyLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const projectShareLink = origin ? `${origin}/p/${projectId}` : `/p/${projectId}`;

  const surveys = useMemo(() => {
    if (!project?.surveys) return null;
    return [...project.surveys].sort(
      (a, b) => (b.completedAt ?? b.startedAt ?? 0) - (a.completedAt ?? a.startedAt ?? 0)
    );
  }, [project?.surveys]);

  async function onCreateInviteLink() {
    setError(null);
    setBusy(true);
    try {
      const result = await createSurvey({ projectId });
      const link = `${window.location.origin}/survey/${result.uniqueId}`;
      setNewSurveyLink(link);
      await navigator.clipboard.writeText(link).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite link");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleStatus() {
    if (!project) return;
    setError(null);
    setBusy(true);
    try {
      if (project.status === "active") await closeProject({ id: projectId });
      else await reopenProject({ id: projectId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteProject() {
    if (!confirm("Delete this project and all related interviews and messages?")) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await removeProject({ id: projectId });
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setBusy(false);
    }
  }

  if (project === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-60" />
        </div>
        <Skeleton className="h-48" />
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

  const relationshipOptions = project.template?.relationshipOptions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.subjectName}
            {project.subjectRole ? ` - ${project.subjectRole}` : ""} -{" "}
            {project.template?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/projects/${projectId}/analysis`}>
              Interviews &amp; analysis
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Share link (send to everyone)</CardTitle>
          <CardDescription>
            This is the one link you share. Each person who opens it gets their own
            private interview so answers don&apos;t mix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input readOnly value={projectShareLink} />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(projectShareLink)}
              >
                Copy
              </Button>
              <Button asChild type="button" variant="outline">
                <a href={projectShareLink} target="_blank" rel="noreferrer">
                  Open
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interviews</CardTitle>
          <CardDescription>
            Each interview is one person&apos;s response. Use the links below to resend
            a specific interview link or open transcripts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Optional: create an individual invite link (useful for reminders).
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onCreateInviteLink()}
              disabled={busy}
            >
              {busy ? "Working..." : "Create invite link"}
            </Button>
          </div>

          {newSurveyLink && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Invite link copied</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input readOnly value={newSurveyLink} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(newSurveyLink)}
                  >
                    Copy
                  </Button>
                  <Button asChild type="button" size="sm" variant="outline">
                    <a href={newSurveyLink} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!surveys || surveys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No interviews yet. Share the link above to start collecting responses.
            </p>
          ) : (
            <div className="space-y-2">
              {surveys.map((s) => {
                const surveyLink = origin
                  ? `${origin}/survey/${s.uniqueId}`
                  : `/survey/${s.uniqueId}`;

                const relationshipLabel = s.relationship
                  ? relationshipOptions.find((r) => r.id === s.relationship)?.label ??
                    s.relationship
                  : null;

                return (
                  <div
                    key={s._id}
                    className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                        <p className="text-sm font-medium truncate">
                          {s.respondentName ?? "Anonymous respondent"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {relationshipLabel
                          ? `Relationship: ${relationshipLabel}`
                          : "Relationship not selected yet"}{" "}
                        | /survey/{s.uniqueId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void navigator.clipboard.writeText(surveyLink)}
                      >
                        Copy interview link
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={surveyLink} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/admin/surveys/${s._id}`}>Transcript</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project actions</CardTitle>
          <CardDescription>
            Close the project to stop new interviews. Delete removes everything.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void onToggleStatus()} disabled={busy}>
            {project.status === "active" ? "Close project" : "Reopen project"}
          </Button>
          <Button type="button" variant="destructive" onClick={() => void onDeleteProject()} disabled={busy}>
            Delete project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

