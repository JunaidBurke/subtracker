# Subscription Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal subscription tracker with Liquid Glass UI, AI-powered insights, and background processing via Supabase Edge Functions.

**Architecture:** Next.js 15 App Router for UI + lightweight API routes. Supabase for DB + Edge Functions for heavy AI tasks. Clerk for auth. Resend for email. Provider-agnostic AI layer starting with Claude.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, Framer Motion, Clerk, Supabase, Claude API, Resend, Recharts, Zod

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install core dependencies**

Run:
```bash
npm install @clerk/nextjs @supabase/supabase-js @anthropic-ai/sdk resend framer-motion recharts zod date-fns
npm install -D @types/node
```

**Step 3: Create `.env.local.example`**

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
AI_PROVIDER=claude
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=notifications@yourdomain.com
```

**Step 4: Create `.gitignore` additions**

Add `.env.local` and `.env` to `.gitignore` if not present.

**Step 5: Configure `tailwind.config.ts` with Liquid Glass tokens**

Extend theme with:
- Custom colors: `glass-bg`, `glass-border`, `accent-blue`, `accent-purple`
- Custom backdrop blur values
- Custom box shadow for glass depth

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with core dependencies"
```

---

## Task 2: TypeScript Types & Zod Validators

**Files:**
- Create: `src/types/index.ts`
- Create: `src/validators/subscription.ts`
- Create: `src/validators/notification.ts`
- Create: `src/validators/ai-insight.ts`

**Step 1: Define TypeScript types**

```typescript
// src/types/index.ts
export type BillingCycle = 'weekly' | 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial'
export type InsightType = 'optimization' | 'forecast' | 'alert'
export type NotificationType = 'renewal_reminder' | 'price_change' | 'digest' | 'insight'
export type NotificationChannel = 'in_app' | 'email'

export interface Subscription {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  category: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_renewal: string
  start_date: string
  status: SubscriptionStatus
  notes: string | null
  payment_method: string | null
  auto_renew: boolean
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  subscription_id: string
  amount: number
  recorded_at: string
}

export interface AIInsight {
  id: string
  user_id: string
  type: InsightType
  title: string
  body: string
  related_subscription_ids: string[]
  is_read: boolean
  is_dismissed: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  channel: NotificationChannel
  is_read: boolean
  sent_at: string
}
```

**Step 2: Create Zod validators**

```typescript
// src/validators/subscription.ts
import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  logo_url: z.string().url().nullable().optional(),
  category: z.string().min(1).max(50),
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).default('USD'),
  billing_cycle: z.enum(['weekly', 'monthly', 'yearly']),
  next_renewal: z.string().date(),
  start_date: z.string().date(),
  status: z.enum(['active', 'paused', 'cancelled', 'trial']).default('active'),
  notes: z.string().max(500).nullable().optional(),
  payment_method: z.string().max(50).nullable().optional(),
  auto_renew: z.boolean().default(true),
})

export const updateSubscriptionSchema = createSubscriptionSchema.partial()
```

**Step 3: Commit**

```bash
git add src/types src/validators
git commit -m "feat: add TypeScript types and Zod validators"
```

---

## Task 3: Supabase Setup & Database Schema

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create Supabase client (browser)**

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create Supabase server client**

```typescript
// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Step 3: Write migration SQL**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  logo_url text,
  category text not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  billing_cycle text not null check (billing_cycle in ('weekly','monthly','yearly')),
  next_renewal date not null,
  start_date date not null,
  status text not null default 'active' check (status in ('active','paused','cancelled','trial')),
  notes text,
  payment_method text,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_next_renewal on subscriptions(next_renewal);
create index idx_subscriptions_status on subscriptions(status);

-- Price history
create table price_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount numeric(10,2) not null,
  recorded_at timestamptz not null default now()
);

create index idx_price_history_sub on price_history(subscription_id);

-- AI insights
create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('optimization','forecast','alert')),
  title text not null,
  body text not null,
  related_subscription_ids uuid[] default '{}',
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_ai_insights_user on ai_insights(user_id);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('renewal_reminder','price_change','digest','insight')),
  title text not null,
  body text not null,
  channel text not null check (channel in ('in_app','email')),
  is_read boolean not null default false,
  sent_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id);

-- Forecasts cache
create table forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  period text not null check (period in ('7d','30d','90d')),
  total_amount numeric(10,2) not null,
  breakdown jsonb not null default '[]',
  generated_at timestamptz not null default now()
);

create index idx_forecasts_user on forecasts(user_id);

-- RLS policies
alter table subscriptions enable row level security;
alter table price_history enable row level security;
alter table ai_insights enable row level security;
alter table notifications enable row level security;
alter table forecasts enable row level security;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();
```

