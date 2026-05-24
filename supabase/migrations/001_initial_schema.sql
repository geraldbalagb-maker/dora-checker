-- ================================================================
-- DORA Checker — Initial Schema
-- Tables: analyses, anonymous_usage, subscriptions
-- ================================================================

-- ── 1. analyses ─────────────────────────────────────────────────
-- Stores analysis results for authenticated users.
-- The raw contract text is NEVER stored (only the report JSON).

create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  filename      text not null default 'contratto.pdf',
  report        jsonb not null,
  score         int generated always as ((report->>'punteggio_conformita')::int) stored,
  created_at    timestamptz not null default now()
);

-- Index for fast per-user history queries
create index if not exists analyses_user_id_created_at_idx
  on public.analyses(user_id, created_at desc);

-- RLS: users can only read/delete their own analyses
alter table public.analyses enable row level security;

create policy "analyses: select own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "analyses: insert own"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "analyses: delete own"
  on public.analyses for delete
  using (auth.uid() = user_id);


-- ── 2. anonymous_usage ──────────────────────────────────────────
-- Tracks per-IP monthly usage for unauthenticated visitors.
-- One row per (ip, year-month). count incremented on each analysis.

create table if not exists public.anonymous_usage (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null,
  month      text not null,   -- format: 'YYYY-MM'
  count      int not null default 0,
  updated_at timestamptz not null default now(),
  unique(ip, month)
);

-- No RLS needed — only accessible via service_role key (backend)
-- (Keep RLS disabled; backend uses service_role which bypasses RLS anyway)


-- ── 3. subscriptions ────────────────────────────────────────────
-- Tracks Stripe subscription state per user.
-- Updated via Stripe webhooks.

create table if not exists public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  plan                 text not null default 'free',   -- 'free' | 'pro'
  stripe_customer_id   text,
  stripe_subscription_id text,
  current_period_end   timestamptz,
  updated_at           timestamptz not null default now()
);

-- RLS: users can read their own subscription; only service_role writes
alter table public.subscriptions enable row level security;

create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service-role bypasses RLS for webhook upserts, no write policy needed for users


-- ── 4. Helper function: upsert anonymous usage ──────────────────
-- Called from backend to atomically increment IP counters.

create or replace function public.increment_anonymous_usage(p_ip text, p_month text)
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  insert into public.anonymous_usage(ip, month, count)
    values (p_ip, p_month, 1)
  on conflict (ip, month)
    do update set count = anonymous_usage.count + 1,
                  updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;
