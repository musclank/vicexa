# VICEXA

**Base Token Factory.** Configure fixed-supply ERC-20 tokens through a guided wallet-based workflow.

VICEXA is a React and Vite application for creating fixed-supply tokens on Base. The current development flow is restricted to **Base Sepolia testnet**. Token drafts can be saved locally, and the Create Token transaction flow becomes available only after the VICEXA factory contract is deployed to Base Sepolia and its public address is configured in Cloudflare Pages.

## Stack
- React 18 and Vite 6
- Ethers v6 for EVM wallet transactions
- Solidity 0.8.24 and OpenZeppelin Contracts 5.x
- Hardhat contract tests and deployment tooling
- Cloudflare Pages
- Supabase authentication

## Local development
```bash
npm install
npm run dev
```

## Build and tests
```bash
npm run build
npm run test:contracts
```

Vite outputs the production site to `dist/`.

## Cloudflare Pages
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Each push to `main` triggers a production deployment when the Git integration is connected.

## Current frontend scope
- Overview, Explore Tokens, and Create a Token screens
- Token configuration: name, symbol, whole-token supply, decimals, description, and website
- Local token draft persistence in the current browser
- EVM wallet connection that switches to Base Sepolia (chain ID 84532)
- Ethers-based factory transaction flow, gated by the configured Base Sepolia factory address
- Transaction receipt parsing and Base Sepolia explorer links
- Google and email authentication through Supabase
- Responsive dark interface

## Contracts
- `contracts/VicexaToken.sol`: fixed-supply ERC-20 token; the creator receives the full initial supply. No owner role or additional mint function.
- `contracts/VicexaTokenFactory.sol`: permissionless factory that emits `TokenCreated`.
- `deploy-factory.cjs`: guarded Hardhat deployment script that refuses to deploy to any chain other than Base Sepolia.
- `contracts/README.md`: compile, deploy, and testnet setup notes.

Run `npm run test:contracts` to execute the Hardhat test suite. Run `npm run deploy:sepolia` only after setting a local `DEPLOYER_PRIVATE_KEY` and funding that wallet with Base Sepolia test ETH. Never commit the private key or place it in a `VITE_` variable.

## Environment variables
Copy `.env.example` to a local `.env` file for local configuration. Keep secrets out of source control.

- `VITE_SUPABASE_URL`: public Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: public Supabase anon/publishable key.
- `VITE_BASE_SEPOLIA_FACTORY_ADDRESS`: public factory contract address after deployment to Base Sepolia.
- `BASE_SEPOLIA_RPC_URL`: optional deployment RPC URL.
- `DEPLOYER_PRIVATE_KEY`: local-only deployment credential; never expose it to frontend code or commit it.

In Cloudflare Pages, set only the public `VITE_` values. After adding or changing the factory address, trigger a new deployment so Vite embeds the value in the build.

## Safety and release status
- Base Mainnet token deployment is not enabled.
- The current contract source is an initial implementation and has not been independently audited.
- The factory must pass the GitHub Actions build and Solidity tests, be deployed and exercised on Base Sepolia, and receive independent security review before any Mainnet release.
- A successful wallet connection does not mean a token has been deployed. A token exists on-chain only after its transaction is confirmed and the factory event is read.
- Testnet ETH has no real-world value.

Never expose seed phrases, private keys, Supabase service-role keys, or wallet secrets in frontend variables, source files, screenshots, or chat.
