# VICEXA Hybrid Launchpad — Clanker Integration

## Status
Architecture scaffold only. No mainnet deployment is enabled. Clanker V5 partner API route and request schema must be confirmed with Clanker before enabling live deployment.

## Architecture
- React + Vite frontend on Cloudflare Pages.
- Cloudflare Pages Functions as the server-side API boundary.
- Supabase Auth for user identity and Supabase Postgres for launch records.
- User wallet signs an explicit message/transaction when the selected Clanker flow requires user authorization.
- Clanker is the token deployment protocol on Base Mainnet (chain ID 8453).
- The Clanker Partner API key is stored only as a Cloudflare secret; never expose it through VITE_ variables or client bundles.

## Hybrid launch flow
1. Authenticated user completes token metadata and launch configuration.
2. Frontend requests a server-created launch intent.
3. Backend verifies the Supabase access token, validates fields, applies rate limits and persists a pending record.
4. Frontend presents a human-readable summary including chain, creator/reward recipients, tax configuration, quote asset, and any fees.
5. User explicitly approves the wallet action if the selected Clanker integration requires wallet signing.
6. Backend calls only the Clanker V5 partner endpoint/schema confirmed for VICEXA. Do not assume the legacy `POST /api/tokens/deploy` V4 schema is V5-compatible.
7. Backend records the provider response and expected token address. A launch is marked confirmed only after checking the on-chain transaction/contract and/or authoritative Clanker indexing response.
8. Dashboard displays pending, submitted, confirmed, or failed state.

## Required server secrets
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (server-side validation only; never service role in browser)
- `CLANKER_PARTNER_API_KEY`
- `CLANKER_V5_DEPLOY_URL` (set only after Clanker confirms the current partner endpoint)
- `BASE_RPC_URL` (optional, for independent receipt/contract verification)

Never commit secret values. Do not use `VITE_` prefixes for secrets.

## Security requirements
- Verify the Supabase user on every mutating request.
- Derive creator wallet from authenticated wallet proof; never trust a client-supplied creator address alone.
- Validate token name, symbol, image URL, metadata, tax/reward recipients and allocations on the server.
- Require explicit user confirmation before any wallet transaction.
- Use idempotency keys and a unique request ID to prevent duplicate launches.
- Rate-limit launch intents per user.
- Keep an immutable audit trail; do not store seed phrases or private keys.
- Do not claim a token is live based only on an expected address or queued response.
- Keep mainnet deployment disabled until partner credentials, V5 request schema, fees, and wallet-signing responsibilities are verified.

## Current integration gate
Clanker's public docs identify V5 as current and describe V5 contracts and tax/reward behavior. The authenticated API deployment page currently documents a V4-shaped deploy request. VICEXA must obtain written confirmation of the V5 partner API endpoint and payload from Clanker before wiring the live call.
