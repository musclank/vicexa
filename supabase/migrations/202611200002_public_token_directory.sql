-- Allow the public Explore Tokens directory to read only verified Base Mainnet launches.
-- Table privileges and RLS policies are both required for PostgREST access.
grant usage on schema public to anon, authenticated;
grant select on table public.token_launches to anon, authenticated;

-- The policy limits public reads to confirmed Base Mainnet deployments.
drop policy if exists "Public can read confirmed Base token launches" on public.token_launches;
create policy "Public can read confirmed Base token launches"
  on public.token_launches
  for select
  to anon, authenticated
  using (
    chain_id = 8453
    and status = 'confirmed'
    and expected_token_address is not null
  );
