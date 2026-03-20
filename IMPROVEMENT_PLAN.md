# Subscription Tracker — Improvement Plan

> Last updated: 2026-03-20
> Status: Pre-launch (architecture complete, not yet deployed)

---

## Current State

The app is fully scaffolded and architecturally complete:

- **Auth:** Clerk middleware in place, sign-in/sign-up pages built
- **Database:** Supabase schema written (migrations 001–003), not yet applied
- **AI:** Multi-provider abstraction with 10+ providers (Anthropic, OpenAI, Google, Groq, xAI, etc.), credential encryption, provider settings UI
- **UI:** Glass-morphism design system (GlassCard, GlassButton, GlassInput, etc.), dashboard, subscription list/detail, insights, settings, landing page
- **API:** Full CRUD for subscriptions, insights, notifications, settings; AI endpoints for query, parse-receipt, compare, providers
- **Charts:** SpendDonut, MonthlyTrend, PriceHistoryChart (Recharts)
- **Email:** Resend integration + templates, Supabase Edge Functions for weekly digest, cost advisor, spend forecast
- **Hooks:** useSubscriptions, useInsights, useNotifications (raw fetch, no caching layer)

**Not yet done (hard blockers):**
- `.env.local` not configured — no real credentials
- Database migrations not applied — app will crash on any DB operation
- Supabase RLS policies enabled but empty — all rows accessible by anyone server-side
- No Vercel project linked/deployed
- Zero tests
- README.md is still the default Next.js boilerplate

---

## P1 — Launch Blockers (Do These First)

These prevent the app from running correctly or safely.

### 1.1 Apply Database Migrations
**What:** Run `supabase/migrations/001_initial_schema.sql`, `002_cron_schedules.sql`, `003_ai_provider_credentials.sql` against the live Supabase project.
**Why:** Without this the DB has no tables; every API call returns 500.
**How:** `supabase db push` or paste migrations into Supabase SQL editor.

### 1.2 Define Supabase RLS Policies
**What:** Add `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies on every table in the `subtracker` schema, scoped to `auth.uid()` matching the `user_id` column.
**Why:** RLS is enabled but no policies exist — either all rows are blocked or all rows are visible depending on Supabase defaults. Server-side admin client bypasses RLS, but this is still a security gap.
**How:** Add to migration 001 or a new `004_rls_policies.sql`:
```sql
CREATE POLICY "Users see own subscriptions"
  ON subtracker.subscriptions FOR ALL
  USING (user_id = auth.uid());
