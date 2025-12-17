import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import { requireAdmin } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("templates").collect();
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
