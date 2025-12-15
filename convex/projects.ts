import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_created")
      .order("desc")
      .collect();

    // Get survey stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const surveys = await ctx.db
          .query("surveys")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const completedCount = surveys.filter(
          (s) => s.status === "completed"
        ).length;
        const inProgressCount = surveys.filter(
          (s) => s.status === "in_progress"
        ).length;
        const totalCount = surveys.length;

        // Get template
        const template = await ctx.db.get(project.templateId);

        return {
          ...project,
          template,
          stats: {
            total: totalCount,
            completed: completedCount,
            inProgress: inProgressCount,
          },
        };
      })
    );

    return projectsWithStats;
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    const project = await ctx.db.get(args.id);
    if (!project) return null;

    const template = await ctx.db.get(project.templateId);
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    const completedCount = surveys.filter(
      (s) => s.status === "completed"
    ).length;
    const inProgressCount = surveys.filter(
      (s) => s.status === "in_progress"
    ).length;

    return {
      ...project,
      template,
      surveys,
      stats: {
        total: surveys.length,
        completed: completedCount,
        inProgress: inProgressCount,
      },
    };
  },
});

export const create = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.string(),
    subjectName: v.string(),
    subjectRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    const projectId = await ctx.db.insert("projects", {
      templateId: args.templateId,
      name: args.name,
      subjectName: args.subjectName,
      subjectRole: args.subjectRole,
      status: "active",
      createdAt: Date.now(),
      createdBy: userId,
    });

    return projectId;
  },
});

export const close = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: Date.now(),
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    await ctx.db.patch(args.id, {
      status: "active",
      closedAt: undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    // Delete all surveys and messages for this project
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const survey of surveys) {
      // Delete all messages for this survey
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_survey", (q) => q.eq("surveyId", survey._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(survey._id);
    }

    // Delete the project
    await ctx.db.delete(args.id);
  },
});
