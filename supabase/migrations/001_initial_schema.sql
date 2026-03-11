-- supabase/migrations/001_initial_schema.sql
-- Schema: subtracker (within CustomerTesting project)

create schema if not exists subtracker;

-- Subscriptions
create table subtracker.subscriptions (
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

create index idx_subscriptions_user_id on subtracker.subscriptions(user_id);
create index idx_subscriptions_next_renewal on subtracker.subscriptions(next_renewal);
create index idx_subscriptions_status on subtracker.subscriptions(status);

-- Price history
create table subtracker.price_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subtracker.subscriptions(id) on delete cascade,
  amount numeric(10,2) not null,
  recorded_at timestamptz not null default now()
);

create index idx_price_history_sub on subtracker.price_history(subscription_id);

-- AI insights
create table subtracker.ai_insights (
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

create index idx_ai_insights_user on subtracker.ai_insights(user_id);

-- Notifications
create table subtracker.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('renewal_reminder','price_change','digest','insight')),
  title text not null,
  body text not null,
  channel text not null check (channel in ('in_app','email')),
  is_read boolean not null default false,
  sent_at timestamptz not null default now()
);

create index idx_notifications_user on subtracker.notifications(user_id);

-- Forecasts cache
create table subtracker.forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  period text not null check (period in ('7d','30d','90d')),
  total_amount numeric(10,2) not null,
  breakdown jsonb not null default '[]',
  generated_at timestamptz not null default now()
);

create index idx_forecasts_user on subtracker.forecasts(user_id);

-- User settings
create table subtracker.user_settings (
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

create index idx_user_settings_user on subtracker.user_settings(user_id);

-- RLS
alter table subtracker.subscriptions enable row level security;
alter table subtracker.price_history enable row level security;
alter table subtracker.ai_insights enable row level security;
alter table subtracker.notifications enable row level security;
alter table subtracker.forecasts enable row level security;
alter table subtracker.user_settings enable row level security;

-- Grant access to roles
grant usage on schema subtracker to anon, authenticated, service_role;
grant all on all tables in schema subtracker to anon, authenticated, service_role;
grant all on all sequences in schema subtracker to anon, authenticated, service_role;

-- Updated_at trigger (in subtracker schema)
create or replace function subtracker.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on subtracker.subscriptions
  for each row execute function subtracker.update_updated_at();

create trigger user_settings_updated_at
  before update on subtracker.user_settings
  for each row execute function subtracker.update_updated_at();
