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

-- User settings
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  email_digest boolean not null default true,
  email_alerts boolean not null default true,
  in_app_alerts boolean not null default true,
  currency text not null default 'USD',
  categories text[] not null default '{"streaming","dev-tools","productivity","entertainment","cloud","finance","health","education","other"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_settings_user on user_settings(user_id);

-- RLS policies (user_id based - personal app using Clerk user IDs)
alter table subscriptions enable row level security;
alter table price_history enable row level security;
alter table ai_insights enable row level security;
alter table notifications enable row level security;
alter table forecasts enable row level security;
alter table user_settings enable row level security;

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

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
