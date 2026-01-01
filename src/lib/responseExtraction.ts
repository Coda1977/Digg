/**
 * Response extraction utility
 * Organizes interview messages by template questions
 */

import { sortByRelationship } from "./relationshipOrder";

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
 */
function calculateRatingStats(responses: Array<{ ratingValue?: number }>) {
  const ratings = responses
    .map(r => r.ratingValue)
    .filter((v): v is number => v !== undefined);

  if (ratings.length === 0) {
    return undefined;
  }

  const distribution = ratings.reduce((acc, rating) => {
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

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

  // Convert map to array, sort responses, and calculate rating stats
  const result = Array.from(questionMap.values()).map((question) => {
    const sortedResponses = sortByRelationship(
      question.responses,
      (r) => r.relationshipId
    );

    // Calculate rating stats if this is a rating question
    const ratingStats = question.questionType === "rating"
      ? calculateRatingStats(sortedResponses)
      : undefined;

    return {
      ...question,
      responses: sortedResponses,
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
