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
    let currentText = line;
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

const messageBubbleVariants = cva("mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300", {
  variants: {
    variant: {
      assistant: "border-l-4 border-ink pl-6 py-1",
      user: "bg-ink text-paper px-6 py-5 ml-0 md:ml-15",
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

    // Parse markdown if children is a string
    const content = typeof children === 'string'
      ? parseMarkdown(children)
      : children;

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
            "text-[17px] leading-[1.8]",
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
