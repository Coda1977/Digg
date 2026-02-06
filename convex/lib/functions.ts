import { ConvexError, v } from "convex/values";
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { requireAdmin } from "./authorization";

// ---------------------------------------------------------------------------
// Admin wrappers — auto-call requireAdmin, inject ctx.userId & ctx.user
// ---------------------------------------------------------------------------

export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const { userId, user } = await requireAdmin(ctx);
    return { ctx: { userId, user }, args: {} };
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const { userId, user } = await requireAdmin(ctx);
    return { ctx: { userId, user }, args: {} };
  },
});

// ---------------------------------------------------------------------------
// Public wrappers — no auth, pass-through (respondent-facing)
// ---------------------------------------------------------------------------

export const publicQuery = customQuery(query, {
  args: {},
  input: async () => ({ ctx: {}, args: {} }),
});

export const publicMutation = customMutation(mutation, {
  args: {},
  input: async () => ({ ctx: {}, args: {} }),
});

// ---------------------------------------------------------------------------
// Secret wrapper — validates INTERNAL_API_SECRET arg (server-to-server)
// ---------------------------------------------------------------------------

export const secretQuery = customQuery(query, {
  args: { secret: v.string() },
  input: async (_ctx, { secret }) => {
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected || secret !== expected) {
      throw new ConvexError("Unauthorized: invalid internal secret");
    }
    return { ctx: {}, args: {} };
  },
});
