import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/authorization";
import { upsertBuiltInTemplates } from "./lib/builtInTemplates";

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const result = await upsertBuiltInTemplates(ctx);
    return { message: "Built-in templates seeded/updated", ...result };
  },
});
