import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EditorialLabel } from "./EditorialLabel";
import { EditorialHeadline } from "./EditorialHeadline";

interface EditorialCardProps {
  eyebrow?: ReactNode;
  headline: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Editorial Card Component
 * Text-forward pattern: eyebrow → headline → description → link
 * Uses 4px left border (not top border) per editorial design mockups
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
        "group space-y-4 border-l-4 border-ink pl-8 py-6 transition-colors",
        onClick && "cursor-pointer hover:border-accent-red",
        className
      )}
      onClick={onClick}
    >
      {eyebrow && (
        <div className="mb-3">
          {typeof eyebrow === "string" ? (
            <EditorialLabel>{eyebrow}</EditorialLabel>
          ) : (
            eyebrow
          )}
        </div>
      )}

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
