import * as React from "react";
import { cn } from "@/lib/utils";

export type EditorialInputProps =
  React.InputHTMLAttributes<HTMLInputElement>;
const EditorialInput = React.forwardRef<HTMLInputElement, EditorialInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border-3 border-ink bg-paper px-5 py-5 text-base text-ink transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-ink-lighter focus-visible:outline-none focus-visible:border-accent-red focus-visible:ring-1 focus-visible:ring-accent-red disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[56px]", // 14 * 4 = 56px for comfortable touch
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
EditorialInput.displayName = "EditorialInput";

export { EditorialInput };
