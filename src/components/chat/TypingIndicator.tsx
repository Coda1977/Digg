"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  language?: "en" | "he";
  className?: string;
}

export function TypingIndicator({ language = "en", className }: TypingIndicatorProps) {
  const text = language === "he" ? "חושב..." : "Thinking...";

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={language === "he" ? "ה-AI חושב" : "AI is thinking"}
    >
      {/* Animated dots */}
      <span className="inline-flex items-center gap-1.5" aria-hidden="true">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-ink-soft",
            "animate-[typing-bounce_1.4s_ease-in-out_infinite]"
          )}
          style={{ animationDelay: "0s" }}
        />
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-ink-soft",
            "animate-[typing-bounce_1.4s_ease-in-out_infinite]"
          )}
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-ink-soft",
            "animate-[typing-bounce_1.4s_ease-in-out_infinite]"
          )}
          style={{ animationDelay: "0.4s" }}
        />
      </span>

      {/* Text with subtle pulse */}
      <span
        className={cn(
          "text-[15px] sm:text-[16px] text-ink-soft font-medium",
          "animate-[typing-pulse_2s_ease-in-out_infinite]"
        )}
      >
        {text}
      </span>
    </div>
  );
}
