alter table subtracker.user_settings
  add column if not exists default_ai_provider text not null default 'anthropic',
  add column if not exists default_ai_model text not null default 'claude-3-7-sonnet-latest';

create table if not exists subtracker.ai_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null,
  encrypted_api_key text not null,
  key_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists idx_ai_provider_credentials_user
  on subtracker.ai_provider_credentials(user_id);

create index if not exists idx_ai_provider_credentials_provider
  on subtracker.ai_provider_credentials(provider);

alter table subtracker.ai_provider_credentials enable row level security;

grant all on table subtracker.ai_provider_credentials to anon, authenticated, service_role;

drop trigger if exists ai_provider_credentials_updated_at on subtracker.ai_provider_credentials;

create trigger ai_provider_credentials_updated_at
  before update on subtracker.ai_provider_credentials
  for each row execute function subtracker.update_updated_at();
