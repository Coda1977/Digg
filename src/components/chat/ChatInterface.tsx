"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Mic, MicOff } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EditorialLabel,
  EditorialButton,
  EditorialTextarea,
  MessageBubble,
} from "@/components/editorial";
import { postJson } from "@/lib/http";
import { chatResponseSchema } from "@/lib/schemas";
import type { UiMessage } from "@/types/message";

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

/**
 * Clean AI responses by removing:
 * - Markdown headers (# Header)
 * - Stage directions (anything in asterisks or underscores that looks theatrical)
 * - Horizontal rules (---)
 * - Extra whitespace
 */
function cleanAIResponse(text: string): string {
  return text
    // Remove markdown headers (# or ## or ### etc at start of line)
    .replace(/^#{1,6}\s+.+$/gm, '')
    // Remove anything in single asterisks (*like this*)
    .replace(/\*[^*\n]+\*/g, '')
    // Remove anything in single underscores (_like this_)
    .replace(/\b_[^_\n]+_\b/g, '')
    // Remove parenthetical stage directions like (smiles) or (pauses)
    .replace(/\([^)]*(?:smiles|nods|pauses|leans|settles|sits|looks|takes|sighs|laughs|chuckles|grins)[^)]*\)/gi, '')
    // Remove horizontal rules (--- or ___ or ***)
    .replace(/^[-_*]{3,}$/gm, '')
    // Remove common stage direction phrases even without formatting
    .replace(/^(?:settles|leans|nods|smiles|pauses|looks|sits|takes|sighs)\s+(?:in|forward|back|up|down|carefully|gently|warmly|thoughtfully|slowly)[^\n]*/gmi, '')
    // Remove extra blank lines (more than 2 newlines)
    .replace(/\n{3,}/g, '\n\n')
    // Clean up any lines that became empty after removals
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n')
    // Trim start and end
    .trim();
}

async function generateAssistantMessage(input: {
  uniqueId: string;
  messages: UiMessage[];
  prompt?: string;
}) {
  const result = await postJson("/api/chat", input, chatResponseSchema);
  return cleanAIResponse(result.text.trim());
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    return messages.map((m) => ({
      role: m.role,
      content: m.role === "assistant" ? cleanAIResponse(m.content) : m.content,
    }));
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

  // Auto-focus textarea after messages update
  useEffect(() => {
    if (generating) return;
    if (!textareaRef.current) return;
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeoutId);
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

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
    <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden">
      <header className="border-b border-ink/20 bg-paper flex-shrink-0">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-3 sm:py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-serif font-bold tracking-headline text-[16px] sm:text-[18px] leading-tight truncate">
                  {project.subjectName}
                </h1>
                <p className="text-[10px] text-ink-soft uppercase tracking-wider mt-0.5">
                  {template.name}
                </p>
              </div>
              <span className="text-xs sm:text-sm font-medium text-ink-soft">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12"
          >
            <div className="mx-auto max-w-[900px] space-y-8 sm:space-y-10">
              {!uiMessages ? (
                <MessageBubble variant="assistant">
                  Loading conversation…
                </MessageBubble>
              ) : uiMessages.length === 0 ? (
                <MessageBubble variant="assistant">
                  Starting interview…
                </MessageBubble>
              ) : (
                uiMessages.map((m, idx) => (
                  <MessageBubble
                    key={idx}
                    variant={m.role === "assistant" ? "assistant" : "user"}
                  >
                    {m.content}
                  </MessageBubble>
                ))
              )}

              {generating && uiMessages && (
                <MessageBubble variant="assistant" role="AI Interviewer">
                  <div className="flex items-center gap-3 text-body text-ink-soft">
                    <span className="inline-flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce [animation-delay:-0.32s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce [animation-delay:-0.16s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce" />
                    </span>
                    <span>Thinking…</span>
                  </div>
                </MessageBubble>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-ink/20 bg-paper flex-shrink-0">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-2.5 sm:py-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <form ref={formRef} className="space-y-2" onSubmit={onSend}>
            <EditorialTextarea
              id="surveyDraft"
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key !== "Enter") return;
                if (e.shiftKey) return;
                e.preventDefault();
                formRef.current?.requestSubmit();
              }}
              placeholder={
                listening
                  ? "Listening… (press Voice to stop)"
                  : "Your response…"
              }
              disabled={generating || !uiMessages || listening}
              className="min-h-[70px] max-h-[180px] resize-y"
            />

            {error && (
              <p className="text-body text-accent-red text-sm" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <EditorialButton
                  type="button"
                  variant={listening ? "primary" : "ghost"}
                  onClick={onToggleVoice}
                  disabled={generating || !uiMessages}
                  aria-pressed={listening}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  className="flex-1"
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {listening ? "Stop" : "Voice"}
                </EditorialButton>

                <EditorialButton
                  type="submit"
                  variant="secondary"
                  disabled={generating || !draft.trim()}
                  className="flex-1"
                >
                  {generating ? "…" : "Send"}
                </EditorialButton>
              </div>

              <EditorialButton
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDialog(true)}
                disabled={generating}
                className="w-full"
              >
                Finish Survey
              </EditorialButton>
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
              You won&apos;t be able to add more responses after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <EditorialButton
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={generating}
            >
              Continue Editing
            </EditorialButton>
            <EditorialButton
              variant="secondary"
              onClick={() => {
                setShowConfirmDialog(false);
                void onFinish();
              }}
              disabled={generating}
            >
              Finish Survey
            </EditorialButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
