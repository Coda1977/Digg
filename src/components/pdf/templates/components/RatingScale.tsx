/**
 * Rating Scale Component
 *
 * Renders a row of rating boxes [1][2][3]...[N] with the selected value highlighted.
 */

import { PDF_COLORS, normalizeScale, normalizeRating } from "@/lib/pdf/pdfStyles";

interface RatingScaleProps {
  max: number;
  value: number;
  lowLabel?: string;
  highLabel?: string;
}

export function RatingScale({ max, value, lowLabel, highLabel }: RatingScaleProps) {
  const safeMax = normalizeScale(max);
  const safeValue = normalizeRating(value, safeMax);
  const roundedValue = Math.round(safeValue);

  // Generate array of numbers from 1 to max
  const numbers = Array.from({ length: safeMax }, (_, i) => i + 1);

  return (
    <div>
      <div style={styles.ratingScaleContainer}>
        {numbers.map((num) => {
          const isHighlighted = num === roundedValue;
          return (
            <div
              key={num}
              style={isHighlighted ? styles.ratingBoxHighlighted : styles.ratingBox}
            >
              <span
                style={
                  isHighlighted ? styles.ratingNumberHighlighted : styles.ratingNumber
                }
              >
                {num}
              </span>
            </div>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div style={styles.ratingLabels}>
          <span style={styles.ratingLabel}>{lowLabel || ""}</span>
          <span style={styles.ratingLabel}>{highLabel || ""}</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ratingScaleContainer: {
    display: "flex",
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 4,
  },
  ratingBox: {
    width: 18,
    height: 18,
    border: `1px solid ${PDF_COLORS.divider}`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PDF_COLORS.white,
    marginRight: 3,
  },
  ratingBoxHighlighted: {
    width: 18,
    height: 18,
    border: `2px solid ${PDF_COLORS.accentRed}`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PDF_COLORS.accentRed,
    marginRight: 3,
  },
  ratingNumber: {
    fontSize: 8,
    fontWeight: 700,
    color: PDF_COLORS.inkSoft,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  ratingNumberHighlighted: {
    fontSize: 8,
    fontWeight: 700,
    color: PDF_COLORS.white,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  ratingLabels: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    maxWidth: 18 * 10 + 3 * 9, // max 10 boxes with 3px gaps
  },
  ratingLabel: {
    fontSize: 7,
    color: PDF_COLORS.inkLighter,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
};
