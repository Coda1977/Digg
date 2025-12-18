import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

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
    await requireAdmin(ctx);

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

export const findSimilar = query({
  args: {
    templateId: v.id("templates"),
    subjectName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const allProjects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .collect();

    // Find projects with similar subject name (case-insensitive match)
    const normalizedInput = args.subjectName.toLowerCase().trim();
    const similar = allProjects.filter((p) => {
      const normalizedSubject = p.subjectName.toLowerCase().trim();
      return normalizedSubject === normalizedInput;
    });

    return similar;
  },
});

export const create = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.string(),
    description: v.optional(v.string()),
    subjectName: v.string(),
    subjectRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);

    const projectId = await ctx.db.insert("projects", {
      templateId: args.templateId,
      name: args.name,
      description: args.description,
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
    await requireAdmin(ctx);

    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: Date.now(),
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.id, {
      status: "active",
      closedAt: undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

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

export const getInsightsInput = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const template = await ctx.db.get(project.templateId);

    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "completed")
      )
      .collect();

    const interviews = await Promise.all(
      surveys.map(async (survey) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_survey_order", (q) => q.eq("surveyId", survey._id))
          .collect();
        return { survey, messages };
      })
    );

    return { project, template, interviews };
  },
});

export const saveAnalysis = mutation({
  args: {
    projectId: v.id("projects"),
    analysis: v.object({
      overview: v.string(),
      keyThemes: v.array(v.string()),
      sentiment: v.union(
        v.literal("positive"),
        v.literal("mixed"),
        v.literal("negative")
      ),
      specificPraise: v.array(v.string()),
      areasForImprovement: v.array(v.string()),
      basedOnSurveyCount: v.number(),
    }),
    segmentedAnalysis: v.optional(
      v.array(
        v.object({
          relationshipType: v.string(),
          relationshipLabel: v.string(),
          overview: v.string(),
          keyThemes: v.array(v.string()),
          sentiment: v.union(
            v.literal("positive"),
            v.literal("mixed"),
            v.literal("negative")
          ),
          specificPraise: v.array(v.string()),
          areasForImprovement: v.array(v.string()),
          basedOnSurveyCount: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const updateData: {
      analysis: {
        overview: string;
        keyThemes: string[];
        sentiment: "positive" | "mixed" | "negative";
        specificPraise: string[];
        areasForImprovement: string[];
        basedOnSurveyCount: number;
        generatedAt: number;
      };
      segmentedAnalysis?: Array<{
        relationshipType: string;
        relationshipLabel: string;
        overview: string;
        keyThemes: string[];
        sentiment: "positive" | "mixed" | "negative";
        specificPraise: string[];
        areasForImprovement: string[];
        basedOnSurveyCount: number;
        generatedAt: number;
      }>;
    } = {
      analysis: {
        ...args.analysis,
        generatedAt: Date.now(),
      },
    };

    if (args.segmentedAnalysis) {
      updateData.segmentedAnalysis = args.segmentedAnalysis.map((segment) => ({
        ...segment,
        generatedAt: Date.now(),
      }));
    }

    await ctx.db.patch(args.projectId, updateData);
  },
});
