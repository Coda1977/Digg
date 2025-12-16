import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Role = "admin" | "user";
type Ctx = QueryCtx | MutationCtx;

function normalizeEmail(email: unknown) {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parseAdminEmails(raw: string | undefined) {
  if (!raw) return new Set<string>();
  const parts = raw
    .split(/[\s,]+/g)
    .map((part) => normalizeEmail(part))
    .filter((part): part is string => part !== null);
  return new Set(parts);
}

async function getRoleDoc(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

async function upsertRole(ctx: MutationCtx, userId: Id<"users">, desiredRole: Role) {
  const now = Date.now();
  const existing = await getRoleDoc(ctx, userId);

  if (!existing) {
    await ctx.db.insert("userRoles", {
      userId,
      role: desiredRole,
      createdAt: now,
      updatedAt: now,
    });
    return desiredRole;
  }

  if (existing.role === desiredRole) return desiredRole;
  await ctx.db.patch(existing._id, { role: desiredRole, updatedAt: now });
  return desiredRole;
}

async function computeDesiredRole(ctx: Ctx, email: string | null): Promise<Role> {
  const adminEmails = parseAdminEmails(
    process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL
  );

  if (adminEmails.size > 0) {
    return email && adminEmails.has(email) ? "admin" : "user";
  }

  const existingAdmin = await ctx.db
    .query("userRoles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .first();

  return existingAdmin ? "user" : "admin";
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password()],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      const user = await ctx.db.get(args.userId);
      if (!user) return;

      const adminEmails = parseAdminEmails(
        process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL
      );

      const profileEmail = normalizeEmail(args.profile.email);
      const userEmail = normalizeEmail(user.email);
      const email = profileEmail ?? userEmail;

      const existingRoleDoc = await getRoleDoc(ctx, args.userId);
      if (adminEmails.size === 0 && existingRoleDoc) return;

      const desiredRole = await computeDesiredRole(ctx, email);
      await upsertRole(ctx, args.userId, desiredRole);
    },
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const roleDoc = await getRoleDoc(ctx, userId);
    return { ...user, role: roleDoc?.role ?? null };
  },
});

export const ensureRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("Unauthorized");

    const adminEmails = parseAdminEmails(
      process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL
    );

    const existingRoleDoc = await getRoleDoc(ctx, userId);
    if (adminEmails.size === 0 && existingRoleDoc) {
      return { role: existingRoleDoc.role };
    }

    const email = normalizeEmail(user.email);
    const desiredRole = await computeDesiredRole(ctx, email);
    const role = await upsertRole(ctx, userId, desiredRole);
    return { role };
  },
});

