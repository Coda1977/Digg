/**
 * Rating Bar Chart Component
 *
 * SVG-based horizontal bar chart for rating visualization.
 * Shows individual ratings with an average line.
 */

import { PDF_COLORS, normalizeScale, normalizeRating } from "@/lib/pdf/pdfStyles";

interface RatingBarChartProps {
  responses: Array<{
    respondentName: string;
    relationshipLabel: string;
    value: number;
  }>;
  maxRating: number;
  lowLabel?: string;
  highLabel?: string;
}

export function RatingBarChart({
  responses,
  maxRating,
  lowLabel,
  highLabel,
}: RatingBarChartProps) {
  // Normalize maxRating to allowed scale
  const safeMax = normalizeScale(maxRating);

  // Normalize all response values and filter invalid ones
  const validResponses = responses
    .map((r) => ({ ...r, value: normalizeRating(r.value, safeMax) }))
    .filter((r) => r.value > 0);

  if (validResponses.length === 0) {
    return null;
  }

  const barHeight = 14;
  const barGap = 4;
  const labelWidth = 70;
  const chartWidth = 180;
  const valueWidth = 25;
  const totalWidth = labelWidth + chartWidth + valueWidth + 10;
  const chartHeight = validResponses.length * (barHeight + barGap) + 30;

  // Calculate average
  const sum = validResponses.reduce((a, b) => a + b.value, 0);
  const rawAvg = sum / validResponses.length;
  const avg = normalizeRating(rawAvg, safeMax) || safeMax / 2;

  // Calculate positions
  const avgX = labelWidth + (avg / safeMax) * chartWidth;
  const chartBottom = 20 + validResponses.length * (barHeight + barGap);

  return (
    <div style={{ marginTop: 8, marginBottom: 8 }}>
      <svg
        width={totalWidth}
        height={chartHeight}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Axis labels */}
        <text
          x={labelWidth}
          y={10}
          style={{
            fontSize: 7,
            fill: PDF_COLORS.inkLighter,
            fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
          }}
        >
          {lowLabel || "1"}
        </text>
        <text
          x={labelWidth + chartWidth - 30}
          y={10}
          style={{
            fontSize: 7,
            fill: PDF_COLORS.inkLighter,
            fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
          }}
        >
          {highLabel || String(safeMax)}
        </text>

        {/* Bars */}
        {validResponses.map((response, idx) => {
          const y = 20 + idx * (barHeight + barGap);
          const barWidth = (response.value / safeMax) * chartWidth;

          return (
            <g key={idx}>
              {/* Label */}
              <text
                x={0}
                y={y + 10}
                style={{
                  fontSize: 8,
                  fill: PDF_COLORS.inkSoft,
                  fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
                }}
              >
                {response.relationshipLabel.substring(0, 10)}
              </text>

              {/* Background bar */}
              <rect
                x={labelWidth}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill={PDF_COLORS.divider}
              />

              {/* Value bar */}
              <rect
                x={labelWidth}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={PDF_COLORS.accentRed}
              />

              {/* Value label */}
              <text
                x={labelWidth + chartWidth + 8}
                y={y + 10}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fill: PDF_COLORS.ink,
                  fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
                }}
              >
                {String(response.value)}
              </text>
            </g>
          );
        })}

        {/* Average line */}
        {validResponses.length > 1 && (
          <g>
            <line
              x1={avgX}
              y1={15}
              x2={avgX}
              y2={chartBottom}
              stroke={PDF_COLORS.ink}
              strokeWidth={2}
              strokeDasharray="4,2"
            />
            <text
              x={avgX - 15}
              y={chartBottom + 12}
              style={{
                fontSize: 8,
                fontWeight: 700,
                fill: PDF_COLORS.ink,
                fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
              }}
            >
              Avg: {avg.toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
