import { useMemo } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

export type DbMessage = {
  role: "assistant" | "user";
  content: string;
  questionId?: string;
  questionText?: string;
};

export type TypeformState = {
  displayText: string;
  displayNumber: number;
  progress: number;
  isWaiting: boolean;
  hasStarted: boolean;
  currentQuestionId: string | null;
};

/**
 * Transforms the message stream into Typeform card state
 * Projects linear chat history as a single-screen display
 */
export function useTypeformAdapter(
  messages: DbMessage[] | null,
  template: Doc<"templates">
): TypeformState {
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return {
        displayText: "Getting ready...",
        displayNumber: 1,
        progress: 0,
        isWaiting: false,
        hasStarted: false,
        currentQuestionId: null,
      };
    }

    // Find the latest assistant message
    const latestAssistantMsg = messages.findLast((m) => m.role === "assistant");

    // Check if we're waiting for AI (last message is from user)
    const lastMessage = messages[messages.length - 1];
    const isWaiting = lastMessage?.role === "user";

    if (!latestAssistantMsg) {
      return {
        displayText: "Getting ready...",
        displayNumber: 1,
        progress: 0,
        isWaiting: true,
        hasStarted: true,
        currentQuestionId: null,
      };
    }

    const displayText = latestAssistantMsg.content;
    const currentQuestionId = latestAssistantMsg.questionId || null;

    // Map questionId to template question index
    // Sort questions by order field first
    const sortedQuestions = [...template.questions].sort((a, b) => a.order - b.order);

    let questionIndex = -1;
    if (currentQuestionId) {
      questionIndex = sortedQuestions.findIndex((q) => q.id === currentQuestionId);
    }

    // Display number (1-indexed)
    const displayNumber = questionIndex >= 0 ? questionIndex + 1 : 1;

    // Calculate progress based on highest question reached
    // Progress = (current question / total questions) * 100
    const progress =
      questionIndex >= 0
        ? Math.round(((questionIndex + 1) / sortedQuestions.length) * 100)
        : 0;

    return {
      displayText,
      displayNumber,
      progress: Math.min(progress, 100),
      isWaiting,
      hasStarted: true,
      currentQuestionId,
    };
  }, [messages, template]);
}
