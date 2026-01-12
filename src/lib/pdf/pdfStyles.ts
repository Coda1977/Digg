/**
 * PDF Styles - CSS constants and base styles for Puppeteer PDF generation
 */

// Import pre-encoded font data (bundled with serverless function)
import {
  NotoSansHebrew_Regular,
  NotoSansHebrew_Bold,
  Inter_Regular,
  Inter_Medium,
  Inter_Bold,
} from "./fontData";

// ============================================================================
// COLOR PALETTE (Editorial Design System)
// ============================================================================

export const PDF_COLORS = {
  paper: "#FAFAF8",        // Background (warm off-white)
  ink: "#0A0A0A",          // Primary text (nearly black)
  inkSoft: "#52525B",      // Secondary text
  inkLighter: "#A1A1AA",   // Tertiary text
  accentRed: "#DC2626",    // Highlights, ratings
  accentGreen: "#22C55E",  // Strengths (reserved)
  accentYellow: "#F59E0B", // Medium priority (reserved)
  divider: "#E5E5E5",      // Light dividers
  dividerStrong: "#0A0A0A", // Strong dividers (rules)
  white: "#FFFFFF",
};

// ============================================================================
// FONT FAMILIES
// ============================================================================

export const PDF_FONTS = {
  serif: "'Noto Sans Hebrew', 'Inter', sans-serif",
  sans: "'Noto Sans Hebrew', 'Inter', sans-serif",
};

// ============================================================================
// BASE CSS STYLES
// ============================================================================

// Generate base styles with embedded base64 fonts (bundled for serverless)
export function getPdfBaseStyles(): string {
  return `
  /* Font declarations - embedded as base64 for serverless */
  /* Hebrew font - loads for Hebrew character range */
  @font-face {
    font-family: 'Noto Sans Hebrew';
    src: url('${NotoSansHebrew_Regular}') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: block;
    unicode-range: U+0590-05FF, U+FB1D-FB4F;
  }
  @font-face {
    font-family: 'Noto Sans Hebrew';
    src: url('${NotoSansHebrew_Bold}') format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: block;
    unicode-range: U+0590-05FF, U+FB1D-FB4F;
  }
  /* Latin font - loads for Latin and common characters */
  @font-face {
    font-family: 'Inter';
    src: url('${Inter_Regular}') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }
  @font-face {
    font-family: 'Inter';
    src: url('${Inter_Medium}') format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: block;
  }
  @font-face {
    font-family: 'Inter';
    src: url('${Inter_Bold}') format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: block;
  }

  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    width: 100%;
    height: 100%;
  }

  body {
    font-family: ${PDF_FONTS.sans};
    font-size: 10px;
    line-height: 1.6;
    color: ${PDF_COLORS.ink};
    background-color: ${PDF_COLORS.paper};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page setup for print */
  @page {
    size: A4;
    margin: 50px 40px 60px 40px;
  }

  /* First page (cover) has no running header */
  @page :first {
    margin-top: 0;
  }

  /* Page break utilities */
  .page-break-before {
    page-break-before: always;
    break-before: page;
  }

  .page-break-after {
    page-break-after: always;
    break-after: page;
  }

  .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Typography utilities */
  .font-serif {
    font-family: ${PDF_FONTS.serif};
  }

  .font-sans {
    font-family: ${PDF_FONTS.sans};
  }

  .text-uppercase {
    text-transform: uppercase;
  }

  .font-bold {
    font-weight: 700;
  }

  .font-semibold {
    font-weight: 600;
  }

  .font-medium {
    font-weight: 500;
  }

  .italic {
    font-style: italic;
  }

  /* Color utilities */
  .text-ink {
    color: ${PDF_COLORS.ink};
  }

  .text-ink-soft {
    color: ${PDF_COLORS.inkSoft};
  }

  .text-ink-lighter {
    color: ${PDF_COLORS.inkLighter};
  }

  .text-accent-red {
    color: ${PDF_COLORS.accentRed};
  }

  .text-white {
    color: ${PDF_COLORS.white};
  }

  .bg-paper {
    background-color: ${PDF_COLORS.paper};
  }

  .bg-ink {
    background-color: ${PDF_COLORS.ink};
  }

  .bg-accent-red {
    background-color: ${PDF_COLORS.accentRed};
  }

  .bg-divider {
    background-color: ${PDF_COLORS.divider};
  }

  .bg-white {
    background-color: ${PDF_COLORS.white};
  }

  /* Border utilities */
  .border-divider {
    border-color: ${PDF_COLORS.divider};
  }

  .border-ink {
    border-color: ${PDF_COLORS.ink};
  }

  .border-accent-red {
    border-color: ${PDF_COLORS.accentRed};
  }

  /* Layout utilities */
  .flex {
    display: flex;
  }

  .flex-row {
    flex-direction: row;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .flex-1 {
    flex: 1;
  }

  .text-center {
    text-align: center;
  }

  .relative {
    position: relative;
  }

  .absolute {
    position: absolute;
  }
`;
}

