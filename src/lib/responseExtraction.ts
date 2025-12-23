/**
 * Response extraction utility
 * Organizes interview messages by template questions
 */

import { sortByRelationship } from "./relationshipOrder";

export type Message = {
  role: "user" | "assistant";
  content: string;
  questionId?: string;
  questionText?: string;
};

export type Survey = {
  _id: string;
  respondentName?: string;
  relationship?: string;
  messages: Message[];
};

export type ResponseByQuestion = {
  questionId: string;
  questionText: string;
  responses: Array<{
    surveyId: string;
    respondentName: string;
    relationshipId: string;
    relationshipLabel: string;
    content: string;
  }>;
};

export type RelationshipOption = {
  id: string;
  label: string;
};

/**
 * Extract responses organized by template question
 * @param surveys Array of surveys with messages
 * @param relationshipOptions Relationship options for label mapping
 * @returns Array of questions with their responses, sorted by relationship
 */
export function extractResponsesByQuestion(
  surveys: Survey[],
  relationshipOptions: RelationshipOption[]
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
          questionMap.set(msg.questionId, {
            questionId: msg.questionId,
            questionText: msg.questionText,
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
        });
      }
    });
  });

  // Convert map to array and sort responses by relationship
  const result = Array.from(questionMap.values()).map((question) => ({
    ...question,
    responses: sortByRelationship(
      question.responses,
      (r) => r.relationshipId
    ),
  }));

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
