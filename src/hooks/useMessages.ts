import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import { postJson } from "@/lib/http";
import { chatResponseSchema, type ChatResponse } from "@/lib/schemas";
import type { UiMessage } from "@/types/message";

/**
 * Clean AI responses by removing:
 * - Markdown headers (# Header)
 * - Stage directions (anything in asterisks or underscores that looks theatrical)
 * - Horizontal rules (---)
 * - Extra whitespace
 */
function cleanAIResponse(text: string): string {
  return text
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/\*[^*\n]+\*/g, "")
    .replace(/\b_[^_\n]+_\b/g, "")
    .replace(
      /\([^)]*(?:smiles|nods|pauses|leans|settles|sits|looks|takes|sighs|laughs|chuckles|grins)[^)]*\)/gi,
      ""
    )
    .replace(/^[-_*]{3,}$/gm, "")
    .replace(
      /^(?:settles|leans|nods|smiles|pauses|looks|sits|takes|sighs)\s+(?:in|forward|back|up|down|carefully|gently|warmly|thoughtfully|slowly)[^\n]*/gim,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .trim();
}

async function generateAssistantMessage(input: {
  uniqueId: string;
  messages: UiMessage[];
  prompt?: string;
}): Promise<ChatResponse> {
  const result = await postJson("/api/chat", input, chatResponseSchema);
  return {
    text: cleanAIResponse(result.text.trim()),
    questionId: result.questionId,
    questionText: result.questionText,
  };
}

type UseMessagesOptions = {
  surveyId: Id<"surveys">;
  uniqueId: string;
  isGenerating: boolean;
  setGenerating: (value: boolean) => void;
  setError: (value: string | null) => void;
};

export function useMessages({
  surveyId,
  uniqueId,
  isGenerating,
  setGenerating,
  setError,
}: UseMessagesOptions) {
  const messages = useQuery(api.messages.getBySurvey, { surveyId });
  const saveMessage = useMutation(api.messages.save);

  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string | null>(null);

  const uiMessages = useMemo<UiMessage[] | null>(() => {
    if (messages === undefined) return null;
    return messages.map((message) => ({
      role: message.role,
      content:
        message.role === "assistant"
          ? cleanAIResponse(message.content)
          : message.content,
    }));
  }, [messages]);

  useEffect(() => {
    if (!uiMessages) return;
    if (uiMessages.length > 0) return;
    if (isGenerating) return;

    void (async () => {
      setError(null);
      setGenerating(true);
      try {
        const response = await generateAssistantMessage({
          uniqueId,
          messages: [],
          prompt:
            "Start the interview now. Follow the flow: brief intro, then the first question.",
        });
        await saveMessage({
          surveyId,
          role: "assistant",
          content: response.text,
          questionId: response.questionId ?? undefined,
          questionText: response.questionText ?? undefined,
        });
        setCurrentQuestionId(response.questionId ?? null);
        setCurrentQuestionText(response.questionText ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start chat");
      } finally {
        setGenerating(false);
      }
    })();
  }, [
    isGenerating,
    saveMessage,
    setError,
    setGenerating,
    surveyId,
    uiMessages,
    uniqueId,
  ]);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!uiMessages) return;
      if (!userText.trim()) return;
      if (isGenerating) return;

      setError(null);
      setGenerating(true);

      const nextMessages: UiMessage[] = [
        ...uiMessages.slice(-40),
        { role: "user", content: userText },
      ];

      try {
        await saveMessage({
          surveyId,
          role: "user",
          content: userText,
          questionId: currentQuestionId ?? undefined,
          questionText: currentQuestionText ?? undefined,
        });

        const response = await generateAssistantMessage({
          uniqueId,
          messages: nextMessages,
        });

        await saveMessage({
          surveyId,
          role: "assistant",
          content: response.text,
          questionId: response.questionId ?? undefined,
          questionText: response.questionText ?? undefined,
        });

        setCurrentQuestionId(response.questionId ?? null);
        setCurrentQuestionText(response.questionText ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setGenerating(false);
      }
    },
    [
      currentQuestionId,
      currentQuestionText,
      isGenerating,
      saveMessage,
      setError,
      setGenerating,
      surveyId,
      uiMessages,
      uniqueId,
    ]
  );

  return {
    uiMessages,
    sendMessage,
  };
}
