import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      elements.push(<br key={`br-${lineIdx}`} />);
    }

    // Parse inline markdown (bold and italic)
    const parts: React.ReactNode[] = [];
    const currentText = line;
    let partIdx = 0;

    // Match **bold**, *italic*, or plain text
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)/g;
    let match;

    while ((match = regex.exec(currentText)) !== null) {
      const segment = match[0];

      if (segment.startsWith('**') && segment.endsWith('**')) {
        // Bold text
        parts.push(<strong key={`${lineIdx}-${partIdx++}`}>{segment.slice(2, -2)}</strong>);
      } else if (segment.startsWith('*') && segment.endsWith('*')) {
        // Italic text
        parts.push(<em key={`${lineIdx}-${partIdx++}`}>{segment.slice(1, -1)}</em>);
      } else {
        // Plain text
        parts.push(<span key={`${lineIdx}-${partIdx++}`}>{segment}</span>);
      }
    }

    elements.push(...parts);
  });

  return elements;
}

const messageBubbleVariants = cva("mb-6 sm:mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300", {
  variants: {
    variant: {
      assistant: "",
      user: "bg-ink text-paper px-4 py-4 sm:px-5 sm:py-5 md:px-6",
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
  direction?: 'ltr' | 'rtl';
}

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      className,
      variant,
      role,
      showRole = true,
      direction = 'ltr',
      children,
      ...props
    },
    ref
  ) => {
    const displayRole =
      role || (variant === "assistant" ? "AI Interviewer" : "You");

    // Parse markdown if children is a string
    const content = typeof children === 'string'
      ? parseMarkdown(children)
      : children;

    const isRtl = direction === 'rtl';

    return (
      <div
        ref={ref}
        className={cn(
          messageBubbleVariants({ variant, className }),
          variant === "assistant" && !isRtl && "border-l-3 sm:border-l-4 border-ink pl-4 sm:pl-5 md:pl-6 py-1",
          variant === "assistant" && isRtl && "border-r-3 sm:border-r-4 border-ink pr-4 sm:pr-5 md:pr-6 py-1",
          variant === "user" && !isRtl && "ml-0 sm:ml-8 md:ml-12 lg:ml-16",
          variant === "user" && isRtl && "mr-0 sm:mr-8 md:mr-12 lg:mr-16"
        )}
        dir={direction}
        {...props}
      >
        {showRole && (
          <div
            className={cn(
              "text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.12em] mb-2 sm:mb-3",
              variant === "assistant" ? "text-ink-soft" : "text-ink-lighter"
            )}
          >
            {displayRole}
          </div>
        )}
        <div
          className={cn(
            "text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] sm:leading-[1.8]",
            variant === "assistant" ? "text-ink" : "text-paper"
          )}
        >
          {content}
        </div>
      </div>
    );
  }
);
MessageBubble.displayName = "MessageBubble";

export { MessageBubble, messageBubbleVariants };
