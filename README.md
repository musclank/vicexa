# VICEXA

**VICEXA is a wallet-signed token launchpad for Base Mainnet using Clanker V5.**

Users configure a token, review the launch settings, and approve the deployment from their own EVM wallet. VICEXA does not receive or store wallet private keys. This project does not provide presales, fundraising, or a token-sale module.

## Stack

- React 18 and Vite 6
- Cloudflare Pages and Pages Functions
- Supabase Auth and Postgres for accounts and launch records
- viem and the Clanker V5 SDK for wallet-signed Base launches
- Base Mainnet (chain ID 8453)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Vite outputs the production site to `dist/`.

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

The `functions/api/launch-intents.js` Pages Function handles authenticated launch records. Deployments must include the `functions/` directory so Cloudflare Pages can publish the API routes.

## Authentication and server configuration

The browser uses these public build variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BASE_RPC_URL` (optional public RPC override; the app defaults to the public Base RPC)

Configure these server-side Cloudflare Pages variables/secrets for Pages Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret; server-side only)
- `BASE_RPC_URL` (required for server-side transaction and deployed-code verification)

The Supabase service-role key must never use a `VITE_` prefix and must never be included in browser code, Git, screenshots, or chat.

## Database setup

Before using tracked launches, review and apply:

`supabase/migrations/202611200001_token_launches.sql`

The migration creates the `token_launches` table and row-level security policies. Pages Functions use the server-only service-role key for controlled state transitions. Confirm the migration against the existing Supabase schema before applying it.

## Token launch flow

1. A user signs in with email and password.
2. The user connects an EVM wallet and switches to Base Mainnet.
3. The user configures token name, symbol, optional image and metadata, and reviews the Clanker V5 tax settings.
4. VICEXA creates an authenticated launch-intent record.
5. The Clanker V5 SDK prepares the deployment and requests approval from the connected wallet.
6. The wallet submits the transaction. A transaction with an uncertain submission state must be checked on the wallet and BaseScan before retrying.
7. The Pages Function checks the transaction receipt and deployed token code before recording a confirmed launch.
8. The interface displays the transaction and token links.

Clanker V5 controls token supply and pool behavior. VICEXA does not offer arbitrary ERC-20 supply or decimals in this launch flow. Fee and reward behavior is governed by Clanker's current factory policy; do not treat preview settings as a guaranteed return.

## Validation

The repository CI runs:

```bash
npm run build
npm run test:contracts
```

The Solidity factory tests are retained for the separate fixed-supply factory prototype; they are not the deployment path used by the Clanker V5 launch screen.

## Mainnet safety

- Base Mainnet launches are real on-chain transactions and require ETH for gas.
- Review token metadata, fee settings, and every wallet prompt before signing.
- Never share seed phrases or private keys.
- A launch is not confirmed merely because a wallet prompt was approved. Verify the transaction on BaseScan and ensure the token contract is deployed.
- The integration and its server-side confirmation logic still require thorough review and independent security assessment before broad public use.
