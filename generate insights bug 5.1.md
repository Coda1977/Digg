# Generate Insights Bug - Investigation Log 5.1

## Current Error
```
No object generated: response did not match schema.
```

## Error History

### Error 1 (Original)
```
Expected ',' or '}' after property value in JSON at position 760 (line 6 column 116)
```

### Error 2 (After Fix #1)
```
Failed to parse AI JSON response: Expected property name or '}' in JSON at position 1 (line 1 column 2)
```

### Error 3 (After Fix #2 - Current)
```
No object generated: response did not match schema.
```

## Fixes Attempted

### Fix #1: Enhanced JSON Parsing (src/lib/aiJson.ts)
- Added `sanitizeJsonString()` to handle control characters
- Added `fixUnescapedQuotes()` to escape quotes inside strings
- Added multiple fallback parsing strategies
- **Result**: Still failed - AI wasn't returning valid JSON at all

### Fix #2: Switch to generateObject (src/app/api/projects/analyze/route.ts)
- Changed from `generateText` + manual parsing to `generateObject`
- Passes Zod schema directly to Claude for structured output
- **Result**: "No object generated: response did not match schema"

## Files Modified
1. `src/lib/aiJson.ts` - Enhanced JSON parsing (Fix #1)
2. `src/app/api/projects/analyze/route.ts` - Switched to generateObject (Fix #2)
3. `src/app/api/surveys/summarize/route.ts` - Switched to generateObject (Fix #2)

## Key Files to Investigate

### Schema Definition
- `src/lib/schemas.ts` - Contains `analysisSchema` that defines expected structure

### Prompt
- `src/lib/reportPrompts.ts` - Contains `PROJECT_ANALYSIS_PROMPT`

### API Route
- `src/app/api/projects/analyze/route.ts` - The endpoint that generates insights

## Hypothesis

The "response did not match schema" error means:
1. The Zod schema has constraints the AI can't satisfy
2. The prompt asks for different fields than the schema expects
3. There's a type mismatch (e.g., schema expects array, AI returns object)

## TODO: Root Cause Investigation
- [ ] Read the full `analysisSchema` from schemas.ts
- [ ] Read the `PROJECT_ANALYSIS_PROMPT` from reportPrompts.ts
- [ ] Compare schema fields vs prompt instructions
- [ ] Check for mismatches in field names, types, or structure
- [ ] Look at actual data being passed to understand context
