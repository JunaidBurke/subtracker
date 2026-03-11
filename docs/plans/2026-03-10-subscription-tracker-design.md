# Subscription Tracker — Design Document

**Date:** 2026-03-10
**Status:** Approved

---

## Overview

A personal subscription tracker with AI-powered insights, built with a Liquid Glass UI. Tracks all recurring subscriptions, provides spend visibility, cost optimization suggestions, forecasting, and natural language queries.

**User:** Single user (personal tool)
**Problem:** Full financial awareness — visibility into what I'm paying, optimization to cut waste, budgeting to forecast costs, all enhanced with AI.

---

## Architecture: Next.js + Supabase Edge Functions (Approach B)

- **Next.js 15 (App Router)** — UI, lightweight API routes (receipt parsing, NL queries)
- **Supabase Edge Functions + pg_cron** — heavy AI work (cost advisor, forecasting, email digests)
- **Resend** — transactional email (weekly digest, urgent alerts)
- **Clerk** — authentication and route protection
- **AI Provider Abstraction** — start with Claude API, swap anytime

This avoids Vercel timeout limits for AI-heavy background tasks while keeping the frontend snappy.

---

## Data Model

### `subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | Clerk user ID |
| name | text | e.g. "Netflix", "GitHub Pro" |
| logo_url | text | nullable, auto-fetched |
| category | text | e.g. "streaming", "dev-tools", "productivity" |
| amount | numeric(10,2) | per-cycle cost |
| currency | text | default "USD" |
| billing_cycle | text | "monthly", "yearly", "weekly" |
| next_renewal | date | next charge date |
| start_date | date | when subscription started |
| status | text | "active", "paused", "cancelled", "trial" |
| notes | text | nullable, free-form |
| payment_method | text | nullable, e.g. "Visa ending 4242" |
| auto_renew | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `price_history`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| subscription_id | uuid | FK |
| amount | numeric(10,2) | price at that time |
| recorded_at | timestamptz | when the price was recorded |

### `ai_insights`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | Clerk user ID |
| type | text | "optimization", "forecast", "alert" |
| title | text | short summary |
| body | text | full insight text |
| related_subscription_ids | uuid[] | subscriptions this relates to |
| is_read | boolean | default false |
| is_dismissed | boolean | default false |
| created_at | timestamptz | |

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | |
| type | text | "renewal_reminder", "price_change", "digest", "insight" |
| title | text | |
| body | text | |
| channel | text | "in_app", "email" |
| is_read | boolean | default false |
| sent_at | timestamptz | |

---

## AI Features

### Provider Abstraction

```typescript
interface AIProvider {
  analyzeText(prompt: string): Promise<string>
  analyzeImage(image: Buffer, prompt: string): Promise<string>
}
```

Factory pattern selects provider from env config. Start with Claude.

### Feature 1: Smart Data Entry (MVP)

- User uploads screenshot or pastes receipt text
- API route sends to AI provider for extraction
- AI returns: name, amount, billing cycle, renewal date, category
- Pre-filled form for user to confirm/edit
- Runs synchronously in Vercel API route

### Feature 2: Cost Advisor (MVP)

- Weekly scheduled Supabase Edge Function (pg_cron)
- Analyzes all active subscriptions for overlaps, waste, cheaper alternatives
- Saves findings to `ai_insights` table
- Triggers in-app + email notification

### Feature 3: Spend Forecasting (MVP)

- Daily scheduled Edge Function
- Calculates upcoming charges for 7/30/90 day windows
- AI analyzes price history for anomalies
- Results cached in `forecasts` table for dashboard reads

### Feature 4: Natural Language Queries (MVP)

- Chat-like input on dashboard
- API route sends question + subscription context to AI
- Conversational response with data
- Runs synchronously for real-time feel

### Email Notifications

- **Resend** for delivery
- Weekly digest via pg_cron → Edge Function → Resend
- Urgent alerts triggered by daily forecast job (renewal in 3 days, price change)

---

## UI/UX — Liquid Glass Design

### Design Language

- **Translucent panels** — `backdrop-blur-xl`, `bg-white/10`, `bg-white/5`
- **Layered depth** — subtle box shadows, `border-white/20`, z-index stacking
- **Subtle motion** — Framer Motion for float-in, hover lifts, number animations
- **Dark base** — deep navy/charcoal background
- **Accent** — blue-purple gradient glow for active states and AI elements
- **Typography** — Inter or Geist for clean readability on glass

### Pages

**Dashboard (Home)**
- Total monthly spend with animated number, trend arrow, next renewal countdown
- Glass card grid: Spend Overview (donut chart), Upcoming Renewals, AI Insights, Monthly Trend
- AI chat input pinned at bottom (glass pill)

**Subscriptions List**
- Filterable/sortable glass table or card view toggle
- Logo, name, amount, cycle, renewal date, status badge per subscription
- Add modal with manual form + screenshot upload tab

**Subscription Detail**
- Full details glass panel, price history chart, related AI insights, edit form

**Insights Page**
- Feed of AI insights as glass cards, filterable by type, with dismiss/act actions

**Settings**
- Notification preferences, category management, currency preference

### Responsive

- Mobile: single column, stacked cards, bottom nav
- Desktop: multi-column grid, sidebar nav
- Touch targets: minimum 44x44px

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Framer Motion |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| AI | Abstract provider, starting with Claude API |
| Email | Resend |
| Background Jobs | Supabase Edge Functions + pg_cron |
| Charts | Recharts |
| Validation | Zod |
| Deploy | Vercel |

### Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   ├── subscriptions/
│   │   ├── insights/
│   │   └── settings/
│   └── api/
│       ├── subscriptions/
│       ├── ai/
│       │   ├── parse-receipt/
│       │   ├── query/
│       │   └── webhook/
│       └── notifications/
├── components/
│   ├── glass/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── claude.ts
│   │   └── prompts.ts
│   ├── supabase/
│   ├── email/
│   └── utils/
├── hooks/
├── types/
└── validators/
```

### Security

- Clerk middleware on all dashboard routes
- Supabase RLS policies filtering by Clerk user_id
- AI API routes: session validation + rate limiting
- Webhook signature validation
- No secrets in client code

---

## Future Features (Not in MVP)

- Connected accounts via Plaid/Gmail API for auto-detection
- Multi-currency with live conversion rates
- Shared/family subscription tracking
- Browser extension for auto-detecting subscription pages
- Export to CSV/PDF
