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
import { EditorialConfirmDialog } from "@/components/editorial/EditorialConfirmDialog";
import { EditorialEmptyState } from "@/components/editorial/EditorialEmptyState";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import { MessageSquare, Trash2 } from "lucide-react";

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

  // Confirmation dialog states
  const [projectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false);
  const [surveyDeleteDialogOpen, setSurveyDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Id<"surveys"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  function handleDeleteProjectClick() {
    setDeleteError(null);
    setProjectDeleteDialogOpen(true);
  }

  async function handleDeleteProjectConfirm() {
    setDeleteError(null);
    setBusy(true);
    try {
      await removeProject({ id: projectId });
      setProjectDeleteDialogOpen(false);
      router.replace("/admin");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteSurveyClick(surveyId: Id<"surveys">) {
    setSurveyToDelete(surveyId);
    setDeleteError(null);
    setSurveyDeleteDialogOpen(true);
  }

  async function handleDeleteSurveyConfirm() {
    if (!surveyToDelete) return;

    setDeleteError(null);
    setDeletingSurveyId(surveyToDelete);
    try {
      await removeSurvey({ id: surveyToDelete });
      setSurveyDeleteDialogOpen(false);
      setSurveyToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete interview");
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-label font-medium uppercase tracking-label text-ink-soft mb-2">
                <Link href="/admin" className="hover:text-ink transition-colors">Dashboard</Link>
                <span className="text-ink-lighter">/</span>
                <span className="text-ink">{project.subjectName}</span>
              </div>
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
              variant={shareLinkCopied ? "secondary" : "outline"} // Visual shift
              onClick={() => void copyShareLink(projectShareLink)}
              className={shareLinkCopied ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300" : ""}
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
          <EditorialEmptyState
            icon={<MessageSquare className="h-10 w-10" />}
            title="No interviews yet"
            description="Share the project link above to start collecting feedback responses."
            className="border-t border-ink/10"
          />
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
                        variant="destructive"
                        size="small"
                        onClick={() => handleDeleteSurveyClick(s._id)}
                        disabled={deletingSurveyId === s._id}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <EditorialButton
          type="button"
          variant="destructive"
          size="small"
          onClick={handleDeleteProjectClick}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" />
          Delete this project
        </EditorialButton>
      </section>

      {/* Delete Project Confirmation Dialog */}
      <EditorialConfirmDialog
        open={projectDeleteDialogOpen}
        onOpenChange={setProjectDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project?.subjectName}"? This will permanently delete all interviews and messages associated with this project.`}
        confirmLabel="Delete Project"
        isDestructive
        isLoading={busy}
        error={deleteError}
        onConfirm={handleDeleteProjectConfirm}
      />

      {/* Delete Survey Confirmation Dialog */}
      <EditorialConfirmDialog
        open={surveyDeleteDialogOpen}
        onOpenChange={setSurveyDeleteDialogOpen}
        title="Delete Interview"
        description="Are you sure you want to delete this interview? All messages will be permanently deleted."
        confirmLabel="Delete Interview"
        isDestructive
        isLoading={deletingSurveyId !== null}
        error={deleteError}
        onConfirm={handleDeleteSurveyConfirm}
      />
    </div>
  );
}
