"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
  EditorialButton,
  EditorialInput,
  StatusBadge,
} from "@/components/editorial";

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
      (a, b) =>
        (b.completedAt ?? b.startedAt ?? 0) - (a.completedAt ?? a.startedAt ?? 0)
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
            <EditorialButton variant="outline" asChild>
              <Link href="/admin">Back to dashboard</Link>
            </EditorialButton>
          </div>
        </div>
      </EditorialSection>
    );
  }

  const relationshipOptions = project.template?.relationshipOptions ?? [];

  return (
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <EditorialLabel>Project</EditorialLabel>
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
            {project.template?.name ? ` · ${project.template.name}` : ""}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <EditorialButton variant="secondary" asChild>
              <Link href={`/admin/projects/${projectId}/analysis`}>
                Interviews &amp; analysis
              </Link>
            </EditorialButton>
            <EditorialButton variant="outline" asChild>
              <Link href="/admin">Back to dashboard</Link>
            </EditorialButton>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      {error && (
        <EditorialSection spacing="md">
          <div className="max-w-[900px] mx-auto border-l-4 border-accent-red pl-6 py-2">
            <EditorialLabel accent>Something went wrong</EditorialLabel>
            <p className="mt-3 text-body text-accent-red" role="alert">
              {error}
            </p>
          </div>
        </EditorialSection>
      )}

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Share Link</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Send one link to everyone
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              This is the one link you share. Each person who opens it gets their own
              private interview, so answers don&apos;t mix.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <EditorialInput readOnly value={projectShareLink} />
            <div className="flex flex-col sm:flex-row gap-3">
              <EditorialButton
                type="button"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(projectShareLink)}
              >
                Copy
              </EditorialButton>
              <EditorialButton variant="outline" asChild>
                <a href={projectShareLink} target="_blank" rel="noreferrer">
                  Open
                </a>
              </EditorialButton>
            </div>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Interviews</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Responses and transcripts
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Each interview is one person&apos;s response. Use the links below to resend
              a specific interview link or open transcripts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body text-ink-soft max-w-xl">
              Optional: create an individual invite link (useful for reminders).
            </p>
            <EditorialButton
              type="button"
              variant="outline"
              onClick={() => void onCreateInviteLink()}
              disabled={busy}
            >
              {busy ? "Working…" : "Create invite link"}
            </EditorialButton>
          </div>

          {newSurveyLink && (
            <div className="border-l-4 border-ink pl-6 py-2 space-y-4">
              <EditorialLabel>Invite link copied</EditorialLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <EditorialInput readOnly value={newSurveyLink} />
                <div className="flex flex-col sm:flex-row gap-3">
                  <EditorialButton
                    type="button"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(newSurveyLink)}
                  >
                    Copy
                  </EditorialButton>
                  <EditorialButton variant="outline" asChild>
                    <a href={newSurveyLink} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </EditorialButton>
                </div>
              </div>
            </div>
          )}

          {!surveys || surveys.length === 0 ? (
            <p className="text-body text-ink-soft">
              No interviews yet. Share the link above to start collecting responses.
            </p>
          ) : (
            <div className="space-y-8">
              {surveys.map((s) => {
                const surveyLink = origin
                  ? `${origin}/survey/${s.uniqueId}`
                  : `/survey/${s.uniqueId}`;

                const relationshipLabel = s.relationship
                  ? relationshipOptions.find((r) => r.id === s.relationship)?.label ??
                    s.relationship
                  : null;

                return (
                  <article key={s._id} className="border-t-3 border-ink pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge
                            status={
                              s.status as "completed" | "in_progress" | "not_started"
                            }
                          />
                          <p className="text-body font-medium text-ink truncate">
                            {s.respondentName ?? "Anonymous respondent"}
                          </p>
                        </div>
                        <p className="text-body text-ink-soft truncate">
                          {relationshipLabel
                            ? `Relationship · ${relationshipLabel}`
                            : "Relationship · Not selected yet"}{" "}
                          · /survey/{s.uniqueId}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <EditorialButton
                          type="button"
                          variant="outline"
                          size="small"
                          onClick={() => void navigator.clipboard.writeText(surveyLink)}
                        >
                          Copy interview link
                        </EditorialButton>
                        <EditorialButton variant="outline" size="small" asChild>
                          <a href={surveyLink} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </EditorialButton>
                        <EditorialButton variant="outline" size="small" asChild>
                          <Link href={`/admin/surveys/${s._id}`}>Transcript</Link>
                        </EditorialButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>Project actions</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Controls
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Close the project to stop new interviews. Delete removes everything.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <EditorialButton
              type="button"
              variant="outline"
              onClick={() => void onToggleStatus()}
              disabled={busy}
            >
              {project.status === "active" ? "Close project" : "Reopen project"}
            </EditorialButton>
            <EditorialButton
              type="button"
              variant="primary"
              onClick={() => void onDeleteProject()}
              disabled={busy}
            >
              Delete project
            </EditorialButton>
          </div>
        </div>
      </EditorialSection>
    </div>
  );
}
