/**
 * Language detection and direction utilities
 */

/**
 * Detect if text contains Hebrew characters
 */
export function containsHebrew(text: string): boolean {
  // Hebrew Unicode range: \u0590-\u05FF
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

/**
 * Detect if text is primarily Hebrew (>30% Hebrew characters)
 */
export function isPrimaryHebrew(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  if (totalChars === 0) return false;

  return (hebrewChars / totalChars) > 0.3;
}

/**
 * Get text direction based on content
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return isPrimaryHebrew(text) ? 'rtl' : 'ltr';
}

/**
 * Detect language from message history
 * Returns 'he' for Hebrew, 'en' for English
 */
export function detectLanguageFromMessages(messages: Array<{ content: string }>): 'he' | 'en' {
  if (messages.length === 0) return 'en';

  // Check last 3 user messages for language hints
  const recentMessages = messages.slice(-3);
  const hebrewCount = recentMessages.filter(m => isPrimaryHebrew(m.content)).length;

  return hebrewCount > 0 ? 'he' : 'en';
}
