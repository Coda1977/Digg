import * as React from "react";
import { cn } from "@/lib/utils";

export interface TemplateCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  title: string;
  description: string;
  onSelect?: () => void;
}

const TemplateCard = React.forwardRef<HTMLDivElement, TemplateCardProps>(
  (
    { className, selected, title, description, onSelect, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-l-4 p-8 transition-all cursor-pointer",
          selected
            ? "border-accent-red bg-white"
            : "border-ink-lighter hover:border-ink",
          className
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.();
          }
        }}
        {...props}
      >
        <div className="flex items-start gap-4">
          {/* Custom Radio Button Visual */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 border-3 border-ink rounded-full relative">
              {selected && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent-red rounded-full" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-bold leading-tight mb-2">
              {title}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }
);
TemplateCard.displayName = "TemplateCard";

export { TemplateCard };
