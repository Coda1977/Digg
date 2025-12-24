"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Plus, AlertCircle } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { Label } from "@/components/ui/label";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialButton,
  EditorialInput,
  EditorialTextarea,
  TemplateCard,
  EditorialBreadcrumbs, // Added
} from "@/components/editorial";
import { getErrorMessage } from "@/lib/errorHandling";

const COMMON_ROLES = [
  "Product Manager",
  "Engineering Manager",
  "Software Engineer",
  "Designer",
  "Data Scientist",
  "Director",
  "VP",
  "Team Lead",
  "Consultant",
  "Analyst",
];

export default function NewProjectPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.list);
  const seedTemplates = useMutation(api.seed.seedTemplates);
  const createProject = useMutation(api.projects.create);

  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectRole, setSubjectRole] = useState("");
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userModifiedName, setUserModifiedName] = useState(false);

  const templatesEmpty = templates !== undefined && templates.length === 0;
  const canSubmit = !!templateId && !!name && !!subjectName && !submitting;

  const sortedTemplates = useMemo(() => {
    if (!templates) return null;
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    if (!templateId || !templates) return null;
    return templates.find((t) => t._id === templateId) ?? null;
  }, [templateId, templates]);

  // Check for similar projects
  const similarProjects = useQuery(
    api.projects.findSimilar,
    templateId && subjectName
      ? { templateId: templateId as Id<"templates">, subjectName }
      : "skip"
  );

  // Smart project name suggestion
  useEffect(() => {
    if (!userModifiedName && selectedTemplate && subjectName) {
      const suggestedName = `${selectedTemplate.name} for ${subjectName}`;
      setName(suggestedName);
    }
  }, [selectedTemplate, subjectName, userModifiedName]);

  const filteredRoles = useMemo(() => {
    if (!subjectRole) return COMMON_ROLES;
    const search = subjectRole.toLowerCase();
    return COMMON_ROLES.filter((role) => role.toLowerCase().includes(search));
  }, [subjectRole]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const projectId = await createProject({
        templateId: templateId as Id<"templates">,
        name,
        description: description.trim() || undefined,
        subjectName,
        subjectRole: subjectRole.trim() || undefined,
      });
      router.replace(`/admin/projects/${projectId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create project"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSeed() {
    setError(null);
    setSubmitting(true);
    try {
      await seedTemplates({});
    } catch (err) {
      setError(getErrorMessage(err, "Failed to seed templates"));
    } finally {
      setSubmitting(false);
    }
  }

  if (templates === undefined) {
    return (
      <EditorialSection spacing="lg">
        <div className="animate-pulse max-w-[900px] mx-auto space-y-6">
          <div className="h-4 bg-ink/5 w-40" />
          <div className="h-12 bg-ink/5 w-2/3" />
          <div className="h-4 bg-ink/5 w-full max-w-xl" />
          <RuledDivider weight="thick" spacing="sm" />
          <div className="space-y-4">
            <div className="h-4 bg-ink/5 w-32" />
            <div className="h-14 bg-ink/5 w-full" />
            <div className="h-4 bg-ink/5 w-32" />
            <div className="h-14 bg-ink/5 w-full" />
            <div className="h-14 bg-ink/5 w-48" />
          </div>
        </div>
      </EditorialSection>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="space-y-6">
        <EditorialBreadcrumbs
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "New Project" },
          ]}
        />
        <div>
          <EditorialHeadline as="h1" size="lg">
            New Project
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft mt-3">
            Configure your feedback project in 3 steps.
          </p>
        </div>
      </div>

      <RuledDivider weight="thick" />

      {templatesEmpty && (
        <div className="border-l-4 border-accent-red pl-6 py-4 space-y-4 bg-paper">
          <EditorialLabel accent>Setup Required</EditorialLabel>
          <h2 className="font-serif font-bold text-headline-sm">
            No templates found
          </h2>
          <p className="text-body text-ink-soft">
            You need to seed the built-in survey templates first.
          </p>
          <div className="pt-2">
            <EditorialButton
              type="button"
              onClick={() => void onSeed()}
              disabled={submitting}
              variant="primary"
            >
              <Plus className="h-5 w-5" />
              Seed templates
            </EditorialButton>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={onSubmit} className="space-y-12 pb-20">

        {/* Step 1: Template */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>01 - Survey Type</EditorialLabel>
            <p className="text-body text-ink-soft">Select the template that best fits your needs.</p>
          </div>

          <div className="space-y-4">
            {sortedTemplates?.map((template) => (
              <TemplateCard
                key={template._id}
                selected={templateId === template._id}
                title={template.name}
                description={template.description}
                onSelect={() => setTemplateId(template._id)}
              />
            ))}
          </div>
        </section>

        <RuledDivider weight="thin" />

        {/* Step 2: Subject */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>02 - Subject</EditorialLabel>
            <p className="text-body text-ink-soft">Who is this feedback for?</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="subjectName" className="uppercase tracking-widest text-xs font-bold text-ink-soft">Name</Label>
              <EditorialInput
                id="subjectName"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
              />
            </div>
            <div className="space-y-3 relative">
              <Label htmlFor="subjectRole" className="uppercase tracking-widest text-xs font-bold text-ink-soft">Role (Optional)</Label>
              <EditorialInput
                id="subjectRole"
                value={subjectRole}
                onChange={(e) => setSubjectRole(e.target.value)}
                onFocus={() => setShowRoleSuggestions(true)}
                onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                placeholder="e.g. Product Manager"
              />
              {showRoleSuggestions && filteredRoles.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-paper border-3 border-ink max-h-60 overflow-y-auto shadow-lg">
                  {filteredRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className="w-full text-left px-5 py-3 text-base hover:bg-ink/5 transition-colors"
                      onMouseDown={() => {
                        setSubjectRole(role);
                        setShowRoleSuggestions(false);
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {similarProjects && similarProjects.length > 0 && (
            <div className="flex gap-3 bg-amber-50 p-4 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> You already have {similarProjects.length} active project{similarProjects.length > 1 ? "s" : ""} for {subjectName} with this template.
              </div>
            </div>
          )}
        </section>

        <RuledDivider weight="thin" />

        {/* Step 3: Project Details */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>03 - Details</EditorialLabel>
            <p className="text-body text-ink-soft">Finalize the project settings.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="uppercase tracking-widest text-xs font-bold text-ink-soft">Project Name</Label>
              <EditorialInput
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setUserModifiedName(true);
                }}
                placeholder="e.g. 360 Feedback for Jane Doe"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="uppercase tracking-widest text-xs font-bold text-ink-soft">Description (Optional)</Label>
              <EditorialTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal notes about this review cycle..."
                rows={3}
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="text-accent-red font-medium" role="alert">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 fixed bottom-0 left-0 right-0 p-4 bg-paper/80 backdrop-blur-md border-t border-ink/10 sm:static sm:bg-transparent sm:border-0 sm:p-0">
          <EditorialButton variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/admin">Cancel</Link>
          </EditorialButton>
          <EditorialButton
            type="submit"
            disabled={!canSubmit}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            {submitting ? "Creating..." : "Create Project"}
          </EditorialButton>
        </div>
      </form>
    </div>
  );
}
