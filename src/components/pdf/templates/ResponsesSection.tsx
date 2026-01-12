/**
 * Responses Section (Part 1) - What People Said
 *
 * Renders all responses organized by interview questions.
 */

import { PDF_COLORS } from "@/lib/pdf/pdfStyles";
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

  // Calculate min/max range from responses with valid ratings
  const ratingValues = question.responses
    .map((r) => r.ratingValue)
    .filter((v): v is number => v !== undefined && v > 0);
  const minRating = ratingValues.length > 0 ? Math.min(...ratingValues) : 0;
  const maxRating = ratingValues.length > 0 ? Math.max(...ratingValues) : 0;
  const hasRange = minRating > 0 && maxRating > 0 && minRating !== maxRating;

  // For rating questions, get text follow-up responses (anonymous)
  const textFollowUps = isRatingQuestion
    ? question.responses
        .map((r) => r.content.trim())
        .filter((content) => {
          const isNumericOnly = /^\d+(\.\d+)?$/.test(content);
          return !isNumericOnly && content.length > 10;
        })
    : [];

  return (
    <div style={styles.questionBlock}>
      {/* Question title */}
      <h3 style={styles.questionTitle}>
        Q{index}: {question.questionText}
      </h3>
      <div style={styles.divider} />

      {/* Rating question: Average + Range + Ideas for Improvement */}
      {hasRatingStats && (
        <>
          <div style={styles.ratingStatsBox}>
            <div style={styles.ratingStatsTitle}>
              Average Rating: {question.ratingStats!.average.toFixed(1)} out of {question.ratingScale!.max}
              {hasRange && ` (Range: ${minRating}-${maxRating})`}
            </div>
            <RatingScale
              max={question.ratingScale!.max}
              value={question.ratingStats!.average}
              lowLabel={question.ratingScale!.lowLabel}
              highLabel={question.ratingScale!.highLabel}
            />
          </div>

          {/* Ideas for Improvement - anonymous bullet list */}
          {textFollowUps.length > 0 && (
            <div style={styles.ideasBox}>
              <div style={styles.ideasTitle}>Ideas for Improvement</div>
              {textFollowUps.map((text, idx) => (
                <div key={idx} style={styles.ideaBullet}>
                  • &ldquo;{text}&rdquo;
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Text questions: Individual responses with names */}
      {!isRatingQuestion &&
        question.responses.map((response, rIndex) => (
          <ResponseItem
            key={`${response.surveyId}-${rIndex}`}
            response={response}
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
  };
}

function ResponseItem({ response }: ResponseItemProps) {
  return (
    <div style={styles.responseItem}>
      <div style={styles.responseHeader}>
        {response.relationshipLabel} - {response.respondentName}:
      </div>
      <div style={styles.responseContent}>{response.content}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    // No page break - cover page already takes full page
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
  ideasBox: {
    backgroundColor: "#f8f8f6",
    padding: 12,
    marginBottom: 12,
    border: `1px solid ${PDF_COLORS.divider}`,
  },
  ideasTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: PDF_COLORS.ink,
    marginBottom: 8,
    fontFamily: "'Noto Sans Hebrew', 'Inter', sans-serif",
  },
  ideaBullet: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.ink,
    marginBottom: 6,
    paddingLeft: 4,
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
