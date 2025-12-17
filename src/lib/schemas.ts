import { z } from "zod";

/**
 * Shared validation schemas for API endpoints
 */

// Message schema
export const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export type Message = z.infer<typeof messageSchema>;

// Chat API request schema
export const chatRequestSchema = z.object({
  uniqueId: z.string().min(1, "Survey ID is required"),
  messages: z.array(messageSchema).max(100, "Too many messages"),
  prompt: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Survey summarize request schema
export const summarizeRequestSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectRole: z.string().optional(),
  relationshipLabel: z.string().optional(),
  messages: z.array(messageSchema).min(1, "At least one message is required"),
});

export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;

// Interview input for project analysis
export const interviewInputSchema = z.object({
  respondentName: z.string().optional(),
  relationshipLabel: z.string().optional(),
  transcript: z.string().min(1, "Transcript cannot be empty"),
});

export type InterviewInput = z.infer<typeof interviewInputSchema>;

// Project analyze request schema
export const analyzeRequestSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectRole: z.string().optional(),
  projectName: z.string().optional(),
  templateName: z.string().optional(),
  interviews: z
    .array(interviewInputSchema)
    .min(1, "At least one interview is required")
    .max(50, "Too many interviews"),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

// API response schemas
export const chatResponseSchema = z.object({
  text: z.string(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const summarySchema = z.object({
  overview: z.string(),
  keyThemes: z.array(z.string()),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  specificPraise: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
});

export type Summary = z.infer<typeof summarySchema>;

/**
 * Helper function to validate and parse data with Zod
 * Returns the parsed data or throws an error with validation details
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}