**Step 4: Run migration in Supabase dashboard or CLI**

**Step 5: Commit**

```bash
git add src/lib/supabase supabase
git commit -m "feat: add Supabase clients and initial database migration"
```

---

## Task 4: Clerk Auth Integration

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Configure Clerk provider in root layout**

Wrap app in `<ClerkProvider>`. Add Inter/Geist font.

**Step 2: Create middleware for route protection**

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**Step 3: Create sign-in and sign-up pages**

Use `<SignIn />` and `<SignUp />` Clerk components with dark theme styling.

**Step 4: Verify auth works locally**

Run: `npm run dev`, navigate to `/sign-in`

**Step 5: Commit**

```bash
git add src/middleware.ts src/app
git commit -m "feat: add Clerk auth with route protection"
```

---

## Task 5: Glass Design System Components

**Files:**
- Create: `src/components/glass/glass-card.tsx`
- Create: `src/components/glass/glass-panel.tsx`
- Create: `src/components/glass/glass-button.tsx`
- Create: `src/components/glass/glass-input.tsx`
- Create: `src/components/glass/glass-badge.tsx`
- Create: `src/components/glass/index.ts`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/dashboard-layout.tsx`
- Create: `src/app/globals.css` (modify existing)

**Step 1: Define glass CSS utilities in globals.css**

Add base dark background gradient, glass utility classes, glow effects.

**Step 2: Build GlassCard component**

Translucent panel with `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`, subtle shadow. Accept `glow` prop for AI-accent border. Use Framer Motion for mount animation.

**Step 3: Build GlassPanel, GlassButton, GlassInput, GlassBadge**

Each component follows the translucent + blur + depth pattern. GlassButton has hover glow. GlassInput has focus glow ring. GlassBadge for status indicators.

**Step 4: Build DashboardLayout with Sidebar + MobileNav**

Sidebar: glass panel, nav links with icons, collapsible on desktop. MobileNav: bottom tab bar with glass background. Responsive switch at `md` breakpoint.

**Step 5: Create barrel export**

```typescript
// src/components/glass/index.ts
export { GlassCard } from './glass-card'
export { GlassPanel } from './glass-panel'
export { GlassButton } from './glass-button'
export { GlassInput } from './glass-input'
export { GlassBadge } from './glass-badge'
```

**Step 6: Commit**

```bash
git add src/components src/app/globals.css
git commit -m "feat: add Liquid Glass design system components and layout"
```

---

## Task 6: Dashboard Page — Spend Overview

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/charts/spend-donut.tsx`
- Create: `src/components/charts/monthly-trend.tsx`
- Create: `src/hooks/use-subscriptions.ts`
- Create: `src/lib/utils/spend.ts`

**Step 1: Create dashboard layout**

Uses `DashboardLayout` component. Server component that checks auth.

**Step 2: Build spend calculation utilities**

```typescript
// src/lib/utils/spend.ts
import { Subscription } from '@/types'

export function calculateMonthlyAmount(sub: Subscription): number {
  switch (sub.billing_cycle) {
    case 'weekly': return sub.amount * 4.33
    case 'monthly': return sub.amount
    case 'yearly': return sub.amount / 12
  }
}

export function totalMonthlySpend(subs: Subscription[]): number {
  return subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + calculateMonthlyAmount(s), 0)
}

export function spendByCategory(subs: Subscription[]): Record<string, number> {
  return subs
    .filter(s => s.status === 'active')
    .reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + calculateMonthlyAmount(s)
      return acc
    }, {} as Record<string, number>)
}
```

**Step 3: Build SpendDonut chart**

Recharts `PieChart` wrapped in GlassCard. Category breakdown with glass tooltip.

**Step 4: Build MonthlyTrend chart**

Recharts `AreaChart` with gradient fill, glass styling.

**Step 5: Build dashboard page**

Grid layout with: total spend card (animated number via Framer Motion), SpendDonut, upcoming renewals list, MonthlyTrend, AI insights preview.

**Step 6: Create `useSubscriptions` hook**

Fetches subscriptions from API, returns data + loading + error states.

**Step 7: Commit**

```bash
git add src/app/\(dashboard\) src/components/charts src/hooks src/lib/utils
git commit -m "feat: add dashboard page with spend overview and charts"
```

---

## Task 7: Subscriptions CRUD API Routes

**Files:**
- Create: `src/app/api/subscriptions/route.ts` (GET, POST)
- Create: `src/app/api/subscriptions/[id]/route.ts` (GET, PUT, DELETE)
- Create: `src/lib/supabase/queries.ts`

