"use client";
import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { ChatInput } from "./ChatInput";
import { ChatProvider } from "./ChatProvider";
import { MessageList } from "./MessageList";
import { useMessages } from "@/hooks/useMessages";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { detectLanguageFromMessages, getTextDirection } from "@/lib/language";
import { postJson } from "@/lib/http";
import { summarySchema } from "@/lib/schemas";
import type { UiMessage } from "@/types/message";

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
  const completeSurvey = useMutation(api.surveys.complete);
  const saveSummary = useMutation(api.surveys.saveSummary);
  const [draft, setDraft] = useState("");
  const [isGenerating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const relationshipLabel = useMemo(
    () =>
      template.relationshipOptions.find((r) => r.id === relationship)?.label ??
      relationship,
    [relationship, template.relationshipOptions]
  );
  const { uiMessages, sendMessage } = useMessages({
    surveyId,
    uniqueId,
    isGenerating,
    setGenerating,
    setError,
  });
  const progressPercent = useMemo(() => {
    if (!uiMessages) return 0;
    const totalQuestions = template.questions.length || 5;
    const userMessageCount = uiMessages.filter((m) => m.role === "user").length;
    return Math.round(Math.min(0.95, userMessageCount / totalQuestions) * 100);
  }, [uiMessages, template.questions.length]);
  const currentLanguage = useMemo(
    () => (uiMessages ? detectLanguageFromMessages(uiMessages) : "en"),
    [uiMessages]
  );
  const { isListening, isLoading: voiceLoading, toggleListening, stopListening } =
    useVoiceInput({
      surveyId: uniqueId,
      draft,
      language: currentLanguage === "he" ? "he" : "en-US",
      setDraft,
      setError,
    });
  const textareaDirection = useMemo(
    () =>
      draft.trim()
        ? getTextDirection(draft)
        : currentLanguage === "he"
          ? "rtl"
          : "ltr",
    [currentLanguage, draft]
  );
  async function handleSend(userText: string) {
    stopListening();
    await sendMessage(userText);
  }
  async function handleFinish() {
    setError(null);
    setGenerating(true);
    stopListening();
    try {
      await completeSurvey({ surveyId });
      if (uiMessages && uiMessages.length > 0) {
        const input: {
          subjectName: string;
          subjectRole?: string;
          relationshipLabel?: string;
          messages: UiMessage[];
        } = {
          subjectName: project.subjectName,
          subjectRole: project.subjectRole ?? undefined,
          relationshipLabel,
          messages: uiMessages,
        };
        postJson("/api/surveys/summarize", input, summarySchema)
          .then((summary) => {
            void saveSummary({ surveyId, summary });
          })
          .catch((err) => {
            console.error("Failed to auto-generate summary:", err);
          });
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete survey");
    } finally {
      setGenerating(false);
    }
  }
  const contextValue = { uiMessages, isGenerating, error, draft, setDraft, currentLanguage, textareaDirection, isListening, voiceLoading, toggleVoice: toggleListening };
  return (
    <ChatProvider value={contextValue}>
      <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden">
        <header className="border-b border-ink/20 bg-paper flex-shrink-0">
          <div className="mx-auto max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] px-3 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="min-w-0">
                <h1 className="font-serif font-bold tracking-headline text-[15px] sm:text-[17px] md:text-[18px] lg:text-[20px] leading-tight truncate">
                  {project.subjectName}
                </h1>
                <p className="text-[11px] sm:text-[12px] text-ink-soft uppercase tracking-wider mt-0.5">
                  {template.name}
                </p>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-ink/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-red to-[#ef4444] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 flex flex-col">
          <MessageList />
        </main>
        <footer className="border-t border-ink/20 bg-paper flex-shrink-0">
          <div className="mx-auto max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] px-3 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            <ChatInput surveyId={surveyId} onSend={handleSend} onFinish={handleFinish} />
          </div>
        </footer>
      </div>
    </ChatProvider>
  );
}
