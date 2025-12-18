"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
} from "@/components/editorial";

type Question = {
  text: string;
  collectMultiple: boolean;
  tempId: string;
};

type RelationshipOption = {
  label: string;
  tempId: string;
};

export default function NewTemplatePage() {
  const router = useRouter();
  const createTemplate = useMutation(api.templates.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a skilled interviewer conducting a 360-degree feedback interview. Your goal is to gather thoughtful, specific feedback about {subjectName}.

Follow these guidelines:
1. Start with a brief, friendly introduction
2. Ask one question at a time from the template
3. Follow up on vague answers with probing questions
4. Create a conversational, comfortable atmosphere
5. When you've covered all questions thoroughly, naturally conclude the interview

Be empathetic, professional, and focused on collecting actionable insights.`
  );
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", collectMultiple: false, tempId: crypto.randomUUID() },
  ]);
  const [relationshipOptions, setRelationshipOptions] = useState<RelationshipOption[]>([
    { label: "", tempId: crypto.randomUUID() },
  ]);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setCreating(true);
    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim(),
        questions: validQuestions.map((q) => ({
          text: q.text.trim(),
          collectMultiple: q.collectMultiple,
        })),
        relationshipOptions: validRelationships.map((r) => ({
          label: r.label.trim(),
        })),
        systemPromptTemplate: systemPrompt.trim(),
      });

      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <EditorialSection spacing="lg">
        <div className="max-w-[900px] mx-auto space-y-6">
          <EditorialLabel>Templates</EditorialLabel>
          <EditorialHeadline as="h1" size="lg">
            New Template
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Build a custom survey template: questions, relationship types, and the interviewer&apos;s
            system prompt.
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
                    Interview questions
                  </h2>
                  <p className="text-body text-ink-soft max-w-2xl">
                    Add one question at a time. The AI will ask follow-ups when answers are
                    vague.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add question
                </button>
              </div>

              <div className="space-y-8">
                {questions.map((question, index) => (
                  <article key={question.tempId} className="border-t-3 border-ink pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="inline-flex items-center justify-center w-14 h-14 border-3 border-ink text-label font-sans font-semibold uppercase tracking-label">
                          Q{index + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">
                          <Textarea
                            value={question.text}
                            onChange={(e) =>
                              updateQuestion(question.tempId, "text", e.target.value)
                            }
                            placeholder="Enter the question…"
                            rows={2}
                            className="min-h-[96px] resize-y rounded-none border-3 border-ink bg-paper px-5 py-4 text-base sm:text-base leading-relaxed text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                          />

                          <label className="flex items-start gap-3 text-body text-ink-soft">
                            <input
                              type="checkbox"
                              checked={question.collectMultiple}
                              onChange={(e) =>
                                updateQuestion(
                                  question.tempId,
                                  "collectMultiple",
                                  e.target.checked
                                )
                              }
                              className="mt-1 h-5 w-5 rounded-none border-2 border-ink accent-ink"
                            />
                            <span>
                              Collect multiple responses (the AI can ask follow-up questions).
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(question.tempId)}
                        disabled={questions.length === 1}
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-transparent text-accent-red font-medium hover:bg-accent-red hover:text-paper transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="h-5 w-5" />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <RuledDivider weight="thick" spacing="sm" />

            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="space-y-3">
                  <EditorialLabel>Relationships</EditorialLabel>
                  <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                    Relationship types
                  </h2>
                  <p className="text-body text-ink-soft max-w-2xl">
                    Define the relationship options respondents can choose (e.g., manager,
                    peer, direct report).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRelationshipOption}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add option
                </button>
              </div>

              <div className="space-y-6">
                {relationshipOptions.map((option, index) => (
                  <article key={option.tempId} className="border-t-3 border-ink pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                        <div className="inline-flex items-center justify-center w-14 h-14 border-3 border-ink text-label font-sans font-semibold uppercase tracking-label">
                          {index + 1}
                        </div>
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            updateRelationshipOption(option.tempId, e.target.value)
                          }
                          placeholder="e.g. Manager"
                          className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRelationshipOption(option.tempId)}
                        disabled={relationshipOptions.length === 1}
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-transparent text-accent-red font-medium hover:bg-accent-red hover:text-paper transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        aria-label={`Remove relationship option ${index + 1}`}
                      >
                        <Trash2 className="h-5 w-5" />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <RuledDivider weight="thick" spacing="sm" />

            <div className="space-y-8">
              <div className="space-y-3">
                <EditorialLabel>AI interviewer prompt</EditorialLabel>
                <h2 className="font-serif font-bold tracking-headline text-headline-md leading-tight">
                  System prompt template
                </h2>
                <p className="text-body text-ink-soft max-w-2xl">
                  Instructions for the AI interviewer. Use {"{subjectName}"} as a placeholder.
                </p>
              </div>

              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={12}
                className="min-h-[320px] resize-y rounded-none border-3 border-ink bg-paper px-5 py-4 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>

            {error && (
              <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
                <EditorialLabel accent>Fix this to continue</EditorialLabel>
                <p className="mt-3 text-body text-accent-red">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-accent-red text-paper font-medium hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {creating ? "Creating…" : "Create template"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin")}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </EditorialSection>
    </div>
  );
}
