# Generate Insights Bug - Investigation Log 5.1

## Status: REVERTED TO ORIGINAL - AWAITING TEST

## What We Learned

**We over-engineered the fix.** The original approach with `generateText` + JSON parsing worked. We broke it by switching to `generateObject`.

## Original Bug
```
Expected ',' or '}' after property value in JSON at position 760
```
Caused by unescaped quotes in AI-generated JSON.

## What We Did Wrong

| Fix | Commit | What it did | Result |
|-----|--------|-------------|--------|
| #1 | 4b905c4 | Enhanced JSON parsing | ✅ CORRECT (kept this) |
| #2 | 99af66d | Switched to generateObject | ❌ Broke everything |
| #3 | 1322895 | Removed JSON instructions | ❌ Made it worse |
| #4 | b9275b2 | Changed z.record() to array | ❌ Unnecessary |

## The Fix: REVERT

Reverted all files to commit 557282e (original working state), keeping only the enhanced `parseAiJsonObject`.

### Commit
`540f2ef` - revert: restore original generateText approach for insight generation

### Files Reverted (8)
1. src/app/api/projects/analyze/route.ts
2. src/app/api/surveys/summarize/route.ts
3. src/lib/reportPrompts.ts
4. src/lib/schemas.ts
5. convex/schema.ts
6. convex/projects.ts
7. src/components/pdf/ProjectInsightsPdf.tsx
8. convex/migrations/cleanOldFields.ts

### File Kept
- `src/lib/aiJson.ts` - Enhanced JSON parsing with:
  - `sanitizeJsonString()` - handles control characters
  - `fixUnescapedQuotes()` - escapes quotes inside strings
  - Multiple fallback strategies

## Why This Should Work

1. **It worked before** - The original approach was reliable
2. **Enhanced JSON parsing** - Now handles the edge cases that caused the original bug
3. **Simpler is better** - Less code, fewer failure modes

## Test Result After Revert

**FAILED** - New error after revert:
```
[CONVEX M(projects:saveAnalysis)] [Request ID: 8a365fa879886875] Server Error Called by client
```

This was a DIFFERENT error - failing at Convex saveAnalysis, not AI generation.

## Root Cause Found

**The frontend was passing `coverage` field to segmentedAnalysis, but Convex didn't expect it.**

In `analysis/page.tsx` (lines 285-313):
```typescript
// BUG: spreading ...segmentAnalysis includes coverage field
return {
  relationshipType,
  relationshipLabel: label,
  ...segmentAnalysis,  // <-- includes coverage!
  basedOnSurveyCount: group.length,
};
```

But the Convex `saveAnalysis` mutation doesn't accept `coverage` in segment objects:
- `analysisSchema` (overall) includes `coverage`
- `segmentedAnalysis` schema does NOT include `coverage`

## Fix Applied

Changed the frontend to explicitly pick only the fields that `saveAnalysis` expects:
```typescript
return {
  relationshipType,
  relationshipLabel: label,
  summary: segmentAnalysis.summary,
  strengths: segmentAnalysis.strengths,
  improvements: segmentAnalysis.improvements,
  narrative: segmentAnalysis.narrative,
  basedOnSurveyCount: group.length,
};
```

## Status: FIX APPLIED - PUSHING TO REMOTE
