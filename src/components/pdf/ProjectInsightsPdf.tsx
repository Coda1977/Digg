import {
  Document,
  Font,
  Page,
  StyleSheet,
  Svg,
  Rect,
  Text as SvgText,
  G,
  Line,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResponseByQuestion } from "@/lib/responseExtraction";

// ============================================================================
// FONT REGISTRATION
// ============================================================================

// NOTE: Using built-in PDF fonts for maximum compatibility
// Custom fonts (WOFF2 from CDN) cause "DataView bounds" errors in browser-based @react-pdf/renderer
// Built-in fonts: Helvetica, Times-Roman, Courier (all with Bold, Oblique, BoldOblique variants)

// Map editorial font families to built-in PDF fonts
const FONT_SERIF = "Times-Roman";      // Used for headlines (instead of Fraunces)
const FONT_SANS = "Helvetica";         // Used for body text (instead of Inter)

// Disable hyphenation for cleaner text
Font.registerHyphenationCallback((word) => [word]);

// ============================================================================
// COLOR PALETTE (Editorial Design System)
// ============================================================================

const COLORS = {
  paper: "#FAFAF8",      // Background
  ink: "#0A0A0A",        // Primary text
  inkSoft: "#52525B",    // Secondary text
  inkLighter: "#A1A1AA", // Tertiary text
  accentRed: "#DC2626",  // Highlights, ratings
  accentGreen: "#22C55E", // Strengths
  accentYellow: "#F59E0B", // Medium priority
  divider: "#E5E5E5",    // Light dividers
  dividerStrong: "#0A0A0A", // Strong dividers (rules)
};

type Sentiment = "positive" | "mixed" | "negative";

export type Strength = {
  point: string;
  quote?: string;
  frequency?: number;
};

export type Improvement = {
  point: string;
  quote?: string;
  action: string;
  priority: "high" | "medium" | "low";
};

export type ProjectInsightsForPdf = {
  summary?: string; // Optional for backwards compatibility
  strengths?: Strength[]; // Optional for backwards compatibility
  improvements?: Improvement[]; // Optional for backwards compatibility
  narrative?: string;
  coverage?: {  // Optional for backwards compatibility
    totalInterviews: number;
    breakdown: Record<string, number>;
  };
  generatedAt: number;
  // OLD SCHEMA FIELDS - for backwards compatibility
  overview?: string;
  keyThemes?: string[];
  sentiment?: "positive" | "mixed" | "negative";
  specificPraise?: string[];
  areasForImprovement?: string[];
  basedOnSurveyCount?: number;
};

export type SurveyForPdf = {
  respondentName: string;
  relationshipLabel: string;
  status: string;
  completedAt?: number;
  summary?: {
    overview: string;
    keyThemes: string[];
    sentiment: Sentiment;
    specificPraise: string[];
    areasForImprovement: string[];
    generatedAt: number;
  };
};

export type SegmentedAnalysisForPdf = {
  relationshipType: string;
  relationshipLabel: string;
  analysis: {
    summary?: string; // Optional for backwards compatibility
    strengths?: Strength[]; // Optional for backwards compatibility
    improvements?: Improvement[]; // Optional for backwards compatibility
    narrative?: string;
    // OLD SCHEMA FIELDS - for backwards compatibility
    overview?: string;
    keyThemes?: string[];
    sentiment?: "positive" | "mixed" | "negative";
    specificPraise?: string[];
    areasForImprovement?: string[];
  };
};

