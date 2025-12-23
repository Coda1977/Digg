import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
  {
    variants: {
      status: {
        // Project statuses
        active: "bg-accent-red text-white",
        closed: "bg-ink-soft text-paper",
        // Interview/survey statuses - differentiated colors
        completed: "bg-green-700 text-white",
        in_progress: "bg-amber-600 text-white",
        not_started: "border-2 border-ink-soft text-ink-soft bg-transparent",
      },
      sentiment: {
        positive: "bg-green-700 text-white",
        neutral: "border-2 border-ink text-ink bg-transparent",
        negative: "border-2 border-accent-red text-accent-red bg-transparent",
        mixed: "border-2 border-amber-600 text-amber-700 bg-transparent",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, sentiment, label, children, ...props }, ref) => {
    // Convert status/sentiment to display label if not provided
    let displayLabel = label || children;

    if (!displayLabel) {
      if (sentiment) {
        displayLabel = sentiment;
      } else if (status === "in_progress") {
        displayLabel = "In Progress";
      } else if (status === "not_started") {
        displayLabel = "Not Started";
      } else if (status) {
        displayLabel = status.replace("_", " ");
      }
    }

    return (
      <span
        className={cn(statusBadgeVariants({ status: sentiment ? undefined : status, sentiment, className }))}
        ref={ref}
        {...props}
      >
        {displayLabel}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
