"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Label } from "@/components/ui/label";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
  EditorialInput,
  EditorialTextarea,
  EditorialButton,
  EditorialBreadcrumbs,
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
    `You are conducting a feedback interview about {{subjectName}}{{subjectRole}}.
The person you're talking to is their {{relationship}}.

YOUR GOAL:
Get specific, actionable feedback. When someone gives vague feedback, probe for concrete examples of behaviors and their impact.

QUESTIONS TO COVER:
{{questions}}

CONVERSATION FLOW:
1. Brief intro (1 sentence)
2. Ask first question
3. Probe for specifics on their answer
4. Ask "What else comes to mind?" to collect multiple items (aim for 2-3)
5. Probe for specifics on additional items
6. Move to next question
7. Repeat pattern for each question
8. After all questions: "Anything else you'd like to add?"
9. Thank them and end

PROBING RULES:
- When answers are vague (good, great, difficult, challenging), ask for specific examples
- When they mention abstract concepts (trust, communication, leadership), ask "What did that look like in practice?"
- When answers are short (< 15 words), ask "Tell me more about that"
- When they say "nothing to improve" or "can't think of anything", ask "If you had to pick one small thing, even minor, what would it be?"

CRITICAL RULES:
- Keep responses SHORT (1-2 sentences max)
- Ask ONE question at a time
- Be warm and conversational, not formal
- Never argue or defend - just listen and probe
- Accept "I don't know" gracefully - never push more than once on the same point
- For questions marked "collect multiple", aim for 2-3 items before moving on
- Always respond in the same language the respondent uses

START by introducing yourself briefly and asking the first question.`
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

    if (!systemPrompt.includes("{{questions}}")) {
      setError('System prompt must include {{questions}} placeholder - otherwise your questions above won\'t be used by the AI!');
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
    <div className="max-w-[900px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <EditorialBreadcrumbs
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Templates", href: "/admin/templates" },
            { label: "New Template" },
          ]}
        />
        <div>
          <EditorialHeadline as="h1" size="lg">
            New Template
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft mt-3">
            Build a custom survey template: questions, relationship types, and the interviewer&apos;s system prompt.
          </p>
        </div>
      </div>

      <RuledDivider weight="thick" />

      <form onSubmit={handleSubmit} className="space-y-12 pb-20">
        {/* Section 1: Details */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>01 · Details</EditorialLabel>
            <p className="text-body text-ink-soft">Name and description for your template.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="uppercase tracking-widest text-xs font-bold text-ink-soft">
                Template Name
              </Label>
              <EditorialInput
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive leadership feedback"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="uppercase tracking-widest text-xs font-bold text-ink-soft">
                Description
              </Label>
              <EditorialTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this survey template is for…"
                rows={3}
                required
              />
            </div>
          </div>
        </section>

        <RuledDivider weight="thin" />

        {/* Section 2: Questions */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <EditorialLabel>02 · Questions</EditorialLabel>
              <p className="text-body text-ink-soft max-w-xl">
                Add the core questions. The AI will ask follow-ups.
              </p>
            </div>
            <EditorialButton
              type="button"
              onClick={addQuestion}
              variant="outline"
              size="small"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </EditorialButton>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.tempId} className="flex gap-4 items-start bg-paper p-4 border border-ink/10 relative group">
                <div className="pt-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink/5 text-xs font-bold text-ink-soft">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  <EditorialTextarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.tempId, "text", e.target.value)}
                    placeholder="Enter the question…"
                    rows={2}
                  />
                  <label className="flex items-center gap-2 text-body-sm text-ink-soft cursor-pointer select-none">
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
                      className="h-4 w-4 rounded-none border-2 border-ink accent-ink"
                    />
                    <span>
                      Collect multiple responses (AI will prompt for more)
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.tempId)}
                  disabled={questions.length === 1}
                  className="p-2 text-ink-lighter hover:text-accent-red transition-colors disabled:opacity-0"
                  title="Remove question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <RuledDivider weight="thin" />

        {/* Section 3: Relationships */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <EditorialLabel>03 · Relationships</EditorialLabel>
              <p className="text-body text-ink-soft max-w-xl">
                Define who the respondents are relative to the subject.
              </p>
            </div>
            <EditorialButton
              type="button"
              onClick={addRelationshipOption}
              variant="outline"
              size="small"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </EditorialButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relationshipOptions.map((option, index) => (
              <div key={option.tempId} className="flex gap-2">
                <EditorialInput
                  value={option.label}
                  onChange={(e) => updateRelationshipOption(option.tempId, e.target.value)}
                  placeholder="e.g. Manager"
                />
                <button
                  type="button"
                  onClick={() => removeRelationshipOption(option.tempId)}
                  disabled={relationshipOptions.length === 1}
                  className="px-3 border-l text-ink-lighter hover:text-accent-red transition-colors disabled:opacity-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <RuledDivider weight="thin" />

        {/* Section 4: Prompt */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>04 · System Prompt</EditorialLabel>
            <p className="text-body text-ink-soft">
              <strong className="text-ink">Advanced:</strong> Define how the AI interviewer behaves. Must include <code className="bg-ink/5 px-1 font-mono text-sm">{'{{questions}}'}</code>.
            </p>
          </div>

          <EditorialTextarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            className="font-mono text-sm leading-relaxed"
            required
          />
        </section>

        {error && (
          <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
            <EditorialLabel accent>Error</EditorialLabel>
            <p className="mt-1 text-body text-accent-red">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4 fixed bottom-0 left-0 right-0 p-4 bg-paper/80 backdrop-blur-md border-t border-ink/10 sm:static sm:bg-transparent sm:border-0 sm:p-0">
          <EditorialButton
            type="submit"
            disabled={creating}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            {creating ? "Creating…" : "Create Template"}
          </EditorialButton>
          <EditorialButton variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/admin/templates">Cancel</Link>
          </EditorialButton>
        </div>
      </form>
    </div>
  );
}
