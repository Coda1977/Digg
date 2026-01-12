/**
 * HTML Renderer for PDF Generation (Server-Side Only)
 *
 * This file should only be imported from API routes or server components.
 * It uses react-dom/server for rendering React components to HTML strings.
 */

import "server-only";
import { createElement } from "react";

// Dynamic import to avoid build-time bundling issues with react-dom/server
let renderToStaticMarkup: (element: React.ReactElement) => string;
const getRenderer = async () => {
  if (!renderToStaticMarkup) {
    const ReactDOMServer = await import("react-dom/server");
    renderToStaticMarkup = ReactDOMServer.renderToStaticMarkup;
  }
  return renderToStaticMarkup;
};
import { PDF_BASE_STYLES, PDF_COLORS } from "@/lib/pdf/pdfStyles";
import { CoverPage } from "@/components/pdf/templates/CoverPage";
import { ResponsesSection } from "@/components/pdf/templates/ResponsesSection";
import { AnalysisSection } from "@/components/pdf/templates/AnalysisSection";
import { TranscriptsSection } from "@/components/pdf/templates/TranscriptsSection";
import type {
  ProjectInsightsForPdf,
  SegmentedAnalysisForPdf,
  TranscriptForPdf,
} from "@/lib/pdf/types";
import type { ResponseByQuestion } from "@/lib/responseExtraction";

export interface PdfTemplateProps {
  projectName: string;
  subjectName: string;
  subjectRole?: string;
  templateName?: string;
  analysis?: ProjectInsightsForPdf;
  segmentedAnalysis?: SegmentedAnalysisForPdf[];
  responsesByQuestion?: ResponseByQuestion[];
  transcripts?: TranscriptForPdf[];
  coverageText?: string;
}

/**
 * Render the PDF template to an HTML string
 *
 * This function renders all React components to static HTML markup,
 * which is then passed to Puppeteer for PDF generation.
 */
export async function renderPdfHtml(props: PdfTemplateProps): Promise<string> {
  // Get the renderer (uses dynamic import)
  const render = await getRenderer();

  // Build the document using createElement to avoid JSX in a .ts file
  const documentElement = createElement(PdfDocument, props);
  const documentHtml = render(documentElement);

  // Wrap in full HTML document with styles
  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=794, initial-scale=1.0">
  <title>Digg - ${escapeHtml(props.subjectName)} - ${escapeHtml(props.projectName)}</title>
  <style>
    ${PDF_BASE_STYLES}
    ${additionalStyles}
  </style>
</head>
<body>
  ${documentHtml}
  <script>
    // Ensure fonts are loaded before rendering completes
    (async function() {
      try {
        await document.fonts.ready;
        // Force layout recalculation
        document.body.offsetHeight;
      } catch (e) {
        console.error('Font loading error:', e);
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Main PDF Document Component
 */
function PdfDocument(props: PdfTemplateProps) {
  const {
    subjectName,
    subjectRole,
    templateName,
    analysis,
    segmentedAnalysis,
    responsesByQuestion,
    transcripts,
    coverageText,
  } = props;

  return createElement(
    "div",
    { style: documentStyle },
    // Cover Page
    createElement(CoverPage, {
      subjectName,
      subjectRole,
      templateName,
      coverageText,
      generatedAt: analysis?.generatedAt,
    }),
    // Part 1: Responses
    responsesByQuestion && responsesByQuestion.length > 0
      ? createElement(ResponsesSection, { responses: responsesByQuestion })
      : null,
    // Part 2: Analysis
    createElement(AnalysisSection, { analysis, segmentedAnalysis }),
    // Appendix: Transcripts
    transcripts && transcripts.length > 0
      ? createElement(TranscriptsSection, { transcripts })
      : null
  );
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Document-level styles
 */
const documentStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "100vh",
  backgroundColor: PDF_COLORS.paper,
  color: PDF_COLORS.ink,
  fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  fontSize: 10,
  lineHeight: 1.6,
};

/**
 * Additional CSS styles specific to print/PDF rendering
 */
const additionalStyles = `
  /* Ensure proper Hebrew/RTL handling */
  [dir="rtl"], .rtl {
    direction: rtl;
    text-align: right;
  }

  /* Auto-detect text direction for mixed content */
  p, div, span, h1, h2, h3, h4, h5, h6 {
    unicode-bidi: plaintext;
  }

  /* Print-specific styles */
  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Force backgrounds to print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide things that shouldn't print */
    .no-print {
      display: none !important;
    }
  }

  /* SVG text styling */
  svg text {
    font-family: 'Noto Sans Hebrew', 'Inter', sans-serif;
  }

  /* Ensure proper line wrapping */
  .wrap-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
`;
