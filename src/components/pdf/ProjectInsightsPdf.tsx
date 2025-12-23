import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResponseByQuestion } from "@/lib/responseExtraction";

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
  summary: string;
  strengths: Strength[];
  improvements: Improvement[];
  narrative?: string;
  coverage: {
    totalInterviews: number;
    breakdown: Record<string, number>;
  };
  generatedAt: number;
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
    summary: string;
    strengths: Strength[];
    improvements: Improvement[];
    narrative?: string;
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
    surveys,
  } = props;

  const roleText = subjectRole ? ` (${subjectRole})` : "";
  const generatedDate = analysis?.generatedAt
    ? formatDate(analysis.generatedAt)
    : formatDate(Date.now());

  return (
    <Document title={`Digg - ${subjectName} - ${projectName}`}>
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>Feedback Report</Text>
          <Text style={styles.coverSubject}>
            {subjectName}
            {roleText}
          </Text>
          {templateName && (
            <Text style={styles.coverMeta}>{templateName}</Text>
          )}
          <Text style={styles.coverMeta}>{generatedDate}</Text>
          {coverageText && (
            <View style={styles.coverageBox}>
              <Text style={styles.coverageText}>Based on {coverageText}</Text>
            </View>
          )}
        </View>
      </Page>

      {/* PART 1: WHAT PEOPLE SAID */}
      {responsesByQuestion && responsesByQuestion.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.partTitle}>Part 1: What People Said</Text>
          <Text style={styles.partDescription}>
            Responses organized by interview questions, ordered by relationship type.
          </Text>

          {responsesByQuestion.map((question, qIdx) => (
            <View key={question.questionId} style={styles.questionBlock}>
              <Text style={styles.questionTitle}>
                Q{qIdx + 1}: {question.questionText}
              </Text>
              <View style={styles.divider} />

              {question.responses.map((response, rIdx) => (
                <View key={`${response.surveyId}-${rIdx}`} style={styles.responseItem}>
                  <Text style={styles.responseHeader}>
                    {response.relationshipLabel} - {response.respondentName}:
                  </Text>
                  <Text style={styles.responseContent}>{response.content}</Text>
                </View>
              ))}
            </View>
          ))}
        </Page>
      )}

      {/* PART 2: AI ANALYSIS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.partTitle}>Part 2: AI Analysis</Text>

        {!analysis ? (
          <Text style={styles.paragraph}>No project insights generated yet.</Text>
        ) : (
          <>
            <Section title="Overall Analysis">
              <Text style={styles.paragraph}>
                Based on {analysis.coverage.totalInterviews} completed interview
                {analysis.coverage.totalInterviews === 1 ? "" : "s"}
              </Text>
              <Subsection title="Summary">
                <Text style={styles.paragraph}>{analysis.summary}</Text>
              </Subsection>

              <Subsection title="Strengths">
                {analysis.strengths.map((strength, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={styles.listText}>
                      <Text style={styles.strengthPoint}>{strength.point}</Text>
                      {strength.quote && (
                        <Text style={styles.quote}>"{strength.quote}"</Text>
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

              <Subsection title="Areas for Improvement">
                {analysis.improvements.map((improvement, idx) => (
                  <View key={idx} style={styles.improvementItem}>
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
                      <Text style={styles.actionLabel}>Action:</Text>
                      <Text style={styles.actionText}>{improvement.action}</Text>
                      {improvement.quote && (
                        <Text style={styles.quote}>"{improvement.quote}"</Text>
                      )}
                    </View>
                  </View>
                ))}
              </Subsection>

              {analysis.narrative && (
                <Subsection title="Narrative">
                  <Text style={styles.paragraph}>{analysis.narrative}</Text>
                </Subsection>
              )}
            </Section>

            {segmentedAnalysis && segmentedAnalysis.length > 0 && (
              <Section title="Segmented Analysis">
                {segmentedAnalysis.map((segment, idx) => (
                  <View key={idx} style={styles.segmentBlock}>
                    <Text style={styles.segmentTitle}>
                      {segment.relationshipLabel} Perspective
                    </Text>
                    <Text style={styles.paragraph}>{segment.analysis.summary}</Text>

                    {segment.analysis.strengths.length > 0 && (
                      <Subsection title="Strengths">
                        {segment.analysis.strengths.map((strength, sIdx) => (
                          <View key={sIdx} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <View style={styles.listText}>
                              <Text>{strength.point}</Text>
                              {strength.quote && (
                                <Text style={styles.quote}>"{strength.quote}"</Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </Subsection>
                    )}

                    {segment.analysis.improvements.length > 0 && (
                      <Subsection title="Areas for Improvement">
                        {segment.analysis.improvements.map((improvement, iIdx) => (
                          <View key={iIdx} style={styles.improvementItem}>
                            <View style={styles.improvementHeader}>
                              <Text style={styles.bullet}>•</Text>
                              <View style={styles.listText}>
                                <Text>{improvement.point}</Text>
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
        <Page size="A4" style={styles.page}>
          <Text style={styles.partTitle}>Appendix: Full Transcripts</Text>

          {transcripts.map((transcript, idx) => (
            <View key={idx} style={styles.transcriptBlock}>
              <Text style={styles.transcriptHeader}>
                Interview {idx + 1}: {transcript.respondentName} ({transcript.relationshipLabel})
              </Text>
              <View style={styles.divider} />

              {transcript.messages.map((msg, msgIdx) => (
                <View key={msgIdx} style={styles.messageBlock}>
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

function formatDateTime(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
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

function MetaRow(props: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{props.label}:</Text>
      <Text style={styles.metaValue}>{props.value}</Text>
    </View>
  );
}

function BulletList(props: { items: string[] }) {
  if (props.items.length === 0) return null;
  return (
    <View style={styles.list}>
      {props.items.map((item, idx) => (
        <View key={idx} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#1a1a1a",
  },

  // Cover page styles
  coverPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 16,
    color: "#1a1a1a",
  },
  coverSubject: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  coverMeta: {
    fontSize: 14,
    marginBottom: 4,
    color: "#4a4a4a",
  },
  coverageBox: {
    marginTop: 40,
    padding: 16,
    borderTop: "2 solid #1a1a1a",
    borderBottom: "2 solid #1a1a1a",
  },
  coverageText: {
    fontSize: 12,
    color: "#4a4a4a",
  },

  // Part title styles
  partTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1a1a1a",
    borderBottom: "2 solid #1a1a1a",
    paddingBottom: 6,
  },
  partDescription: {
    fontSize: 10,
    marginBottom: 16,
    color: "#6a6a6a",
    fontStyle: "italic",
  },

  // Question block styles (Part 1)
  questionBlock: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  divider: {
    borderBottom: "1 solid #cccccc",
    marginBottom: 10,
  },
  responseItem: {
    marginBottom: 10,
    paddingLeft: 8,
  },
  responseHeader: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 3,
    color: "#4a4a4a",
  },
  responseContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },

  // Section styles (Analysis)
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subsection: {
    marginTop: 10,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
    color: "#2a2a2a",
  },
  paragraph: {
    marginBottom: 8,
    fontSize: 10,
    lineHeight: 1.5,
  },

  // Segmented analysis styles
  segmentBlock: {
    marginBottom: 14,
    paddingLeft: 8,
    borderLeft: "2 solid #e0e0e0",
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#1a1a1a",
  },

  // Transcript styles (Appendix)
  transcriptBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1 solid #e0e0e0",
  },
  transcriptHeader: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
    color: "#1a1a1a",
  },
  messageBlock: {
    marginBottom: 10,
  },
  messageRole: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 2,
    color: "#6a6a6a",
    textTransform: "uppercase",
  },
  messageContent: {
    fontSize: 10,
    lineHeight: 1.5,
    paddingLeft: 8,
  },

  // List styles
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
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },

  // NEW: Strength and improvement styles
  strengthPoint: {
    fontWeight: 600,
    marginBottom: 3,
  },
  quote: {
    fontStyle: "italic",
    fontSize: 9,
    color: "#6a6a6a",
    marginTop: 2,
    marginBottom: 2,
  },
  frequency: {
    fontSize: 8,
    color: "#8a8a8a",
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
    marginBottom: 2,
  },
  priorityBadge: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#4a4a4a",
    marginTop: 2,
  },
  improvementDetails: {
    marginLeft: 12,
    paddingLeft: 8,
    borderLeft: "1 solid #e0e0e0",
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#6a6a6a",
    marginBottom: 2,
  },
  actionText: {
    fontSize: 10,
    marginBottom: 3,
  },

  // Legacy styles (kept for backwards compatibility)
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  meta: { marginBottom: 16 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 70, color: "#444" },
  metaValue: { flex: 1 },
  card: {
    border: "1 solid #E5E7EB",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
});
