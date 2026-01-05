/**
 * Attempts to fix common JSON issues in AI-generated text:
 * - Unescaped quotes inside string values
 * - Unescaped newlines inside strings
 * - Control characters
 */
function sanitizeJsonString(jsonStr: string): string {
  // Replace unescaped control characters
  let result = jsonStr;

  // Replace literal newlines/tabs that might be inside strings
  result = result.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });

  return result;
}

/**
 * Attempts to fix unescaped quotes inside JSON string values.
 * This is a best-effort fix for a common AI JSON generation issue.
 */
function fixUnescapedQuotes(jsonStr: string): string {
  const chars = [...jsonStr];
  const result: string[] = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (escapeNext) {
      result.push(char);
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      result.push(char);
      continue;
    }

    if (char === '"') {
      if (!inString) {
        // Starting a string
        inString = true;
        result.push(char);
      } else {
        // We're in a string - is this the end or an unescaped quote?
        // Look ahead to see if this looks like end of string
        // End of string is followed by: , } ] : or whitespace then one of those
        let lookAhead = i + 1;
        while (lookAhead < chars.length && /\s/.test(chars[lookAhead])) {
          lookAhead++;
        }
        const afterQuote = chars[lookAhead];

        if (
          afterQuote === ',' ||
          afterQuote === '}' ||
          afterQuote === ']' ||
          afterQuote === ':' ||
          afterQuote === undefined
        ) {
          // This is likely the end of the string
          inString = false;
          result.push(char);
        } else {
          // This is likely an unescaped quote inside the string - escape it
          result.push('\\', char);
        }
      }
    } else {
      result.push(char);
    }
  }

  return result.join('');
}

/**
 * Try to extract and parse JSON from AI response text.
 * Handles common issues like:
 * - JSON wrapped in markdown code blocks
 * - Extra text before/after JSON
 * - Unescaped quotes in string values
 * - Control characters in strings
 */
export function parseAiJsonObject(text: string) {
  const trimmed = text.trim();

  // First attempt: parse as-is
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    // Continue to fallback strategies
  }

  // Second attempt: extract JSON from text
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON");
  }

  const candidate = trimmed.slice(start, end + 1);

  // Try parsing the extracted JSON
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // Continue to sanitization
  }

  // Third attempt: sanitize control characters and try again
  try {
    const sanitized = sanitizeJsonString(candidate);
    return JSON.parse(sanitized) as unknown;
  } catch {
    // Continue to quote fixing
  }

  // Fourth attempt: fix unescaped quotes in string values
  try {
    const fixed = fixUnescapedQuotes(candidate);
    return JSON.parse(fixed) as unknown;
  } catch {
    // Continue to combined approach
  }

  // Fifth attempt: sanitize + fix quotes
  try {
    const sanitized = sanitizeJsonString(candidate);
    const fixed = fixUnescapedQuotes(sanitized);
    return JSON.parse(fixed) as unknown;
  } catch (e) {
    // Re-throw with more context
    const error = e instanceof Error ? e : new Error(String(e));
    throw new Error(`Failed to parse AI JSON response: ${error.message}`);
  }
}
