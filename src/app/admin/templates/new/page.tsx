"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Label } from "@/components/ui/label";
import {
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialInput,
  EditorialTextarea,
  EditorialButton,
  EditorialBreadcrumbs,
} from "@/components/editorial";
import { EditorialFixedBottomBar } from "@/components/editorial/EditorialFixedBottomBar";
import { QuestionTypeSelector } from "@/components/admin/QuestionTypeSelector";
import { RatingConfigPanel } from "@/components/admin/RatingConfigPanel";

type Question = {
  text: string;
  collectMultiple: boolean;
  type?: "text" | "rating";
  ratingScale?: {
    max: number;
    lowLabel?: string;
    highLabel?: string;
  };
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
  const [persona, setPersona] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", collectMultiple: false, type: "text", tempId: crypto.randomUUID() },
  ]);
  const [relationshipOptions, setRelationshipOptions] = useState<RelationshipOption[]>([
    { label: "", tempId: crypto.randomUUID() },
  ]);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addQuestion() {
    setQuestions([...questions, { text: "", collectMultiple: false, type: "text", tempId: crypto.randomUUID() }]);
  }

  function removeQuestion(tempId: string) {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.tempId !== tempId));
    }
  }

  function updateQuestion(tempId: string, field: keyof Question, value: Question[keyof Question]) {
    setQuestions(
      questions.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q))
    );
  }

  function updateQuestionType(tempId: string, type: "text" | "rating") {
    setQuestions(
      questions.map((q) =>
        q.tempId === tempId
          ? {
              ...q,
              type,
              // Initialize rating config if switching to rating
              ratingScale: type === "rating" ? { max: 10 } : undefined,
              // Disable collectMultiple for rating questions
              collectMultiple: type === "rating" ? false : q.collectMultiple,
            }
          : q
      )
    );
  }

  function updateRatingConfig(
    tempId: string,
    config: { max: number; lowLabel?: string; highLabel?: string }
  ) {
    setQuestions(
      questions.map((q) =>
        q.tempId === tempId ? { ...q, ratingScale: config } : q
      )
    );
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
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

    // Note: persona is optional - Digg Core handles the methodology

    setCreating(true);
    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim(),
        questions: validQuestions.map((q) => ({
          text: q.text.trim(),
          collectMultiple: q.collectMultiple,
          ...(q.type && { type: q.type }),
          ...(q.ratingScale && { ratingScale: q.ratingScale }),
        })),
        relationshipOptions: validRelationships.map((r) => ({
          label: r.label.trim(),
        })),
        systemPromptTemplate: persona.trim(),
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
            <EditorialLabel>01 - Details</EditorialLabel>
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
                placeholder="Describe what this survey template is for..."
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
              <EditorialLabel>02 - Questions</EditorialLabel>
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
                <div className="flex flex-col items-center gap-1 pt-3">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-ink-lighter hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Move question ${index + 1} up`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink/5 text-xs font-bold text-ink-soft">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, "down")}
                    disabled={index === questions.length - 1}
                    className="p-1 text-ink-lighter hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Move question ${index + 1} down`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  <EditorialTextarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.tempId, "text", e.target.value)}
                    placeholder="Enter the question..."
                    rows={2}
                    aria-label={`Question ${index + 1} text`}
                  />

                  <QuestionTypeSelector
                    value={question.type || "text"}
                    onChange={(type) => updateQuestionType(question.tempId, type)}
                    name={`questionType-${question.tempId}`}
                  />

                  {question.type === "rating" && question.ratingScale && (
                    <RatingConfigPanel
                      config={question.ratingScale}
                      onChange={(config) => updateRatingConfig(question.tempId, config)}
                    />
                  )}

                  {question.type !== "rating" && (
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
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.tempId)}
                  disabled={questions.length === 1}
                  className="p-2 text-ink-lighter hover:text-accent-red transition-colors disabled:opacity-0"
                  aria-label={`Remove question ${index + 1}`}
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
              <EditorialLabel>03 - Relationships</EditorialLabel>
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
                  aria-label={`Relationship option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeRelationshipOption(option.tempId)}
                  disabled={relationshipOptions.length === 1}
                  className="px-3 border-l text-ink-lighter hover:text-accent-red transition-colors disabled:opacity-0"
                  aria-label={`Remove relationship option ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <RuledDivider weight="thin" />

        {/* Section 4: Persona (Optional) */}
        <section className="space-y-6">
          <div className="space-y-2">
            <EditorialLabel>04 - Interviewer Persona <span className="text-ink-soft font-normal">(Optional)</span></EditorialLabel>
            <p className="text-body text-ink-soft">
              Customize the interviewer&apos;s style and tone. Leave blank for standard behavior.
              Example: &quot;Be professional but empathetic. Focus on leadership examples.&quot;
            </p>
          </div>

          <EditorialTextarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={4}
            placeholder="Optional: Add style guidance for the interviewer..."
          />
        </section>

        {error && (
          <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
            <EditorialLabel accent>Error</EditorialLabel>
            <p className="mt-1 text-body text-accent-red">{error}</p>
          </div>
        )}

        <EditorialFixedBottomBar>
          <EditorialButton variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/admin/templates">Cancel</Link>
          </EditorialButton>
          <EditorialButton
            type="submit"
            disabled={creating}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            {creating ? "Creating..." : "Create Template"}
          </EditorialButton>
        </EditorialFixedBottomBar>
      </form>
    </div>
  );
}
