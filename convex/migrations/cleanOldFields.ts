import { internalMutation } from "../_generated/server";

const PRIORITY_VALUES = ["high", "medium", "low"] as const;

type Priority = (typeof PRIORITY_VALUES)[number];
type Strength = {
  point: string;
  quote?: string;
  frequency?: number;
};
type Improvement = {
  point: string;
  quote?: string;
  action: string;
  priority: Priority;
};
type NormalizedAnalysis = {
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
type NormalizedSegment = {
  relationshipType: string;
  relationshipLabel: string;
  summary: string;
  strengths: Strength[];
  improvements: Improvement[];
  narrative?: string;
  basedOnSurveyCount: number;
  generatedAt: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecordOfNumbers(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === "number");
}

function isPriority(value: unknown): value is Priority {
  return (
    typeof value === "string" &&
    PRIORITY_VALUES.includes(value as Priority)
  );
}

function normalizeStrengths(value: unknown): Strength[] | null {
  if (!Array.isArray(value)) return null;

  return value
    .filter((item) => {
      const record = asRecord(item);
      return !!record && typeof record.point === "string";
    })
    .map((item) => {
      const record = asRecord(item) ?? {};
      const quote =
        typeof record.quote === "string" ? record.quote : undefined;
      const frequency = isValidNumber(record.frequency)
        ? record.frequency
        : undefined;
      return {
        point: record.point as string,
        quote,
        frequency,
      };
    });
}

function normalizeImprovements(value: unknown): Improvement[] | null {
  if (!Array.isArray(value)) return null;

  return value
    .filter((item) => {
      const record = asRecord(item);
      return (
        !!record &&
        typeof record.point === "string" &&
        typeof record.action === "string" &&
        isPriority(record.priority)
      );
    })
    .map((item) => {
      const record = asRecord(item) ?? {};
      return {
        point: record.point as string,
        action: record.action as string,
        priority: record.priority as Priority,
        quote: typeof record.quote === "string" ? record.quote : undefined,
      };
    });
}

function normalizeCoverage(
  value: unknown
): NormalizedAnalysis["coverage"] | null {
  const record = asRecord(value);
  if (!record) return null;
  if (!isValidNumber(record.totalInterviews)) return null;
  if (!isRecordOfNumbers(record.breakdown)) return null;
  return {
    totalInterviews: record.totalInterviews,
    breakdown: record.breakdown,
  };
}

function normalizeAnalysis(value: unknown): NormalizedAnalysis | null {
  const record = asRecord(value);
  if (!record) return null;

  if (typeof record.summary !== "string") return null;
  const strengths = normalizeStrengths(record.strengths);
  const improvements = normalizeImprovements(record.improvements);
  const coverage = normalizeCoverage(record.coverage);
  if (!strengths || !improvements || !coverage) return null;
  if (!isValidNumber(record.generatedAt)) return null;

  return {
    summary: record.summary,
    strengths,
    improvements,
    narrative: typeof record.narrative === "string" ? record.narrative : undefined,
    coverage,
    generatedAt: record.generatedAt,
  };
}

function normalizeSegment(value: unknown): NormalizedSegment | null {
  const record = asRecord(value);
  if (!record) return null;

  if (typeof record.relationshipType !== "string") return null;
  if (typeof record.relationshipLabel !== "string") return null;
  if (typeof record.summary !== "string") return null;
  if (!isValidNumber(record.basedOnSurveyCount)) return null;
  if (!isValidNumber(record.generatedAt)) return null;

  const strengths = normalizeStrengths(record.strengths);
  const improvements = normalizeImprovements(record.improvements);
  if (!strengths || !improvements) return null;

  return {
    relationshipType: record.relationshipType,
    relationshipLabel: record.relationshipLabel,
    summary: record.summary,
    strengths,
    improvements,
    narrative: typeof record.narrative === "string" ? record.narrative : undefined,
    basedOnSurveyCount: record.basedOnSurveyCount,
    generatedAt: record.generatedAt,
  };
}

export const removeOldFields = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();

    for (const project of projects) {
      const patch: Record<string, unknown> = {};
      let hasChanges = false;

      if (project.analysis !== undefined) {
        const nextAnalysis = normalizeAnalysis(project.analysis as unknown);
        patch.analysis = nextAnalysis ?? undefined;
        hasChanges = true;
      }

      if (project.segmentedAnalysis !== undefined) {
        const segments = Array.isArray(project.segmentedAnalysis)
          ? project.segmentedAnalysis
              .map((segment) => normalizeSegment(segment as unknown))
              .filter(Boolean)
          : [];
        patch.segmentedAnalysis = segments.length > 0 ? segments : undefined;
        hasChanges = true;
      }

      if (hasChanges) {
        await ctx.db.patch(project._id, patch);
      }
    }
  },
});
