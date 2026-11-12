# Denzo

Minimal Next.js app with Clerk, Neon, and Drizzle.

## Setup

```bash
pnpm i
```

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`. If you don't have a Clerk app yet, `pnpm dlx clerk@latest init --accountless` writes temporary dev keys.

```bash
pnpm dev
```

The database client validates all three variables when it loads.

## Deploying to Vercel

Import this repository on Vercel and add the same three environment variables. The free tier is enough.
