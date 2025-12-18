"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
} from "@/components/editorial";

export default function NewProjectPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.list);
  const seedTemplates = useMutation(api.seed.seedTemplates);
  const createProject = useMutation(api.projects.create);

  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectRole, setSubjectRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templatesEmpty = templates !== undefined && templates.length === 0;
  const canSubmit = !!templateId && !!name && !!subjectName && !submitting;

  const sortedTemplates = useMemo(() => {
    if (!templates) return null;
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const projectId = await createProject({
        templateId: templateId as Id<"templates">,
        name,
        subjectName,
        subjectRole: subjectRole.trim() ? subjectRole.trim() : undefined,
      });
      router.replace(`/admin/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
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
      setError(err instanceof Error ? err.message : "Failed to seed templates");
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
            Create a feedback project using one of the protocols (templates).
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
              You probably haven&apos;t seeded the 4 built-in protocols yet.
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
            <EditorialLabel>Project Details</EditorialLabel>
            <p className="text-body text-ink-soft max-w-2xl">
              Choose a protocol and set the subject. You can share the survey link
              after creating the project.
            </p>
          </div>

          <form className="space-y-8" onSubmit={onSubmit}>
            <div className="space-y-3">
              <Label
                htmlFor="template"
                className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
              >
                Protocol
              </Label>
              <select
                id="template"
                className="flex h-14 w-full border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base text-ink focus:outline-none focus:ring-0 focus:border-accent-red transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a protocol…
                </option>
                {sortedTemplates?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>

            <RuledDivider weight="medium" spacing="xs" />

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
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 360 feedback for Jane"
                required
                className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <RuledDivider weight="medium" spacing="xs" />

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
              <div className="space-y-3">
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
                  placeholder="e.g. Product Manager"
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

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
