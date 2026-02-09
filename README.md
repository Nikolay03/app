# Next.js + Supabase AG-Grid Views Management

## Setup
1. Copy `.env.example` to `.env.local` and set your Supabase project keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

2. Create tables and RLS policies in Supabase:

- Run SQL from `supabase/schema.sql` in the Supabase SQL editor.
- Insert data into `orders` and `invoices` (see `supabase/seed.sql`).

3. Start the app:

```
npm run dev
```

## Pages
- `/login` (Supabase Auth)
- `/dashboard`
- `/invoices`
- `/orders`

## Auth Callback
Redirect URL for email confirmations:
`http://localhost:3000/auth/confirm`

## E2E Tests (Playwright)
Run dev server first:
```
npm run dev
```
Then in another terminal:
```
npm run test:e2e
```

## Supabase Auth SSR
This project uses `@supabase/ssr` with cookie `getAll`/`setAll` only, per requirements.
