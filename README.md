# Digg

AI-powered 360 feedback platform with conversational interviews and intelligent analysis.

## Features

- **AI-Powered Interviews**: Natural conversation flow using Claude Sonnet 4.5
- **Voice Input**: Speech-to-text via Deepgram for hands-free responses
- **Smart Question Tracking**: AI tracks which template question it's exploring in real-time
- **Auto-Generated Summaries**: Interview summaries generated automatically on completion
- **Intelligent Analysis**: Map-reduce aggregation across interviews with actionable insights
- **Professional PDF Reports**: Multi-section reports with raw feedback, AI analysis, and full transcripts
- **Relationship Hierarchy**: Organized feedback by role (Manager → Peer → Direct Report)
- **Bilingual Support**: English/Hebrew with automatic RTL detection

## Report System

The platform generates comprehensive feedback reports with three parts:

### Part 1: What People Said
- Responses organized by template questions
- Sorted by relationship hierarchy
- Shows who said what in a structured format

### Part 2: AI Analysis
- **Strengths**: Key strengths with supporting quotes and frequency data
- **Improvements**: Actionable recommendations with priority levels (high/medium/low)
- **Narrative**: Overarching themes and patterns
- **Segmented Analysis**: Perspective-specific insights by relationship type

### Part 3: Appendix
- Full interview transcripts for reference

## Stack

- Next.js App Router (`src/app`)
- Convex database/functions (`convex/`)
- Convex Auth (Password provider)
- Anthropic via AI SDK (`src/app/api/chat/route.ts`)
- Deepgram for speech-to-text (`src/hooks/useDeepgram.ts`)
- Bilingual support (English/Hebrew with automatic RTL)

## Local setup

1. Install deps: `npm install`
2. Create `.env.local`:
   - `NEXT_PUBLIC_CONVEX_URL=...`
   - `ANTHROPIC_API_KEY=...`
   - `DEEPGRAM_API_KEY=...` (for voice input - get $200 free credits at [console.deepgram.com](https://console.deepgram.com))
3. Set an admin allowlist in Convex (recommended):
   - `npx convex env set ADMIN_EMAILS "you@example.com"`
   - If `ADMIN_EMAILS` is unset, the first signed-in user becomes admin.
4. Run Next: `npm run dev`

## Running tests

### Unit Tests (Vitest)
```bash
npm run test        # Runs unit tests in watch mode
npm run test:ui     # Opens Vitest UI
```

### E2E Tests (Playwright)
```bash
# Against local dev server
npm run test:e2e

# Against production
$env:BASE_URL='https://digg-teal.vercel.app'; npm run test:e2e
```

## First run (in the browser)

1. Go to `/admin/login` and sign up.
2. Go to `/admin/projects/new` and click `Seed templates` (creates the 4 built-in protocols).
3. Create a project and then create survey links from the project page.
4. Open a survey link (`/survey/<id>`) and complete the AI interview.

## Deployment checklist (Vercel + Convex)

- Vercel env vars:
  - `NEXT_PUBLIC_CONVEX_URL` (your `https://<deployment>.convex.cloud` URL)
  - `ANTHROPIC_API_KEY`
  - `DEEPGRAM_API_KEY` (for voice input - required)
- Convex env vars (prod deployment):
  - `SITE_URL` (your web app URL, e.g. `https://digg-teal.vercel.app`)
  - `AUTH_SECRET`
  - `JWT_PRIVATE_KEY`
  - `JWKS` (must be valid JSON; used by `/.well-known/jwks.json`)
  - `ADMIN_EMAILS` (comma/space-separated list of admin emails)
- Redeploy Convex after changing functions in `convex/`: `npx convex deploy -y`

## Troubleshooting

- If `/admin/login` loops after sign-in, verify:
  - `https://<your-deployment>.convex.site/.well-known/openid-configuration` returns 200
  - `https://<your-deployment>.convex.site/.well-known/jwks.json` returns 200 and valid JSON
