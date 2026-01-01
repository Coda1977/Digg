import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorialInput } from "./EditorialInput";

export interface EditorialSearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  showClearButton?: boolean;
}

const EditorialSearchInput = React.forwardRef<
  HTMLInputElement,
  EditorialSearchInputProps
>(({ className, value, onClear, showClearButton = true, ...props }, ref) => {
  const hasValue = value !== undefined && value !== "";

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft pointer-events-none"
        aria-hidden="true"
      />
      <EditorialInput
        type="search"
        value={value}
        className={cn("pl-12 pr-10", className)}
        ref={ref}
        {...props}
      />
      {showClearButton && hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
EditorialSearchInput.displayName = "EditorialSearchInput";

export { EditorialSearchInput };
