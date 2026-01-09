/**
 * Analysis Section (Part 2) - AI Analysis
 *
 * Renders the AI-generated analysis including summary, strengths,
 * improvements, narrative, and segmented analysis.
 */

import { PDF_COLORS, safeCount } from "@/lib/pdf/pdfStyles";
import type {
  ProjectInsightsForPdf,
  SegmentedAnalysisForPdf,
  Strength,
  Improvement,
} from "../ProjectInsightsPdf";

interface AnalysisSectionProps {
  analysis?: ProjectInsightsForPdf;
  segmentedAnalysis?: SegmentedAnalysisForPdf[];
}

export function AnalysisSection({
  analysis,
  segmentedAnalysis,
}: AnalysisSectionProps) {
  return (
    <div style={styles.section}>
      {/* Part header */}
      <h2 style={styles.partTitle}>Part 2: AI Analysis</h2>

      {!analysis ? (
        <p style={styles.paragraph}>No project insights generated yet.</p>
      ) : (
        <>
          {/* Overall Analysis */}
          <div style={styles.overallSection}>
            {analysis.coverage?.totalInterviews && (
              <p style={styles.paragraph}>
                Based on {analysis.coverage.totalInterviews} interview
                {analysis.coverage.totalInterviews !== 1 ? "s" : ""}.
              </p>
            )}

            {/* Summary */}
            {analysis.summary && (
              <Subsection title="Summary">
                <p style={styles.paragraph}>{analysis.summary}</p>
              </Subsection>
            )}

            {/* Strengths */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <Subsection title="Strengths">
                {analysis.strengths.map((strength, idx) => (
                  <StrengthItem key={idx} strength={strength} />
                ))}
              </Subsection>
            )}

            {/* Areas for Improvement */}
            {analysis.improvements && analysis.improvements.length > 0 && (
              <Subsection title="Areas for Improvement">
                {analysis.improvements.map((improvement, idx) => (
                  <ImprovementItem key={idx} improvement={improvement} />
                ))}
              </Subsection>
            )}

            {/* Narrative */}
            {analysis.narrative && (
              <Subsection title="Narrative">
                <p style={styles.paragraph}>{analysis.narrative}</p>
              </Subsection>
            )}
          </div>

          {/* Segmented Analysis */}
          {segmentedAnalysis && segmentedAnalysis.length > 0 && (
            <div style={styles.segmentedSection}>
              <h3 style={styles.sectionTitle}>Analysis by Relationship</h3>
              {segmentedAnalysis.map((segment, idx) => (
                <SegmentBlock key={idx} segment={segment} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SubsectionProps {
  title: string;
  children: React.ReactNode;
}

function Subsection({ title, children }: SubsectionProps) {
  return (
    <div style={styles.subsection}>
      <h4 style={styles.subsectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

interface StrengthItemProps {
  strength: Strength;
}

function StrengthItem({ strength }: StrengthItemProps) {
  const frequency = safeCount(strength.frequency);

  return (
    <div style={styles.listItem}>
      <span style={styles.bullet}>•</span>
      <div style={styles.listContent}>
        <div style={styles.strengthPoint}>{strength.point}</div>
        {strength.quote && <div style={styles.quote}>"{strength.quote}"</div>}
        {frequency !== undefined && (
          <div style={styles.frequency}>
            Mentioned by {frequency} respondent{frequency !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

interface ImprovementItemProps {
  improvement: Improvement;
}

function ImprovementItem({ improvement }: ImprovementItemProps) {
  const priorityColors: Record<string, string> = {
    high: PDF_COLORS.accentRed,
    medium: PDF_COLORS.accentYellow,
    low: PDF_COLORS.inkSoft,
  };

  return (
    <div style={styles.improvementItem}>
      <div style={styles.listItem}>
        <span style={styles.bullet}>•</span>
        <div style={styles.listContent}>
          <div style={styles.improvementPoint}>{improvement.point}</div>
          <div
            style={{
              ...styles.priorityBadge,
              color: priorityColors[improvement.priority] || PDF_COLORS.inkSoft,
            }}
          >
            Priority: {improvement.priority.toUpperCase()}
          </div>
        </div>
      </div>
      <div style={styles.improvementDetails}>
        <div style={styles.actionLabel}>Action</div>
        <div style={styles.actionText}>{improvement.action}</div>
        {improvement.quote && (
          <div style={styles.quote}>"{improvement.quote}"</div>
        )}
      </div>
    </div>
  );
}

interface SegmentBlockProps {
  segment: SegmentedAnalysisForPdf;
}

function SegmentBlock({ segment }: SegmentBlockProps) {
  const { analysis } = segment;

  return (
    <div style={styles.segmentBlock}>
      <h4 style={styles.segmentTitle}>{segment.relationshipLabel} Perspective</h4>

      {/* Summary */}
      {analysis.summary && <p style={styles.paragraph}>{analysis.summary}</p>}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div style={styles.miniSubsection}>
          <div style={styles.miniSubsectionTitle}>Strengths</div>
          {analysis.strengths.map((strength, idx) => (
            <StrengthItem key={idx} strength={strength} />
          ))}
        </div>
      )}

      {/* Improvements */}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div style={styles.miniSubsection}>
          <div style={styles.miniSubsectionTitle}>Areas for Improvement</div>
          {analysis.improvements.map((improvement, idx) => (
            <ImprovementItem key={idx} improvement={improvement} />
          ))}
        </div>
      )}

      {/* Narrative */}
      {analysis.narrative && <p style={styles.paragraph}>{analysis.narrative}</p>}
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
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  overallSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    color: PDF_COLORS.ink,
    borderBottom: `2px solid ${PDF_COLORS.ink}`,
    paddingBottom: 6,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
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
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
    whiteSpace: "pre-wrap",
  },
  listItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 8,
    pageBreakInside: "avoid",
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  listContent: {
    flex: 1,
  },
  strengthPoint: {
    fontWeight: 600,
    marginBottom: 3,
    color: PDF_COLORS.ink,
    fontSize: 10,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  quote: {
    fontStyle: "italic",
    fontSize: 9,
    color: PDF_COLORS.inkSoft,
    marginTop: 2,
    marginBottom: 2,
    paddingLeft: 8,
    borderLeft: `2px solid ${PDF_COLORS.divider}`,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  frequency: {
    fontSize: 8,
    color: PDF_COLORS.inkLighter,
    marginTop: 2,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  improvementItem: {
    marginBottom: 12,
    pageBreakInside: "avoid",
  },
  improvementPoint: {
    fontWeight: 600,
    marginBottom: 2,
    color: PDF_COLORS.ink,
    fontSize: 10,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  priorityBadge: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    marginTop: 2,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  improvementDetails: {
    marginLeft: 12,
    paddingLeft: 8,
    borderLeft: `1px solid ${PDF_COLORS.divider}`,
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: PDF_COLORS.inkSoft,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  actionText: {
    fontSize: 10,
    color: PDF_COLORS.ink,
    marginBottom: 3,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  segmentedSection: {
    marginTop: 24,
  },
  segmentBlock: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeft: `3px solid ${PDF_COLORS.divider}`,
    pageBreakInside: "avoid",
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  miniSubsection: {
    marginTop: 8,
    marginBottom: 8,
  },
  miniSubsectionTitle: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 4,
    color: PDF_COLORS.inkSoft,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
};
