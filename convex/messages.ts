import { v } from "convex/values";
import { publicQuery, publicMutation, adminQuery } from "./lib/functions";

export const getBySurvey = publicQuery({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.surveyId))
      .collect();
  },
});

// Maximum allowed rating scale value - all ratings must be within 1..max
const MAX_ALLOWED_SCALE = 10;

/**
 * Sanitize rating value at storage time to prevent corrupt data.
 * Returns undefined if invalid, clamped value if valid.
 */
function sanitizeRatingValue(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  if (value < 1 || value > MAX_ALLOWED_SCALE) return undefined;
  // Round to 1 decimal place and clamp
  return Math.round(Math.max(1, Math.min(MAX_ALLOWED_SCALE, value)) * 10) / 10;
}

export const save = publicMutation({
  args: {
    surveyId: v.id("surveys"),
    role: v.union(v.literal("assistant"), v.literal("user")),
    content: v.string(),
    questionId: v.optional(v.string()),
    questionText: v.optional(v.string()),
    ratingValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.surveyId))
      .order("desc")
      .first();

    const nextOrder = (lastMessage?.order ?? -1) + 1;

    // Sanitize rating value at storage time
    const sanitizedRating = sanitizeRatingValue(args.ratingValue);

    const messageId = await ctx.db.insert("messages", {
      surveyId: args.surveyId,
      role: args.role,
      content: args.content,
      order: nextOrder,
      createdAt: Date.now(),
      questionId: args.questionId,
      questionText: args.questionText,
      ratingValue: sanitizedRating,
    });

    return messageId;
  },
});

export const getLatest = publicQuery({
  args: { surveyId: v.id("surveys"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.surveyId))
      .collect();

    // Return last N messages
    return messages.slice(-limit);
  },
});

// Debug query to find messages with rating values for a project
export const debugRatings = adminQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get all surveys for this project
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const results = [];
    for (const survey of surveys) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_survey_order", (q) => q.eq("surveyId", survey._id))
        .collect();

      const ratingsInSurvey = messages
        .filter(m => m.ratingValue !== undefined)
        .map(m => ({
          surveyId: survey._id,
          respondentName: survey.respondentName,
          questionId: m.questionId,
          content: m.content,
          ratingValue: m.ratingValue,
          ratingValueType: typeof m.ratingValue,
          isFinite: Number.isFinite(m.ratingValue),
          absValue: m.ratingValue !== undefined ? Math.abs(m.ratingValue) : undefined,
        }));

      results.push(...ratingsInSurvey);
    }

    return results;
  },
});
