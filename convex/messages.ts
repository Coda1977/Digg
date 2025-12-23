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
