import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // Survey templates (system and custom)
  templates: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("personal_360"),
      v.literal("team"),
      v.literal("cross_functional"),
      v.literal("organizational"),
      v.literal("custom")
    ),
    questions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        collectMultiple: v.boolean(),
        order: v.number(),
      })
    ),
    relationshipOptions: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
      })
    ),
    systemPromptTemplate: v.string(),
    isBuiltIn: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // Feedback projects
  projects: defineTable({
    templateId: v.id("templates"),
    name: v.string(),
    description: v.optional(v.string()),
    subjectName: v.string(),
    subjectRole: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("closed")),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    analysis: v.optional(
      v.object({
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
        generatedAt: v.number(),
      })
    ),
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
          generatedAt: v.number(),
        })
      )
    ),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Individual survey sessions
  surveys: defineTable({
    projectId: v.id("projects"),
    uniqueId: v.string(),
    respondentName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    isFlagged: v.optional(v.boolean()),
    flagReason: v.optional(v.string()),
    summary: v.optional(
      v.object({
        overview: v.string(),
        keyThemes: v.array(v.string()),
        sentiment: v.union(
          v.literal("positive"),
          v.literal("mixed"),
          v.literal("negative")
        ),
        specificPraise: v.array(v.string()),
        areasForImprovement: v.array(v.string()),
        generatedAt: v.number(),
      })
    ),
  })
    .index("by_uniqueId", ["uniqueId"])
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"]),

  // Chat messages within surveys
  messages: defineTable({
    surveyId: v.id("surveys"),
    role: v.union(v.literal("assistant"), v.literal("user")),
    content: v.string(),
    order: v.number(),
    createdAt: v.number(),
    // Question context - which template question this message relates to
    questionId: v.optional(v.string()),
    questionText: v.optional(v.string()),
  })
    .index("by_survey", ["surveyId"])
    .index("by_survey_order", ["surveyId", "order"]),
});