// Legacy export for backwards compatibility
export const PDF_BASE_STYLES = getPdfBaseStyles();

// ============================================================================
// STYLE OBJECTS (matching original PDF component)
// ============================================================================

export const pdfStyleObjects = {
  // Page
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
    backgroundColor: PDF_COLORS.paper,
  },

  // Running header
  runningHeader: {
    position: "absolute" as const,
    top: 20,
    left: 40,
    right: 40,
  },
  runningHeaderText: {
    fontSize: 8,
    fontWeight: 500,
    color: PDF_COLORS.inkLighter,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  runningHeaderRule: {
    height: 1,
    backgroundColor: PDF_COLORS.divider,
    marginTop: 6,
  },

  // Page number
  pageNumber: {
    position: "absolute" as const,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    fontSize: 8,
    color: PDF_COLORS.inkLighter,
  },

  // Cover page
  coverPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    padding: 40,
  },
  coverTopRule: {
    position: "absolute" as const,
    top: 60,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: PDF_COLORS.ink,
  },
  coverBottomRule: {
    position: "absolute" as const,
    bottom: 80,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: PDF_COLORS.ink,
  },
  coverEyebrow: {
    fontSize: 10,
    fontWeight: 500,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase" as const,
    letterSpacing: 3,
    marginBottom: 16,
  },
  coverSubject: {
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 8,
    color: PDF_COLORS.ink,
    textAlign: "center" as const,
  },
  coverRole: {
    fontSize: 14,
    color: PDF_COLORS.inkSoft,
    marginBottom: 24,
    textAlign: "center" as const,
  },
  coverMeta: {
    fontSize: 11,
    color: PDF_COLORS.inkSoft,
    marginBottom: 4,
    textAlign: "center" as const,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: PDF_COLORS.ink,
    margin: "24px 0",
  },
  coverageBox: {
    marginTop: 32,
    padding: "16px 24px",
    borderTop: `2px solid ${PDF_COLORS.ink}`,
    borderBottom: `2px solid ${PDF_COLORS.ink}`,
    textAlign: "center" as const,
  },
  coverageText: {
    fontSize: 12,
    color: PDF_COLORS.ink,
    textAlign: "center" as const,
  },

  // Part titles
  partTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: PDF_COLORS.ink,
    borderBottom: `3px solid ${PDF_COLORS.ink}`,
    paddingBottom: 8,
    letterSpacing: -0.5,
  },
  partDescription: {
    fontSize: 10,
    marginBottom: 20,
    color: PDF_COLORS.inkSoft,
    fontStyle: "italic" as const,
  },

  // Question blocks
  questionBlock: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: PDF_COLORS.ink,
  },
  divider: {
    height: 1,
    backgroundColor: PDF_COLORS.divider,
    marginBottom: 12,
  },

  // Response items
  responseItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeft: `2px solid ${PDF_COLORS.divider}`,
  },
  responseHeader: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 4,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  responseContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
  },

  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    color: PDF_COLORS.ink,
    borderBottom: `2px solid ${PDF_COLORS.ink}`,
    paddingBottom: 6,
  },
  subsection: {
    marginTop: 12,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    color: PDF_COLORS.ink,
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
  },

  // Segment block
  segmentBlock: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeft: `3px solid ${PDF_COLORS.divider}`,
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: PDF_COLORS.ink,
  },

  // Transcript styles
  transcriptBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `1px solid ${PDF_COLORS.divider}`,
  },
  transcriptHeader: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    color: PDF_COLORS.ink,
  },
  messageBlock: {
    marginBottom: 10,
  },
  messageRole: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 2,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 10,
    lineHeight: 1.6,
    paddingLeft: 8,
    color: PDF_COLORS.ink,
  },

  // List styles
  listItem: {
    display: "flex",
    flexDirection: "row" as const,
    marginBottom: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: PDF_COLORS.ink,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
  },

  // Strength styles
  strengthPoint: {
    fontWeight: 600,
    marginBottom: 3,
    color: PDF_COLORS.ink,
  },
  quote: {
    fontStyle: "italic" as const,
    fontSize: 9,
    color: PDF_COLORS.inkSoft,
    marginTop: 2,
    marginBottom: 2,
    paddingLeft: 8,
    borderLeft: `2px solid ${PDF_COLORS.divider}`,
  },
  frequency: {
    fontSize: 8,
    color: PDF_COLORS.inkLighter,
    marginTop: 2,
  },

  // Improvement styles
  improvementItem: {
    marginBottom: 12,
  },
  improvementPoint: {
    fontWeight: 600,
    marginBottom: 2,
    color: PDF_COLORS.ink,
  },
  priorityBadge: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: PDF_COLORS.inkSoft,
    marginTop: 2,
  },
  improvementDetails: {
    marginLeft: 12,
    paddingLeft: 8,
    borderLeft: `1px solid ${PDF_COLORS.divider}`,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: PDF_COLORS.inkSoft,
    marginBottom: 2,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  actionText: {
    fontSize: 10,
    color: PDF_COLORS.ink,
    marginBottom: 3,
  },

  // Rating styles
  ratingStatsBox: {
    backgroundColor: PDF_COLORS.paper,
    padding: 12,
    marginBottom: 12,
    border: `1px solid ${PDF_COLORS.divider}`,
  },
  ratingStatsTitle: {
    fontSize: 9,
    fontWeight: 500,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
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
  },
  ratingNumberHighlighted: {
    fontSize: 8,
    fontWeight: 700,
    color: PDF_COLORS.white,
  },
  ratingLabels: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    marginTop: 2,
  },
  ratingLabel: {
    fontSize: 7,
    color: PDF_COLORS.inkLighter,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert a style object to inline CSS string
 */
export function styleToString(style: Record<string, unknown>): string {
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      // Handle numeric values (add px for certain properties)
      if (typeof value === "number" && !["fontWeight", "lineHeight", "flex", "opacity"].includes(key)) {
        return `${cssKey}: ${value}px`;
      }
      return `${cssKey}: ${value}`;
    })
    .join("; ");
}

