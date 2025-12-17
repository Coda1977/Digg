"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Mic, MicOff } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UiMessage = {
  role: "assistant" | "user";
  content: string;
};

type WebSpeechRecognitionAlternative = { transcript: string };

type WebSpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: WebSpeechRecognitionAlternative | undefined;
};

type WebSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<WebSpeechRecognitionResult>;
};

type WebSpeechRecognitionErrorEvent = { error: string };

type WebSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

function getSpeechRecognitionConstructor(): WebSpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeTranscript(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function appendTranscript(acc: string, chunk: string) {
  const normalized = normalizeTranscript(chunk);
  if (!normalized) return acc;
  if (!acc) return normalized;
  return `${acc} ${normalized}`;
}

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const voiceBaseRef = useRef<string>("");
  const voiceTranscriptRef = useRef<string>("");

  const relationshipLabel = useMemo(() => {
    return (
      template.relationshipOptions.find((r) => r.id === relationship)?.label ??
      relationship
    );
  }, [relationship, template.relationshipOptions]);

  const uiMessages = useMemo<UiMessage[] | null>(() => {
    if (messages === undefined) return null;
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  const progress = useMemo(() => {
    if (!uiMessages) return 0;
    const userMessageCount = uiMessages.filter((m) => m.role === "user").length;
    const totalQuestions = template.questions.length || 5; // Fallback to 5 if no questions
    const calculated = (userMessageCount / totalQuestions) * 100;
    // Cap at 95% until survey is actually completed
    return Math.min(95, calculated);
  }, [uiMessages, template.questions.length]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [uiMessages?.length, generating]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (!recognition) return;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop?.();
      } catch {
        // ignore
      }
    };
  }, []);

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

  // Restore draft from localStorage on mount
  useEffect(() => {
    const storageKey = `digg_draft_${surveyId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDraft(saved);
      }
    } catch {
      // localStorage may be disabled
    }
  }, [surveyId]);

  // Auto-save draft to localStorage when it changes
  useEffect(() => {
    const storageKey = `digg_draft_${surveyId}`;
    const timeoutId = setTimeout(() => {
      try {
        if (draft.trim()) {
          localStorage.setItem(storageKey, draft);
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000);
        } else {
          localStorage.removeItem(storageKey);
          setDraftSaved(false);
        }
      } catch {
        // localStorage may be disabled
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [draft, surveyId]);

  function stopVoice() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // ignore
    } finally {
      setListening(false);
    }
  }

  function onToggleVoice() {
    if (listening) {
      stopVoice();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Try Chrome or Edge, or use your device keyboard dictation."
      );
      return;
    }

    setError(null);
    voiceBaseRef.current = draft.trimEnd();
    voiceTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = (navigator.language || "en-US") as string;

    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalChunk += transcript;
        else interimChunk += transcript;
      }

      voiceTranscriptRef.current = appendTranscript(
        voiceTranscriptRef.current,
        finalChunk
      );
      const interim = normalizeTranscript(interimChunk);
      const spoken = [voiceTranscriptRef.current, interim]
        .filter(Boolean)
        .join(" ");
      const base = voiceBaseRef.current;

      setDraft(spoken ? (base ? `${base} ${spoken}` : spoken) : base);
    };

    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      const code = typeof event.error === "string" ? event.error : "unknown";
      const message =
        code === "not-allowed"
          ? "Microphone permission denied."
        : code === "no-speech"
          ? "No speech detected."
          : code === "audio-capture"
          ? "No microphone found."
          : "Voice input failed.";
      setError(message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError("Voice input failed to start.");
      setListening(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!uiMessages) return;

    const userText = draft.trim();
    if (!userText) return;
    if (generating) return;

    stopVoice();
    setDraft("");
    setError(null);
    setGenerating(true);

    // Clear draft from localStorage when sending
    const storageKey = `digg_draft_${surveyId}`;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage may be disabled
    }

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
    stopVoice();

    // Clear draft from localStorage when completing survey
    const storageKey = `digg_draft_${surveyId}`;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage may be disabled
    }

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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base sm:text-sm font-medium truncate">
              Feedback about {project.subjectName}
            </p>
            <p className="text-sm sm:text-xs text-muted-foreground truncate">
              {template.name} · {relationshipLabel}
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 sm:h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm sm:text-xs font-medium text-muted-foreground min-w-[3rem] text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl w-full flex-1 px-3 sm:px-4 py-3 sm:py-4 flex flex-col min-h-0">
        <Card className="flex-1 min-h-0">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col min-h-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-3 sm:space-y-3">
              {!uiMessages ? (
                <p className="text-base sm:text-sm text-muted-foreground">Loading…</p>
              ) : uiMessages.length === 0 ? (
                <p className="text-base sm:text-sm text-muted-foreground">Starting interview…</p>
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
                          ? "w-full sm:max-w-[85%] rounded-lg bg-muted px-4 py-3 text-base sm:text-sm whitespace-pre-wrap leading-relaxed"
                          : "w-full sm:max-w-[85%] rounded-lg bg-primary px-4 py-3 text-base sm:text-sm text-primary-foreground whitespace-pre-wrap leading-relaxed"
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
      </main>

      <footer className="border-t bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur sticky bottom-0">
        <div className="mx-auto max-w-3xl px-3 sm:px-4 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
          <form ref={formRef} className="space-y-3" onSubmit={onSend}>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key !== "Enter") return;
                if (e.shiftKey) return;
                e.preventDefault();
                formRef.current?.requestSubmit();
              }}
              placeholder={
                listening ? "Listening… (press mic to stop)" : "Type your answer…"
              }
              rows={3}
              disabled={generating || !uiMessages || listening}
              className="text-base resize-none"
            />

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Mobile: Stack buttons vertically */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="hidden sm:flex sm:items-center sm:gap-3">
                <p className="text-xs text-muted-foreground">
                  Enter to send · Shift+Enter for a new line
                </p>
                {draftSaved && (
                  <p className="text-xs text-muted-foreground">· Draft saved</p>
                )}
              </div>

              <div className="flex items-stretch gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onToggleVoice}
                  disabled={generating || !uiMessages}
                  aria-pressed={listening}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  className="flex-1 sm:flex-initial min-h-[44px]"
                >
                  {listening ? (
                    <>
                      <MicOff className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Voice</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={generating}
                  className="flex-1 sm:flex-initial min-h-[44px] text-base sm:text-sm"
                >
                  <span className="sm:hidden">Finish</span>
                  <span className="hidden sm:inline">Finish conversation</span>
                </Button>

                <Button
                  type="submit"
                  disabled={generating || !draft.trim()}
                  className="flex-1 sm:flex-initial min-h-[44px] text-base sm:text-sm font-semibold"
                >
                  {generating ? "…" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </footer>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you ready to finish?</DialogTitle>
            <DialogDescription>
              You won't be able to add more responses after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={generating}
            >
              Continue Editing
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                void onFinish();
              }}
              disabled={generating}
            >
              Finish Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
