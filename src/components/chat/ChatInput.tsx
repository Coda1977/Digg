"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { EditorialButton, EditorialTextarea } from "@/components/editorial";
import { useDraftStorage } from "@/hooks/useDraftStorage";

import { FinishSurveyDialog } from "./FinishSurveyDialog";
import { useChatContext } from "./ChatProvider";
import { VoiceControls } from "./VoiceControls";

type ChatInputProps = {
  surveyId: string;
  onSend: (userText: string) => Promise<void> | void;
  onFinish: () => Promise<void> | void;
};

export function ChatInput({ surveyId, onSend, onFinish }: ChatInputProps) {
  const {
    uiMessages,
    isGenerating,
    isListening,
    error,
    draft,
    setDraft,
    currentLanguage,
    textareaDirection,
  } = useChatContext();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesReady = uiMessages !== null;
  const { clearDraftStorage } = useDraftStorage({ surveyId, draft, setDraft });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    if (isGenerating) return;
    if (!textareaRef.current) return;
    const timeoutId = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [isGenerating, uiMessages?.length]);

  const placeholder = isListening
    ? currentLanguage === "he"
      ? "מקשיב... (לחץ על עצור כדי להפסיק)"
      : "Listening... (press Voice to stop)"
    : currentLanguage === "he"
      ? "התשובה שלך..."
      : "Your response...";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!messagesReady || isGenerating) return;
    const userText = draft.trim();
    if (!userText) return;
    setDraft("");
    clearDraftStorage();
    void onSend(userText);
  }

  function handleFinish() {
    clearDraftStorage();
    void onFinish();
  }

  return (
    <>
      <form ref={formRef} className="space-y-2" onSubmit={handleSubmit}>
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
          placeholder={placeholder}
          disabled={isGenerating || !messagesReady || isListening}
          className="min-h-[60px] sm:min-h-[70px] md:min-h-[80px] max-h-[150px] sm:max-h-[180px] md:max-h-[220px] resize-y"
          dir={textareaDirection}
          style={{ textAlign: textareaDirection === "rtl" ? "right" : "left" }}
        />

        {error && (
          <p className="text-body text-accent-red text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <VoiceControls />
            <EditorialButton
              type="submit"
              variant="secondary"
              disabled={isGenerating || !draft.trim()}
              className="flex-1"
            >
              {isGenerating ? "..." : currentLanguage === "he" ? "שלח" : "Send"}
            </EditorialButton>
          </div>

          <EditorialButton
            type="button"
            variant="outline"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isGenerating}
            className="w-full"
          >
            {currentLanguage === "he" ? "סיים סקר" : "Finish Survey"}
          </EditorialButton>
        </div>
      </form>

      <FinishSurveyDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        isGenerating={isGenerating}
        currentLanguage={currentLanguage}
        onConfirm={handleFinish}
      />
    </>
  );
}
