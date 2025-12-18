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
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <EditorialLabel>Projects</EditorialLabel>
          <EditorialHeadline as="h1" size="lg">
            New Project
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Create a feedback project using one of the survey types (templates).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <EditorialButton variant="outline" asChild>
              <Link href="/admin">Back to dashboard</Link>
            </EditorialButton>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      {templatesEmpty && (
        <EditorialSection spacing="md">
          <div className="max-w-[900px] mx-auto border-l-4 border-accent-red pl-6 py-2 space-y-4">
            <EditorialLabel accent>Setup</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              No templates found
            </h2>
            <p className="text-body text-ink-soft">
              You probably haven&apos;t seeded the 4 built-in survey templates yet.
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
        </EditorialSection>
      )}

      <EditorialSection spacing="md" ruled>
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="space-y-3">
            <EditorialLabel>1. Choose Survey Type</EditorialLabel>
            <p className="text-body text-ink-soft max-w-2xl">
              Select the type of feedback you want to collect. Each template includes specific questions and interview prompts.
            </p>
          </div>

          <form className="space-y-8" onSubmit={onSubmit}>
            {/* Template Selection */}
            <div className="space-y-6">
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

            <RuledDivider weight="medium" spacing="xs" />

            <div className="space-y-3">
              <EditorialLabel>2. Project Details</EditorialLabel>
              <p className="text-body text-ink-soft max-w-2xl">
                Name your project and optionally add a description for context.
              </p>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
              >
                Project name
              </Label>
              <EditorialInput
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setUserModifiedName(true);
                }}
                placeholder="e.g. 360 feedback for Jane Doe"
                required
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
              >
                Description (optional)
              </Label>
              <EditorialTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Q1 2025 performance review cycle"
                rows={3}
              />
            </div>

            <RuledDivider weight="medium" spacing="xs" />

            <div className="space-y-3">
              <EditorialLabel>3. Subject Information</EditorialLabel>
              <p className="text-body text-ink-soft max-w-2xl">
                Enter details about the person receiving feedback.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label
                  htmlFor="subjectName"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Subject name
                </Label>
                <EditorialInput
                  id="subjectName"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-3 relative">
                <Label
                  htmlFor="subjectRole"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Subject role (optional)
                </Label>
                <EditorialInput
                  id="subjectRole"
                  value={subjectRole}
                  onChange={(e) => setSubjectRole(e.target.value)}
                  onFocus={() => setShowRoleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                  placeholder="e.g. Product Manager"
                />
                {showRoleSuggestions && filteredRoles.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-paper border-3 border-ink max-h-60 overflow-y-auto">
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
              <div className="border-l-4 border-amber-500 bg-amber-50 pl-6 pr-6 py-4" role="alert">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-body font-medium text-amber-900">
                      Similar project{similarProjects.length > 1 ? "s" : ""} found
                    </p>
                    <p className="text-body-sm text-amber-800">
                      You already have {similarProjects.length} project{similarProjects.length > 1 ? "s" : ""} for &quot;{subjectName}&quot; using this survey type:
                    </p>
                    <ul className="text-body-sm text-amber-800 list-disc list-inside">
                      {similarProjects.map((p) => (
                        <li key={p._id}>
                          <Link
                            href={`/admin/projects/${p._id}`}
                            className="underline hover:text-amber-900"
                          >
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
                <p className="text-body text-accent-red">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <EditorialButton
                type="submit"
                disabled={!canSubmit}
                variant="primary"
              >
                <Plus className="h-5 w-5" />
                {submitting ? "Creating…" : "Create project"}
              </EditorialButton>
              <EditorialButton variant="outline" asChild>
                <Link href="/admin">Cancel</Link>
              </EditorialButton>
            </div>
          </form>
        </div>
      </EditorialSection>
    </div>
  );
}
