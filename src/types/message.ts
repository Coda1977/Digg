/**
 * Shared message types for UI components
 */

export type UiMessage = {
  role: "assistant" | "user";
  content: string;
};
