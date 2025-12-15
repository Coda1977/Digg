"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

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
  const canSubmit = templateId && name && subjectName && !submitting;

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-sm text-muted-foreground">
            Create a feedback project using one of the protocols (templates).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back</Link>
        </Button>
      </div>

      {templatesEmpty && (
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">No templates found</CardTitle>
            <p className="text-sm text-muted-foreground">
              You probably haven’t seeded the 4 built-in protocols yet.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void onSeed()} disabled={submitting}>
              Seed templates
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="template">Protocol</Label>
              <select
                id="template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 360 feedback for Jane"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject name</Label>
                <Input
                  id="subjectName"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectRole">Subject role (optional)</Label>
                <Input
                  id="subjectRole"
                  value={subjectRole}
                  onChange={(e) => setSubjectRole(e.target.value)}
                  placeholder="e.g. Product Manager"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? "Creating…" : "Create project"}
              </Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/admin">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

