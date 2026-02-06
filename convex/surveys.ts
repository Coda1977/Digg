import { v } from "convex/values";
import { nanoid } from "nanoid";
import { ConvexError } from "convex/values";
import {
  adminQuery,
  adminMutation,
  publicQuery,
  publicMutation,
  secretQuery,
} from "./lib/functions";

export const getByUniqueId = publicQuery({
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

export const getByProject = adminQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getCompletedByProject = adminQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("surveys")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "completed")
      )
      .collect();
  },
});

export const createFromProject = adminMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const uniqueId = nanoid(10);

    const surveyId = await ctx.db.insert("surveys", {
      projectId: args.projectId,
      uniqueId,
      status: "not_started",
    });

    return { surveyId, uniqueId };
  },
});

export const createPublicFromProject = publicMutation({
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

export const start = publicMutation({
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

export const complete = publicMutation({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.surveyId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const flagSensitive = adminMutation({
  args: {
    surveyId: v.id("surveys"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.surveyId, {
      isFlagged: true,
      flagReason: args.reason,
    });
  },
});

export const clearFlag = adminMutation({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.surveyId, {
      isFlagged: false,
      flagReason: undefined,
    });
  },
});

export const saveSummary = adminMutation({
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
    await ctx.db.patch(args.surveyId, {
      summary: {
        ...args.summary,
        generatedAt: Date.now(),
      },
    });
  },
});

export const remove = adminMutation({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const survey = await ctx.db.get(args.id);
    if (!survey) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_survey_order", (q) => q.eq("surveyId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const getById = adminQuery({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
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

export const getByProjectWithMessages = adminQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Fetch messages for each survey
    const surveysWithMessages = await Promise.all(
      surveys.map(async (survey) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_survey_order", (q) => q.eq("surveyId", survey._id))
          .collect();
        return { ...survey, messages };
      })
    );

    return surveysWithMessages;
  },
});

// Server-to-server getByProjectWithMessages for PDF generation (validates shared secret)
export const getByProjectWithMessagesInternal = secretQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Fetch messages for each survey
    const surveysWithMessages = await Promise.all(
      surveys.map(async (survey) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_survey_order", (q) => q.eq("surveyId", survey._id))
          .collect();
        return { ...survey, messages };
      })
    );

    return surveysWithMessages;
  },
});
