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

// Allowed rating scales - same as in responseExtraction.ts
const ALLOWED_SCALES = [3, 4, 5, 7, 10] as const;
const DEFAULT_SCALE = 10;

/**
 * Normalize scale max to an allowed value.
 * Defensive guard in case raw data is passed directly.
 */
function normalizeScale(max: number): number {
  if (!Number.isFinite(max) || max <= 0 || max > 100) return DEFAULT_SCALE;
  const rounded = Math.round(max);
  if ((ALLOWED_SCALES as readonly number[]).includes(rounded)) return rounded;
  // Find closest allowed scale
  let closest = DEFAULT_SCALE;
  let minDiff = Infinity;
  for (const scale of ALLOWED_SCALES) {
    const diff = Math.abs(scale - rounded);
    if (diff < minDiff) {
      minDiff = diff;
      closest = scale;
    }
  }
  return closest;
}

export function RatingScaleDisplay({
  max,
  value,
  lowLabel,
  highLabel,
  isAverage = false,
}: RatingScaleDisplayProps) {
  // Normalize max to prevent Array.from crash with corrupt values
  const safeMax = normalizeScale(max);
  const scaleValues = Array.from({ length: safeMax }, (_, i) => i + 1);

  // Normalize value - if corrupt, don't highlight anything
  const safeValue = Number.isFinite(value) && value >= 1 && value <= safeMax ? value : 0;

  // For average, we highlight the closest integer but show the decimal
  const highlightValue = isAverage ? Math.round(safeValue) : safeValue;

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
        {isAverage && safeValue > 0 && (
          <span className="ml-2 font-serif text-lg font-bold text-ink">
            {safeValue.toFixed(1)}
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
