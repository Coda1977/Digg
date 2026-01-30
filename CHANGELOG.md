# Changelog

## 2026-01-30 -- Security Hardening & CI Pipeline

Comprehensive security review implementation based on CTO code review findings.
Commits: `a5af164`, `ed41cb3`, `94905c5`, `5ffeb73`, `cea7f88`.

---

### Critical: Auth-Bypass Queries Removed

**Problem:** Three Convex queries (`devGetById`, `devGetByProjectWithMessages`, `devListProjectIds`) in `convex/projects.ts` and `convex/surveys.ts` skipped all authentication. They were marked `// TODO: Remove this after testing` but remained deployed. Since `NEXT_PUBLIC_CONVEX_URL` is public and Convex queries are callable by anyone who knows the function name, this allowed unauthenticated data exfiltration of all interview transcripts.

**Fix:** Deleted all three `dev*` queries. Replaced with `getByIdInternal` and `getByProjectWithMessagesInternal` that validate a shared `INTERNAL_API_SECRET` environment variable. The PDF generation route (`src/app/api/pdf/generate/route.ts`) now passes this secret when calling Convex.

**Setup required:** `INTERNAL_API_SECRET` must be set in both:
- Vercel: Project Settings > Environment Variables
- Convex: `npx convex env set INTERNAL_API_SECRET <value>`

Both environments were configured during this session.

**Files changed:**
- `convex/projects.ts` -- Removed `devListProjectIds` + `devGetById`, added `getByIdInternal`
- `convex/surveys.ts` -- Removed `devGetByProjectWithMessages`, added `getByProjectWithMessagesInternal`
- `src/app/api/pdf/generate/route.ts` -- Switched to secret-validated queries
- `.env.example` -- Added `INTERNAL_API_SECRET` with generation instructions

---

### Critical: `.env.vercel` Removed from Git

**Problem:** `.env.vercel` was tracked in Git and contained a Vercel OIDC JWT token. The public GitHub repo history preserves it permanently.

**Fix:** Ran `git rm --cached .env.vercel` and added `.env.vercel` to `.gitignore`.

**Remaining action:** Rotate the Vercel OIDC token. Consider using BFG Repo-Cleaner to scrub the token from Git history since the repo is public.

**Files changed:**
- `.gitignore` -- Added `.env.vercel`
- `.env.vercel` -- Deleted from tracking (file remains locally)

---

### High: Deepgram API Key No Longer Exposed to Browser

**Problem:** `GET /api/deepgram` returned the raw `DEEPGRAM_API_KEY` in its JSON response. Any survey respondent could extract the master key from browser DevTools.

**Fix:** The route now calls Deepgram's `/v1/auth/grant` endpoint to generate a short-lived JWT (120-second TTL) and returns that instead. The master key never leaves the server. The `useDeepgram` hook was updated to always fetch a fresh token per recording session.

**Files changed:**
- `src/app/api/deepgram/route.ts` -- Replaced raw key return with temp token generation
- `src/hooks/useDeepgram.ts` -- Always fetch fresh token per session
- `src/__tests__/api/deepgram.route.test.ts` -- Updated tests to mock token endpoint, verify temp token returned

---

### High: CI/CD Pipeline Added

**Problem:** No `.github/workflows/` directory existed. No automated quality gates.

**Fix:** Created `.github/workflows/ci.yml` with three jobs:
1. **lint-typecheck** -- Runs ESLint + `tsc --noEmit`
2. **unit-tests** -- Runs `vitest run`
3. **build** -- Runs `next build` (depends on lint + tests passing)

Triggers on push to `master` and pull requests targeting `master`.

**Files created:**
- `.github/workflows/ci.yml`

---

### Medium: Security Headers Added

**Problem:** No CSP, HSTS, X-Frame-Options, or other security headers were configured.

**Fix:** Added security headers via `next.config.js` `headers()` configuration (applied to all routes):
- `Strict-Transport-Security` (1 year, includeSubDomains)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restricts camera, geolocation, payment)
- `Content-Security-Policy` allowing self, Convex (HTTP + WebSocket), Deepgram API/WebSocket

**Note:** Initially implemented as `src/middleware.ts` (Edge Runtime), but this caused persistent `MIDDLEWARE_INVOCATION_FAILED` 500 errors on Vercel with Next.js 16.0.10. Moved to `next.config.js` `headers()` which avoids the Edge Runtime entirely and is the recommended pattern for static security headers.

**Files changed:**
- `next.config.js` -- Added `headers()` with all security headers + `.trim()` on env vars
- `src/middleware.ts` -- Created then deleted (Edge Runtime incompatible on Vercel)

---

### Fix: CSP Blocking Convex WebSocket Connections

**Problem:** After adding security headers, the admin login button was greyed out and the dashboard showed "Loading..." indefinitely. The `NEXT_PUBLIC_CONVEX_URL` environment variable on Vercel contained trailing CRLF (`\r\n`) characters, which were injected into the CSP `connect-src` directive. Browsers rejected the malformed URLs, blocking all WebSocket connections to Convex -- preventing auth initialization and data loading.

**Fix:** Added `.trim()` when reading `NEXT_PUBLIC_CONVEX_URL` in `next.config.js` to strip trailing whitespace/newlines before building the CSP string.

**Files changed:**
- `next.config.js` -- Added `.trim()` to env var reading

---

### Lint: All ESLint Errors and Warnings Resolved

Fixed 15 errors and 17 warnings that were blocking CI:

| Issue | File(s) | Fix |
|-------|---------|-----|
| Ref access during render | `src/app/admin/page.tsx` | Replaced ref cache with plain `useMemo` |
| `any` type | `templates/new/page.tsx`, `templates/[id]/edit/page.tsx` | Changed to `Question[keyof Question]` |
| Unescaped JSX `"` | `RatingConfigPanel.tsx`, `HistoryModal.tsx` | Replaced with `&quot;` |
| setState in useEffect | `ChatInput.tsx` | Derived value from `error` prop instead |
| Unused variables | 8 files across admin, PDF, survey, tests | Removed or prefixed with `_` |
| Dead code | `puppeteerClient.ts` | Removed unused `loadFonts`/`getFontPath` |
| Expression statements | `puppeteerClient.ts` | Added `void` prefix |

---

### Cleanup: Stale Files Removed

- `BUG_CORRUPT_NUMBER.txt` -- Resolved bug report from Jan 7-8 (react-pdf coordinate overflow). The app now uses Puppeteer for PDF generation, making this obsolete.
- `_ul` -- Stale file listing artifact from a previous session.

---

### Convex Deployment

All Convex backend changes were deployed via `npx convex deploy -y` to `https://fast-llama-701.convex.cloud`. The `INTERNAL_API_SECRET` environment variable was set in the Convex environment.

---

### Remaining Actions

1. **Rotate the Vercel OIDC token** -- The token from `.env.vercel` is still in Git history. Consider BFG Repo-Cleaner since the repo is public.
2. **Clean `NEXT_PUBLIC_CONVEX_URL` on Vercel** -- Re-enter the value in Vercel Project Settings without trailing whitespace to prevent future CRLF issues.
