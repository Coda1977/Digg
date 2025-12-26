"use client";

import { Mic, MicOff } from "lucide-react";

import { EditorialButton } from "@/components/editorial";

import { useChatContext } from "./ChatProvider";

export function VoiceControls() {
  const {
    uiMessages,
    isGenerating,
    isListening,
    voiceLoading,
    toggleVoice,
    currentLanguage,
  } = useChatContext();

  const messagesReady = uiMessages !== null;
  const disabled = isGenerating || !messagesReady || voiceLoading;

  return (
    <EditorialButton
      type="button"
      variant={isListening ? "primary" : "ghost"}
      onClick={toggleVoice}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      className="flex-1 min-h-[48px]"
    >
      {isListening ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
      {voiceLoading
        ? "..."
        : isListening
          ? currentLanguage === "he"
            ? "עצור"
            : "Stop"
          : currentLanguage === "he"
            ? "הקלטה"
            : "Voice"}
    </EditorialButton>
  );
}
