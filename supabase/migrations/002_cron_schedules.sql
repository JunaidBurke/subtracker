-- supabase/migrations/002_cron_schedules.sql
-- pg_cron schedules for Edge Functions
-- Requires pg_cron and pg_net extensions to be enabled in Supabase dashboard.

-- Enable required extensions (pg_cron is pre-installed on Supabase, just needs enabling)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Weekly cost advisor: Sundays 9am UTC
-- Analyzes subscriptions for overlaps, duplicates, and savings opportunities.
select cron.schedule('cost-advisor', '0 9 * * 0', $$
  select net.http_post(
    url := current_setting('supabase.functions_url') || '/cost-advisor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
$$);

-- Daily spend forecast: 6am UTC
-- Calculates upcoming charges and detects price anomalies.
select cron.schedule('spend-forecast', '0 6 * * *', $$
  select net.http_post(
    url := current_setting('supabase.functions_url') || '/spend-forecast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
$$);

-- Weekly digest: Mondays 8am UTC
-- Sends email summary with spend, renewals, and insights.
select cron.schedule('weekly-digest', '0 8 * * 1', $$
  select net.http_post(
    url := current_setting('supabase.functions_url') || '/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
$$);
