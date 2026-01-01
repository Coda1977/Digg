# Remaining Design Improvements

**Last Updated:** January 1, 2026

---

## Completed This Session

### Animation & UI Polish
- [x] Stat counters - Removed animation (caused issues with Convex reactive updates)
- [x] Progress bar transitions - Already had smooth `transition-all duration-500 ease-out`
- [x] Delete button colors - Fixed `bg-accent-red` not compiling; now uses explicit `bg-[#DC2626]`

### Previous Session Fixes
- [x] Mobile menu overlay - Solid backdrop
- [x] Favicon - Created editorial-style SVG
- [x] Mobile status badge positioning - Inline on all screens
- [x] Progress bar color - Unified to red gradient
- [x] Voice input discoverability - "Try voice" always visible on mobile
- [x] Rating auto-submit timing - Increased to 800ms
- [x] EditorialFixedBottomBar - Applied to template forms
- [x] Network error recovery - Retry button with draft preservation
- [x] PDF typography - Times-Roman headings, page numbers

---

## Still To Do (Nice-to-Have)

### 1. PDF Data Visualizations
- Add bar chart for relationship type distribution
- Add frequency bars for strengths

### 2. Message Timestamps
- Add subtle timestamps for long conversations

### 3. Admin Keyboard Shortcuts
- J/K navigation for project list
- `/` for search focus

### 4. Animation Polish
- Message send sound/haptic feedback (skipped - requires native integration)

---

## Technical Notes

### Delete Button Fix
The `bg-accent-red` Tailwind class wasn't being recognized by the CSS compiler (computed background was `rgba(0,0,0,0)`). Fixed by using explicit hex value `bg-[#DC2626]` in `src/components/editorial/EditorialButton.tsx:19-20`.

### Stats Counter Decision
Removed animated counters because Convex's reactive data model causes frequent re-renders. The animation would restart on every data update, causing "jumping" numbers. Plain numbers with caching for flicker prevention is the simpler, more reliable solution.
