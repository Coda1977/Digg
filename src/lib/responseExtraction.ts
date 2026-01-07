/**
 * Response extraction utility
 * Organizes interview messages by template questions
 */

import { sortByRelationship } from "./relationshipOrder";

// ============================================================================
// DATA NORMALIZATION CONSTANTS
// ============================================================================
// All rating scales must be one of these values
const ALLOWED_SCALES = [3, 4, 5, 7, 10] as const;
const DEFAULT_SCALE = 10;

/**
 * Normalize a rating scale max to an allowed value.
 * If corrupt or invalid, returns DEFAULT_SCALE.
 */
function normalizeScale(max: number | undefined): number {
  if (max === undefined) return DEFAULT_SCALE;
  if (!Number.isFinite(max) || max <= 0 || max > 100) return DEFAULT_SCALE;
  // Find closest allowed scale
  const rounded = Math.round(max);
  if ((ALLOWED_SCALES as readonly number[]).includes(rounded)) return rounded;
  // If not exact match, find closest
  let closest = DEFAULT_SCALE;
  let minDiff = Infinity;
  for (const scale of ALLOWED_SCALES) {
    const diff = Math.abs(scale - rounded);
    if (diff < minDiff) {
      minDiff = diff;
      closest = scale;
    }
  }
  return closest;
}

/**
 * Normalize a rating value to be valid within 1..maxScale.
 * Returns undefined if the value is corrupt or out of range.
 */
function normalizeRatingValue(value: number | undefined, maxScale: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  if (value < 1 || value > maxScale) return undefined;
  // Round to 1 decimal place
  return Math.round(value * 10) / 10;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  questionId?: string;
  questionText?: string;
  ratingValue?: number;
};

type Survey = {
  _id: string;
  respondentName?: string;
  relationship?: string;
  messages: Message[];
};

export type ResponseByQuestion = {
  questionId: string;
  questionText: string;
  questionType?: "text" | "rating";
  ratingScale?: {
    max: number;
    lowLabel?: string;
    highLabel?: string;
  };
  responses: Array<{
    surveyId: string;
    respondentName: string;
    relationshipId: string;
    relationshipLabel: string;
    content: string;
    ratingValue?: number;
  }>;
  ratingStats?: {
    average: number;
    distribution: Record<number, number>;
  };
};

type RelationshipOption = {
  id: string;
  label: string;
};

type TemplateQuestion = {
  id: string;
  text: string;
  type?: "text" | "rating";
  ratingScale?: {
    max: number;
    lowLabel?: string;
    highLabel?: string;
  };
};

/**
 * Calculate rating statistics from responses
 * Filters out invalid ratings and rounds the average to 1 decimal place
 */
function calculateRatingStats(responses: Array<{ ratingValue?: number }>, maxRating: number = 10) {
  const ratings = responses
    .map(r => r.ratingValue)
    .filter((v): v is number =>
      v !== undefined &&
      Number.isFinite(v) &&
      v >= 1 &&
      v <= maxRating
    );

  if (ratings.length === 0) {
    return undefined;
  }

  const distribution = ratings.reduce((acc, rating) => {
    // Round to nearest integer for distribution
    const roundedRating = Math.round(rating);
    acc[roundedRating] = (acc[roundedRating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Calculate average and round to 1 decimal place
  const sum = ratings.reduce((s, r) => s + r, 0);
  const average = Math.round((sum / ratings.length) * 10) / 10;

  return { average, distribution };
}

/**
 * Extract responses organized by template question
 * @param surveys Array of surveys with messages
 * @param relationshipOptions Relationship options for label mapping
 * @param templateQuestions Template questions for type information
 * @returns Array of questions with their responses, sorted by relationship
 */
export function extractResponsesByQuestion(
  surveys: Survey[],
  relationshipOptions: RelationshipOption[],
  templateQuestions?: TemplateQuestion[]
): ResponseByQuestion[] {
  // Map to store responses grouped by questionId
  const questionMap = new Map<string, ResponseByQuestion>();

  // Process each survey
  surveys.forEach((survey) => {
    const relationshipId = survey.relationship ?? "other";
    const relationshipLabel =
      relationshipOptions.find((r) => r.id === relationshipId)?.label ??
      relationshipId;
    const respondentName = survey.respondentName ?? "Anonymous";

    // Process each user message (respondent's answers)
    survey.messages.forEach((msg) => {
      if (msg.role === "user" && msg.questionId && msg.questionText) {
        // Get or create question entry
        if (!questionMap.has(msg.questionId)) {
          // Find question type from template
          const templateQuestion = templateQuestions?.find(q => q.id === msg.questionId);

          questionMap.set(msg.questionId, {
            questionId: msg.questionId,
            questionText: msg.questionText,
            questionType: templateQuestion?.type,
            ratingScale: templateQuestion?.ratingScale,
            responses: [],
          });
        }

        // Add response
        questionMap.get(msg.questionId)!.responses.push({
          surveyId: survey._id,
          respondentName,
          relationshipId,
          relationshipLabel,
          content: msg.content,
          ratingValue: msg.ratingValue,
        });
      }
    });
  });

  // Convert map to array, sort responses, normalize all data, and calculate rating stats
  const result = Array.from(questionMap.values()).map((question) => {
    const sortedResponses = sortByRelationship(
      question.responses,
      (r) => r.relationshipId
    );

    // NORMALIZE the rating scale to an allowed value [3, 4, 5, 7, 10]
    const normalizedMax = normalizeScale(question.ratingScale?.max);

    // Build the normalized ratingScale object (or undefined if no scale)
    const normalizedRatingScale = question.ratingScale
      ? {
          max: normalizedMax,
          lowLabel: question.ratingScale.lowLabel,
          highLabel: question.ratingScale.highLabel,
        }
      : undefined;

    // NORMALIZE all rating values to be within 1..normalizedMax
    const normalizedResponses = sortedResponses.map(r => ({
      ...r,
      ratingValue: normalizeRatingValue(r.ratingValue, normalizedMax),
    }));

    // Calculate rating stats using normalized values
    const ratingStats = question.questionType === "rating"
      ? calculateRatingStats(normalizedResponses, normalizedMax)
      : undefined;

    // WRITE BACK the normalized ratingScale (not the raw one!)
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      ratingScale: normalizedRatingScale,
      responses: normalizedResponses,
      ratingStats,
    };
  });

  return result;
}

/**
 * Get coverage statistics from surveys
 * @param surveys Array of surveys
 * @param relationshipOptions Relationship options for label mapping
 * @returns Coverage info with breakdown by relationship
 */
export function getCoverageStats(
  surveys: Survey[],
  relationshipOptions: RelationshipOption[]
): {
  totalInterviews: number;
  breakdown: Array<{ label: string; count: number }>;
  breakdownText: string;
} {
  const completedSurveys = surveys.filter((s) => s.messages.length > 0);
  const totalInterviews = completedSurveys.length;

  // Count by relationship
  const countMap = new Map<string, number>();
  completedSurveys.forEach((survey) => {
    const relationshipId = survey.relationship ?? "other";
    const relationshipLabel =
      relationshipOptions.find((r) => r.id === relationshipId)?.label ??
      relationshipId;
    countMap.set(relationshipLabel, (countMap.get(relationshipLabel) ?? 0) + 1);
  });

  const breakdown = Array.from(countMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Generate text like "2 Managers, 4 Peers, 2 Direct Reports"
  const breakdownText = breakdown
    .map((item) => `${item.count} ${item.label}${item.count === 1 ? "" : "s"}`)
    .join(", ");

  return { totalInterviews, breakdown, breakdownText };
}
