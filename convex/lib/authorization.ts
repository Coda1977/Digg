import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { normalizeEmail, getAdminEmailsFromEnv } from "./email";

type Ctx = QueryCtx | MutationCtx;

export async function requireAdmin(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("Unauthorized");

  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.size > 0) {
    const email = normalizeEmail(user.email);
    if (email && adminEmails.has(email)) return { userId, user };
    throw new ConvexError("Forbidden");
  }

  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (roleDoc?.role === "admin") return { userId, user };

  throw new ConvexError("Forbidden");
}
