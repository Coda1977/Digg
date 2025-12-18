"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
} from "@/components/editorial";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Question = {
  id?: string;
  text: string;
  collectMultiple: boolean;
  tempId: string;
};

type RelationshipOption = {
  id?: string;
  label: string;
  tempId: string;
};

function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<Id<"templates"> | null>(null);

  // Unwrap async params
  useEffect(() => {
    params.then((p) => setTemplateId(p.id as Id<"templates">));
  }, [params]);

  const template = useQuery(api.templates.getById, templateId ? { id: templateId } : "skip");
  const updateTemplate = useMutation(api.templates.update);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<RelationshipOption[]>([]);

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when template data loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setSystemPrompt(template.systemPromptTemplate);
      setQuestions(
        template.questions
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            id: q.id,
            text: q.text,
            collectMultiple: q.collectMultiple,
            tempId: crypto.randomUUID(),
          }))
      );
      setRelationshipOptions(
        template.relationshipOptions.map((r) => ({
          id: r.id,
          label: r.label,
          tempId: crypto.randomUUID(),
        }))
      );
    }
  }, [template]);

  // Show loading while params or template are loading
  if (!templateId || template === undefined) {
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

  if (template === null) {
    return (
      <EditorialSection spacing="lg">
        <div className="text-center py-editorial-lg">
          <p className="text-body-lg text-ink-soft mb-6">Template not found</p>
          <Link
            href="/admin/templates"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-transparent hover:text-ink transition-colors"
          >
            Back to Templates
          </Link>
        </div>
      </EditorialSection>
    );
  }

  if (template.isBuiltIn) {
    return (
      <EditorialSection spacing="lg">
        <div className="text-center py-editorial-lg">
          <p className="text-body-lg text-ink-soft mb-6">
            Built-in templates cannot be edited
          </p>
          <Link
            href="/admin/templates"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-transparent hover:text-ink transition-colors"
          >
            Back to Templates
          </Link>
        </div>
      </EditorialSection>
    );
  }

  function addQuestion() {
    setQuestions([...questions, { text: "", collectMultiple: false, tempId: crypto.randomUUID() }]);
  }

  function removeQuestion(tempId: string) {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.tempId !== tempId));
    }
  }

  function updateQuestion(tempId: string, field: keyof Question, value: string | boolean) {
    setQuestions(
      questions.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q))
    );
  }

  function addRelationshipOption() {
    setRelationshipOptions([...relationshipOptions, { label: "", tempId: crypto.randomUUID() }]);
  }

  function removeRelationshipOption(tempId: string) {
    if (relationshipOptions.length > 1) {
      setRelationshipOptions(relationshipOptions.filter((r) => r.tempId !== tempId));
    }
  }

  function updateRelationshipOption(tempId: string, label: string) {
    setRelationshipOptions(
      relationshipOptions.map((r) => (r.tempId === tempId ? { ...r, label } : r))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!templateId) {
      setError("Template ID not loaded yet");
      return;
    }

    // Validation
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) {
      setError("At least one question is required");
      return;
    }

    const validRelationships = relationshipOptions.filter((r) => r.label.trim());
    if (validRelationships.length === 0) {
      setError("At least one relationship option is required");
      return;
    }

    if (!systemPrompt.trim()) {
      setError("System prompt is required");
      return;
    }

    if (!systemPrompt.includes("{{questions}}")) {
      setError('System prompt must include {{questions}} placeholder - otherwise your questions above won\'t be used by the AI!');
      return;
    }

    setUpdating(true);
    try {
      await updateTemplate({
        id: templateId,
        name: name.trim(),
        description: description.trim(),
        questions: validQuestions.map((q) => ({
          id: q.id,
          text: q.text.trim(),
          collectMultiple: q.collectMultiple,
        })),
        relationshipOptions: validRelationships.map((r) => ({
          id: r.id,
          label: r.label.trim(),
        })),
        systemPromptTemplate: systemPrompt.trim(),
      });

      router.push("/admin/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <EditorialLabel>Templates</EditorialLabel>
          <EditorialHeadline as="h1" size="lg">
            Edit Template
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Update your custom survey template: questions, relationship types, and the
            interviewer&apos;s system prompt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/admin/templates"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              Back to templates
            </Link>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider weight="thick" spacing="sm" />

      <EditorialSection spacing="md">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <EditorialLabel>Template details</EditorialLabel>
            <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
              Name and purpose
            </h2>
            <p className="text-body text-ink-soft max-w-2xl">
              Give the template a clear name and a short description so you can find it
              quickly later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Template name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Executive leadership feedback"
                  required
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <RuledDivider weight="medium" spacing="xs" />

              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this survey template is for…"
                  rows={3}
                  required
                  className="min-h-[120px] resize-y rounded-none border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base leading-relaxed text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <RuledDivider weight="thick" spacing="sm" />

            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="space-y-3">
                  <EditorialLabel>Questions</EditorialLabel>
                  <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                    Survey questions
                  </h2>
                  <p className="text-body text-ink-soft max-w-2xl">
                    The AI interviewer will explore these questions during the conversation.
                    Use <code className="bg-ink/5 px-1">{"{subjectName}"}</code> as a placeholder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                  Add question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div
                    key={q.tempId}
                    className="border-l-4 border-ink pl-6 py-4 space-y-4 bg-paper"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <Label
                          htmlFor={`question-${q.tempId}`}
                          className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                        >
                          Question {idx + 1}
                        </Label>
                        <Textarea
                          id={`question-${q.tempId}`}
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(q.tempId, "text", e.target.value)
                          }
                          placeholder="What's the question you want to explore?"
                          rows={2}
                          className="min-h-[80px] resize-y rounded-none border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base leading-relaxed text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.tempId)}
                        disabled={questions.length === 1}
                        className="mt-8 p-2 text-accent-red hover:bg-accent-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`collect-multiple-${q.tempId}`}
                        checked={q.collectMultiple}
                        onChange={(e) =>
                          updateQuestion(q.tempId, "collectMultiple", e.target.checked)
                        }
                        className="h-5 w-5 border-3 border-ink text-ink focus:ring-accent-red"
                      />
                      <Label
                        htmlFor={`collect-multiple-${q.tempId}`}
                        className="text-body text-ink cursor-pointer"
                      >
                        Collect multiple responses for this question
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <RuledDivider weight="thick" spacing="sm" />

            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="space-y-3">
                  <EditorialLabel>Relationship types</EditorialLabel>
                  <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                    Who can give feedback
                  </h2>
                  <p className="text-body text-ink-soft max-w-2xl">
                    Define the different relationships people can have (e.g., Manager, Peer,
                    Direct Report).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRelationshipOption}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                  Add option
                </button>
              </div>

              <div className="space-y-4">
                {relationshipOptions.map((r, idx) => (
                  <div
                    key={r.tempId}
                    className="flex items-center gap-4 border-l-4 border-ink pl-6 py-3 bg-paper"
                  >
                    <div className="flex-1 space-y-2">
                      <Label
                        htmlFor={`relationship-${r.tempId}`}
                        className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                      >
                        Option {idx + 1}
                      </Label>
                      <Input
                        id={`relationship-${r.tempId}`}
                        value={r.label}
                        onChange={(e) =>
                          updateRelationshipOption(r.tempId, e.target.value)
                        }
                        placeholder="e.g. Manager, Peer, Direct Report"
                        className="h-12 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRelationshipOption(r.tempId)}
                      disabled={relationshipOptions.length === 1}
                      className="p-2 text-accent-red hover:bg-accent-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <RuledDivider weight="thick" spacing="sm" />

            <div className="space-y-8">
              <div className="space-y-3">
                <EditorialLabel>AI interviewer prompt</EditorialLabel>
                <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                  System instructions
                </h2>
                <p className="text-body text-ink-soft max-w-2xl">
                  Define how the AI interviewer should behave. <strong className="text-ink">You MUST include {"{{"}}questions{"}}"}</strong> in your prompt - this is where your questions from above will be injected.
                </p>
              </div>

              <div className="border-l-4 border-accent-yellow bg-accent-yellow/10 pl-6 py-4 mb-6">
                <p className="text-body text-ink font-medium mb-2">Available Placeholders:</p>
                <ul className="text-body text-ink-soft space-y-1">
                  <li><code className="bg-ink/5 px-1 font-mono">{"{{"}}questions{"}}"}</code> - Your questions from above (REQUIRED)</li>
                  <li><code className="bg-ink/5 px-1 font-mono">{"{{"}}subjectName{"}}"}</code> - Person being reviewed (e.g. "John")</li>
                  <li><code className="bg-ink/5 px-1 font-mono">{"{{"}}subjectRole{"}}"}</code> - Their role (e.g. "Senior Engineer")</li>
                  <li><code className="bg-ink/5 px-1 font-mono">{"{{"}}relationship{"}}"}</code> - Respondent's relationship (e.g. "Manager")</li>
                </ul>
              </div>

              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a skilled interviewer…"
                rows={12}
                required
                className="min-h-[300px] resize-y rounded-none border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base leading-relaxed text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              />
            </div>

            {error && (
              <div className="border-l-4 border-accent-red bg-accent-red/10 px-6 py-4">
                <p className="text-body text-accent-red">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 min-h-[56px] px-10 border-3 border-ink bg-ink text-paper font-bold text-lg hover:bg-transparent hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Saving…" : "Save changes"}
              </button>
              <Link
                href="/admin/templates"
                className="inline-flex items-center justify-center gap-2 min-h-[56px] px-10 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
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

export default function EditTemplatePageWithErrorBoundary({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ErrorBoundary>
      <EditTemplatePage params={params} />
    </ErrorBoundary>
  );
}
