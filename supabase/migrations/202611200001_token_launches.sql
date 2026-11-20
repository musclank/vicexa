-- VICEXA launch records. Apply through Supabase SQL editor after reviewing the project migration history.
create extension if not exists pgcrypto;

create table if not exists public.token_launches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null unique default gen_random_uuid(),
  chain_id bigint not null default 8453 check (chain_id = 8453),
  provider text not null default 'clanker',
  provider_version text not null default 'v5',
  status text not null default 'draft'
    check (status in ('draft','awaiting_wallet','submitted','pending_indexing','confirmed','failed','cancelled')),
  token_name text not null check (char_length(token_name) between 1 and 64),
  token_symbol text not null check (char_length(token_symbol) between 1 and 16),
  token_image_url text,
  description text,
  creator_wallet text,
  expected_token_address text,
  transaction_hash text,
  provider_request_id text,
  provider_response jsonb not null default '{}'::jsonb,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists token_launches_user_created_idx
  on public.token_launches (user_id, created_at desc);

create index if not exists token_launches_status_idx
  on public.token_launches (status, created_at desc);

alter table public.token_launches enable row level security;

drop policy if exists "Users can read their own launches" on public.token_launches;
create policy "Users can read their own launches"
  on public.token_launches for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own launch drafts" on public.token_launches;
create policy "Users can create their own launch drafts"
  on public.token_launches for insert
  with check (auth.uid() = user_id and status = 'draft');

-- No client-side UPDATE/DELETE policy: state transitions and provider responses
-- must be written by a trusted server-side function using a restricted service role.
