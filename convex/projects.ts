import { v, ConvexError } from "convex/values";
import { adminQuery, adminMutation, secretQuery } from "./lib/functions";

// ============================================================================
// SANITIZATION HELPERS - Prevent corrupt numbers from being stored
// ============================================================================

/**
 * Sanitize a frequency value (expected range: 1-100)
 * Returns undefined if corrupt or out of range
 */
function sanitizeFrequency(val: number | undefined): number | undefined {
  if (val === undefined) return undefined;
  if (!Number.isFinite(val) || val < 1 || val > 100) {
    console.warn(`[CONVEX] Rejected corrupt frequency: ${val}`);
    return undefined;
  }
  return Math.round(val);
}

/**
 * Sanitize a count value (expected range: 0-1000)
 * Returns 0 if corrupt or out of range
 */
function sanitizeCount(val: number): number {
  if (!Number.isFinite(val) || val < 0 || val > 1000) {
    console.warn(`[CONVEX] Rejected corrupt count: ${val}`);
    return 0;
  }
  return Math.round(val);
}

export const list = adminQuery({
  args: {},
  handler: async (ctx) => {
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

export const getById = adminQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
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

export const findSimilar = adminQuery({
  args: {
    templateId: v.id("templates"),
    subjectName: v.string(),
  },
  handler: async (ctx, args) => {
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

export const create = adminMutation({
  args: {
    templateId: v.id("templates"),
    name: v.string(),
    description: v.optional(v.string()),
    subjectName: v.string(),
    subjectRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      templateId: args.templateId,
      name: args.name,
      description: args.description,
      subjectName: args.subjectName,
      subjectRole: args.subjectRole,
      status: "active",
      createdAt: Date.now(),
      createdBy: ctx.userId,
    });

    return projectId;
  },
});

export const close = adminMutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: Date.now(),
    });
  },
});

export const reopen = adminMutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "active",
      closedAt: undefined,
    });
  },
});

export const remove = adminMutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    // Delete all surveys and messages for this project
    const surveys = await ctx.db
      .query("surveys")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const survey of surveys) {
      // Delete all messages for this survey
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_survey_order", (q) => q.eq("surveyId", survey._id))
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

export const getInsightsInput = adminQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
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

export const saveAnalysis = adminMutation({
  args: {
    projectId: v.id("projects"),
    analysis: v.object({
      summary: v.string(),
      strengths: v.array(
        v.object({
          point: v.string(),
          quote: v.optional(v.string()),
          frequency: v.optional(v.number()),
        })
      ),
      improvements: v.array(
        v.object({
          point: v.string(),
          quote: v.optional(v.string()),
          action: v.string(),
          priority: v.union(
            v.literal("high"),
            v.literal("medium"),
            v.literal("low")
          ),
        })
      ),
      narrative: v.optional(v.string()),
      coverage: v.object({
        totalInterviews: v.number(),
        breakdown: v.record(v.string(), v.number()),
      }),
    }),
    segmentedAnalysis: v.optional(
      v.array(
        v.object({
          relationshipType: v.string(),
          relationshipLabel: v.string(),
          summary: v.string(),
          strengths: v.array(
            v.object({
              point: v.string(),
              quote: v.optional(v.string()),
              frequency: v.optional(v.number()),
            })
          ),
          improvements: v.array(
            v.object({
              point: v.string(),
              quote: v.optional(v.string()),
              action: v.string(),
              priority: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low")
              ),
            })
          ),
          narrative: v.optional(v.string()),
          basedOnSurveyCount: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // SANITIZE all numeric values before storing to prevent corrupt data
    const sanitizedAnalysis = {
      summary: args.analysis.summary,
      strengths: args.analysis.strengths.map((s) => ({
        point: s.point,
        quote: s.quote,
        frequency: sanitizeFrequency(s.frequency),
      })),
      improvements: args.analysis.improvements,
      narrative: args.analysis.narrative,
      coverage: {
        totalInterviews: sanitizeCount(args.analysis.coverage.totalInterviews),
        breakdown: Object.fromEntries(
          Object.entries(args.analysis.coverage.breakdown).map(([k, v]) => [
            k,
            sanitizeCount(v),
          ])
        ),
      },
      generatedAt: Date.now(),
    };

    const updateData: {
      analysis: typeof sanitizedAnalysis;
      segmentedAnalysis?: Array<{
        relationshipType: string;
        relationshipLabel: string;
        summary: string;
        strengths: Array<{
          point: string;
          quote?: string;
          frequency?: number;
        }>;
        improvements: Array<{
          point: string;
          quote?: string;
          action: string;
          priority: "high" | "medium" | "low";
        }>;
        narrative?: string;
        basedOnSurveyCount: number;
        generatedAt: number;
      }>;
    } = {
      analysis: sanitizedAnalysis,
    };

    if (args.segmentedAnalysis) {
      // SANITIZE segmented analysis too
      updateData.segmentedAnalysis = args.segmentedAnalysis.map((segment) => ({
        relationshipType: segment.relationshipType,
        relationshipLabel: segment.relationshipLabel,
        summary: segment.summary,
        strengths: segment.strengths.map((s) => ({
          point: s.point,
          quote: s.quote,
          frequency: sanitizeFrequency(s.frequency),
        })),
        improvements: segment.improvements,
        narrative: segment.narrative,
        basedOnSurveyCount: sanitizeCount(segment.basedOnSurveyCount),
        generatedAt: Date.now(),
      }));
    }

    await ctx.db.patch(args.projectId, updateData);
  },
});

// Server-to-server getById for PDF generation (validates shared secret)
export const getByIdInternal = secretQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
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