**Step 1: Create query helpers**

```typescript
// src/lib/supabase/queries.ts
import { createSupabaseAdmin } from './server'

export async function getSubscriptions(userId: string) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, name, logo_url, category, amount, currency, billing_cycle, next_renewal, start_date, status, notes, payment_method, auto_renew, created_at, updated_at')
    .eq('user_id', userId)
    .order('next_renewal', { ascending: true })
  if (error) throw error
  return data
}
```

**Step 2: Build GET /api/subscriptions**

Auth check via `auth()` from Clerk. Return user's subscriptions. Paginate with `limit` and `offset` query params (default limit 50).

**Step 3: Build POST /api/subscriptions**

Validate body with `createSubscriptionSchema`. Insert into DB. Also insert initial `price_history` record.

**Step 4: Build GET/PUT/DELETE /api/subscriptions/[id]**

PUT validates with `updateSubscriptionSchema`. If amount changed, insert new `price_history` record. DELETE sets status to `cancelled` (soft delete).

**Step 5: Commit**

```bash
git add src/app/api/subscriptions src/lib/supabase/queries.ts
git commit -m "feat: add subscriptions CRUD API routes"
```

---

## Task 8: Subscriptions List & Detail Pages

**Files:**
- Create: `src/app/(dashboard)/subscriptions/page.tsx`
- Create: `src/app/(dashboard)/subscriptions/[id]/page.tsx`
- Create: `src/components/subscriptions/subscription-card.tsx`
- Create: `src/components/subscriptions/subscription-form.tsx`
- Create: `src/components/subscriptions/add-subscription-modal.tsx`
- Create: `src/components/charts/price-history-chart.tsx`

**Step 1: Build SubscriptionCard**

Glass card with logo, name, amount, billing cycle badge, status badge, next renewal date. Hover lift animation.

**Step 2: Build SubscriptionForm**

Glass-styled form for add/edit. Fields match `createSubscriptionSchema`. Has two tabs: "Manual" and "Smart Entry" (screenshot upload — wired in Task 10).

**Step 3: Build AddSubscriptionModal**

Framer Motion animated glass modal overlay.

**Step 4: Build subscriptions list page**

Filter by status/category. Card view. Add button opens modal.

**Step 5: Build subscription detail page**

Glass panel with all fields, PriceHistoryChart (Recharts LineChart), edit form, related AI insights.

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/subscriptions src/components/subscriptions src/components/charts
git commit -m "feat: add subscriptions list and detail pages"
```

---

## Task 9: AI Provider Abstraction Layer

**Files:**
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/claude.ts`
- Create: `src/lib/ai/prompts.ts`

**Step 1: Define provider interface and factory**

```typescript
// src/lib/ai/provider.ts
export interface AIProvider {
  analyzeText(prompt: string): Promise<string>
  analyzeImage(imageBase64: string, prompt: string): Promise<string>
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'claude'
  switch (provider) {
    case 'claude':
      return new (require('./claude').ClaudeProvider)()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}
```

**Step 2: Implement Claude provider**

```typescript
// src/lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { AIProvider } from './provider'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }

  async analyzeText(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    return block.text
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    return block.text
  }
}
```

**Step 3: Create prompt templates**

```typescript
// src/lib/ai/prompts.ts
export const PARSE_RECEIPT_PROMPT = `Extract subscription details from this receipt/screenshot.
Return JSON only: { "name": string, "amount": number, "currency": string, "billing_cycle": "weekly"|"monthly"|"yearly", "category": string, "next_renewal": "YYYY-MM-DD" | null }
If a field cannot be determined, use null.`

export const COST_ADVISOR_PROMPT = (subscriptions: string) =>
  `Analyze these active subscriptions and identify:
1. Overlapping or duplicate services
2. Potentially unused subscriptions (high cost, niche category)
3. Cheaper alternatives for well-known services

Subscriptions: ${subscriptions}

Return JSON array: [{ "title": string, "body": string, "type": "optimization", "related_names": string[] }]`

export const NL_QUERY_PROMPT = (context: string, question: string) =>
  `You are a subscription tracking assistant. Answer based on this data:

${context}

User question: ${question}

Be concise and conversational. Include specific numbers when relevant.`

export const FORECAST_PROMPT = (subscriptions: string, priceHistory: string) =>
  `Analyze these subscriptions and their price history for anomalies or trends:

Subscriptions: ${subscriptions}
Price History: ${priceHistory}

Flag any unusual price increases or patterns. Return JSON:
{ "anomalies": [{ "subscription_name": string, "detail": string }], "summary": string }`
```

