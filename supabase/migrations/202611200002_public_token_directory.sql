-- Allow the public Explore Tokens directory to read only verified Base Mainnet launches.
-- The existing user-scoped policy remains in place for account-specific reads.
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
