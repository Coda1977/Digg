"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useMessages } from "@/hooks/useMessages";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTypeformAdapter, type DbMessage } from "@/hooks/useTypeformAdapter";
import { detectLanguageFromMessages, getTextDirection } from "@/lib/language";
import { postJson } from "@/lib/http";
import { summarySchema } from "@/lib/schemas";
import type { UiMessage } from "@/types/message";
import { TypeformLayout } from "./TypeformLayout";
import { QuestionCard } from "./QuestionCard";
import { WaitingCard } from "./WaitingCard";
import { HistoryModal } from "./HistoryModal";

export function TypeformSurvey({
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
  const [isGenerating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const relationshipLabel = useMemo(
    () =>
      template.relationshipOptions.find((r) => r.id === relationship)?.label ??
      relationship,
    [relationship, template.relationshipOptions]
  );

  // Query raw messages from DB to get questionId
  const rawMessages = useQuery(api.messages.getBySurvey, { surveyId });

  // Use the existing useMessages hook for AI conversation
  const { uiMessages, sendMessage } = useMessages({
    surveyId,
    uniqueId,
    isGenerating,
    setGenerating,
    setError,
  });

  // Convert raw messages to DbMessage format for adapter
  const dbMessages = useMemo<DbMessage[] | null>(() => {
    if (rawMessages === undefined) return null;
    return rawMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      questionId: msg.questionId,
      questionText: msg.questionText,
    }));
  }, [rawMessages]);

  // Use adapter to get Typeform display state
  const typeformState = useTypeformAdapter(dbMessages, template);

  // Detect language from messages
  const currentLanguage = useMemo(
    () => (uiMessages ? detectLanguageFromMessages(uiMessages) : "en"),
    [uiMessages]
  );

  // Voice input setup
  const [draft, setDraft] = useState("");
  const { isListening, isLoading: voiceLoading, toggleListening, stopVoice } =
    useVoiceInput({
      surveyId: uniqueId,
      draft,
      language: currentLanguage === "he" ? "he" : "en-US",
      setDraft,
      setError,
    });

  // Clear draft when question changes (root fix for stale text)
  useEffect(() => {
    setDraft("");
  }, [typeformState.currentQuestionId]);

  // Determine textarea direction
  const textareaDirection = useMemo(
    () =>
      draft.trim()
        ? getTextDirection(draft)
        : currentLanguage === "he"
          ? "rtl"
          : "ltr",
    [currentLanguage, draft]
  );

  // Find current question config from template
  const currentQuestion = useMemo(() => {
    if (!typeformState.currentQuestionId) return null;
    return template.questions.find(q => q.id === typeformState.currentQuestionId) ?? null;
  }, [typeformState.currentQuestionId, template.questions]);

  // Check if a rating has already been submitted for current question
  // If so, follow-up messages should use text input, not rating buttons
  const hasRatingBeenSubmitted = useMemo(() => {
    if (!rawMessages || !typeformState.currentQuestionId) return false;
    // Look for a user message with ratingValue for this question
    return rawMessages.some(
      (msg) =>
        msg.role === "user" &&
        msg.questionId === typeformState.currentQuestionId &&
        msg.ratingValue !== undefined
    );
  }, [rawMessages, typeformState.currentQuestionId]);

  // Determine if we should show rating input or text input
  // Show rating only for initial rating questions, not for follow-ups
  const shouldShowRatingInput = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type !== "rating") return false;
    // If rating already submitted for this question, show text input for follow-up
    return !hasRatingBeenSubmitted;
  }, [currentQuestion, hasRatingBeenSubmitted]);

  const handleSend = async (userText: string) => {
    stopVoice();
    setDraft("");
    await sendMessage(userText);
  };

  const handleRatingSubmit = async (ratingValue: number) => {
    // Send rating as message content with ratingValue attached
    await sendMessage(ratingValue.toString(), ratingValue);
  };

  const handleFinish = async () => {
    setError(null);
    setGenerating(true);
    stopVoice();
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
  };

  // Show appropriate content
  const showHistory = typeformState.hasStarted && !!dbMessages && dbMessages.length > 2;

  return (
    <>
      <TypeformLayout
        subjectName={project.subjectName}
        progress={typeformState.progress}
        onHistoryClick={() => setHistoryOpen(true)}
        showHistory={showHistory}
      >
        {typeformState.isWaiting ? (
          <WaitingCard
            language={currentLanguage}
          />
        ) : (
          <QuestionCard
            questionText={typeformState.displayText}
            onSubmit={handleSend}
            onFinish={handleFinish}
            isGenerating={isGenerating}
            textDirection={textareaDirection}
            language={currentLanguage}
            isListening={isListening}
            voiceLoading={voiceLoading}
            toggleVoice={toggleListening}
            draft={draft}
            setDraft={setDraft}
            questionType={shouldShowRatingInput ? "rating" : "text"}
            ratingScale={shouldShowRatingInput ? currentQuestion?.ratingScale : undefined}
            onRatingSubmit={handleRatingSubmit}
          />
        )}

        {/* Error display */}
        {error && (
          <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 bg-accent-red text-white px-4 sm:px-6 py-3 rounded shadow-lg max-w-[90vw] sm:max-w-md text-center text-sm sm:text-base">
            {error}
          </div>
        )}
      </TypeformLayout>

      {/* History Modal */}
      {dbMessages && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setHistoryOpen(false)}
          messages={dbMessages}
          language={currentLanguage}
        />
      )}
    </>
  );
}
