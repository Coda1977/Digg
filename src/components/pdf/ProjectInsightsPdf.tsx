import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

type Sentiment = "positive" | "mixed" | "negative";

export type ProjectInsightsForPdf = {
  overview: string;
  keyThemes: string[];
  sentiment: Sentiment;
  specificPraise: string[];
  areasForImprovement: string[];
  basedOnSurveyCount: number;
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

export function ProjectInsightsPdf(props: {
  projectName: string;
  subjectName: string;
  subjectRole?: string;
  templateName?: string;
  analysis?: ProjectInsightsForPdf;
  surveys: SurveyForPdf[];
}) {
  const { projectName, subjectName, subjectRole, templateName, analysis, surveys } =
    props;

  const roleText = subjectRole ? ` (${subjectRole})` : "";

  return (
    <Document title={`Digg - ${subjectName} - ${projectName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Feedback report</Text>
        <Text style={styles.subtitle}>
          {subjectName}
          {roleText}
        </Text>

        <View style={styles.meta}>
          <MetaRow label="Project" value={projectName} />
          {templateName ? <MetaRow label="Survey Type" value={templateName} /> : null}
          <MetaRow
            label="Insights generated"
            value={analysis ? formatDateTime(analysis.generatedAt) : "—"}
          />
        </View>

        <Section title="Project insights">
          {!analysis ? (
            <Text style={styles.paragraph}>No project insights generated yet.</Text>
          ) : (
            <>
              <Text style={styles.paragraph}>
                Based on {analysis.basedOnSurveyCount} completed interviews · Sentiment:{" "}
                {analysis.sentiment}
              </Text>
              <Text style={styles.paragraph}>
                Insights generated: {formatDateTime(analysis.generatedAt)}
              </Text>
              <Subsection title="Overview">
                <Text style={styles.paragraph}>{analysis.overview}</Text>
              </Subsection>
              <Subsection title="Key themes">
                <BulletList items={analysis.keyThemes} />
              </Subsection>
              <Subsection title="Specific praise">
                <BulletList items={analysis.specificPraise} />
              </Subsection>
              <Subsection title="Areas for improvement">
                <BulletList items={analysis.areasForImprovement} />
              </Subsection>
            </>
          )}
        </Section>

        <Section title="Interviews">
          {surveys.length === 0 ? (
            <Text style={styles.paragraph}>No surveys yet.</Text>
          ) : (
            surveys.map((s, idx) => (
              <View key={`${idx}-${s.respondentName}`} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {s.respondentName} ({s.relationshipLabel})
                </Text>
                <Text style={styles.paragraph}>
                  Status: {s.status}
                  {s.completedAt ? ` · Completed: ${formatDateTime(s.completedAt)}` : ""}
                </Text>

                {s.summary ? (
                  <>
                    <Text style={styles.paragraph}>
                      Summary sentiment: {s.summary.sentiment} · Generated:{" "}
                      {formatDateTime(s.summary.generatedAt)}
                    </Text>
                    <Text style={styles.paragraph}>{s.summary.overview}</Text>
                    {s.summary.specificPraise.length > 0 ? (
                      <Subsection title="Praise">
                        <BulletList items={s.summary.specificPraise} />
                      </Subsection>
                    ) : null}
                    {s.summary.areasForImprovement.length > 0 ? (
                      <Subsection title="Improvements">
                        <BulletList items={s.summary.areasForImprovement} />
                      </Subsection>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.paragraph}>
                    No per-interview summary generated.
                  </Text>
                )}
              </View>
            ))
          )}
        </Section>
      </Page>
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
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  meta: { marginBottom: 16 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 70, color: "#444" },
  metaValue: { flex: 1 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  subsection: { marginTop: 8 },
  subsectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  paragraph: { marginBottom: 6 },
  list: { marginLeft: 10, marginBottom: 4 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 10 },
  listText: { flex: 1 },
  card: {
    border: "1 solid #E5E7EB",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
});
