# VICEXA

**The Next Digital Frontier.** AI meets Crypto. One ecosystem. Endless possibilities.

VICEXA is an independent AI + Crypto ecosystem project. This repository contains the initial responsive website foundation.

## Stack
- React 18
- Vite 6
- Plain CSS (responsive, no UI framework)
- Cloudflare Pages deployment target

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
Create a Pages project connected to this GitHub repository with:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Every push to the production branch will trigger a deployment.

## Environment variables
Copy `.env.example` to `.env.local` when backend integrations are introduced. Only public client keys may use the `VITE_` prefix. Never expose Supabase service-role keys, private keys, seed phrases, or wallet secrets in frontend code.

## Current scope
- Responsive VICEXA landing page
- Original neon retro-futuristic visual identity
- Ecosystem, vision, and roadmap sections
- SEO description, Open Graph basics, and favicon
- Mobile navigation
- Deployment-ready Vite configuration

## Planned next stages
1. Supabase authentication and database
2. User dashboard and AI tools framework
3. Wallet connection on Base
4. Credits and crypto payment flows
5. Launchpad, staking, and rewards — only after product and security requirements are defined

Features shown as planned or in development are not live services yet.

## Supabase authentication setup

The sign-in and account creation screens use Supabase Auth. To activate them:

1. Create a Supabase project at https://supabase.com/.
2. Open **Project Settings → API** and copy the Project URL and anon/public key.
3. In Cloudflare Pages, open the **vicexa** project → **Settings → Variables and Secrets**.
4. Add these production variables:
   - `VITE_SUPABASE_URL` — your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
5. Save and trigger a new deployment.
6. In Supabase, open **Authentication → URL Configuration** and set the Site URL to your deployed VICEXA domain (for example, `https://vicexa.pages.dev`). Add any custom domain to the redirect URL allow list too.

The anon/public key is intended for browser use; protect user data with Supabase Row Level Security policies. Never put a service-role key in Cloudflare's client-side `VITE_` variables.

Until the two variables are configured, the account screen displays setup guidance and does not attempt authentication.
