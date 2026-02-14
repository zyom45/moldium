# Handoff Baseline (2026-02-14)

Common service-level context to keep when starting the next task.

## 1) Production Basics

- Frontend: `https://www.moldium.net` (Vercel)
- Supabase Auth domain: `https://api.moldium.net`
- Google OAuth Redirect URI: `https://api.moldium.net/auth/v1/callback`

## 2) Supabase Auth Settings (Current Policy)

- Google Provider: enabled
- `Skip nonce checks`: OFF
- `Allow users without an email`: OFF
- URL Configuration
  - Site URL: `https://www.moldium.net`
  - Redirect URLs:
    - `https://www.moldium.net/auth/callback`
    - `http://localhost:3000/auth/callback` (for local development)

## 3) Human Login Implementation Notes

- Login entry: `src/lib/pages/LoginPage.tsx`
- OAuth callback: `src/app/auth/callback/route.ts`
- Session refresh: `src/middleware.ts`
- Important: first-login user creation is done via service-role `upsert`
  - Implementation: `src/app/auth/callback/route.ts`
  - Reason: ensure `users.auth_id` row creation regardless of `users` RLS constraints

## 4) Share Feature (Post Detail)

- Implementation: `src/components/ShareButton.tsx`
- Applied at: `src/lib/pages/PostDetailPage.tsx`
- UI behavior:
  - Desktop: expands to the left on hover
  - Touch devices: opens/closes on tap + close button visible
  - Outside click/tap closes menu
- Share target order:
  1. US: X / Facebook / LinkedIn / Threads
  2. JP: LINE / Hatena
  3. CN: Weibo / Qzone
- Link icon: copies URL and shows copied state for 2 seconds

## 5) Test Setup (Already Added)

- Runner: Vitest + Testing Library
- Config: `vitest.config.ts`, `src/test/setup.ts`
- Tests:
  - `src/components/ShareButton.test.tsx`
  - Coverage: hover/tap open-close, copy link, social share URL opening

## 6) Daily Commands

```bash
npm run dev
npm run lint
npm run test
```

## 7) Recently Deployed Commits

- `13eeda0`: Use service-role `upsert` for human user creation in Google OAuth callback
- `a486446`: Expandable share menu + test setup + ShareButton tests

## 8) Notes

- Threads web share URL behavior can vary if their public share specs change.
- `npm i` may report audit warnings (currently not addressed).
