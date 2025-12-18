# Digg Application - Editorial Design System Guidelines

**Version 1.0** | December 2025

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Page Patterns](#page-patterns)
8. [Responsive Design](#responsive-design)
9. [Do's and Don'ts](#dos-and-donts)
10. [Implementation Notes](#implementation-notes)

---

## Design Philosophy

Digg uses an **editorial/print-inspired design system** that treats every page like a magazine spread. The interface feels like reading a well-designed publication rather than operating software.

**Core Aesthetic:**
- Print magazine layout principles
- Strong typographic hierarchy
- Generous negative space ("paper")
- Minimal decoration
- Bold, confident design choices

**Key Differentiators:**
- No shadows, gradients, or glossy effects
- Graphic rules (borders) instead of elevation
- Serif headlines for drama, sans-serif for clarity
- 95% monochrome with 5% vivid accent color
- Text-forward UI components

---

## Design Principles

### 1. Treat Every Page Like a Print Layout

Design each page as if you're laying out a magazine spread:

**Apply:**
- Big editorial headlines (64px+)
- Strong typographic hierarchy
- Lots of "paper" (negative space)
- Clear section breaks using horizontal rules

**Example:**
```
[EYEBROW LABEL - 12px uppercase]
Dashboard                           ← 64px serif headline
Manage your feedback projects...   ← 16px body text

─────────────────────────────────  ← 4px rule

[STATS PANEL - generous spacing]
```

### 2. Use "Paper + Ink" Base with Rare Loud Accents

The default UI is almost monochrome:

**Base Colors:**
- Warm off-white background ("paper")
- Pure black text ("ink")
- Soft gray for secondary text

**Accent Colors:**
- Red or yellow in large, confident blocks
- NOT tiny UI ornaments
- Use for: full-bleed sections, large highlight panels, primary CTAs

**Rule of thumb:** 95% monochrome, 5% accent color

### 3. Editorial Typography: Serif for Drama, Sans for Clarity

Use a strict two-font system:

**Serif (Fraunces):**
- All headlines (H1, H2, H3)
- Project names, subject names
- Large numbers in stats
- Poster/editorial feel

**Sans-serif (Inter):**
- Body text and paragraphs
- Form inputs and labels
- UI controls
- Navigation
- Modern, readable

**Typography Rules:**
- Headline line-height: tight (0.95–1.1)
- Headline letter-spacing: slightly negative (-0.02em)
- Body line-height: comfortable (1.6–1.75)
- Small labels: ALL CAPS with extra tracking (0.1–0.15em)

### 4. Bold Type Scale, Restrained Everything Else

The "wow" comes from scale, not effects:

**Type Scale:**
- headline-xl: 64px (main page titles)
- headline-lg: 48px (section titles)
- headline-md: 32px (subsection titles)
- headline-sm: 24px (card titles)
- body: 16px (default text)
- label: 12px (ALL CAPS labels)

**When in doubt:**
- Increase font size (not color/weight)
- Add whitespace (not decoration)
- Use bold type hierarchy (not effects)

**Never use:**
- Gradients
- Glass/blur effects
- Glows or shadows (except extremely subtle)
- Multiple colors

### 5. Strong Rhythm Through Spacing

Use a deliberately chunky spacing system:

**Editorial Spacing Scale:**
- space-xs: 40px
- space-sm: 60px
- space-md: 80px
- space-lg: 120px
- space-xl: 160px

**Apply:**
- Sections separated by 80–160px vertical gaps
- Components have airy internal padding
- Mobile keeps same rhythm (slightly compressed)

**This spacing is a signature. Don't tighten it.**

### 6. Graphic Rules as Primary UI Element

Instead of cards-with-shadows, use:

**Rule Weights:**
- Thick (4px): Major section dividers
- Medium (3px): Standard section breaks, button borders
- Thin (1px): Subtle dividers, table rows

**Usage:**
- Horizontal rules to separate sections
- Left borders (4px) for cards/highlights
- Button borders (3px) instead of fills
- Should feel like "printed ink lines"

**Never use:**
- Drop shadows
- Elevation/z-index effects
- Material design layers

### 7. Navigation as Editorial Overlay

On mobile, navigation is a full-screen designed "page":

**Desktop:**
- Simple header with logo + links
- 3px border bottom
- Sticky positioning

**Mobile:**
- Hamburger menu icon
- Full-screen overlay when opened
- Large serif headlines for nav items
- Graphic ruled dividers
- Only visible on mobile (hidden on desktop)

**Transitions:**
- Deliberate, not snappy
- Like turning a page, not clicking a button

### 8. Components are Text-Forward

Make UI feel like reading, not operating:

**Component Pattern:**
```
[EYEBROW LABEL - uppercase]
Headline in Serif         ← Bold, large
One sentence description  ← Softer, readable
→ Link or action          ← Minimal styling
```

**Button Styling:**
- Mostly styled links (not heavy buttons)
- Buttons: flat, no shadow, minimal radius
- 3px borders when used
- Hover state: invert (background fills)

**Forms:**
- Large inputs (44px+ height)
- 3px borders
- 16px font size (prevents iOS zoom)
- ALL CAPS labels with tracking

---

## Color System

### Base Palette

```css
/* Paper + Ink */
--paper: #FAFAF8;        /* Warm off-white background */
--ink: #0A0A0A;          /* Pure black text */
--ink-soft: #52525B;     /* Secondary text, muted */
--ink-lighter: #A1A1AA;  /* Tertiary text, placeholders */

/* Accent Colors (use sparingly) */
--accent-red: #DC2626;   /* Primary actions, highlights */
--accent-yellow: #FBBF24; /* Alternative accent (optional) */
```

### Color Usage Rules

**Background:**
- Default: `--paper` on all pages
- Accent blocks: White (#FFFFFF) for highlighted panels
- Never use colored backgrounds except for accent blocks

**Text:**
- Primary: `--ink` (pure black)
- Secondary: `--ink-soft` (descriptions, meta info)
- Tertiary: `--ink-lighter` (placeholders, hints)

**Borders:**
- Default: `--ink` (3-4px for graphic rules)
- Secondary: `--ink-lighter` (1-2px for subtle dividers)
- Active/Hover: `--accent-red`

**Buttons:**
- Default: Transparent with `--ink` border
- Primary: `--accent-red` background
- Hover: Invert (background fills)

**Status Indicators:**
- Active/Complete: `--accent-red`
- In Progress: `--ink-soft`
- Closed: `--ink-lighter`

### Color Don'ts

❌ Never use:
- Blue (too digital/software-like)
- Multiple accent colors per page
- Colored text (except accents)
- Colored backgrounds (except white panels)
- Gradients of any kind

---

## Typography

### Font Families

**Primary Fonts:**
```css
--font-serif: 'Fraunces', serif;  /* Headlines, drama */
--font-sans: 'Inter', sans-serif;  /* Body, UI, clarity */
```

**Loading:**
- Use Google Fonts
- Font display: swap
- Optimize with next/font/google if using Next.js

### Type Scale

```css
/* Headlines (Serif) */
.headline-xl {
  font-family: var(--font-serif);
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.headline-lg {
  font-family: var(--font-serif);
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.headline-md {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.headline-sm {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

/* Body Text (Sans) */
.body-text {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.75;
  color: var(--ink-soft);
}

/* Labels (Sans) */
.eyebrow {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
```

### Typography Rules

**Headlines:**
- Always use serif font
- Tight line-height (0.95–1.2)
- Negative letter-spacing on XL/LG
- Never use color (always black or red accent)
- Never use font weights other than 700 (bold)

**Body Text:**
- Always use sans-serif font
- Comfortable line-height (1.6–1.75)
- Default color: `--ink-soft` (not pure black)
- Never center-align large blocks

**Labels:**
- ALL CAPS only
- Increased letter-spacing (0.1–0.15em)
- Font size: 11-12px
- Use for: form labels, section eyebrows, meta info

**Special Cases:**
- Stats numbers: Serif, 56-72px, line-height: 1
- Buttons: Sans, 15px, medium weight (500)
- Form inputs: Sans, 16px (prevents iOS zoom)

---

## Spacing & Layout

### Spacing Scale

```css
/* Editorial Spacing System */
--space-xs: 40px;   /* Minimum section gap */
--space-sm: 60px;   /* Standard section gap */
--space-md: 80px;   /* Large section gap */
--space-lg: 120px;  /* Major section gap */
--space-xl: 160px;  /* Page-level gap */
```

### Layout Principles

**Container:**
- Max-width: 1200px (most pages)
- Max-width: 900px (forms, reading-focused pages)
- Padding: 32px (desktop), 20px (mobile)
- Center-aligned

**Vertical Rhythm:**
- Hero sections: `space-lg` top/bottom padding
- Content sections: `space-md` top/bottom padding
- Form sections: `space-sm` between groups
- Card spacing: 24-40px between items

**Horizontal Spacing:**
- Button groups: 12-16px gap
- Form labels to inputs: 12px
- Icon to text: 8px
- Multi-column grids: 24-48px gap

### Grid System

**Stats Panels:**
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 48px;

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
  gap: 32px;
}
```

**Two-Column Layouts:**
```css
display: grid;
grid-template-columns: 1fr auto;
gap: 24px;

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

---

## Components

### 1. Buttons

**Default Button:**
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 500;
  border: 3px solid var(--ink);
  background: transparent;
  color: var(--ink);
  transition: all 0.2s;
}

.btn:hover {
  background: var(--ink);
  color: var(--paper);
}
```

**Primary Button:**
```css
.btn-primary {
  background: var(--accent-red);
  color: white;
  border-color: var(--accent-red);
}

.btn-primary:hover {
  background: #B91C1C;
  border-color: #B91C1C;
}
```

**Small Button:**
```css
.btn-sm {
  padding: 10px 20px;
  font-size: 14px;
}
```

**Button Rules:**
- Minimum height: 44px (touch-friendly)
- 3px borders (never 1px or 2px)
- No border-radius (completely square)
- No shadows
- Hover: invert colors
- Icons: 8px gap from text

### 2. Form Inputs

**Text Input:**
```css
.form-input {
  width: 100%;
  padding: 20px;
  font-size: 16px; /* CRITICAL: prevents iOS zoom */
  border: 3px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-red);
}

.form-input::placeholder {
  color: var(--ink-lighter);
}
```

**Textarea:**
```css
.form-textarea {
  min-height: 120px;
  resize: vertical;
  /* Same styles as input */
}
```

**Form Label:**
```css
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 12px;
}
```

**Form Hint:**
```css
.form-hint {
  font-size: 14px;
  color: var(--ink-soft);
  margin-top: 12px;
  line-height: 1.6;
}
```

### 3. Cards

**Editorial Card Pattern:**
```html
<article class="card">
  <div class="eyebrow">Status · Role</div>
  <h3 class="card-title">Card Headline</h3>
  <p class="card-description">One sentence description</p>
  <a href="#" class="card-link">View Project →</a>
</article>
```

**Card Styling:**
```css
.card {
  border-left: 4px solid var(--ink);
  padding: 32px;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--accent-red);
}

