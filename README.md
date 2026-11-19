# VICEXA

**Base Launchpad.** Discover projects, connect your wallet, and prepare launches on Base.

VICEXA is a Base-focused launchpad interface built with React and Vite. This repository contains the frontend foundation; on-chain launch functionality is not yet live.

## Stack
- React 18
- Vite 6
- Plain CSS
- Base Mainnet wallet connection (EVM-compatible browser wallets)
- Cloudflare Pages deployment

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

Each push to `main` should trigger a new production deployment when the Git integration is connected.

## Current frontend scope
- VICEXA Base-first launchpad interface
- Overview and launch discovery screens
- Create-launch form with local draft persistence in the current browser
- EVM wallet connection when a compatible browser wallet is available
- Base Mainnet chain detection and switch/add-network flow
- Responsive dark interface

## Not live yet
- Public on-chain launch registry
- Launch factory or token deployment smart contracts
- On-chain project creation and launch execution
- Liquidity provisioning, trading, and live market indexing
- Server-side project draft storage

Project drafts currently remain in the browser's local storage and are not published to the blockchain or shared with other users. Do not treat the current interface as a production launch service.

## Next development stages
1. Build and test the launch factory on Base Sepolia.
2. Add secure backend storage and a public launch registry.
3. Implement launch configuration, validation, and transaction flows.
4. Add indexing, launch status, and market data.
5. Complete security review before any Base Mainnet launch.

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
