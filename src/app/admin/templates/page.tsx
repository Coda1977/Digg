"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { Plus, Pencil, Trash2, AlertCircle, Search, Copy, ChevronDown, ChevronUp } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialButton,
  EditorialBreadcrumbs,
  EditorialInput,
} from "@/components/editorial";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function TemplatesPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.list);
  const deleteTemplate = useMutation(api.templates.remove);
  const duplicateTemplate = useMutation(api.templates.duplicate);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<Id<"templates">>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Id<"templates"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<Id<"templates"> | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!templates) return null;
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  function toggleQuestions(templateId: Id<"templates">) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  }

  async function handleDuplicate(templateId: Id<"templates">) {
    setIsDuplicating(templateId);
    try {
      const newId = await duplicateTemplate({ id: templateId });
      router.push(`/admin/templates/${newId}/edit`);
    } catch (err) {
      console.error("Failed to duplicate:", err);
    } finally {
      setIsDuplicating(null);
    }
  }

  if (templates === undefined) {
    return (
      <>
        <EditorialSection spacing="lg">
          <EditorialBreadcrumbs
            items={[{ label: "Admin", href: "/admin" }, { label: "Templates" }]}
          />
          <div className="animate-pulse space-y-editorial-md mt-6">
            <div className="h-16 bg-ink/5 w-2/3" />
            <RuledDivider weight="thick" spacing="sm" />
            <div className="h-40 bg-ink/5" />
          </div>
        </EditorialSection>
      </>
    );
  }

  const builtInTemplates = (filteredTemplates ?? []).filter((t) => t.isBuiltIn);
  const customTemplates = (filteredTemplates ?? []).filter((t) => !t.isBuiltIn);

  const handleDeleteClick = (templateId: Id<"templates">) => {
    setTemplateToDelete(templateId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteTemplate({ id: templateToDelete });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const templateToDeleteData = templates.find((t) => t._id === templateToDelete);

  return (
    <div>
      {/* Hero Section */}
      <EditorialSection spacing="lg">
        <EditorialBreadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Templates" }]}
        />
        <div className="space-y-6 mt-6">
          <EditorialLabel>Digg Admin</EditorialLabel>
          <EditorialHeadline as="h1" size="xl">
            Survey Templates
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Create and manage survey templates. Each template defines the questions,
            relationship types, and AI interviewer behavior for your feedback surveys.
          </p>
          <div className="pt-4">
            <EditorialButton variant="primary" asChild>
              <Link href="/admin/templates/new">
                <Plus className="h-5 w-5" />
                New Template
              </Link>
            </EditorialButton>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider />

      {/* Search */}
      {templates && templates.length > 0 && (
        <EditorialSection spacing="sm">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft pointer-events-none" />
            <EditorialInput
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
              aria-label="Search templates"
            />
          </div>
          {searchQuery.trim() && (
            <p className="text-body-sm text-ink-soft mt-2">
              Showing {builtInTemplates.length + customTemplates.length} of {templates.length} templates
            </p>
          )}
        </EditorialSection>
      )}

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <>
          <EditorialSection spacing="lg">
            <div className="space-y-6">
              <div>
                <EditorialLabel>Custom Templates</EditorialLabel>
                <p className="text-body text-ink-soft mt-2">
                  Templates you&apos;ve created for your specific needs
                </p>
              </div>
              <div className="grid gap-4">
                {customTemplates.map((template) => {
                  const isExpanded = expandedQuestions.has(template._id);
                  return (
                    <div key={template._id} className="border-l-4 border-ink pl-8 py-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-bold text-headline-xs mb-2">
                            {template.name}
                          </h3>
                          <p className="text-body text-ink-soft mb-3">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-label uppercase tracking-label text-ink-soft">
                            <button
                              type="button"
                              onClick={() => toggleQuestions(template._id)}
                              className="flex items-center gap-1 hover:text-ink transition-colors"
                              aria-expanded={isExpanded}
                            >
                              {template.questions.length} Questions
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            <span>-</span>
                            <span>{template.relationshipOptions.length} Relationship Types</span>
                            <span>-</span>
                            <span>
                              {template.projectCount === 0
                                ? "Not used"
                                : `Used by ${template.projectCount} project${template.projectCount === 1 ? "" : "s"}`}
                            </span>
                          </div>

                          {/* Question Preview */}
                          {isExpanded && (
                            <div className="mt-4 space-y-2 pl-4 border-l-2 border-ink/10">
                              {template.questions.map((q, idx) => (
                                <p key={q.id} className="text-body-sm text-ink-soft">
                                  <span className="font-medium text-ink">{idx + 1}.</span> {q.text}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <EditorialButton
                            variant="outline"
                            size="small"
                            onClick={() => router.push(`/admin/templates/${template._id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </EditorialButton>
                          <EditorialButton
                            variant="primary"
                            size="small"
                            onClick={() => handleDeleteClick(template._id)}
                            className="bg-accent-red border-accent-red hover:bg-red-700 hover:border-red-700"
                            aria-label={`Delete ${template.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </EditorialButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </EditorialSection>
          <RuledDivider />
        </>
      )}

      {/* Built-in Templates Section */}
      {builtInTemplates.length > 0 && (
        <EditorialSection spacing="lg">
          <div className="space-y-6">
            <div>
              <EditorialLabel>Built-in Templates</EditorialLabel>
              <p className="text-body text-ink-soft mt-2">
                Default templates provided by Digg (cannot be edited or deleted)
              </p>
            </div>
            <div className="grid gap-4">
              {builtInTemplates.map((template) => {
                const isExpanded = expandedQuestions.has(template._id);
                return (
                  <div key={template._id} className="border-l-4 border-ink pl-8 py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-headline-xs mb-2">
                          {template.name}
                        </h3>
                        <p className="text-body text-ink-soft mb-3">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-label uppercase tracking-label text-ink-soft">
                          <button
                            type="button"
                            onClick={() => toggleQuestions(template._id)}
                            className="flex items-center gap-1 hover:text-ink transition-colors"
                            aria-expanded={isExpanded}
                          >
                            {template.questions.length} Questions
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          <span>-</span>
                          <span>{template.relationshipOptions.length} Relationship Types</span>
                          <span>-</span>
                          <span>
                            {template.projectCount === 0
                              ? "Not used"
                              : `Used by ${template.projectCount} project${template.projectCount === 1 ? "" : "s"}`}
                          </span>
                        </div>

                        {/* Question Preview */}
                        {isExpanded && (
                          <div className="mt-4 space-y-2 pl-4 border-l-2 border-ink/10">
                            {template.questions.map((q, idx) => (
                              <p key={q.id} className="text-body-sm text-ink-soft">
                                <span className="font-medium text-ink">{idx + 1}.</span> {q.text}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <EditorialButton
                          variant="outline"
                          size="small"
                          onClick={() => void handleDuplicate(template._id)}
                          disabled={isDuplicating === template._id}
                        >
                          <Copy className="h-4 w-4" />
                          {isDuplicating === template._id ? "Duplicating..." : "Duplicate as Custom"}
                        </EditorialButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </EditorialSection>
      )}

      {/* Empty State */}
      {customTemplates.length === 0 && builtInTemplates.length === 0 && (
        <EditorialSection spacing="lg">
          <div className="text-center py-editorial-lg">
            <p className="text-body-lg text-ink-soft mb-6">
              No templates yet. Create your first template to get started.
            </p>
            <EditorialButton variant="primary" asChild>
              <Link href="/admin/templates/new">
                <Plus className="h-5 w-5" />
                Create Template
              </Link>
            </EditorialButton>
          </div>
        </EditorialSection>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDeleteData?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-start gap-3 p-4 bg-accent-red/10 border-l-4 border-accent-red">
              <AlertCircle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-body text-accent-red">{deleteError}</p>
            </div>
          )}

          <DialogFooter className="gap-3">
            <EditorialButton
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </EditorialButton>
            <EditorialButton
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-accent-red border-accent-red hover:bg-red-700 hover:border-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </EditorialButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TemplatesPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <TemplatesPage />
    </ErrorBoundary>
  );
}