export type TranscriptForPdf = {
  respondentName: string;
  relationshipLabel: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Rule component for horizontal dividers with weight hierarchy
 */
function Rule({ weight = "light" }: { weight?: "heavy" | "medium" | "light" }) {
  const heights = { heavy: 3, medium: 2, light: 1 };
  const colors = {
    heavy: COLORS.ink,
    medium: COLORS.ink,
    light: COLORS.divider,
  };
  return (
    <View
      style={{
        height: heights[weight],
        backgroundColor: colors[weight],
        marginVertical: 12,
      }}
    />
  );
}

/**
 * Running header component - appears on each page except cover
 */
function RunningHeader({
  subjectName,
  projectName,
}: {
  subjectName: string;
  projectName: string;
}) {
  return (
    <View style={styles.runningHeader} fixed>
      <Text style={styles.runningHeaderText}>
        {subjectName} — {projectName}
      </Text>
      <View style={styles.runningHeaderRule} />
    </View>
  );
}

/**
 * SVG-based horizontal bar chart for rating visualization
 */
function RatingBarChart({
  responses,
  maxRating,
  lowLabel,
  highLabel,
}: {
  responses: Array<{ respondentName: string; relationshipLabel: string; value: number }>;
  maxRating: number;
  lowLabel?: string;
  highLabel?: string;
}) {
  const barHeight = 14;
  const barGap = 4;
  const labelWidth = 70;
  const chartWidth = 180;
  const valueWidth = 25;
  const totalWidth = labelWidth + chartWidth + valueWidth + 10;
  const chartHeight = responses.length * (barHeight + barGap) + 30;

  // Calculate average
  const avg = responses.length > 0
    ? responses.reduce((a, b) => a + b.value, 0) / responses.length
    : 0;
  const avgX = labelWidth + (avg / maxRating) * chartWidth;
  const chartBottom = 20 + responses.length * (barHeight + barGap);

  return (
    <View style={{ marginVertical: 8 }}>
      <Svg width={totalWidth} height={chartHeight}>
        {/* Axis labels */}
        <SvgText x={labelWidth} y={10} style={{ fontSize: 7, fill: COLORS.inkLighter }}>
          {lowLabel || "1"}
        </SvgText>
        <SvgText x={labelWidth + chartWidth - 30} y={10} style={{ fontSize: 7, fill: COLORS.inkLighter }}>
          {highLabel || String(maxRating)}
        </SvgText>

        {/* Bars */}
        {responses.map((response, idx) => {
          const y = 20 + idx * (barHeight + barGap);
          const barWidth = (response.value / maxRating) * chartWidth;

          return (
            <G key={String(idx)}>
              {/* Label */}
              <SvgText x={0} y={y + 10} style={{ fontSize: 8, fill: COLORS.inkSoft }}>
                {response.relationshipLabel.substring(0, 10)}
              </SvgText>

              {/* Background bar */}
              <Rect
                x={labelWidth}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill={COLORS.divider}
              />

              {/* Value bar */}
              <Rect
                x={labelWidth}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={COLORS.accentRed}
              />

              {/* Value label */}
              <SvgText
                x={labelWidth + chartWidth + 8}
                y={y + 10}
                style={{ fontSize: 9, fontWeight: 700, fill: COLORS.ink }}
              >
                {String(response.value)}
              </SvgText>
            </G>
          );
        })}

        {/* Average line */}
        {responses.length > 1 && (
          <G>
            <Line
              x1={avgX}
              y1={15}
              x2={avgX}
              y2={chartBottom}
              stroke={COLORS.ink}
              strokeWidth={2}
              strokeDasharray="4,2"
            />
            <SvgText
              x={avgX - 15}
              y={chartBottom + 12}
              style={{ fontSize: 8, fontWeight: 700, fill: COLORS.ink }}
            >
              Avg: {avg.toFixed(1)}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

export function ProjectInsightsPdf(props: {
  projectName: string;
  subjectName: string;
  subjectRole?: string;
  templateName?: string;
  analysis?: ProjectInsightsForPdf;
  segmentedAnalysis?: SegmentedAnalysisForPdf[];
  responsesByQuestion?: ResponseByQuestion[];
  transcripts?: TranscriptForPdf[];
  coverageText?: string;
  surveys: SurveyForPdf[];
}) {
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

  const roleText = subjectRole ? ` (${subjectRole})` : "";
  const generatedDate = analysis?.generatedAt
    ? formatDate(analysis.generatedAt)
    : "Not generated yet";

  return (
    <Document title={`Digg - ${subjectName} - ${projectName}`}>
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Top rule */}
          <View style={styles.coverTopRule} />

          {/* Eyebrow */}
          <Text style={styles.coverEyebrow}>Feedback Report</Text>

          {/* Subject name - large */}
          <Text style={styles.coverSubject}>{subjectName}</Text>

          {/* Role */}
          {subjectRole && (
            <Text style={styles.coverRole}>{subjectRole}</Text>
          )}

          {/* Divider */}
          <View style={styles.coverDivider} />

          {/* Meta info */}
          {templateName && (
            <Text style={styles.coverMeta}>{templateName}</Text>
          )}
          <Text style={styles.coverMeta}>{generatedDate}</Text>

          {/* Coverage stats */}
          {coverageText && (
            <View style={styles.coverageBox}>
              <Text style={styles.coverEyebrow}>Based On</Text>
              <Text style={styles.coverageText}>{coverageText}</Text>
            </View>
          )}

          {/* Bottom rule */}
          <View style={styles.coverBottomRule} />
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PART 1: WHAT PEOPLE SAID */}
      {responsesByQuestion && responsesByQuestion.length > 0 && (
        <Page size="A4" style={styles.page}>
          <RunningHeader subjectName={subjectName} projectName={projectName} />
          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
          <Text style={styles.partTitle}>Part 1: What People Said</Text>
          <Text style={styles.partDescription}>
            Responses organized by interview questions, ordered by relationship type.
          </Text>

          {responsesByQuestion.map((question, qIdx) => (
            <View key={question.questionId} style={styles.questionBlock} wrap={false}>
              <Text style={styles.questionTitle}>
                Q{qIdx + 1}: {question.questionText}
              </Text>
              <View style={styles.divider} />

              {/* Rating Statistics with SVG bar chart */}
              {question.questionType === "rating" && question.ratingStats && question.ratingScale && (
                <View style={styles.ratingStatsBox}>
                  <Text style={styles.ratingStatsTitle}>Rating Distribution</Text>
                  <RatingBarChart
                    responses={question.responses
                      .filter((r) => r.ratingValue !== undefined)
                      .map((r) => ({
                        respondentName: r.respondentName,
                        relationshipLabel: r.relationshipLabel,
                        value: r.ratingValue as number,
                      }))}
                    maxRating={question.ratingScale.max}
                    lowLabel={question.ratingScale.lowLabel}
                    highLabel={question.ratingScale.highLabel}
                  />
                </View>
              )}

              {question.responses.map((response, rIdx) => (
                <View key={`${response.surveyId}-${rIdx}`} style={styles.responseItem} wrap={false}>
                  <Text style={styles.responseHeader}>
                    {response.relationshipLabel} - {response.respondentName}:
                  </Text>
                  {/* Show rating with visual scale */}
                  {response.ratingValue !== undefined && question.ratingScale ? (
                    <View style={{ marginTop: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {Array.from({ length: question.ratingScale.max }, (_, i) => i + 1).map((num) => {
                          const isHighlighted = num === response.ratingValue;
                          return (
                            <View
                              key={String(num)}
                              style={isHighlighted ? styles.ratingBoxHighlighted : styles.ratingBox}
                            >
                              <Text style={isHighlighted ? styles.ratingNumberHighlighted : styles.ratingNumber}>
                                {String(num)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      {(question.ratingScale.lowLabel || question.ratingScale.highLabel) && (
                        <View style={styles.ratingLabels}>
                          <Text style={styles.ratingLabel}>{question.ratingScale.lowLabel || ""}</Text>
                          <Text style={styles.ratingLabel}>{question.ratingScale.highLabel || ""}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.responseContent}>{response.content}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </Page>
      )}

      {/* PART 2: AI ANALYSIS */}
      <Page size="A4" style={styles.page} break>
        <RunningHeader subjectName={subjectName} projectName={projectName} />
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        <Text style={styles.partTitle}>Part 2: AI Analysis</Text>

        {!analysis ? (
          <Text style={styles.paragraph}>No project insights generated yet.</Text>
        ) : (
          <>
            <Section title="Overall Analysis">
              {analysis.coverage && (
                <Text style={styles.paragraph}>
                  Based on {analysis.coverage.totalInterviews} completed interview
                  {analysis.coverage.totalInterviews === 1 ? "" : "s"}
                </Text>
              )}
              {analysis.summary && (
                <Subsection title="Summary">
                  <Text style={styles.paragraph}>{analysis.summary}</Text>
                </Subsection>
              )}

              {analysis.strengths && analysis.strengths.length > 0 && (
                <Subsection title="Strengths">
                  {analysis.strengths.map((strength, idx) => (
                  <View key={idx} style={styles.listItem} wrap={false}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={styles.listText}>
                      <Text style={styles.strengthPoint}>{strength.point}</Text>
                      {strength.quote && (
                        <Text style={styles.quote}>
                          &quot;{strength.quote}&quot;
                        </Text>
                      )}
                      {strength.frequency && (
                        <Text style={styles.frequency}>
                          Mentioned by {strength.frequency} respondent
                          {strength.frequency === 1 ? "" : "s"}
                        </Text>
                      )}
                    </View>
                  </View>
                  ))}
                </Subsection>
              )}

              {analysis.improvements && analysis.improvements.length > 0 && (
                <Subsection title="Areas for Improvement">
                  {analysis.improvements.map((improvement, idx) => (
                  <View key={idx} style={styles.improvementItem} wrap={false}>
                    <View style={styles.improvementHeader}>
                      <Text style={styles.bullet}>•</Text>
                      <View style={styles.listText}>
                        <Text style={styles.improvementPoint}>{improvement.point}</Text>
                        <Text style={styles.priorityBadge}>
                          Priority: {improvement.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.improvementDetails}>
                      <Text style={styles.actionLabel}>Action</Text>
                      <Text style={styles.actionText}>{improvement.action}</Text>
                      {improvement.quote && (
                        <Text style={styles.quote}>
                          &quot;{improvement.quote}&quot;
                        </Text>
                      )}
                    </View>
                  </View>
                  ))}
                </Subsection>
              )}

              {analysis.narrative && (
                <Subsection title="Narrative">
                  <Text style={styles.paragraph}>{analysis.narrative}</Text>
                </Subsection>
              )}
            </Section>

            {segmentedAnalysis && segmentedAnalysis.length > 0 && (
              <Section title="Segmented Analysis">
                {segmentedAnalysis.map((segment, idx) => (
                  <View key={idx} style={styles.segmentBlock} wrap={false}>
                    <Text style={styles.segmentTitle}>
                      {segment.relationshipLabel} Perspective
                    </Text>
                    {segment.analysis.summary && (
                      <Text style={styles.paragraph}>{segment.analysis.summary}</Text>
                    )}

                    {segment.analysis.strengths && segment.analysis.strengths.length > 0 && (
                      <Subsection title="Strengths">
                        {segment.analysis.strengths.map((strength, sIdx) => (
                          <View key={sIdx} style={styles.listItem} wrap={false}>
                            <Text style={styles.bullet}>•</Text>
                            <View style={styles.listText}>
                              <Text style={styles.strengthPoint}>{strength.point}</Text>
                              {strength.quote && (
                                <Text style={styles.quote}>
                                  &quot;{strength.quote}&quot;
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </Subsection>
                    )}

                    {segment.analysis.improvements && segment.analysis.improvements.length > 0 && (
                      <Subsection title="Areas for Improvement">
                        {segment.analysis.improvements.map((improvement, iIdx) => (
                          <View key={iIdx} style={styles.improvementItem} wrap={false}>
                            <View style={styles.improvementHeader}>
                              <Text style={styles.bullet}>•</Text>
                              <View style={styles.listText}>
                                <Text style={styles.improvementPoint}>{improvement.point}</Text>
                              </View>
                            </View>
                            <View style={styles.improvementDetails}>
                              <Text style={styles.actionText}>{improvement.action}</Text>
                            </View>
                          </View>
                        ))}
                      </Subsection>
                    )}

                    {segment.analysis.narrative && (
                      <Text style={styles.paragraph}>{segment.analysis.narrative}</Text>
                    )}
                  </View>
                ))}
              </Section>
            )}
          </>
        )}
      </Page>

      {/* APPENDIX: FULL TRANSCRIPTS */}
      {transcripts && transcripts.length > 0 && (
        <Page size="A4" style={styles.page} break>
          <RunningHeader subjectName={subjectName} projectName={projectName} />
          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
          <Text style={styles.partTitle}>Appendix: Full Transcripts</Text>

          {transcripts.map((transcript, idx) => (
            <View key={idx} style={styles.transcriptBlock} break={idx > 0}>
              <Text style={styles.transcriptHeader}>
                Interview {idx + 1}: {transcript.respondentName} ({transcript.relationshipLabel})
              </Text>
              <View style={styles.divider} />

              {transcript.messages.map((msg, msgIdx) => (
                <View key={msgIdx} style={styles.messageBlock} wrap={false}>
                  <Text style={styles.messageRole}>
                    {msg.role === "assistant" ? "Interviewer" : "Respondent"}:
                  </Text>
                  <Text style={styles.messageContent}>{msg.content}</Text>
                </View>
              ))}
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

function Subsection(props: { title: string; children: ReactNode }) {
  return (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

function RatingScalePdf(props: {
  max: number;
  value: number;
  lowLabel?: string;
  highLabel?: string;
  isAverage?: boolean;
}) {
  const { max, value, lowLabel, highLabel, isAverage = false } = props;
  const scaleValues = Array.from({ length: max }, (_, i) => i + 1);
  const highlightValue = isAverage ? Math.round(value) : value;

  return (
    <View>
      <View style={styles.ratingScaleContainer}>
        {scaleValues.map((num) => {
          const isHighlighted = num === highlightValue;
          return (
            <View
              key={String(num)}
              style={isHighlighted ? styles.ratingBoxHighlighted : styles.ratingBox}
            >
              <Text style={isHighlighted ? styles.ratingNumberHighlighted : styles.ratingNumber}>
                {String(num)}
              </Text>
            </View>
          );
        })}
        {isAverage && (
          <Text style={styles.ratingAverageValue}>{value.toFixed(1)}</Text>
        )}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabel}>{lowLabel || ""}</Text>
          <Text style={styles.ratingLabel}>{highLabel || ""}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ============================================================================
  // PAGE STYLES
  // ============================================================================
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: FONT_SANS,
    lineHeight: 1.6,
    color: COLORS.ink,
    backgroundColor: COLORS.paper,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.inkLighter,
    fontFamily: FONT_SANS,
  },

  // ============================================================================
  // RUNNING HEADER
  // ============================================================================
  runningHeader: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
  },
  runningHeaderText: {
    fontSize: 8,
    fontFamily: FONT_SANS,
    fontWeight: 500,
    color: COLORS.inkLighter,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  runningHeaderRule: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginTop: 6,
  },

  // ============================================================================
  // COVER PAGE
  // ============================================================================
  coverPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  coverTopRule: {
    position: "absolute",
    top: 60,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: COLORS.ink,
  },
  coverBottomRule: {
    position: "absolute",
    bottom: 80,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: COLORS.ink,
  },
  coverEyebrow: {
    fontSize: 10,
    fontWeight: 500,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 8,
    color: COLORS.ink,
    letterSpacing: -1.5,
    textAlign: "center",
  },
  coverSubject: {
    fontSize: 28,
    fontWeight: 400,
    fontFamily: FONT_SERIF,
    marginBottom: 8,
    color: COLORS.ink,
    textAlign: "center",
  },
  coverRole: {
    fontSize: 14,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
    marginBottom: 24,
    textAlign: "center",
  },
  coverMeta: {
    fontSize: 11,
    fontFamily: FONT_SANS,
    marginBottom: 4,
    color: COLORS.inkSoft,
    textAlign: "center",
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.ink,
    marginVertical: 24,
  },
  coverageBox: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.ink,
    alignItems: "center",
  },
  coverageText: {
    fontSize: 12,
    fontFamily: FONT_SANS,
    color: COLORS.ink,
    textAlign: "center",
  },

  // ============================================================================
  // PART TITLES (Major Sections)
  // ============================================================================
  partTitle: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 16,
    color: COLORS.ink,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.ink,
    paddingBottom: 8,
    letterSpacing: -0.5,
  },
  partDescription: {
    fontSize: 10,
    marginBottom: 20,
    color: COLORS.inkSoft,
    fontStyle: "italic",
    fontFamily: FONT_SANS,
  },

  // ============================================================================
  // QUESTION BLOCKS (Part 1)
  // ============================================================================
  questionBlock: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 8,
    color: COLORS.ink,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },
  dividerStrong: {
    height: 2,
    backgroundColor: COLORS.ink,
    marginVertical: 16,
  },
  responseItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.divider,
  },
  responseHeader: {
    fontSize: 9,
    fontWeight: 500,
    fontFamily: FONT_SANS,
    marginBottom: 4,
    color: COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  responseContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.ink,
    fontFamily: FONT_SANS,
  },

  // ============================================================================
  // SECTION STYLES (Analysis)
  // ============================================================================
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 12,
    color: COLORS.ink,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink,
    paddingBottom: 6,
  },
  subsection: {
    marginTop: 12,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 6,
    color: COLORS.ink,
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 10,
    lineHeight: 1.6,
    fontFamily: FONT_SANS,
    color: COLORS.ink,
  },

  // ============================================================================
  // SEGMENTED ANALYSIS
  // ============================================================================
  segmentBlock: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.divider,
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 8,
    color: COLORS.ink,
  },

  // ============================================================================
  // TRANSCRIPT STYLES (Appendix)
  // ============================================================================
  transcriptBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  transcriptHeader: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    marginBottom: 10,
    color: COLORS.ink,
  },
  messageBlock: {
    marginBottom: 10,
  },
  messageRole: {
    fontSize: 9,
    fontWeight: 500,
    fontFamily: FONT_SANS,
    marginBottom: 2,
    color: COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 10,
    fontFamily: FONT_SANS,
    lineHeight: 1.6,
    paddingLeft: 8,
    color: COLORS.ink,
  },

  // ============================================================================
  // LIST STYLES
  // ============================================================================
  list: {
    marginLeft: 12,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    fontFamily: FONT_SANS,
    color: COLORS.ink,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONT_SANS,
    lineHeight: 1.6,
    color: COLORS.ink,
  },

  // ============================================================================
  // STRENGTH AND IMPROVEMENT STYLES
  // ============================================================================
  strengthPoint: {
    fontWeight: 600,
    fontFamily: FONT_SANS,
    marginBottom: 3,
    color: COLORS.ink,
  },
  quote: {
    fontStyle: "italic",
    fontFamily: FONT_SANS,
    fontSize: 9,
    color: COLORS.inkSoft,
    marginTop: 2,
    marginBottom: 2,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.divider,
  },
  frequency: {
    fontSize: 8,
    fontFamily: FONT_SANS,
    color: COLORS.inkLighter,
    marginTop: 2,
  },
  improvementItem: {
    marginBottom: 12,
  },
  improvementHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  improvementPoint: {
    fontWeight: 600,
    fontFamily: FONT_SANS,
    marginBottom: 2,
    color: COLORS.ink,
  },
  priorityBadge: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: FONT_SANS,
    textTransform: "uppercase",
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  improvementDetails: {
    marginLeft: 12,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: 500,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionText: {
    fontSize: 10,
    fontFamily: FONT_SANS,
    color: COLORS.ink,
    marginBottom: 3,
  },

  // ============================================================================
  // RATING SCALE STYLES
  // ============================================================================
  ratingScaleContainer: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 4,
  },
  ratingBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginRight: 3,
  },
  ratingBoxHighlighted: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.accentRed,
    marginRight: 3,
  },
  ratingNumber: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
  },
  ratingNumberHighlighted: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: FONT_SANS,
    color: "#ffffff",
  },
  ratingLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  ratingLabel: {
    fontSize: 7,
    fontFamily: FONT_SANS,
    color: COLORS.inkLighter,
  },
  ratingStatsBox: {
    backgroundColor: COLORS.paper,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  ratingStatsTitle: {
    fontSize: 9,
    fontWeight: 500,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  ratingAverage: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingAverageValue: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: FONT_SERIF,
    color: COLORS.ink,
    marginLeft: 10,
  },
  ratingAverageLabel: {
    fontSize: 9,
    fontFamily: FONT_SANS,
    color: COLORS.inkSoft,
  },

  // ============================================================================
  // LEGACY STYLES (kept for backwards compatibility)
  // ============================================================================
  title: { fontSize: 20, fontWeight: 700, fontFamily: FONT_SERIF, marginBottom: 4, color: COLORS.ink },
  subtitle: { fontSize: 14, fontFamily: FONT_SANS, marginBottom: 12, color: COLORS.inkSoft },
  meta: { marginBottom: 16 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 70, fontFamily: FONT_SANS, color: COLORS.inkSoft },
  metaValue: { flex: 1, fontFamily: FONT_SANS, color: COLORS.ink },
  card: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: 700, fontFamily: FONT_SERIF, marginBottom: 4, color: COLORS.ink },
});
