# Remaining Design Improvements

**Last Updated:** January 1, 2026

---

## Medium Priority

### 1. Apply EditorialFixedBottomBar to Forms
- Component exists at `src/components/editorial/EditorialFixedBottomBar.tsx`
- **Apply to:**
  - `src/app/admin/projects/[id]/page.tsx` - Edit project
  - `src/app/admin/templates/[id]/edit/page.tsx` - Edit template
  - `src/app/admin/templates/new/page.tsx` - New template

### 2. Network Error Recovery
- Network errors show toast but no retry mechanism
- **Fix:** Add inline retry button, preserve draft text on connection loss
- **File:** `src/components/chat/ChatInput.tsx`

### 3. PDF Typography Alignment
- PDF uses Helvetica vs. web's Fraunces/Inter
- **Fix:** Embed custom fonts or use Times New Roman/Helvetica pair
- **File:** `src/components/pdf/ProjectInsightsPdf.tsx`

### 4. PDF Navigation Aids
- No table of contents or page numbers
- **Fix:** Add TOC with hyperlinks, page numbers in footer
- **File:** `src/components/pdf/ProjectInsightsPdf.tsx`

---

## Nice-to-Have

### 5. PDF Data Visualizations
- Add bar chart for relationship type distribution
- Add frequency bars for strengths

### 6. Message Timestamps
- Add subtle timestamps for long conversations

### 7. Admin Keyboard Shortcuts
- J/K navigation, / for search

### 8. Animation Polish
- Animate stat counters on load
- Smooth progress bar transitions
- Message send sound/haptic feedback