-- repeat for ai_insights, notifications, forecasts, user_settings
```

### 1.3 Configure Environment Variables
**What:** Copy `.env.local.example` → `.env.local`, fill in real Clerk, Supabase, and Anthropic keys. Set `AI_CREDENTIAL_ENCRYPTION_KEY` to a 32-byte random hex string.
**Why:** App will not start without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.
**How:** See `.env.local.example`.

### 1.4 Add Toast Notifications for User Feedback
**What:** Install `sonner` (or use a lightweight toast). Show toasts on: subscription created/updated/deleted, settings saved, AI insight refresh, errors.
**Why:** Without feedback, users don't know if their actions succeeded. Every mutation currently fires silently.
**Files to touch:** `src/app/(dashboard)/dashboard/layout.tsx` (add Toaster), each hook/mutation call site.

### 1.5 Add Delete Confirmation Dialog
**What:** Wrap the delete subscription action in a GlassCard-styled `AlertDialog` asking "Delete [name]? This can't be undone."
**Why:** Users can accidentally delete subscriptions with no recovery path.
**Files:** `src/components/subscriptions/subscription-card.tsx`, possibly `src/components/subscriptions/add-subscription-modal.tsx`.

### 1.6 Add Basic Error Boundaries
**What:** Wrap the dashboard and each page with React error boundaries that show a GlassCard error state with a "Retry" button.
**Why:** A single component crash (e.g. chart with bad data) currently kills the entire dashboard.
**Files:** New `src/components/error-boundary.tsx`, wrap in `src/app/(dashboard)/dashboard/layout.tsx`.

### 1.7 Fix README.md
**What:** Replace the default Next.js README with a proper project README covering: what the app does, setup instructions, env vars, local dev, deployment.
**Why:** It's the first thing anyone (or future-you) reads.
**File:** `README.md`

### 1.8 Link Vercel Project and Deploy
**What:** `vercel link`, set env vars in Vercel dashboard, push to trigger auto-deploy.
**Why:** App currently lives only on localhost.
**How:** `vercel env add` for each variable in `.env.local.example`, or use Vercel dashboard.

---

## P2 — Post-Launch Polish (Within 2 Weeks of Launch)

Quality-of-life improvements that reduce churn and increase trust.

### 2.1 Replace Raw Fetch Hooks with SWR
**What:** Migrate `useSubscriptions`, `useInsights`, `useNotifications` to use SWR (`useSWR` / `useSWRMutation`).
**Why:** Current hooks re-fetch on every mount, have no deduplication, no cache, and no optimistic updates. SWR gives this for free.
**Impact:** Snappier UI, fewer loading spinners, automatic revalidation on focus.
**Files:** `src/hooks/use-subscriptions.ts`, `src/hooks/use-insights.ts`, `src/hooks/use-notifications.ts`

### 2.2 Search and Filter on Subscriptions List
**What:** Add a search input and filter dropdown (by category, status, billing cycle) to the subscriptions list page.
**Why:** Once users have 20+ subscriptions, scrolling a flat list is painful.
**Files:** `src/app/(dashboard)/dashboard/subscriptions/page.tsx`, new `src/components/subscriptions/subscription-filters.tsx`

### 2.3 Add Rate Limiting to API Routes
**What:** Add per-user rate limiting to all API routes. Use Upstash Redis with `@upstash/ratelimit` or simple in-memory approach.
**Why:** The AI endpoints (`/api/ai/query`, `/api/ai/parse-receipt`) are expensive. No rate limiting means a bug or malicious user can rack up API costs.
**Files:** New `src/lib/rate-limit.ts`, applied in each `src/app/api/ai/*/route.ts`.

### 2.4 Subscription Sorting
**What:** Allow sorting the subscriptions list by: name, amount (high→low, low→high), next renewal date, date added.
**Why:** Users want to find their most expensive subscriptions quickly.
**Files:** `src/app/(dashboard)/dashboard/subscriptions/page.tsx`

### 2.5 Export to CSV
**What:** Add an "Export" button on the subscriptions page that downloads a CSV of all active subscriptions (name, amount, billing cycle, next renewal, category).
**Why:** Users want to share or audit their subscriptions in a spreadsheet.
**Files:** New `src/lib/utils/export.ts`, `src/app/(dashboard)/dashboard/subscriptions/page.tsx`

### 2.6 Budget Threshold Alerts
**What:** Add a "monthly budget" field to UserSettings. If projected monthly spend exceeds the threshold, show a red GlassBadge on the dashboard and trigger an alert notification.
**Why:** Core value prop of a subscription tracker — warn users before they overspend.
**Files:** `src/types/index.ts`, `src/validators/`, `src/app/api/settings/route.ts`, `src/components/settings/notification-prefs.tsx`, `src/lib/utils/spend.ts`

### 2.7 Subscription Trial Expiration Tracking
**What:** Add a `trial_ends_at` field to subscriptions. Show a prominent banner/badge "Trial ends in X days" on subscription cards and detail view. Trigger a notification 3 days before trial ends.
**Why:** Trial → paid conversion surprises are a top source of user frustration. Catching them is a core use case.
**Files:** `src/types/index.ts`, migration `005_trial_fields.sql`, `src/components/subscriptions/subscription-card.tsx`, `src/lib/supabase/queries.ts`

### 2.8 Pagination in Subscriptions Hook
**What:** The API route supports `limit`/`offset` pagination but the hook fetches everything at once. Implement cursor or page-based pagination in the hook and list view.
**Why:** Users with 50+ subscriptions will hit performance issues.
**Files:** `src/hooks/use-subscriptions.ts`, `src/app/(dashboard)/dashboard/subscriptions/page.tsx`

### 2.9 Keyboard Shortcuts
**What:** Add keyboard shortcuts: `N` to open add subscription modal, `?` for help overlay, `ESC` to close modals, `/` to focus search.
**Why:** Power users expect this. Glass-morphism apps look slick but often ignore keyboard UX.
**Files:** New `src/hooks/use-keyboard-shortcuts.ts`, integrated in dashboard layout.

### 2.10 Improve Mobile Nav Affordance
**What:** The bottom mobile nav currently shows only icons. Add labels. Add a visible "+" FAB (floating action button) for adding a subscription.
**Why:** Icon-only nav fails usability testing. The most common action (add subscription) should be one tap.
**Files:** `src/components/layout/mobile-nav.tsx`

---

## P3 — Future Features (Backlog, No Active Sprint)

Log these in `docs/future-features.md` and don't build them until P1 and P2 are done.

### 3.1 Calendar View for Renewals
A monthly calendar showing which subscriptions renew on which days. High visual impact, useful for cash flow planning.

### 3.2 Subscription Auto-Detection via Browser Extension
A companion browser extension that detects subscription confirmation emails or payment pages and offers to add them to the tracker automatically.

### 3.3 OAuth Auto-Import from Email
Connect Gmail/Outlook, scan for subscription receipts, and bulk-import. Would dramatically reduce onboarding friction.

### 3.4 Price Change Detection and Alerts
Periodically check if a subscription's price has changed (via user-submitted receipts or bank feeds) and flag it.

### 3.5 Shareable Spending Reports
Generate a public URL with a read-only, anonymized spending breakdown (e.g., "I spend $X/month on subscriptions, broken down by category").

### 3.6 Family/Team Sharing
Allow multiple users to share a subscription tracker workspace (useful for households or small teams).

### 3.7 Annual Review Mode
A dedicated "year in review" view: total spent in the past 12 months, subscriptions added/removed, biggest price changes.

### 3.8 Mobile App (React Native / Expo)
A mobile companion with push notifications for renewal reminders.

---

## Tech Debt Register

Issues that don't block launch but should be addressed before the codebase grows.

| # | Issue | File(s) | Effort | Priority |
|---|-------|---------|--------|----------|
| T1 | `middleware.ts` exists alongside `proxy.ts` — Next.js 16 uses `proxy.ts`; `middleware.ts` may conflict | `src/middleware.ts`, `src/proxy.ts` | Small | P1 |
| T2 | `AGENTS.md` is a duplicate of `CLAUDE.md` — either delete or differentiate | `AGENTS.md` | Trivial | P2 |
| T3 | Hooks use raw `fetch` with `useState/useEffect` — no deduplication, no optimistic updates | `src/hooks/*.ts` | Medium | P2 |
| T4 | No error boundaries — a single bad render crashes the entire page | All pages | Small | P1 |
| T5 | API routes return `{ error: 'Internal server error' }` on all 500s — no structured error codes for client-side handling | `src/app/api/*/route.ts` | Medium | P2 |
| T6 | `config/ai-providers.json` is 794 lines and contains outdated models (GPT-4o, Gemini 1.5 Pro, etc.) — needs audit | `config/ai-providers.json` | Small | P2 |
| T7 | Dashboard `page.tsx` uses `'use client'` for the entire page — could be split to push client boundary down | `src/app/(dashboard)/dashboard/page.tsx` | Medium | P3 |
| T8 | Supabase Edge Functions use Deno runtime but there's no local testing setup for them | `supabase/functions/` | Small | P2 |
| T9 | No structured logging — `console.error('[route-name]', error)` is inconsistent and noisy | `src/app/api/*/route.ts` | Small | P2 |
| T10 | `src/lib/ai/insights.ts` generates insights on-demand — no caching, every page load re-runs AI calls | `src/lib/ai/insights.ts` | Medium | P1 |

---

## Testing Backlog

Zero tests currently exist. Start here:

### Critical Path (Write First)
- `src/lib/utils/spend.ts` — unit test `calculateMonthlyAmount`, `totalMonthlySpend`, `spendByCategory` with edge cases (yearly/weekly normalization, zero amounts, empty arrays)
- `src/app/api/subscriptions/route.ts` — integration test POST validation (valid body, invalid body, missing fields, auth rejection)
- `src/app/api/subscriptions/[id]/route.ts` — integration test DELETE (own subscription, another user's subscription → 403)
- `src/validators/subscription.ts` — unit test Zod schemas

### Component Tests (After Critical Path)
- `src/components/subscriptions/subscription-card.tsx` — renders name, amount, billing cycle; delete button present
- `src/components/glass/*.tsx` — snapshot tests for design system components (prevent regressions)
- `src/hooks/use-subscriptions.ts` — mock fetch, test loading/error/success states

### E2E (After App Is Live)
- Add subscription flow: fill form → submit → appears in list
- Delete subscription: click delete → confirm → removed from list
- AI query: type natural language question → response renders without crash

**Target:** 70% coverage on `src/lib/` and `src/app/api/` before first external user.

---

## Performance Checklist

- [ ] Add `next/image` to subscription card logo rendering (currently renders raw `<img>` or placeholder)
- [ ] Virtualize subscription list with `react-window` or `@tanstack/virtual` if list exceeds 100 items
- [ ] Debounce search input (300ms) to avoid re-filtering on every keystroke
- [ ] Memoize expensive spend calculations in dashboard (`useMemo` on `totalMonthlySpend` and `spendByCategory`)
- [ ] Lazy-load charts below the fold (`React.lazy` + `Suspense`)
- [ ] Add `stale-while-revalidate` cache headers to GET API routes
- [ ] Move AI insight generation to a background job (Supabase Edge Function) rather than on-demand per request

---

## Prioritized Backlog Summary

| ID | Item | Priority | Effort | Status |
|----|------|----------|--------|--------|
| 1.1 | Apply DB migrations | P1 | Small | ⬜ |
| 1.2 | Define RLS policies | P1 | Small | ⬜ |
| 1.3 | Configure env vars | P1 | Small | ⬜ |
| 1.4 | Toast notifications | P1 | Small | ⬜ |
| 1.5 | Delete confirmation dialog | P1 | Small | ⬜ |
| 1.6 | Error boundaries | P1 | Small | ⬜ |
| 1.7 | Fix README.md | P1 | Trivial | ⬜ |
| 1.8 | Vercel deployment | P1 | Small | ⬜ |
| T1 | middleware.ts vs proxy.ts conflict | P1 | Small | ⬜ |
| T10 | Cache AI insights (don't regenerate per request) | P1 | Medium | ⬜ |
| 2.1 | SWR for hooks | P2 | Medium | ⬜ |
| 2.2 | Search + filter subscriptions | P2 | Medium | ⬜ |
| 2.3 | Rate limiting on AI routes | P2 | Small | ⬜ |
| 2.4 | Subscription sorting | P2 | Small | ⬜ |
| 2.5 | Export to CSV | P2 | Small | ⬜ |
| 2.6 | Budget threshold alerts | P2 | Medium | ⬜ |
| 2.7 | Trial expiration tracking | P2 | Medium | ⬜ |
| 2.8 | Pagination in hooks | P2 | Medium | ⬜ |
| 2.9 | Keyboard shortcuts | P2 | Small | ⬜ |
| 2.10 | Mobile nav labels + FAB | P2 | Small | ⬜ |
| Tests | Critical path unit/integration tests | P2 | Medium | ⬜ |
| T2–T9 | Remaining tech debt | P2/P3 | Various | ⬜ |
| 3.1–3.8 | Future features | P3 | Large | ⬜ |
