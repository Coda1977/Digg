# Digg (MVP)

AI-powered feedback surveys with four built-in protocols (templates), backed by Convex.

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
- Redeploy Convex after changing functions in `convex/`: `npx convex deploy --prod`

## Troubleshooting

- If `/admin/login` loops after sign-in, verify:
  - `https://<your-deployment>.convex.site/.well-known/openid-configuration` returns 200
  - `https://<your-deployment>.convex.site/.well-known/jwks.json` returns 200 and valid JSON
