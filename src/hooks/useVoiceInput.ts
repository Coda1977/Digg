import { useCallback, useRef } from "react";

import { useDeepgram } from "@/hooks/useDeepgram";

function normalizeTranscript(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function appendTranscript(acc: string, chunk: string) {
  const normalized = normalizeTranscript(chunk);
  if (!normalized) return acc;
  if (!acc) return normalized;
  return `${acc} ${normalized}`;
}

type UseVoiceInputOptions = {
  surveyId: string;
  draft: string;
  language: string;
  setDraft: (value: string) => void;
  setError: (value: string | null) => void;
};

export function useVoiceInput({
  surveyId,
  draft,
  language,
  setDraft,
  setError,
}: UseVoiceInputOptions) {
  const voiceBaseRef = useRef<string>("");
  const voiceTranscriptRef = useRef<string>("");

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal) {
        voiceTranscriptRef.current = appendTranscript(
          voiceTranscriptRef.current,
          transcript
        );
      }

      const base = voiceBaseRef.current;
      const accumulated = voiceTranscriptRef.current;
      const spoken = isFinal
        ? accumulated
        : appendTranscript(accumulated, transcript);

      setDraft(spoken ? (base ? `${base} ${spoken}` : spoken) : base);
    },
    [setDraft]
  );

  const { isListening, isLoading, startListening, stopListening } = useDeepgram({
    surveyId,
    language,
    onTranscript: handleTranscript,
    onError: (error) => setError(error),
  });

  const startVoice = useCallback(() => {
    setError(null);
    voiceBaseRef.current = draft.trimEnd();
    voiceTranscriptRef.current = "";
    startListening().catch((err) => {
      console.error("Voice input error:", err);
    });
  }, [draft, setError, startListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    startVoice();
  }, [isListening, startVoice, stopListening]);

  return {
    isListening,
    isLoading,
    toggleListening,
    stopListening,
  };
}