.card-title {
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 16px;
}

.card-description {
  font-size: 16px;
  line-height: 1.75;
  color: var(--ink-soft);
  margin-bottom: 24px;
}

.card-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s;
}

.card-link:hover {
  border-bottom-color: var(--ink);
}
```

**Card Rules:**
- Never use box-shadow
- Never use border-radius
- Always use left border (4px)
- Hover state: change border color to accent
- Background: transparent or white

### 4. Graphic Rules (Dividers)

```css
/* Thick Rule - Major Sections */
.rule-thick {
  border: none;
  border-top: 4px solid var(--ink);
  margin: 80px 0; /* space-md */
}

/* Medium Rule - Standard Sections */
.rule-medium {
  border: none;
  border-top: 3px solid var(--ink);
  margin: 60px 0; /* space-sm */
}

/* Thin Rule - Subtle Dividers */
.rule-thin {
  border: none;
  border-top: 1px solid var(--ink-lighter);
  margin: 24px 0;
}
```

**Usage:**
- Thick (4px): Between major page sections
- Medium (3px): Within sections, form groups
- Thin (1px): Between list items, table rows

### 5. Status Badges

```css
.status-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 16px;
  background: var(--ink);
  color: var(--paper);
}

.status-badge.active {
  background: var(--accent-red);
  color: white;
}

