import * as React from "react";
import { cn } from "@/lib/utils";

export type EditorialTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const EditorialTextarea = React.forwardRef<
  HTMLTextAreaElement,
  EditorialTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] sm:min-h-[120px] w-full border-2 sm:border-3 border-ink bg-paper px-3 py-4 sm:px-4 sm:py-5 md:px-5 text-base text-ink transition-colors placeholder:text-ink-lighter focus-visible:outline-none focus-visible:border-accent-red disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        "leading-relaxed", // line-height 1.6
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
EditorialTextarea.displayName = "EditorialTextarea";

export { EditorialTextarea };
