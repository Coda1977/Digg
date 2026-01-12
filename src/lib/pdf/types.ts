/**
 * PDF Generation Types
 *
 * Shared type definitions for PDF generation.
 * Used by both the HTML renderer and template components.
 */

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
  summary?: string;
  strengths?: Strength[];
  improvements?: Improvement[];
  narrative?: string;
  coverage?: {
    totalInterviews: number;
    breakdown: Record<string, number>;
  };
  generatedAt: number;
  // Legacy schema fields - for backwards compatibility
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
    sentiment: "positive" | "mixed" | "negative";
    specificPraise: string[];
    areasForImprovement: string[];
    generatedAt: number;
  };
};

export type SegmentedAnalysisForPdf = {
  relationshipType: string;
  relationshipLabel: string;
  analysis: {
    summary?: string;
    strengths?: Strength[];
    improvements?: Improvement[];
    narrative?: string;
    // Legacy schema fields - for backwards compatibility
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
