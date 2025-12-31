import { useState } from "react";

type RatingInputProps = {
  max: number; // 3, 4, 5, 7, or 10
  lowLabel?: string;
  highLabel?: string;
  onSubmit: (value: number) => void;
  language?: "en" | "he";
};

export function RatingInput({
  max,
  lowLabel,
  highLabel,
  onSubmit,
  language = "en",
}: RatingInputProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    // Auto-submit after brief delay for visual feedback
    setTimeout(() => {
      onSubmit(value);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(value);
    }
  };

  // Generate array of rating values
  const ratingValues = Array.from({ length: max }, (_, i) => i + 1);

  // Determine if we need to stack on mobile for larger scales
  const shouldStack = max > 7;

  return (
    <div className="w-full space-y-6" dir={language === "he" ? "rtl" : "ltr"}>
      {/* Rating buttons */}
      <div
        className={`flex ${
          shouldStack ? "flex-wrap" : "flex-nowrap"
        } gap-2 justify-center items-center`}
        role="radiogroup"
        aria-label={language === "he" ? "בחר דירוג" : "Select rating"}
      >
        {ratingValues.map((value) => {
          const isSelected = selectedValue === value;
          const isHovered = hoveredValue === value;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${
                language === "he" ? "דירוג" : "Rating"
              } ${value} ${language === "he" ? `מתוך ${max}` : `of ${max}`}`}
              onClick={() => handleSelect(value)}
              onKeyDown={(e) => handleKeyDown(e, value)}
              onMouseEnter={() => setHoveredValue(value)}
              onMouseLeave={() => setHoveredValue(null)}
              className={`
                relative flex items-center justify-center
                min-w-[48px] min-h-[48px]
                w-12 h-12
                font-sans font-bold text-lg
                border-3 border-ink
                transition-all duration-150
                hover:bg-ink hover:text-paper
                focus:outline-none focus:ring-4 focus:ring-accent-red focus:ring-offset-2
                ${
                  isSelected || isHovered
                    ? "bg-ink text-paper scale-110"
                    : "bg-paper text-ink"
                }
                ${isSelected ? "ring-4 ring-accent-red ring-offset-2" : ""}
              `}
            >
              {value}
            </button>
          );
        })}
      </div>

      {/* Labels */}
      {(lowLabel || highLabel) && (
        <div className="flex justify-between items-start px-2 text-body-sm text-ink-soft">
          <div className="text-left max-w-[120px]">
            {lowLabel && (
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold text-ink text-xs">1</span>
                <span>{lowLabel}</span>
              </div>
            )}
          </div>
          <div className="text-right max-w-[120px]">
            {highLabel && (
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-ink text-xs">{max}</span>
                <span>{highLabel}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="text-center text-body-sm text-ink-soft">
        {language === "he"
          ? `בחר מספר מ-1 עד ${max}`
          : `Select a number from 1 to ${max}`}
      </div>
    </div>
  );
}
