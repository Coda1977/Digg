"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type UiMessage = {
  role: "assistant" | "user";
  content: string;
};

async function generateAssistantMessage(input: {
  uniqueId: string;
  messages: UiMessage[];
  prompt?: string;
}) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => null)) as
    | { text: string }
    | { error: string }
    | null;

  if (!res.ok) {
    const errorMessage =
      body && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new Error(errorMessage);
  }

  if (!body || !("text" in body) || typeof body.text !== "string") {
    throw new Error("Bad response from server");
  }

  return body.text.trim();
}

export function ChatInterface({
  uniqueId,
  surveyId,
  template,
  project,
  relationship,
  onComplete,
}: {
  uniqueId: string;
  surveyId: Id<"surveys">;
  template: Doc<"templates">;
  project: Doc<"projects">;
  relationship: string;
  onComplete: () => void;
}) {
  const messages = useQuery(api.messages.getBySurvey, { surveyId });
  const saveMessage = useMutation(api.messages.save);
  const completeSurvey = useMutation(api.surveys.complete);

  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationshipLabel = useMemo(() => {
    return (
      template.relationshipOptions.find((r) => r.id === relationship)?.label ??
      relationship
    );
  }, [relationship, template.relationshipOptions]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const uiMessages = useMemo<UiMessage[] | null>(() => {
    if (messages === undefined) return null;
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [uiMessages?.length, generating]);

  useEffect(() => {
    if (!uiMessages) return;
    if (uiMessages.length > 0) return;
    if (generating) return;

    void (async () => {
      setError(null);
      setGenerating(true);
      try {
        const text = await generateAssistantMessage({
          uniqueId,
          messages: [],
          prompt:
            "Start the interview now. Follow the flow: brief intro, then the first question.",
        });
        await saveMessage({ surveyId, role: "assistant", content: text });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start chat");
      } finally {
        setGenerating(false);
      }
    })();
  }, [generating, saveMessage, surveyId, uiMessages, uniqueId]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!uiMessages) return;

    const userText = draft.trim();
    if (!userText) return;
    if (generating) return;

    setDraft("");
    setError(null);
    setGenerating(true);

    const nextMessages: UiMessage[] = [
      ...uiMessages.slice(-40),
      { role: "user", content: userText },
    ];

    try {
      await saveMessage({ surveyId, role: "user", content: userText });

      const assistantText = await generateAssistantMessage({
        uniqueId,
        messages: nextMessages,
      });

      await saveMessage({ surveyId, role: "assistant", content: assistantText });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setGenerating(false);
    }
  }

  async function onFinish() {
    setError(null);
    setGenerating(true);
    try {
      await completeSurvey({ surveyId });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete survey");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              Feedback about {project.subjectName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {template.name} · {relationshipLabel}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onFinish()}
            disabled={generating}
          >
            Finish
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl w-full flex-1 p-4 space-y-4">
        <Card className="h-[60vh]">
          <CardHeader className="py-4">
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              ref={scrollRef}
              className="h-[48vh] overflow-y-auto pr-2 space-y-3"
            >
              {!uiMessages ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : uiMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Starting interview…
                </p>
              ) : (
                uiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={
                      m.role === "assistant"
                        ? "flex justify-start"
                        : "flex justify-end"
                    }
                  >
                    <div
                      className={
                        m.role === "assistant"
                          ? "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
                          : "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <form className="space-y-2" onSubmit={onSend}>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your answer…"
            rows={3}
            disabled={generating || !uiMessages}
          />
          <div className="flex items-center justify-between gap-2">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Keep answers specific; examples help.
              </p>
            )}
            <Button type="submit" disabled={generating || !draft.trim()}>
              {generating ? "…" : "Send"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
