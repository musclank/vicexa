# VICEXA

**Base Token Factory.** Configure token deployments for Base through a guided, wallet-based workflow.

VICEXA is a Base-focused Token Factory interface built with React and Vite. The frontend includes token configuration and local draft saving. Initial Solidity source is available under `contracts/`, but it has not yet been compiled, tested, deployed, or audited. On-chain token deployment is not enabled.

## Stack
- React 18
- Vite 6
- Plain CSS
- Base Mainnet wallet connection (EVM-compatible browser wallets)
- Solidity 0.8.24+ and OpenZeppelin Contracts 5.x for the initial factory source
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
- EVM wallet connection and Base Mainnet chain detection
- Google and email authentication through Supabase
- Responsive dark interface

## Contract source
- `contracts/VicexaToken.sol`: fixed-supply ERC-20 token; initial supply is minted to the creator, with no owner role or additional mint function.
- `contracts/VicexaTokenFactory.sol`: permissionless token factory with a `TokenCreated` event.
- `contracts/README.md`: parameters and Remix compile guidance.

The contract source is an initial implementation only. It has not been compiled or independently reviewed. Do not deploy it to Base Mainnet.

## Not live yet
- Compiled and tested factory contracts
- On-chain token deployment and transaction flow
- Public on-chain token registry and indexing
- Server-side token draft storage
- Independent smart contract security review

Token configurations currently remain in browser local storage. Saving a draft does not deploy a token, mint supply, or send a blockchain transaction.

## Next development stages
1. Compile the factory and token contracts using Solidity 0.8.24+ and OpenZeppelin Contracts 5.x.
2. Add automated tests for input validation, supply scaling, creator allocation, and factory events.
3. Deploy and test on Base Sepolia.
4. Add transaction simulation, wallet confirmation, and error handling.
5. Complete independent security review before enabling Base Mainnet deployments.

## Environment variables
Only public client keys may use the `VITE_` prefix. Never expose Supabase service-role keys, private keys, seed phrases, or wallet secrets in frontend code.

## Supabase authentication
Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages. Configure the deployed VICEXA URL in Supabase **Authentication → URL Configuration** and protect user data with Row Level Security policies.
