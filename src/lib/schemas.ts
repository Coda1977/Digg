import { z } from "zod";

/**
 * Shared validation schemas for API endpoints
 */

// Message schema
export const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1, "Message content cannot be empty"),
});


// Chat API request schema
export const chatRequestSchema = z.object({
  uniqueId: z.string().min(1, "Survey ID is required"),
  messages: z.array(messageSchema).max(100, "Too many messages"),
  prompt: z.string().optional(),
});


// Survey summarize request schema
export const summarizeRequestSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectRole: z.string().optional(),
  relationshipLabel: z.string().optional(),
  messages: z.array(messageSchema).min(1, "At least one message is required"),
});


// Interview input for project analysis
export const interviewInputSchema = z.object({
  respondentName: z.string().optional(),
  relationshipLabel: z.string().optional(),
  transcript: z.string().min(1, "Transcript cannot be empty"),
});


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


// API response schemas
export const chatResponseSchema = z.object({
  text: z.string(),
  questionId: z.string().nullable().optional(),
  questionText: z.string().nullable().optional(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
});

// OLD: Interview summary schema (still used for per-interview summaries)
export const summarySchema = z.object({
  overview: z.string(),
  keyThemes: z.array(z.string()),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  specificPraise: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
});

export type Summary = z.infer<typeof summarySchema>;

// NEW: Simplified project analysis schema
export const analysisSchema = z.object({
  summary: z.string(),
  strengths: z.array(
    z.object({
      point: z.string(),
      quote: z.string().optional(),
      frequency: z.number().optional(),
    })
  ),
  improvements: z.array(
    z.object({
      point: z.string(),
      quote: z.string().optional(),
      action: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
  narrative: z.string().optional(),
  coverage: z.object({
    totalInterviews: z.number(),
    breakdown: z.array(
      z.object({
        role: z.string(),
        count: z.number(),
      })
    ),
  }),
});

export type Analysis = z.infer<typeof analysisSchema>;

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
