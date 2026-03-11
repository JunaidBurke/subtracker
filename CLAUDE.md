# Subscription Tracker

AI-powered subscription management app with glass-morphism UI. Track subscriptions, get AI insights on spending, and receive renewal reminders.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS 4 + Framer Motion (glass-morphism design system)
- **Auth:** Clerk
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude (via `@anthropic-ai/sdk`)
- **Email:** Resend
- **Charts:** Recharts
- **Validation:** Zod

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck  # TypeScript check (tsc --noEmit)
npx eslint src/    # Lint (next lint has a Next 16 bug, use eslint directly)
```

## Architecture

### Frontend (Next.js App Router)

```
src/
  app/
    (auth)/              # Clerk sign-in/sign-up pages
    (dashboard)/         # Authenticated pages (layout with sidebar + mobile nav)
      page.tsx           # Dashboard — spend overview, charts, AI chat
      subscriptions/     # List + detail pages
      insights/          # AI insight cards
      settings/          # Notifications, categories, currency
    api/
      subscriptions/     # CRUD + [id] route
      insights/          # GET/PUT insights
      notifications/     # GET/PUT notifications
      settings/          # GET/PUT user settings
      ai/parse-receipt/  # Receipt image parsing
      ai/query/          # Natural language query
    page.tsx             # Landing page (public)
  components/
    glass/               # Glass-morphism design system (Card, Button, Input, Badge, Panel)
    layout/              # DashboardLayout, Sidebar, MobileNav, NotificationBell
    charts/              # SpendDonut, MonthlyTrend, PriceHistoryChart
    ai/                  # AIChatInput, AIChatResponse
    subscriptions/       # SubscriptionCard, AddModal, Form, SmartEntry
    insights/            # InsightCard
    notifications/       # NotificationList
    settings/            # NotificationPrefs, CategoryManager
    landing/             # Hero, Features, Stats, AnimatedBackground
  hooks/                 # useSubscriptions, useInsights, useNotifications
  lib/
    supabase/            # client.ts (browser), server.ts (admin), queries.ts
    ai/                  # claude.ts, provider.ts, prompts.ts
    email/               # resend.ts, templates.ts
    utils/               # spend.ts (calculation helpers)
  types/                 # Shared TypeScript interfaces
  validators/            # Zod schemas (subscription, notification, ai-insight)
  middleware.ts          # Clerk auth middleware
```

### Edge Functions (Supabase / Deno)

```
supabase/functions/
  cost-advisor/          # AI-powered cost optimization suggestions
  spend-forecast/        # Spending predictions
  weekly-digest/         # Weekly email digest
```

These run on Deno runtime and are excluded from `tsconfig.json`.

## Key Patterns

- **Glass design system:** All UI uses `GlassCard`, `GlassButton`, `GlassInput`, `GlassBadge`, `GlassPanel`
- **Error handling:** API routes use try/catch with Zod validation, UI shows glass-styled error states with retry buttons
- **Loading states:** Skeleton cards on every page while data fetches
- **Empty states:** Friendly messages when no data exists
- **Mobile-first:** Sidebar hidden on mobile, bottom nav shown; cards stack single-column; 44px touch targets
- **Server-side auth:** All API routes verify Clerk session; Supabase admin client used server-side only

## Environment Variables

See `.env.local.example` for required variables. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to the client.
