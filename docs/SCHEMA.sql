-- ============================================================
-- Personal AI Assistant — Supabase Database Schema
-- ============================================================
-- Run this in the Supabase SQL editor (Settings → SQL Editor).
-- Auth users are managed by supabase.auth.users; the tables
-- below extend that with application-specific data.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements";

-- ── Users ───────────────────────────────────────────────────
-- Mirrors auth.users and adds billing + subscription columns.
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null unique,
  name                text,
  created_at          timestamptz not null default now(),
  stripe_customer_id  text unique,
  subscription_tier   text check (subscription_tier in ('starter', 'pro', 'max')),
  subscription_status text not null default 'inactive'
                          check (subscription_status in ('inactive', 'trialing', 'active', 'paused', 'past_due', 'cancelled'))
);

-- Auto-populate from auth.users on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Agents ──────────────────────────────────────────────────
-- One agent per user. Tracks provisioning state and channel IDs.
create table if not exists public.agents (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  name              text not null default 'My Assistant',
  type              text not null default 'personal'
                       check (type in ('personal', 'business')),
  status            text not null default 'provisioning'
                       check (status in ('provisioning', 'running', 'stopped', 'error', 'deprovisioned')),
  telegram_chat_id  text,
  config            jsonb not null default '{}'::jsonb,
  container_id      text,
  container_name    text,
  provisioned_at    timestamptz,
  created_at        timestamptz not null default now(),
  constraint agents_user_id_unique unique (user_id)
);

create index if not exists agents_user_id_idx on public.agents(user_id);
create index if not exists agents_telegram_chat_id_idx on public.agents(telegram_chat_id)
  where telegram_chat_id is not null;

-- ── Agent Memory ─────────────────────────────────────────────
-- Key/value store for each agent's persistent memory.
create table if not exists public.agent_memory (
  id         uuid primary key default uuid_generate_v4(),
  agent_id   uuid not null references public.agents(id) on delete cascade,
  key        text not null,
  value      text not null,
  created_at timestamptz not null default now(),
  constraint agent_memory_agent_key_unique unique (agent_id, key)
);

create index if not exists agent_memory_agent_id_idx on public.agent_memory(agent_id);

-- ── Usage Logs ───────────────────────────────────────────────
-- Tracks per-task token usage for billing and analytics.
create table if not exists public.usage_logs (
  id          uuid primary key default uuid_generate_v4(),
  agent_id    uuid not null references public.agents(id) on delete cascade,
  task_type   text not null default 'chat'
                 check (task_type in ('chat', 'search', 'memory_read', 'memory_write', 'tool_call')),
  tokens_used integer not null default 0 check (tokens_used >= 0),
  cost_usd    numeric(10, 6) not null default 0 check (cost_usd >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists usage_logs_agent_id_idx on public.usage_logs(agent_id);
create index if not exists usage_logs_created_at_idx on public.usage_logs(created_at desc);

-- ── Telegram Mappings ────────────────────────────────────────
-- Maps Telegram chat_id → user_id for webhook routing.
-- (Denormalised for fast lookup; also stored on agents.telegram_chat_id)
create table if not exists public.telegram_mappings (
  chat_id    text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists telegram_mappings_user_id_idx on public.telegram_mappings(user_id);

-- ── WhatsApp Mappings ────────────────────────────────────────
create table if not exists public.whatsapp_mappings (
  phone      text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_mappings_user_id_idx on public.whatsapp_mappings(user_id);

-- ── Row Level Security ───────────────────────────────────────
alter table public.users           enable row level security;
alter table public.agents          enable row level security;
alter table public.agent_memory    enable row level security;
alter table public.usage_logs      enable row level security;
alter table public.telegram_mappings enable row level security;
alter table public.whatsapp_mappings enable row level security;

-- Users: each user sees only their own row
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Agents: each user sees only their own agent
create policy "agents_select_own" on public.agents
  for select using (auth.uid() = user_id);

create policy "agents_update_own" on public.agents
  for update using (auth.uid() = user_id);

-- Agent memory: users access their own agent's memory
create policy "agent_memory_select_own" on public.agent_memory
  for select using (
    exists (
      select 1 from public.agents a
      where a.id = agent_memory.agent_id
        and a.user_id = auth.uid()
    )
  );

-- Usage logs: users read their own agent's logs
create policy "usage_logs_select_own" on public.usage_logs
  for select using (
    exists (
      select 1 from public.agents a
      where a.id = usage_logs.agent_id
        and a.user_id = auth.uid()
    )
  );

-- Mappings: users read their own
create policy "telegram_mappings_select_own" on public.telegram_mappings
  for select using (auth.uid() = user_id);

create policy "whatsapp_mappings_select_own" on public.whatsapp_mappings
  for select using (auth.uid() = user_id);

-- ── Convenience Views ────────────────────────────────────────
create or replace view public.user_dashboard as
  select
    u.id,
    u.email,
    u.name,
    u.subscription_tier,
    u.subscription_status,
    a.id          as agent_id,
    a.status      as agent_status,
    a.telegram_chat_id,
    (
      select count(*)::int
      from public.usage_logs ul
      where ul.agent_id = a.id
        and ul.created_at >= date_trunc('month', now())
    ) as tasks_this_month,
    (
      select coalesce(sum(ul.tokens_used), 0)::bigint
      from public.usage_logs ul
      where ul.agent_id = a.id
        and ul.created_at >= date_trunc('month', now())
    ) as tokens_this_month,
    (
      select count(*)::int
      from public.agent_memory am
      where am.agent_id = a.id
    ) as memory_entries
  from public.users u
  left join public.agents a on a.user_id = u.id;
