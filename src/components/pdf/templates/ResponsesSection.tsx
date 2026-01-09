/**
 * Responses Section (Part 1) - What People Said
 *
 * Renders all responses organized by interview questions.
 */

import { PDF_COLORS, normalizeScale, normalizeRating } from "@/lib/pdf/pdfStyles";
import { RatingBarChart } from "./components/RatingBarChart";
import { RatingScale } from "./components/RatingScale";
import type { ResponseByQuestion } from "@/lib/responseExtraction";

interface ResponsesSectionProps {
  responses: ResponseByQuestion[];
}

export function ResponsesSection({ responses }: ResponsesSectionProps) {
  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div style={styles.section}>
      {/* Part header */}
      <h2 style={styles.partTitle}>Part 1: What People Said</h2>
      <p style={styles.partDescription}>
        Responses organized by interview questions, ordered by relationship type.
      </p>

      {/* Question blocks */}
      {responses.map((question, qIndex) => (
        <QuestionBlock
          key={question.questionId}
          question={question}
          index={qIndex + 1}
        />
      ))}
    </div>
  );
}

interface QuestionBlockProps {
  question: ResponseByQuestion;
  index: number;
}

function QuestionBlock({ question, index }: QuestionBlockProps) {
  const isRatingQuestion = question.questionType === "rating";
  const hasRatingStats = isRatingQuestion && question.ratingStats && question.ratingScale;

  return (
    <div style={styles.questionBlock}>
      {/* Question title */}
      <h3 style={styles.questionTitle}>
        Q{index}: {question.questionText}
      </h3>
      <div style={styles.divider} />

      {/* Rating stats box with bar chart */}
      {hasRatingStats && (
        <div style={styles.ratingStatsBox}>
          <div style={styles.ratingStatsTitle}>Rating Distribution</div>
          <RatingBarChart
            responses={question.responses
              .filter((r) => r.ratingValue !== undefined)
              .map((r) => ({
                respondentName: r.respondentName,
                relationshipLabel: r.relationshipLabel,
                value: r.ratingValue!,
              }))}
            maxRating={question.ratingScale!.max}
            lowLabel={question.ratingScale!.lowLabel}
            highLabel={question.ratingScale!.highLabel}
          />
        </div>
      )}

      {/* Individual responses */}
      {question.responses.map((response, rIndex) => (
        <ResponseItem
          key={`${response.surveyId}-${rIndex}`}
          response={response}
          isRating={isRatingQuestion}
          ratingScale={question.ratingScale}
        />
      ))}
    </div>
  );
}

interface ResponseItemProps {
  response: {
    respondentName: string;
    relationshipLabel: string;
    content: string;
    ratingValue?: number;
  };
  isRating: boolean;
  ratingScale?: {
    max: number;
    lowLabel?: string;
    highLabel?: string;
  };
}

function ResponseItem({ response, isRating, ratingScale }: ResponseItemProps) {
  const hasValidRating =
    isRating &&
    ratingScale &&
    response.ratingValue !== undefined &&
    normalizeRating(response.ratingValue, normalizeScale(ratingScale.max)) > 0;

  return (
    <div style={styles.responseItem}>
      <div style={styles.responseHeader}>
        {response.relationshipLabel} - {response.respondentName}:
      </div>

      {hasValidRating ? (
        <RatingScale
          max={ratingScale!.max}
          value={response.ratingValue!}
          lowLabel={ratingScale!.lowLabel}
          highLabel={ratingScale!.highLabel}
        />
      ) : (
        <div style={styles.responseContent}>{response.content}</div>
      )}
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
  partDescription: {
    fontSize: 10,
    marginBottom: 20,
    color: PDF_COLORS.inkSoft,
    fontStyle: "italic",
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  questionBlock: {
    marginBottom: 24,
    pageBreakInside: "avoid",
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  divider: {
    height: 1,
    backgroundColor: PDF_COLORS.divider,
    marginBottom: 12,
  },
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
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  responseItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeft: `2px solid ${PDF_COLORS.divider}`,
    pageBreakInside: "avoid",
  },
  responseHeader: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 4,
    color: PDF_COLORS.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  responseContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.ink,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
    whiteSpace: "pre-wrap",
  },
};
