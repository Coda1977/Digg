import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBySurvey = query({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.surveyId))
      .collect();
  },
});

export const save = mutation({
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

    const messageId = await ctx.db.insert("messages", {
      surveyId: args.surveyId,
      role: args.role,
      content: args.content,
      order: nextOrder,
      createdAt: Date.now(),
      questionId: args.questionId,
      questionText: args.questionText,
      ratingValue: args.ratingValue,
    });

    return messageId;
  },
});

export const getLatest = query({
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
export const debugRatings = query({
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