**Step 4: Commit**

```bash
git add src/lib/ai
git commit -m "feat: add AI provider abstraction with Claude implementation"
```

---

## Task 10: Smart Data Entry (AI Receipt Parsing)

**Files:**
- Create: `src/app/api/ai/parse-receipt/route.ts`
- Modify: `src/components/subscriptions/subscription-form.tsx` (add Smart Entry tab)

**Step 1: Build parse-receipt API route**

```typescript
// src/app/api/ai/parse-receipt/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/provider'
import { PARSE_RECEIPT_PROMPT } from '@/lib/ai/prompts'
import { z } from 'zod'

const requestSchema = z.object({
  image: z.string().optional(),
  text: z.string().optional(),
}).refine(data => data.image || data.text, {
  message: 'Either image or text is required',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = requestSchema.parse(body)
    const ai = getAIProvider()

    let result: string
    if (validated.image) {
      result = await ai.analyzeImage(validated.image, PARSE_RECEIPT_PROMPT)
    } else {
      result = await ai.analyzeText(`${PARSE_RECEIPT_PROMPT}\n\nReceipt text:\n${validated.text}`)
    }

    const parsed = JSON.parse(result)
    return NextResponse.json(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[parse-receipt]', error)
    return NextResponse.json({ error: 'Failed to parse receipt' }, { status: 500 })
  }
}
```

**Step 2: Wire Smart Entry tab into subscription form**

Add image upload (drag-and-drop) + text paste area. On submit, call `/api/ai/parse-receipt`, then pre-fill the manual form fields with response. User confirms and saves.

**Step 3: Commit**

```bash
git add src/app/api/ai/parse-receipt src/components/subscriptions
git commit -m "feat: add AI-powered receipt parsing for smart data entry"
```

---

## Task 11: Natural Language Query

**Files:**
- Create: `src/app/api/ai/query/route.ts`
- Create: `src/components/ai/ai-chat-input.tsx`
- Create: `src/components/ai/ai-chat-response.tsx`
- Modify: `src/app/(dashboard)/page.tsx` (add chat input)

**Step 1: Build query API route**

Auth check. Fetch user's active subscriptions. Build context string with names, amounts, categories, renewal dates. Send to AI with user's question using `NL_QUERY_PROMPT`. Return response.

**Step 2: Build AIChatInput**

Glass pill input pinned at bottom of dashboard. Submit sends question to `/api/ai/query`. Shows loading state with subtle glow animation.

**Step 3: Build AIChatResponse**

Glass panel that appears above input with AI's response. Framer Motion slide-up animation. Dismiss button.

**Step 4: Wire into dashboard page**

**Step 5: Commit**

```bash
git add src/app/api/ai/query src/components/ai src/app/\(dashboard\)/page.tsx
git commit -m "feat: add natural language query chat on dashboard"
```

---

## Task 12: Notifications System (In-App)

**Files:**
- Create: `src/app/api/notifications/route.ts` (GET, PUT)
- Create: `src/components/layout/notification-bell.tsx`
- Create: `src/components/notifications/notification-list.tsx`
- Create: `src/hooks/use-notifications.ts`

**Step 1: Build notifications API**

GET: fetch unread notifications for user, limit 20. PUT: mark as read by ID.

**Step 2: Build NotificationBell**

Icon in sidebar/top bar. Shows unread count badge. Click opens glass dropdown with NotificationList.

**Step 3: Build NotificationList**

Glass panel list of notifications. Each item: icon by type, title, body preview, timestamp. Click marks as read.

**Step 4: Build useNotifications hook**

Poll every 60 seconds for new notifications. Return unread count + list.

**Step 5: Commit**

```bash
git add src/app/api/notifications src/components/layout src/components/notifications src/hooks
git commit -m "feat: add in-app notification system"
```

---

## Task 13: Insights Page

**Files:**
- Create: `src/app/(dashboard)/insights/page.tsx`
- Create: `src/app/api/insights/route.ts` (GET, PUT)
- Create: `src/components/insights/insight-card.tsx`
- Create: `src/hooks/use-insights.ts`

**Step 1: Build insights API**

GET: fetch insights for user, filterable by type, exclude dismissed. PUT: mark as read or dismissed.

**Step 2: Build InsightCard**

Glass card with type icon/badge, title, body, related subscriptions listed. Action buttons: dismiss, mark read. Glow border for unread.

**Step 3: Build insights page**

