import { internalMutation } from "./_generated/server";
import { upsertBuiltInTemplates } from "./lib/builtInTemplates";

export const repairBuiltInTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await upsertBuiltInTemplates(ctx);
  },
});
