"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialCard,
  EditorialButton,
} from "@/components/editorial";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.list);
  const deleteTemplate = useMutation(api.templates.remove);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Id<"templates"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (templates === undefined) {
    return (
      <EditorialSection spacing="lg">
        <div className="animate-pulse space-y-editorial-md">
          <div className="h-16 bg-ink/5 w-2/3" />
          <RuledDivider weight="thick" spacing="sm" />
          <div className="h-40 bg-ink/5" />
        </div>
      </EditorialSection>
    );
  }

  const builtInTemplates = templates.filter((t) => t.isBuiltIn);
  const customTemplates = templates.filter((t) => !t.isBuiltIn);

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
        <div className="space-y-6">
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

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <>
          <EditorialSection spacing="lg">
            <div className="space-y-6">
              <div>
                <EditorialLabel>Custom Templates</EditorialLabel>
                <p className="text-body text-ink-soft mt-2">
                  Templates you've created for your specific needs
                </p>
              </div>
              <div className="grid gap-4">
                {customTemplates.map((template) => (
                  <EditorialCard key={template._id} hover>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-headline-xs mb-2">
                          {template.name}
                        </h3>
                        <p className="text-body text-ink-soft mb-3">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-label uppercase tracking-label text-ink-soft">
                          <span>{template.questions.length} Questions</span>
                          <span>·</span>
                          <span>{template.relationshipOptions.length} Relationship Types</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/templates/${template._id}/edit`)}
                          className="border-2 border-ink/20 hover:border-ink hover:bg-ink hover:text-paper"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(template._id)}
                          className="border-2 border-accent-red/20 text-accent-red hover:border-accent-red hover:bg-accent-red hover:text-paper"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </EditorialCard>
                ))}
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
              {builtInTemplates.map((template) => (
                <EditorialCard key={template._id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-headline-xs mb-2">
                        {template.name}
                      </h3>
                      <p className="text-body text-ink-soft mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-label uppercase tracking-label text-ink-soft">
                        <span>{template.questions.length} Questions</span>
                        <span>·</span>
                        <span>{template.relationshipOptions.length} Relationship Types</span>
                      </div>
                    </div>
                  </div>
                </EditorialCard>
              ))}
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
              Are you sure you want to delete "{templateToDeleteData?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-start gap-3 p-4 bg-accent-red/10 border-l-4 border-accent-red">
              <AlertCircle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-body text-accent-red">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
