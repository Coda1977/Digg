"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create Custom Template</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Design your own feedback survey template
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/admin">Cancel</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Details</CardTitle>
            <CardDescription>Basic information about your template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Template Name *
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Executive Leadership Feedback"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description *
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this template..."
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Interview Questions</CardTitle>
                <CardDescription>
                  Add the questions that will guide the interview
                </CardDescription>
              </div>
              <Button type="button" onClick={addQuestion} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.tempId}
                className="flex gap-3 p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-start pt-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      Q{index + 1}
                    </Badge>
                    <Textarea
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.tempId, "text", e.target.value)
                      }
                      placeholder="Enter your question..."
                      rows={2}
                      className="flex-1"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={question.collectMultiple}
                      onChange={(e) =>
                        updateQuestion(question.tempId, "collectMultiple", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-muted-foreground">
                      Collect multiple responses (ask follow-up questions)
                    </span>
                  </label>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(question.tempId)}
                  disabled={questions.length === 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Relationship Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Relationship Types</CardTitle>
                <CardDescription>
                  Define the relationships respondents can have with the subject
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={addRelationshipOption}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {relationshipOptions.map((option, index) => (
              <div key={option.tempId} className="flex gap-3 items-center">
                <Badge variant="outline" className="shrink-0 w-12 justify-center">
                  {index + 1}
                </Badge>
                <Input
                  value={option.label}
                  onChange={(e) => updateRelationshipOption(option.tempId, e.target.value)}
                  placeholder="e.g., Manager, Peer, Direct Report"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelationshipOption(option.tempId)}
                  disabled={relationshipOptions.length === 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Interviewer Prompt</CardTitle>
            <CardDescription>
              Instructions for the AI interviewer. Use {"{subjectName}"} as a placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              required
            />
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={creating} className="flex-1 sm:flex-initial">
            {creating ? "Creating..." : "Create Template"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin")}
            disabled={creating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
