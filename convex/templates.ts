import { query } from "./_generated/server";
import { v } from "convex/values";
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
