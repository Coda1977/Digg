/**
 * Transcripts Section (Appendix) - Full Transcripts
 *
 * Renders the full interview transcripts.
 */

import { PDF_COLORS } from "@/lib/pdf/pdfStyles";
import type { TranscriptForPdf } from "@/lib/pdf/types";

interface TranscriptsSectionProps {
  transcripts: TranscriptForPdf[];
}

export function TranscriptsSection({ transcripts }: TranscriptsSectionProps) {
  if (!transcripts || transcripts.length === 0) {
    return null;
  }

  return (
    <div style={styles.section}>
      {/* Part header */}
      <h2 style={styles.partTitle}>Appendix: Full Transcripts</h2>

      {/* Transcript blocks */}
      {transcripts.map((transcript, idx) => (
        <TranscriptBlock
          key={idx}
          transcript={transcript}
          index={idx + 1}
          isFirst={idx === 0}
        />
      ))}
    </div>
  );
}

interface TranscriptBlockProps {
  transcript: TranscriptForPdf;
  index: number;
  isFirst: boolean;
}

function TranscriptBlock({ transcript, index, isFirst }: TranscriptBlockProps) {
  return (
    <div
      style={{
        ...styles.transcriptBlock,
        pageBreakBefore: isFirst ? undefined : "always",
      }}
    >
      {/* Header */}
      <h3 style={styles.transcriptHeader}>
        Interview {index}: {transcript.respondentName} ({transcript.relationshipLabel})
      </h3>
      <div style={styles.divider} />

      {/* Messages */}
      {transcript.messages.map((message, msgIdx) => (
        <div key={msgIdx} style={styles.messageBlock}>
          <div style={styles.messageRole}>
            {message.role === "user" ? "Respondent" : "Interviewer"}:
          </div>
          <div style={styles.messageContent}>{message.content}</div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    pageBreakBefore: "always",
  },
  partTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: PDF_COLORS.ink,
    borderBottom: `3px solid ${PDF_COLORS.ink}`,
    paddingBottom: 8,
    letterSpacing: -0.5,
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
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
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  divider: {
    height: 1,
    backgroundColor: PDF_COLORS.divider,
    marginBottom: 12,
  },
  messageBlock: {
    marginBottom: 10,
    pageBreakInside: "avoid",
  },
  messageRole: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 2,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
  },
  messageContent: {
    fontSize: 10,
    lineHeight: 1.6,
    paddingLeft: 8,
    color: PDF_COLORS.ink,
    fontFamily: "'Inter', 'Noto Sans Hebrew', sans-serif",
    whiteSpace: "pre-wrap",
  },
};