/**
 * Format date for display (same as original)
 */
export function formatDate(ms: number): string {
  try {
    const date = new Date(ms);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// Allowed rating scales
export const ALLOWED_SCALES = [3, 4, 5, 7, 10] as const;
export const DEFAULT_SCALE = 10;

/**
 * Normalize scale max to an allowed value
 */
export function normalizeScale(max: number | undefined): number {
  if (max === undefined) return DEFAULT_SCALE;
  if (!Number.isFinite(max) || max <= 0 || max > 100) return DEFAULT_SCALE;
  const rounded = Math.round(max);
  if ((ALLOWED_SCALES as readonly number[]).includes(rounded)) return rounded;
  return DEFAULT_SCALE;
}

/**
 * Normalize a rating value to be valid within 1..maxScale
 */
export function normalizeRating(value: number | undefined, maxScale: number): number {
  if (value === undefined) return 0;
  if (!Number.isFinite(value)) return 0;
  if (value < 1 || value > maxScale) return 0;
  return Math.round(value * 10) / 10;
}

/**
 * Sanitize a count/frequency value for display
 */
export function safeCount(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0 || value > 10000) {
    console.error(`[PDF_CORRUPT_NUMBER] safeCount rejected: ${value}`);
    return undefined;
  }
  return Math.round(value);
}
