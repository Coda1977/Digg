import * as React from "react";
import { cn } from "@/lib/utils";

export interface EditorialSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const EditorialSelect = React.forwardRef<
  HTMLSelectElement,
  EditorialSelectProps
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex w-full border-3 border-ink bg-paper px-5 py-5 text-base text-ink transition-colors focus-visible:outline-none focus-visible:border-accent-red disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        "min-h-[56px]",
        // Custom dropdown arrow
        "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjMEEwQTBBIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-[right_20px_center]",
        "pr-12", // Extra padding for arrow
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
EditorialSelect.displayName = "EditorialSelect";

export { EditorialSelect };
