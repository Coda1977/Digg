"use client";

import { MessageBubble } from "@/components/editorial";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { getTextDirection } from "@/lib/language";

import { useChatContext } from "./ChatProvider";
import { TypingIndicator } from "./TypingIndicator";

export function MessageList() {
  const { uiMessages, isGenerating, currentLanguage } = useChatContext();
  const scrollRef = useAutoScroll(uiMessages?.length ?? 0, isGenerating);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12"
      >
        <div className="mx-auto max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] space-y-6 sm:space-y-8 md:space-y-10">
          {!uiMessages ? (
            <MessageBubble variant="assistant" direction="ltr">
              Loading conversation...
            </MessageBubble>
          ) : uiMessages.length === 0 ? (
            <MessageBubble variant="assistant" direction="ltr">
              Starting interview...
            </MessageBubble>
          ) : (
            uiMessages.map((message, idx) => (
              <MessageBubble
                key={idx}
                variant={message.role === "assistant" ? "assistant" : "user"}
                direction={getTextDirection(message.content)}
              >
                {message.content}
              </MessageBubble>
            ))
          )}

          {isGenerating && uiMessages && (
            <MessageBubble
              variant="assistant"
              role={currentLanguage === "he" ? "מראיין AI" : "AI Interviewer"}
              direction={currentLanguage === "he" ? "rtl" : "ltr"}
            >
              <TypingIndicator language={currentLanguage} />
            </MessageBubble>
          )}
        </div>
      </div>
    </div>
  );
}