.status-badge.completed {
  background: var(--ink);
  color: white;
}
```

### 6. Progress Bar

```css
.progress-container {
  margin-top: 20px;
}

.progress-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #E5E5E5;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--ink);
  transition: width 0.3s ease;
}
```

### 7. Tabs

```css
.tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 3px solid var(--ink);
}

.tab-button {
  padding: 16px 32px;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  border-bottom: 4px solid transparent;
  margin-bottom: -3px; /* overlaps nav border */
}

.tab-button.active {
  color: var(--ink);
  border-bottom-color: var(--accent-red);
}
```

### 8. Message Bubbles (Chat Interface)

**Assistant Message:**
```css
.message-assistant {
  border-left: 4px solid var(--ink);
  padding-left: 24px;
  margin-bottom: 32px;
}
```

**User Message:**
```css
.message-user {
  background: var(--ink);
  color: var(--paper);
  padding: 24px;
  margin-left: 60px; /* indent on desktop */
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .message-user {
    margin-left: 0; /* full width on mobile */
  }
}
```

---

## Page Patterns

### Page Structure Template

Every page follows this structure:

```html
<!-- Header (Sticky) -->
<header class="header">
  <!-- Logo + Navigation -->
</header>

<!-- Hero Section -->
<section class="hero">
  <div class="eyebrow">Context Label</div>
  <h1 class="headline-xl">Page Title</h1>
  <p class="body-text">Page description</p>
