/**
 * PDF HTML Template
 *
 * Main template that assembles all PDF sections into a complete HTML document.
 * This HTML is then converted to PDF using Puppeteer.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { PDF_BASE_STYLES, PDF_COLORS } from "@/lib/pdf/pdfStyles";
import { CoverPage } from "./CoverPage";
import { ResponsesSection } from "./ResponsesSection";
import { AnalysisSection } from "./AnalysisSection";
import { TranscriptsSection } from "./TranscriptsSection";
import type {
  ProjectInsightsForPdf,
  SegmentedAnalysisForPdf,
  TranscriptForPdf,
} from "../ProjectInsightsPdf";
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
export function renderPdfHtml(props: PdfTemplateProps): string {
  const documentHtml = renderToStaticMarkup(<PdfDocument {...props} />);

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
</body>
</html>`;
}

/**
 * Main PDF Document Component
 */
function PdfDocument(props: PdfTemplateProps) {
  const {
    projectName,
    subjectName,
    subjectRole,
    templateName,
    analysis,
    segmentedAnalysis,
    responsesByQuestion,
    transcripts,
    coverageText,
  } = props;

  return (
    <div style={styles.document}>
      {/* Cover Page */}
      <CoverPage
        subjectName={subjectName}
        subjectRole={subjectRole}
        templateName={templateName}
        coverageText={coverageText}
        generatedAt={analysis?.generatedAt}
      />

      {/* Part 1: Responses */}
      {responsesByQuestion && responsesByQuestion.length > 0 && (
        <ResponsesSection responses={responsesByQuestion} />
      )}

      {/* Part 2: Analysis */}
      <AnalysisSection
        analysis={analysis}
        segmentedAnalysis={segmentedAnalysis}
      />

      {/* Appendix: Transcripts */}
      {transcripts && transcripts.length > 0 && (
        <TranscriptsSection transcripts={transcripts} />
      )}
    </div>
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
const styles: Record<string, React.CSSProperties> = {
  document: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: PDF_COLORS.paper,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
    fontSize: 10,
    lineHeight: 1.6,
  },
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
