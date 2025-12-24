"use client";

import { createContext, useContext } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { UiMessage } from "@/types/message";

type ChatContextValue = {
  uiMessages: UiMessage[] | null;
  isGenerating: boolean;
  error: string | null;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  currentLanguage: "en" | "he";
  textareaDirection: "ltr" | "rtl";
  isListening: boolean;
  voiceLoading: boolean;
  toggleVoice: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChatContextValue;
}) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
