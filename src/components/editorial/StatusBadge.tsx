import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
  {
    variants: {
      status: {
        active: "bg-accent-red text-white",
        in_progress: "bg-ink text-paper",
        not_started: "bg-ink-lighter text-paper",
        completed: "bg-ink text-paper",
        closed: "bg-ink-soft text-paper",
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
  ({ className, status, label, children, ...props }, ref) => {
    // Convert status to display label if not provided
    const displayLabel =
      label ||
      children ||
      (status === "in_progress"
        ? "In Progress"
        : status === "not_started"
        ? "Not Started"
        : status?.replace("_", " "));

    return (
      <span
        className={cn(statusBadgeVariants({ status, className }))}
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