</section>

<hr class="rule-thick">

<!-- Content Section 1 -->
<section class="section">
  <!-- Content -->
</section>

<hr class="rule-thick">

<!-- Content Section 2 -->
<section class="section">
  <!-- Content -->
</section>

<!-- Footer Spacing -->
<div style="height: 80px;"></div>
```

### Header Pattern

**Desktop:**
```html
<header class="header">
  <div class="container">
    <div class="header-content">
      <div class="logo">DIGG ADMIN</div>
      <nav class="header-nav">
        <a href="#" class="header-link">Dashboard</a>
        <a href="#" class="header-link">Sign out</a>
      </nav>
    </div>
  </div>
</header>
```

**Styling:**
```css
.header {
  border-bottom: 3px solid var(--ink);
  padding: 24px 0;
  position: sticky;
  top: 0;
  background: var(--paper);
  z-index: 100;
}

.logo {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.header-link {
  font-size: 15px;
  color: var(--ink);
  text-decoration: none;
}

.header-link:hover {
  color: var(--accent-red);
}
```

### Hero Pattern

```html
<section class="hero">
  <div class="container">
    <div class="eyebrow">Context Label</div>
    <h1 class="headline-xl">Page Title</h1>
    <p class="body-text">Brief description or subtitle</p>
  </div>
</section>
```

**Styling:**
```css
.hero {
  padding: 120px 0 60px; /* space-lg and space-sm */
}

.eyebrow {
  margin-bottom: 12px;
}

.headline-xl {
  margin-bottom: 16px;
}
```

### Stats Panel Pattern

```html
<section class="stats-panel">
  <div class="stat-item">
    <div class="stat-number">1</div>
    <div class="stat-label">Active Projects</div>
  </div>
  <div class="stat-item">
    <div class="stat-number">3</div>
    <div class="stat-label">Total Surveys</div>
  </div>
  <div class="stat-item">
    <div class="stat-number">1</div>
    <div class="stat-label">Completed</div>
  </div>
</section>
```

**Styling:**
```css
.stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  padding: 80px 0; /* space-md */
}

