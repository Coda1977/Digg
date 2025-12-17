import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorialLabelProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

/**
 * Editorial Label Component
 * ALL CAPS eyebrow labels for categorization
 */
export function EditorialLabel({
  children,
  className,
  accent = false,
}: EditorialLabelProps) {
  return (
    <span
      className={cn(
        "text-label font-sans font-semibold uppercase tracking-label",
        accent ? "text-accent-red" : "text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
