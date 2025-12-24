import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { nanoid } from "nanoid";
import { requireAdmin } from "./lib/authorization";
import { assertNoLegacyPlaceholders } from "./lib/templateValidation";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const templates = await ctx.db.query("templates").collect();

    // Get project counts for each template
    const templatesWithCounts = await Promise.all(
      templates.map(async (template) => {
        const projectCount = await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("templateId"), template._id))
          .collect();
        return {
          ...template,
          projectCount: projectCount.length,
        };
      })
    );

    return templatesWithCounts;
  },
});

export const getById = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByType = query({
  args: {
    type: v.union(
      v.literal("personal_360"),
      v.literal("team"),
      v.literal("cross_functional"),
      v.literal("organizational"),
      v.literal("custom")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("templates")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    questions: v.array(
      v.object({
        text: v.string(),
        collectMultiple: v.boolean(),
      })
    ),
    relationshipOptions: v.array(
      v.object({
        label: v.string(),
      })
    ),
    systemPromptTemplate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    assertNoLegacyPlaceholders(args.systemPromptTemplate);

    // Generate IDs and add order to questions
    const questions = args.questions.map((q, idx) => ({
      id: nanoid(8),
      text: q.text,
      collectMultiple: q.collectMultiple,
      order: idx + 1,
    }));

    // Generate IDs for relationship options
    const relationshipOptions = args.relationshipOptions.map((r) => ({
      id: nanoid(8),
      label: r.label,
    }));

    const templateId = await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      type: "custom",
      questions,
      relationshipOptions,
      systemPromptTemplate: args.systemPromptTemplate,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.string(),
    description: v.string(),
    questions: v.array(
      v.object({
        id: v.optional(v.string()), // Keep existing IDs if present
        text: v.string(),
        collectMultiple: v.boolean(),
      })
    ),
    relationshipOptions: v.array(
      v.object({
        id: v.optional(v.string()), // Keep existing IDs if present
        label: v.string(),
      })
    ),
    systemPromptTemplate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    assertNoLegacyPlaceholders(args.systemPromptTemplate);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Template not found");
    }

    // Prevent editing built-in templates
    if (existing.isBuiltIn) {
      throw new Error("Cannot edit built-in templates");
    }

    // Process questions: keep existing IDs or generate new ones
    const questions = args.questions.map((q, idx) => ({
      id: q.id || nanoid(8),
      text: q.text,
      collectMultiple: q.collectMultiple,
      order: idx + 1,
    }));

    // Process relationship options: keep existing IDs or generate new ones
    const relationshipOptions = args.relationshipOptions.map((r) => ({
      id: r.id || nanoid(8),
      label: r.label,
    }));

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      questions,
      relationshipOptions,
      systemPromptTemplate: args.systemPromptTemplate,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new ConvexError("Template not found");
    }

    // Prevent deleting built-in templates
    if (template.isBuiltIn) {
      throw new ConvexError("Cannot delete built-in templates");
    }

    // Check if template is in use by any projects
    const projectsUsingTemplate = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("templateId"), args.id))
      .collect();

    if (projectsUsingTemplate.length > 0) {
      throw new ConvexError(
        `Cannot delete template. It is currently used by ${projectsUsingTemplate.length} project(s).`
      );
    }

    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Generate new IDs for questions and relationships
    const questions = template.questions.map((q, idx) => ({
      id: nanoid(8),
      text: q.text,
      collectMultiple: q.collectMultiple,
      order: idx + 1,
    }));

    const relationshipOptions = template.relationshipOptions.map((r) => ({
      id: nanoid(8),
      label: r.label,
    }));

    const newTemplateId = await ctx.db.insert("templates", {
      name: `${template.name} (Copy)`,
      description: template.description,
      type: "custom",
      questions,
      relationshipOptions,
      systemPromptTemplate: template.systemPromptTemplate ?? "",
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return newTemplateId;
  },
});
