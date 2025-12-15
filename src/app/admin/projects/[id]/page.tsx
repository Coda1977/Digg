"use client";

import { useMemo, useState } from "react";
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

  const [newSurveyLink, setNewSurveyLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const surveys = useMemo(() => {
    if (!project?.surveys) return null;
    return [...project.surveys].sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  }, [project?.surveys]);

  async function onCreateSurvey() {
    setError(null);
    setBusy(true);
    try {
      const result = await createSurvey({ projectId });
      const link = `${window.location.origin}/survey/${result.uniqueId}`;
      setNewSurveyLink(link);
      await navigator.clipboard.writeText(link).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create survey");
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
    if (!confirm("Delete this project and all related surveys/messages?")) return;
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
          <Skeleton className="h-10 w-28" />
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
            This project ID doesn’t exist or you don’t have access.
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.subjectName}
            {project.subjectRole ? ` · ${project.subjectRole}` : ""} ·{" "}
            {project.template?.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Survey links</CardTitle>
          <CardDescription>
            Create a unique link for each respondent and send it to them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void onCreateSurvey()} disabled={busy}>
              {busy ? "Working…" : "Create survey link"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void onToggleStatus()}
              disabled={busy}
            >
              {project.status === "active" ? "Close project" : "Reopen project"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void onDeleteProject()}
              disabled={busy}
            >
              Delete project
            </Button>
          </div>

          {newSurveyLink && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Newest link (copied)</p>
              <div className="flex gap-2">
                <Input readOnly value={newSurveyLink} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigator.clipboard.writeText(newSurveyLink)}
                >
                  Copy
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={newSurveyLink} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Surveys</CardTitle>
          <CardDescription>
            Track progress and open respondent links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!surveys || surveys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No surveys created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {surveys.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(s.status)}>
                        {s.status}
                      </Badge>
                      <p className="text-sm font-medium truncate">
                        /survey/{s.uniqueId}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.respondentName ? `Respondent: ${s.respondentName}` : "No respondent name"}
                      {s.relationship ? ` · Relationship: ${s.relationship}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/survey/${s.uniqueId}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
