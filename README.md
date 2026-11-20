# VICEXA

**Base Token Factory.** Configure token deployments for Base through a guided, wallet-based workflow.

VICEXA is a Base-focused Token Factory interface built with React and Vite. The current implementation provides token configuration and local draft saving. On-chain token deployment is not yet enabled.

## Stack
- React 18
- Vite 6
- Plain CSS
- Base Mainnet wallet connection (EVM-compatible browser wallets)
- Cloudflare Pages deployment
- Supabase authentication

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

Vite outputs the production site to `dist/`.

## Cloudflare Pages
Connect this repository to a Cloudflare Pages project with:
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Each push to `main` triggers a production deployment when the Git integration is connected.

## Current frontend scope
- VICEXA Base-first Token Factory interface
- Overview and token discovery screens
- Token configuration form: name, symbol, initial supply, decimals, description, and website
- Local token draft persistence in the current browser
- EVM wallet connection when a compatible browser wallet is available
- Base Mainnet chain detection and switch/add-network flow
- Google and email authentication through Supabase
- Responsive dark interface

## Not live yet
- ERC-20 token factory smart contract
- On-chain token deployment and transaction flow
- Public on-chain token registry and indexing
- Server-side token draft storage
- Independent smart contract security review

Token configurations currently remain in the browser's local storage. Saving a draft does not deploy a token, mint supply, or send a blockchain transaction. Do not treat the current interface as a production token deployment service.

## Next development stages
1. Implement a minimal ERC-20 factory contract with deployment events.
2. Compile and test factory deployment and token creation on Base Sepolia.
3. Add transaction simulation, wallet confirmation, and error handling.
4. Add a public on-chain token registry and indexing.
5. Complete independent security review before enabling Base Mainnet deployments.

## Environment variables
Copy `.env.example` to `.env.local` when backend integrations are introduced. Only public client keys may use the `VITE_` prefix. Never expose Supabase service-role keys, private keys, seed phrases, or wallet secrets in frontend code.

## Supabase authentication setup
If Supabase authentication is enabled in this project:

1. Create a Supabase project.
2. Open **Project Settings → API** and copy the Project URL and anon/public key.
3. In Cloudflare Pages, open **Settings → Variables and Secrets**.
4. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Save and trigger a new deployment.
6. Configure the deployed VICEXA domain in Supabase **Authentication → URL Configuration**.

Protect user data with Supabase Row Level Security policies. Never expose a service-role key in client-side `VITE_` variables.
