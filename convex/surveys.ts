import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import { ConvexError } from "convex/values";
import { requireAdmin } from "./lib/authorization";

export const getByUniqueId = query({
  args: { uniqueId: v.string() },
  handler: async (ctx, args) => {
    const survey = await ctx.db
      .query("surveys")
      .withIndex("by_uniqueId", (q) => q.eq("uniqueId", args.uniqueId))
      .first();

    if (!survey) return null;

    const project = await ctx.db.get(survey.projectId);
    if (!project) return null;

    const template = await ctx.db.get(project.templateId);
    if (!template) return null;

    return {
      ...survey,
      project,
      template,
    };
  },
});

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getCompletedByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("surveys")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "completed")
      )
      .collect();
  },
});

export const createFromProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const uniqueId = nanoid(10);

    const surveyId = await ctx.db.insert("surveys", {
      projectId: args.projectId,
      uniqueId,
      status: "not_started",
    });

    return { surveyId, uniqueId };
  },
});

export const createPublicFromProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");
    if (project.status !== "active") throw new ConvexError("Project is closed");

    const uniqueId = nanoid(10);

    const surveyId = await ctx.db.insert("surveys", {
      projectId: args.projectId,
      uniqueId,
      status: "not_started",
    });

    return { surveyId, uniqueId };
  },
});

export const start = mutation({
  args: {
    surveyId: v.id("surveys"),
    relationship: v.string(),
    respondentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.surveyId, {
      relationship: args.relationship,
      respondentName: args.respondentName,
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

export const complete = mutation({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.surveyId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const flagSensitive = mutation({
  args: {
    surveyId: v.id("surveys"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.surveyId, {
      isFlagged: true,
      flagReason: args.reason,
    });
  },
});

export const clearFlag = mutation({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.surveyId, {
      isFlagged: false,
      flagReason: undefined,
    });
  },
});

export const saveSummary = mutation({
  args: {
    surveyId: v.id("surveys"),
    summary: v.object({
      overview: v.string(),
      keyThemes: v.array(v.string()),
      sentiment: v.union(
        v.literal("positive"),
        v.literal("mixed"),
        v.literal("negative")
      ),
      specificPraise: v.array(v.string()),
      areasForImprovement: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.surveyId, {
      summary: {
        ...args.summary,
        generatedAt: Date.now(),
      },
    });
  },
});

export const getById = query({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const survey = await ctx.db.get(args.id);
    if (!survey) return null;

    const project = await ctx.db.get(survey.projectId);
    if (!project) return null;

    const template = await ctx.db.get(project.templateId);
    if (!template) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.id))
      .collect();

    return {
      ...survey,
      project,
      template,
      messages,
    };
  },
});
