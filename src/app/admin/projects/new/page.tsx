"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Plus, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
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
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
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
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Back to dashboard
            </Link>
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
              <button
                type="button"
                onClick={() => void onSeed()}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-accent-red text-paper font-medium hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus className="h-5 w-5" />
                Seed templates
              </button>
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
            <div className="space-y-3">
              <Label
                htmlFor="template"
                className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
              >
                Survey Type
              </Label>
              <select
                id="template"
                className="flex h-14 w-full border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base text-ink focus:outline-none focus:ring-0 focus:border-accent-red transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a survey type…
                </option>
                {sortedTemplates?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="bg-ink/5 border-l-4 border-ink pl-6 pr-6 py-4 space-y-3">
                  <p className="text-body text-ink">
                    {selectedTemplate.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
                  >
                    {showTemplatePreview ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide survey questions
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show survey questions
                      </>
                    )}
                  </button>

                  {showTemplatePreview && (
                    <div className="pt-3 space-y-4">
                      <div>
                        <h4 className="text-label font-sans font-medium uppercase tracking-label text-ink-soft mb-2">
                          Questions
                        </h4>
                        <ol className="space-y-2 list-decimal list-inside text-body text-ink-soft">
                          {selectedTemplate.questions
                            .sort((a, b) => a.order - b.order)
                            .map((q) => (
                              <li key={q.id}>
                                {q.text.replaceAll("{{subjectName}}", subjectName || "[Subject]")}
                                {q.collectMultiple && (
                                  <span className="text-xs text-ink-lighter ml-2">
                                    (collect multiple responses)
                                  </span>
                                )}
                              </li>
                            ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="text-label font-sans font-medium uppercase tracking-label text-ink-soft mb-2">
                          Relationship Options
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.relationshipOptions.map((r) => (
                            <span
                              key={r.id}
                              className="inline-block px-3 py-1 bg-ink/10 text-sm text-ink"
                            >
                              {r.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setUserModifiedName(true);
                }}
                placeholder="e.g. 360 feedback for Jane Doe"
                required
                className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
              >
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Q1 2025 performance review cycle"
                rows={3}
                className="text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
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
                <Input
                  id="subjectName"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-3 relative">
                <Label
                  htmlFor="subjectRole"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Subject role (optional)
                </Label>
                <Input
                  id="subjectRole"
                  value={subjectRole}
                  onChange={(e) => setSubjectRole(e.target.value)}
                  onFocus={() => setShowRoleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                  placeholder="e.g. Product Manager"
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
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
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-accent-red text-paper font-medium hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus className="h-5 w-5" />
                {submitting ? "Creating…" : "Create project"}
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </EditorialSection>
    </div>
  );
}
