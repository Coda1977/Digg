# Digg (MVP)

AI-powered feedback surveys with four built-in protocols (templates), backed by Convex.

## Stack

- Next.js App Router (`src/app`)
- Convex database/functions (`convex/`)
- Convex Auth (Password provider)
- Anthropic via AI SDK (server route `src/app/api/chat/route.ts`)

## Local setup

1. Install deps: `npm install`
2. Create `.env.local` (or set env vars in your shell):
   - `NEXT_PUBLIC_CONVEX_URL=...`
   - `ANTHROPIC_API_KEY=...` (required for AI chat)
3. Run Next: `npm run dev`

## First run (in the browser)

1. Go to `/admin/login` and sign up.
2. Go to `/admin/projects/new` and click “Seed templates” (creates the 4 built-in protocols).
3. Create a project and then create survey links from the project page.
4. Open a survey link (`/survey/<id>`) and complete the AI interview.

## Deployment checklist (Vercel + Convex)

- Vercel env vars:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `ANTHROPIC_API_KEY`
- Convex env vars:
  - `JWT_PRIVATE_KEY` (required by Convex Auth; set in the Convex dashboard or via `npx convex env set`)
- Redeploy Convex after changing functions in `convex/`.

