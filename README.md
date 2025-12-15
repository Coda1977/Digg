# Digg (MVP)

AI-powered feedback surveys with four built-in protocols (templates), backed by Convex.

## Stack

- Next.js App Router (`src/app`)
- Convex database/functions (`convex/`)
- Convex Auth (Password provider)
- Anthropic via AI SDK (`src/app/api/chat/route.ts`)

## Local setup

1. Install deps: `npm install`
2. Create `.env.local`:
   - `NEXT_PUBLIC_CONVEX_URL=...`
   - `ANTHROPIC_API_KEY=...`
3. Run Next: `npm run dev`

## First run (in the browser)

1. Go to `/admin/login` and sign up.
2. Go to `/admin/projects/new` and click `Seed templates` (creates the 4 built-in protocols).
3. Create a project and then create survey links from the project page.
4. Open a survey link (`/survey/<id>`) and complete the AI interview.

## Deployment checklist (Vercel + Convex)

- Vercel env vars:
  - `NEXT_PUBLIC_CONVEX_URL` (your `https://<deployment>.convex.cloud` URL)
  - `ANTHROPIC_API_KEY`
- Convex env vars (prod deployment):
  - `SITE_URL` (your web app URL, e.g. `https://digg-teal.vercel.app`)
  - `AUTH_SECRET`
  - `JWT_PRIVATE_KEY`
  - `JWKS` (must be valid JSON; used by `/.well-known/jwks.json`)
- Redeploy Convex after changing functions in `convex/`: `npx convex deploy --prod`

## Troubleshooting

- If `/admin/login` loops after sign-in, verify:
  - `https://<your-deployment>.convex.site/.well-known/openid-configuration` returns 200
  - `https://<your-deployment>.convex.site/.well-known/jwks.json` returns 200 and valid JSON
