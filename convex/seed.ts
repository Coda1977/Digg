import { adminMutation } from "./lib/functions";
import { upsertBuiltInTemplates } from "./lib/builtInTemplates";

export const seedTemplates = adminMutation({
  args: {},
  handler: async (ctx) => {
    const result = await upsertBuiltInTemplates(ctx);
    return { message: "Built-in templates seeded/updated", ...result };
  },
});