.stat-number {
  font-family: var(--font-serif);
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-soft);
}

@media (max-width: 768px) {
  .stats-panel {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .stat-number {
    font-size: 56px;
  }
}
```

### Form Page Pattern

```html
<section class="form-section">
  <div class="container">
    <!-- Form Group 1 -->
    <div class="form-group">
      <label class="form-label">Field Label</label>
      <input type="text" class="form-input" placeholder="Placeholder...">
      <p class="form-hint">Helper text explanation</p>
    </div>
    
    <hr class="rule-medium">
    
    <!-- Form Group 2 -->
    <div class="form-group">
      <!-- ... -->
    </div>
  </div>
</section>
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
/* Default styles: Mobile (< 768px) */

/* Tablet and Desktop */
@media (min-width: 768px) {
  /* Desktop-specific styles */
}
```

### Mobile Adjustments

**Typography:**
```css
/* Mobile */
.headline-xl { font-size: 40px; }
.headline-lg { font-size: 32px; }
.headline-md { font-size: 24px; }

/* Desktop */
@media (min-width: 768px) {
  .headline-xl { font-size: 64px; }
  .headline-lg { font-size: 48px; }
  .headline-md { font-size: 32px; }
}
```

**Spacing:**
- Mobile: Reduce editorial spacing by ~30%
- space-lg: 80px → 60px
- space-md: 60px → 40px
- Container padding: 32px → 20px

**Layout:**
- Grids: Multi-column → Single column
- Buttons: Side-by-side → Stacked
- Button groups: `flex-direction: column`
- Cards: Remove left/right margins

**Forms:**
- Full-width inputs
- Stacked button groups
- Larger touch targets (min 44px)

### Touch Optimization

**Minimum Touch Targets:**
- Buttons: 44px height minimum
- Form inputs: 44px height minimum
- Icons: 44×44px clickable area
- Links in lists: 44px row height

**Input Font Size:**
```css
/* CRITICAL: Prevents iOS zoom */
input, textarea, select {
  font-size: 16px; /* Never less than 16px */
}
```

**Safe Areas (Notched Devices):**
```css
/* iOS Safe Area Insets */
.sticky-footer {
  padding-bottom: env(safe-area-inset-bottom);
}

.sticky-header {
  padding-top: env(safe-area-inset-top);
}
```

---

## Do's and Don'ts

### ✅ DO

**Typography:**
- Use serif for headlines (drama)
- Use sans for body text (clarity)
- Make headlines 2-3x bigger than body text
- Use ALL CAPS for labels and eyebrows
- Use tight line-height on headlines (0.95–1.1)

**Color:**
- Default to paper + ink (monochrome)
- Use accent red sparingly (5% of UI)
- Use soft gray for secondary text
- Use white panels for highlighted content

**Spacing:**
- Leave generous whitespace (80-120px gaps)
- Use consistent spacing scale
- Pad components generously (24-32px)
- Separate sections with thick rules

**Components:**
- Use 3-4px borders (not 1px)
- Use left borders for cards
- Use flat buttons with borders
- Keep forms simple and airy

**Layout:**
- Center content (max-width container)
- Use grid for multi-column layouts
- Stack on mobile
- Keep reading width narrow (900px max for forms)

### ❌ DON'T

**Typography:**
- Don't use serif for body text
- Don't use sans for headlines
- Don't use multiple font families
- Don't use colored text (except accents)
- Don't use font sizes smaller than 12px

**Color:**
- Don't use multiple accent colors per page
- Don't use gradients
- Don't use shadows (except extremely subtle)
- Don't use colored backgrounds (except white panels)
- Don't use blue or green accents

**Spacing:**
- Don't tighten the editorial spacing system
- Don't use 8px/16px spacing (too tight)
- Don't let components touch
- Don't ignore vertical rhythm

**Components:**
- Don't use box-shadow on cards
- Don't use border-radius (keep square)
- Don't use icon-only buttons
- Don't use pills/badges with rounded corners
- Don't use hamburger menu on desktop

**Layout:**
- Don't use full-width layouts (use max-width)
- Don't use multi-column on mobile
- Don't center-align body text
- Don't break the grid

---

## Implementation Notes

### Font Loading

**Next.js:**
```javascript
import { Fraunces } from 'next/font/google';
import { Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
```

**HTML/CSS:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### CSS Variables Setup

```css
:root {
  /* Colors */
  --paper: #FAFAF8;
  --ink: #0A0A0A;
  --ink-soft: #52525B;
  --ink-lighter: #A1A1AA;
  --accent-red: #DC2626;
  
  /* Spacing */
  --space-xs: 40px;
  --space-sm: 60px;
  --space-md: 80px;
  --space-lg: 120px;
  --space-xl: 160px;
  
  /* Fonts */
  --font-serif: 'Fraunces', serif;
  --font-sans: 'Inter', sans-serif;
}

body {
  font-family: var(--font-sans);
  background: var(--paper);
  color: var(--ink);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

### Tailwind Configuration (if using Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        paper: '#FAFAF8',
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#52525B',
          lighter: '#A1A1AA',
        },
        accent: {
          red: '#DC2626',
          yellow: '#FBBF24',
        },
      },
      spacing: {
        'editorial-xs': '40px',
        'editorial-sm': '60px',
        'editorial-md': '80px',
        'editorial-lg': '120px',
        'editorial-xl': '160px',
      },
      fontSize: {
        'headline-xl': ['64px', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'headline-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline-md': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-sm': ['24px', { lineHeight: '1.2' }],
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
};
```

### Accessibility Considerations

**Focus States:**
```css
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 3px solid var(--accent-red);
  outline-offset: 2px;
}
```

**ARIA Labels:**
- Add labels to icon-only buttons
- Use semantic HTML (header, nav, main, section)
- Ensure form inputs have associated labels

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Tab order should follow visual order
- Focus should be visible

### Performance

**Font Loading:**
- Use `font-display: swap` to prevent FOIT
- Preload critical fonts
- Subset fonts to Latin characters

**Images:**
- Use next/image or similar optimization
- Lazy load below-the-fold images
- Use WebP format with fallbacks

**CSS:**
- Minimize custom CSS (use utility classes when possible)
- Remove unused styles
- Compress production CSS

---

## Quick Reference Cheat Sheet

```
COLORS
------
Background: #FAFAF8 (paper)
Text: #0A0A0A (ink)
Secondary: #52525B (ink-soft)
Accent: #DC2626 (red)

FONTS
-----
Headlines: Fraunces (serif, 700)
Body: Inter (sans, 400-600)

TYPE SCALE
----------
XL: 64px (page titles)
LG: 48px (sections)
MD: 32px (subsections)
SM: 24px (cards)
Body: 16px
Label: 12px (ALL CAPS)

SPACING
-------
XS: 40px
SM: 60px
MD: 80px
LG: 120px
XL: 160px

BORDERS
-------
Thick: 4px (major sections)
Medium: 3px (buttons, rules)
Thin: 1px (subtle dividers)

COMPONENTS
----------
Buttons: 3px border, 14px/28px padding
Inputs: 3px border, 20px padding, 16px font
Cards: 4px left border, 32px padding
Rules: 3-4px horizontal borders

BREAKPOINT
----------
Mobile: < 768px
Desktop: ≥ 768px
```

---

## Questions for Your Builder?

If your builder has questions, they should reference:

1. **Mockups**: The 6 HTML files provided show exact implementation
2. **This document**: Design principles and component specs
3. **Color values**: Exact hex codes are specified
4. **Spacing values**: Use the editorial spacing scale (40/60/80/120/160px)
5. **Typography**: Use Fraunces (serif) and Inter (sans-serif) from Google Fonts

**Most Important Rules to Follow:**
1. No shadows, no gradients, no rounded corners
2. 3-4px borders everywhere (not 1px)
3. 95% monochrome, 5% accent red
4. Serif headlines, sans body text
5. 80-120px spacing between sections
6. 16px font size on form inputs (prevents iOS zoom)

---

**End of Design Guidelines**
