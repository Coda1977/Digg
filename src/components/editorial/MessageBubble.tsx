import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const messageBubbleVariants = cva("mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300", {
  variants: {
    variant: {
      assistant: "border-l-4 border-ink pl-6",
      user: "bg-ink text-paper p-6 ml-0 md:ml-15",
    },
  },
  defaultVariants: {
    variant: "assistant",
  },
});

export interface MessageBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageBubbleVariants> {
  role?: string;
  showRole?: boolean;
}

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      className,
      variant,
      role,
      showRole = true,
      children,
      ...props
    },
    ref
  ) => {
    const displayRole =
      role || (variant === "assistant" ? "AI Interviewer" : "You");

    return (
      <div
        ref={ref}
        className={cn(messageBubbleVariants({ variant, className }))}
        {...props}
      >
        {showRole && (
          <div
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em] mb-3",
              variant === "assistant" ? "text-ink-soft" : "text-ink-lighter"
            )}
          >
            {displayRole}
          </div>
        )}
        <div
          className={cn(
            "text-base leading-relaxed whitespace-pre-wrap",
            variant === "assistant" ? "text-ink" : "text-paper"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
MessageBubble.displayName = "MessageBubble";

export { MessageBubble, messageBubbleVariants };
