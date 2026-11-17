# Denzo

Minimal Next.js app with Clerk, Neon, and Drizzle.

## Setup

```bash
pnpm i
```

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`. If you don't have a Clerk app yet, `pnpm dlx clerk@latest init --accountless` writes temporary dev keys.

In the Clerk dashboard, add a webhook endpoint for `user.created`, `user.updated`, and `user.deleted` pointing at `/api/webhooks/clerk`, then set `CLERK_WEBHOOK_SIGNING_SECRET` to that endpoint's signing secret. The app also copies the signed-in user into Postgres on each visit, so the row exists before the first webhook arrives.

```bash
pnpm dev
```

The database client validates all three variables when it loads.

## Deploying to Vercel

Import this repository on Vercel and add the same environment variables, including `CLERK_WEBHOOK_SIGNING_SECRET`. The free tier is enough. The webhook URL is `https://<your-domain>/api/webhooks/clerk`.

## Code structure

List and task code lives in `src/features/lists` and `src/features/tasks`. Each feature has its components, validation in `models.ts`, Server Actions in `actions.ts`, and database operations in `data.ts`. User records live in `src/features/users`.

Actions authenticate the request, validate input, and call `refresh()` after a successful write. Data operations take the authenticated user ID and enforce ownership and business rules with Drizzle. Task creation and moves check ownership of the destination list. List deletion rejects the default list. Call these operations from new server entry points so each caller gets the same checks.

The `queries.ts` modules contain authenticated reads. A visit copies the Clerk user into `users` and the first visit also creates the default list with conflict-safe inserts. Webhooks keep that copy updated and delete it when Clerk deletes the user. The existing unique index permits one default list per user. Database modules use `server-only` to prevent imports into client code.

Client components import schemas and constants from their feature's `models.ts`. Both status controls use the same `isTaskStatus` function. The shared action result type and UUID schema live in `src/lib`. `src/components` contains the app header and shared UI components.

`NewListForm` owns list creation, focus, cancellation, and navigation. `QuickAdd` owns task input and clears it after success. Rename, task editing, deletion, and optimistic status changes keep their own mutation code because they have different state rules. There is no shared mutation hook or result factory.

## Verification and follow-up work

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Tests use the existing SQL migration in a local PGlite PostgreSQL engine; they do not use the configured Neon database or require Clerk keys. Client tests use React in jsdom with mocked Server Actions.

Tests cover cross-user IDs, default-list protection, task moves, cascading deletion, input validation, successful refresh, returned server failures, unexpected database exceptions, concurrent first reads, form retries, rejected requests, optimistic rollback, and rapid successive status changes. The concurrency test checks the initialization code and unique index in PGlite; it does not test Neon request timing. The client tests do not test the Next.js network transport.

This change preserves request-failure behavior. An unexpected exception reaches the React error boundary. The list creation and rename guards do not reset after a thrown request error. Overlapping status changes keep the existing optimistic behavior and have no per-task ordering guard. A separate reliability change should add exception handling, guard cleanup, retry behavior, and protection against overlapping mutations, with tests for each change.
