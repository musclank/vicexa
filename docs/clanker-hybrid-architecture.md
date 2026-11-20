# VICEXA Hybrid Launchpad — Clanker V5

## Architecture
- React + Vite frontend hosted on Cloudflare Pages.
- Supabase Auth identifies each creator; Supabase Postgres stores launch records.
- Cloudflare Pages Function verifies the Supabase access token and performs trusted launch-record state transitions using a server-only Supabase service-role secret.
- The browser uses the connected wallet through viem's EIP-1193 custom transport. The wallet signs the Clanker V5 launch transaction; VICEXA never receives or stores private keys.
- Clanker V5 SDK (clanker-sdk/v5) deploys on Base Mainnet (chain ID 8453).

## Why SDK V5, not the legacy partner REST deploy endpoint
Clanker's public deployment REST endpoint currently documents a V4-shaped request. New V5 launches use the V5 SDK import. Do not send V5 payloads to the V4-shaped REST endpoint. The Partner API key is not required for the browser-wallet SDK launch flow. It may be used later for approved partner-only indexing/data endpoints after Clanker confirms access and terms.

## Launch lifecycle
1. User signs into VICEXA and connects a Base Mainnet wallet.
2. User enters token name, symbol, image and metadata, then reviews the V5 tax settings.
3. VICEXA creates an authenticated launch-intent record through /api/launch-intents.
4. Frontend creates a viem wallet client backed by the injected EIP-1193 wallet and a public client on Base.
5. Clanker V5 SDK simulates/prepares the launch and requests the user's wallet signature.
6. SDK returns a transaction hash and waits for the launch receipt. A sent/uncertain transaction is never retried automatically.
7. VICEXA sends the result to the authenticated Pages Function, which updates the launch record. Only a confirmed receipt is marked confirmed.
8. User sees the token address and BaseScan / Clanker links.

## Base V5 facts
- Base chain ID: 8453.
- V5 token supply and pool behavior are controlled by the Clanker V5 factory; VICEXA does not expose arbitrary ERC-20 supply/decimals.
- Buy/sell taxes are governed by the live factory tax policy. Do not promise fixed effective creator revenue; the protocol share and anti-snipe rules apply.
- V5 tokens use the cccc address suffix and the V5 factory/pool system.
- Base Sepolia is not a supported V5 launch network. Do not offer a Sepolia V5 test deployment.

## Required Cloudflare Pages secrets
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only; never expose as VITE_ variable)
- Optional BASE_RPC_URL if a dedicated public RPC is configured.

No Clanker private key or partner API key is required for direct wallet-signed V5 launches. Never place wallet private keys in environment variables or server storage.

## Security and operational controls
- Require Supabase authentication for launch intents and status updates.
- Verify the bearer token with Supabase Auth on every mutating request.
- Use the service role only in Pages Functions; never in client bundles.
- Derive the creator wallet from the connected wallet and require the wallet to approve the actual launch transaction.
- Validate names, symbols, URLs and status transitions server-side.
- Store request IDs, wallet address, tx hash and resulting token address; never store seed phrases or private keys.
- Treat SEND_UNCERTAIN or unknown receipt state as unresolved. Tell the user to check the wallet/transaction before attempting another launch.
- Keep all launch operations user-initiated. Do not launch from background jobs.
- Verify live tax policy and quote configuration before displaying exact fee or reward estimates.