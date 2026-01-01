/**
 * Visual rating scale display for analysis page
 * Shows a scale with the selected/average value highlighted
 */

type RatingScaleDisplayProps = {
  max: number;
  value: number;
  lowLabel?: string;
  highLabel?: string;
  isAverage?: boolean;
};

// Use explicit hex color to ensure Tailwind JIT picks it up
const ACCENT_RED = "#DC2626";

export function RatingScaleDisplay({
  max,
  value,
  lowLabel,
  highLabel,
  isAverage = false,
}: RatingScaleDisplayProps) {
  const scaleValues = Array.from({ length: max }, (_, i) => i + 1);

  // For average, we highlight the closest integer but show the decimal
  const highlightValue = isAverage ? Math.round(value) : value;

  return (
    <div className="space-y-2">
      {/* Scale buttons */}
      <div className="flex gap-1 flex-wrap items-center">
        {scaleValues.map((num) => {
          const isHighlighted = num === highlightValue;

          return (
            <div
              key={num}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 font-sans font-bold text-sm sm:text-base border-2 transition-colors"
              style={
                isHighlighted
                  ? { backgroundColor: ACCENT_RED, color: "white", borderColor: ACCENT_RED }
                  : { backgroundColor: "var(--paper)", color: "var(--ink-soft)", borderColor: "rgba(10, 10, 10, 0.3)" }
              }
            >
              {num}
            </div>
          );
        })}

        {/* Show actual value next to scale */}
        {isAverage && (
          <span className="ml-2 font-serif text-lg font-bold text-ink">
            {value.toFixed(1)}
          </span>
        )}
      </div>

      {/* Labels */}
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-ink-soft">
          <span>{lowLabel || ""}</span>
          <span>{highLabel || ""}</span>
        </div>
      )}
    </div>
  );
}