Filter tabs: All, Optimizations, Forecasts, Alerts. Feed of InsightCards.

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/insights src/app/api/insights src/components/insights src/hooks
git commit -m "feat: add AI insights page with filtering"
```

---

## Task 14: Settings Page

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/app/api/settings/route.ts`
- Create: `src/components/settings/notification-prefs.tsx`
- Create: `src/components/settings/category-manager.tsx`

**Step 1: Build settings API**

Store user preferences in a `user_settings` table (add migration). Fields: `email_digest`, `email_alerts`, `in_app_alerts`, `currency`, `categories` (text[]).

**Step 2: Build NotificationPrefs component**

Toggle switches (glass-styled) for email digest, email alerts, in-app alerts.

**Step 3: Build CategoryManager**

List of categories with add/remove. Glass input + glass badge list.

**Step 4: Build settings page**

Glass panels for each settings section.

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/settings src/app/api/settings src/components/settings supabase
git commit -m "feat: add settings page with notification and category preferences"
```

---

## Task 15: Email Notifications (Resend)

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/lib/email/templates.ts`

**Step 1: Create Resend client wrapper**

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  })
  if (error) throw error
}
```

**Step 2: Create email templates**

Glass-inspired HTML email templates for: weekly digest, renewal reminder, price change alert. Dark background with translucent cards.

**Step 3: Commit**

```bash
git add src/lib/email
git commit -m "feat: add Resend email client and notification templates"
```

---

## Task 16: Supabase Edge Functions (Cost Advisor + Forecasting)

**Files:**
- Create: `supabase/functions/cost-advisor/index.ts`
- Create: `supabase/functions/spend-forecast/index.ts`
- Create: `supabase/functions/weekly-digest/index.ts`

**Step 1: Build cost-advisor Edge Function**

Fetches all active subscriptions. Sends to AI via direct Claude API call (Edge Functions can't use the Next.js AI abstraction). Parses response. Inserts insights into `ai_insights`. Creates notifications.

**Step 2: Build spend-forecast Edge Function**

Calculates upcoming charges for 7/30/90 day windows. Fetches price history. Sends to AI for anomaly detection. Upserts results into `forecasts` table. Creates alert notifications for anomalies.

**Step 3: Build weekly-digest Edge Function**

Compiles week summary: total spent, upcoming renewals, new insights. Sends email via Resend API. Creates in-app digest notification.

**Step 4: Configure pg_cron schedules**

```sql
-- Run cost advisor weekly on Sundays at 9am UTC
select cron.schedule('cost-advisor', '0 9 * * 0', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/cost-advisor',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
$$);

-- Run spend forecast daily at 6am UTC
select cron.schedule('spend-forecast', '0 6 * * *', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/spend-forecast',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
$$);

-- Run weekly digest Mondays at 8am UTC
select cron.schedule('weekly-digest', '0 8 * * 1', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/weekly-digest',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
$$);
```

**Step 5: Commit**

```bash
git add supabase/functions
git commit -m "feat: add Supabase Edge Functions for cost advisor, forecasting, and digest"
```

---

## Task 17: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Build public landing page**

Liquid Glass themed landing page with:
- Hero: app name, tagline, CTA to sign in
- Feature highlights: 4 glass cards for each AI feature
- Glass navigation bar
- Framer Motion scroll animations

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Liquid Glass landing page"
```

---

## Task 18: Polish & Final Integration

**Files:**
- Various touch-ups across components

**Step 1: Add loading states**

Skeleton glass cards on all pages during data fetch.

**Step 2: Add empty states**

Friendly messages with CTAs when no subscriptions, no insights, etc.

**Step 3: Add error boundaries**

Glass-styled error panels with retry buttons.

**Step 4: Responsive testing**

Verify mobile layout, touch targets, bottom nav.

**Step 5: Run linting and type check**

```bash
npm run lint
npm run typecheck
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: add loading states, empty states, error handling, and responsive polish"
```

---

## Execution Order Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffolding | None |
| 2 | Types & validators | 1 |
| 3 | Supabase setup & schema | 1 |
| 4 | Clerk auth | 1 |
| 5 | Glass design system | 1 |
| 6 | Dashboard page | 2, 3, 4, 5 |
| 7 | Subscriptions CRUD API | 2, 3, 4 |
| 8 | Subscriptions pages | 5, 6, 7 |
| 9 | AI provider layer | 1 |
| 10 | Smart data entry | 8, 9 |
| 11 | Natural language query | 6, 9 |
| 12 | Notifications system | 3, 4, 5 |
| 13 | Insights page | 5, 12 |
| 14 | Settings page | 3, 4, 5 |
| 15 | Email (Resend) | 1 |
| 16 | Edge Functions | 3, 9, 15 |
| 17 | Landing page | 5 |
| 18 | Polish & integration | All above |
