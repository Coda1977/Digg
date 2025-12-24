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
  EditorialBreadcrumbs,
  EditorialDataRow,
} from "@/components/editorial";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as Id<"projects">;
  const project = useQuery(api.projects.getById, { id: projectId });

  const createSurvey = useMutation(api.surveys.createFromProject);
  const removeSurvey = useMutation(api.surveys.remove);
  const closeProject = useMutation(api.projects.close);
  const reopenProject = useMutation(api.projects.reopen);
  const removeProject = useMutation(api.projects.remove);

  const [origin, setOrigin] = useState("");
  const [newSurveyLink, setNewSurveyLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null);
  const [deletingSurveyId, setDeletingSurveyId] = useState<Id<"surveys"> | null>(
    null
  );

  // Copy feedback hooks
  const { copied: shareLinkCopied, onCopy: copyShareLink } = useCopyFeedback();
  const { copied: newLinkCopied, onCopy: copyNewLink } = useCopyFeedback();

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

  async function onDeleteSurvey(surveyId: Id<"surveys">) {
    if (!confirm("Delete this interview and all related messages?")) {
      return;
    }

    setError(null);
    setDeletingSurveyId(surveyId);
    try {
      await removeSurvey({ id: surveyId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete interview");
    } finally {
      setDeletingSurveyId(null);
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
    <div className="max-w-[900px] mx-auto space-y-12">
      {/* Header Section */}
      <section className="space-y-6">
        <EditorialBreadcrumbs
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: project.subjectName },
          ]}
        />
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <EditorialHeadline as="h1" size="lg">
                  {project.subjectName}
                </EditorialHeadline>
                <StatusBadge status={project.status as "active" | "closed"} />
              </div>
              <div className="flex items-center gap-2 text-body text-ink-soft">
                {project.subjectRole && <span>{project.subjectRole}</span>}
                {project.template?.name && <span>- {project.template.name}</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <EditorialButton variant="secondary" asChild>
                <Link href={`/admin/projects/${projectId}/analysis`}>
                  View Analysis
                </Link>
              </EditorialButton>
              <EditorialButton
                type="button"
                variant="outline"
                onClick={() => void onToggleStatus()}
                disabled={busy}
              >
                {project.status === "active" ? "Close" : "Reopen"}
              </EditorialButton>
            </div>
          </div>
        </div>
      </section>

      <RuledDivider />

      {error && (
        <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
          <p className="text-body text-accent-red">{error}</p>
        </div>
      )}

      {/* Share Section - Compact */}
      <section className="bg-paper border border-ink/10 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <EditorialLabel>Share Project</EditorialLabel>
            <p className="text-body text-ink-soft mt-1">
              Send this link to anyone to collect their feedback.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <EditorialInput readOnly value={projectShareLink} className="flex-1 md:w-[300px]" />
            <EditorialButton
              type="button"
              variant="outline"
              onClick={() => void copyShareLink(projectShareLink)}
            >
              {shareLinkCopied ? "Copied!" : "Copy"}
            </EditorialButton>
          </div>
        </div>
      </section>

      {/* Interviews List */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <EditorialLabel>Interviews ({surveys ? surveys.length : 0})</EditorialLabel>
          <button
            type="button"
            onClick={() => void onCreateInviteLink()}
            disabled={busy}
            className="text-label font-medium text-ink hover:text-accent-red transition-colors disabled:opacity-50"
          >
            + Create individual invite
          </button>
        </div>

        {newSurveyLink && (
          <div className="bg-ink/5 p-4 border border-ink/10 flex items-center justify-between gap-4 mb-6">
            <span className="text-body text-ink">New invite link created:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-paper px-2 py-1 rounded">{newSurveyLink}</code>
              <button
                onClick={() => void copyNewLink(newSurveyLink)}
                className="text-label underline"
              >
                {newLinkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {!surveys || surveys.length === 0 ? (
          <div className="py-12 text-center border-t border-ink/10">
            <p className="text-body text-ink-soft">
              No interviews yet. Share the link above to start collecting responses.
            </p>
          </div>
        ) : (
          <div>
            {surveys.map((s) => {
              const relationshipLabel = s.relationship
                ? relationshipOptions.find((r) => r.id === s.relationship)?.label ??
                s.relationship
                : "Unknown Relationship";

              const surveyLink = origin
                ? `${origin}/survey/${s.uniqueId}`
                : `/survey/${s.uniqueId}`;

              return (
                <EditorialDataRow
                  key={s._id}
                  status={
                    <StatusBadge status={s.status as "completed" | "in_progress" | "not_started"} />
                  }
                  title={s.respondentName || "Anonymous"}
                  meta={
                    <>
                      <span>{relationshipLabel}</span>
                      <span className="text-ink-lighter font-mono text-xs">{s.uniqueId}</span>
                    </>
                  }
                  actions={
                    <>
                      <EditorialButton
                        type="button"
                        variant="outline"
                        size="small"
                        onClick={async () => {
                          await navigator.clipboard.writeText(surveyLink);
                          setCopiedSurveyId(s._id);
                          setTimeout(() => setCopiedSurveyId(null), 1500);
                        }}
                      >
                        {copiedSurveyId === s._id ? "Copied!" : "Copy Link"}
                      </EditorialButton>
                      <EditorialButton variant="outline" size="small" asChild>
                        <Link href={`/admin/surveys/${s._id}`}>Transcript</Link>
                      </EditorialButton>
                      <EditorialButton
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => void onDeleteSurvey(s._id)}
                        disabled={deletingSurveyId === s._id}
                      >
                        {deletingSurveyId === s._id ? "Deleting..." : "Delete"}
                      </EditorialButton>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <RuledDivider weight="thin" />

      <section className="pt-4 pb-12">
        <button
          type="button"
          onClick={() => void onDeleteProject()}
          disabled={busy}
          className="text-label text-accent-red hover:text-red-700 transition-colors"
        >
          Delete this project
        </button>
      </section>
    </div>
  );
}
