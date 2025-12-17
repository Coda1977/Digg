import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EditorialLabel } from "./EditorialLabel";
import { EditorialHeadline } from "./EditorialHeadline";

interface EditorialCardProps {
  eyebrow?: string;
  headline: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Editorial Card Component
 * Text-forward pattern: eyebrow → headline → description → link
 */
export function EditorialCard({
  eyebrow,
  headline,
  description,
  action,
  className,
  onClick,
}: EditorialCardProps) {
  return (
    <article
      className={cn(
        "group space-y-4 border-t-3 border-ink pt-6",
        onClick && "cursor-pointer transition-opacity hover:opacity-70",
        className
      )}
      onClick={onClick}
    >
      {eyebrow && <EditorialLabel>{eyebrow}</EditorialLabel>}

      <EditorialHeadline as="h3" size="sm">
        {headline}
      </EditorialHeadline>

      {description && (
        <div className="text-body-lg text-ink-soft leading-relaxed max-w-2xl">
          {description}
        </div>
      )}

      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </article>
  );
}
