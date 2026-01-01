import * as React from "react";
import { cn } from "@/lib/utils";

export interface EditorialEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EditorialEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EditorialEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-ink-soft">
          {icon}
        </div>
      )}
      <h3 className="font-serif font-bold text-xl text-ink mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-body text-ink-soft max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
