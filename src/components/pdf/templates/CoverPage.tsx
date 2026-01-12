/**
 * Cover Page Component for PDF
 *
 * Renders the first page of the PDF with subject name, role, and metadata.
 */

import { PDF_COLORS, formatDate } from "@/lib/pdf/pdfStyles";

interface CoverPageProps {
  subjectName: string;
  subjectRole?: string;
  templateName?: string;
  coverageText?: string;
  generatedAt?: number;
}

export function CoverPage({
  subjectName,
  subjectRole,
  templateName,
  coverageText,
  generatedAt,
}: CoverPageProps) {
  const generatedDate = generatedAt ? formatDate(generatedAt) : "Not generated yet";

  return (
    <div style={styles.coverPage}>
      {/* Top rule */}
      <div style={styles.coverTopRule} />

      {/* Eyebrow */}
      <div style={styles.coverEyebrow}>Feedback Report</div>

      {/* Subject name - large */}
      <h1 style={styles.coverSubject}>{subjectName}</h1>

      {/* Role */}
      {subjectRole && <div style={styles.coverRole}>{subjectRole}</div>}

      {/* Divider */}
      <div style={styles.coverDivider} />

      {/* Meta info */}
      {templateName && <div style={styles.coverMeta}>{templateName}</div>}
      <div style={styles.coverMeta}>{generatedDate}</div>

      {/* Coverage stats */}
      {coverageText && (
        <div style={styles.coverageBox}>
          <div style={styles.coverEyebrow}>Based On</div>
          <div style={styles.coverageText}>{coverageText}</div>
        </div>
      )}

      {/* Bottom rule */}
      <div style={styles.coverBottomRule} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  coverPage: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 40,
    pageBreakAfter: "always",
  },
  coverTopRule: {
    position: "absolute",
    top: 60,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: PDF_COLORS.ink,
  },
  coverBottomRule: {
    position: "absolute",
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
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  coverSubject: {
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 8,
    color: PDF_COLORS.ink,
    textAlign: "center",
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  coverRole: {
    fontSize: 14,
    color: PDF_COLORS.inkSoft,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  coverMeta: {
    fontSize: 11,
    color: PDF_COLORS.inkSoft,
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: PDF_COLORS.ink,
    marginTop: 24,
    marginBottom: 24,
  },
  coverageBox: {
    marginTop: 32,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderTop: `2px solid ${PDF_COLORS.ink}`,
    borderBottom: `2px solid ${PDF_COLORS.ink}`,
    textAlign: "center",
  },
  coverageText: {
    fontSize: 12,
    color: PDF_COLORS.ink,
    textAlign: "center",
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
};
