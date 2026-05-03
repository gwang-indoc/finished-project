# Remove Account

**Date:** 2026-04-29
**Status:** Approved (pending implementation)

## Context

The app has email/password auth via better-auth and a SQLite store with `user`, `session`, `account`, `verification`, and `notes` tables. There is no way for a user to remove their own account — it can only be done by hand-editing the database. This change adds a self-service "Remove account" flow so a signed-in user can delete their account and all associated data.

There is no existing settings page, no profile menu, and no FK cascade behavior on `notes.user_id`, `session.userId`, or `account.userId` (only the unparameterized FK constraint with `PRAGMA foreign_keys = ON`). The flow needs to handle the cascade explicitly.

## Decisions

### Decision 1: Hard delete with cascade — no soft delete, no orphaned public notes

When a user removes their account, the system permanently deletes their `user` row, all of their `notes` (private _and_ public), all of their `session` rows, and all of their `account` rows in a single transaction. Public URLs (`/p/<slug>`) immediately return 404. There is no recovery window.

**Alternatives considered:**

- **Hard delete account, orphan public notes** (set `notes.user_id = NULL` or to a sentinel) — preserves shared content but leaks null-user complications throughout the codebase. Rejected.
- **Soft delete with a retention window** — adds a "deleted" column on `user`, requires a background reaper job and a recovery flow. Overkill for this app's stage. Rejected.

The strongest privacy posture is also the simplest: when the user wants out, they get out completely.

### Decision 2: New `/settings` page with type-email confirmation

The Remove account control lives on a new `/settings` page in a "Danger zone" card. Confirmation requires typing the user's exact email address into a text input — the Confirm button stays disabled until `typed.trim() === session.user.email` (case-sensitive). This is the GitHub / Stripe / Linear pattern: friction proportional to the irreversibility of the action.

**Alternatives considered:**

- **Inline on /dashboard + password re-entry confirm** — no new route, but clutters the dashboard with a one-time-use destructive action. Rejected.
- **/settings + simple two-button confirm modal** — a single misclick away from deletion. Rejected for an irreversible action.

The visual companion mockups (now archived under `.superpowers/brainstorm/`) showed all three side-by-side; the typed-email confirmation read as the safest while still being possible to complete.

### Decision 3: Reach /settings via a plain "Settings" link in the global header

The global header (`components/header.tsx`) gets a single new `<Link href='/settings'>Settings</Link>` rendered between the brand and the Logout button, gated on the same `user` prop the Logout button uses. The link is the lightest possible nav surface for a single-destination route.

**Alternatives considered:**

- **Email-with-dropdown** (`you@example.com ▾` containing Settings + Logout) — useful pattern once a profile menu has multiple items, but overkill for one destination today. Rejected for now; reversible later.
- **Avatar/initial circle + dropdown** — same concern, plus introduces an avatar/initial component we don't otherwise need.
- **"Settings" link inside the dashboard body** — only discoverable from /dashboard. Less consistent than the header.

### Decision 4: Explicit transactional cascade, no schema migration

The deletion runs in a single SQLite transaction (`db.transaction(() => { ... })()`) in this order: `notes` → `session` → `account` → `user`. This keeps the work entirely inside the new server action and avoids a destructive schema migration on better-auth-managed tables.

**Alternatives considered:**

- **Add `ON DELETE CASCADE` to all three FKs** — requires `CREATE TABLE ... new`, `INSERT ... SELECT`, `DROP TABLE old`, `ALTER ... RENAME` in SQLite (no `ALTER TABLE ... ADD CONSTRAINT`). Touches better-auth tables, risky, and doesn't justify itself for one feature. Rejected.
- **Use better-auth's user-deletion hook if available** — better-auth ships a `user.deleteUser` API in some configs but it isn't enabled here, and wiring it would still leave us responsible for `notes` cleanup since better-auth doesn't know about that table. Rejected as net-negative complexity.

### Decision 5: Sign out and redirect to `/` after deletion

After the transaction commits, the action clears the session (better-auth `signOut`, falling back to a manual cookie clear if needed) and `redirect('/')` — the welcome page. The user just deleted their account, so there's nothing to authenticate them for; landing on the welcome page is the natural "you're a stranger here now" surface.

**Alternative considered:**

- **Redirect to `/authenticate`** — could be confusing because the user just intentionally severed all auth. Rejected.

## Implementation

Five files changed/created:

| File                                   | Status                 | Purpose                                                                                                                                                                  |
| -------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/settings/page.tsx`                | new (Server Component) | Auth-gates via `auth.api.getSession`; redirects to `/authenticate` on miss; renders the user's email and the Remove account form                                         |
| `app/settings/actions.ts`              | new (Server Action)    | `removeAccount` action: zod-validates the typed email, asserts it matches `session.user.email`, runs the four-table delete in a transaction, signs out, redirects to `/` |
| `app/settings/remove-account-form.tsx` | new (`'use client'`)   | Owns the typed-email input + Confirm button (disabled until match); calls the server action via `useActionState` for inline error rendering                              |
| `components/header.tsx`                | edit (~3 lines)        | Add `<Link href='/settings'>Settings</Link>` between brand and Logout, gated on the same `user` prop                                                                     |
| `lib/validation.ts`                    | edit (~5 lines)        | Add `removeAccountSchema = z.object({ confirmEmail: z.string().email().max(254) })`                                                                                      |

No schema migration. No new dependencies.

## Data flow

```
[client modal: types email, clicks Confirm]
  → form action submits {confirmEmail} to removeAccount server action
  → action: getSession() → if no session, redirect to /authenticate
  → action: zod-validate confirmEmail
  → action: assert confirmEmail.trim() === session.user.email (case-sensitive, exact)
  → action: db.transaction(() => {
       DELETE FROM notes   WHERE user_id = ?
       DELETE FROM session WHERE userId  = ?
       DELETE FROM account WHERE userId  = ?
       DELETE FROM user    WHERE id      = ?
     })()
  → action: better-auth signOut (or clear cookie)
  → action: redirect('/')
```

The action **trusts the session, not the form**, for the user ID. The `confirmEmail` from the form is only a confirmation gate; the lookup key is `session.user.id`.

## Error handling

- **Email mismatch** → server action returns `{ error: 'Email did not match' }`; form renders an inline error; no DB writes (assertion runs before the transaction).
- **Session expired between load and submit** → action redirects to `/authenticate` (same pattern as other auth-gated actions).
- **DB error mid-transaction** → SQLite rolls back automatically; action returns `{ error: 'Failed to remove account, please try again' }`. No partial state.
- **Concurrent delete in two tabs** → second tab finds zero rows for sessions/account/user, noops, redirects. Idempotent.

## Security

- Lookup uses `session.user.id` only — the form's `confirmEmail` is never used in a SQL parameter.
- Inputs are zod-validated as defense in depth even though the typed value isn't passed to SQL.
- Action is a Server Action; no public API surface.
- The deletion order (children → parents) preserves FK integrity throughout the transaction; `PRAGMA foreign_keys = ON` is already set.

## Testing

- **`__tests__/lib/validation.test.ts`** — extend with `removeAccountSchema` cases (valid email, missing email, invalid format, oversized).
- **`__tests__/app/settings/actions.test.ts`** — new test file. Drive vitest with a temporary SQLite file via `DB_PATH`. Seed a user + a session + an account + a few notes. Stub `auth.api.getSession` to return the seeded user. Run `removeAccount` with the matching email; assert all four tables have zero rows for that user. Run again with a mismatched email; assert nothing was deleted and the action returned an error.
- **No component test for the form in this change.** The disabled-until-match behavior is testable but adding the harness is more weight than the assertion is worth; flagged as an optional follow-up.
- TDD: the server-action test is written RED before the action body lands, per the project's `tasks.md` discipline.

## Scope

- Adds: `/settings` route, Settings link in header, remove-account flow with type-email confirmation.
- Modifies: `components/header.tsx`, `lib/validation.ts`.
- Touches a new capability spec: `account-management` (introduces the concept; future work like "change password" or "change email" would `MODIFY` this same capability).

## Non-goals

- Profile editing on `/settings` (rename, change email, change password).
- "Export your data first" flow before deletion (no JSON dump).
- Soft delete + recovery window.
- Migrating `notes`/`session`/`account` to use `ON DELETE CASCADE`.
- Switching the header to a profile dropdown (Section 2 options ii/iii from the visual companion mockups).

## Verification

- `bun run lint` clean.
- `bun run test:run` — all existing 42 tests pass plus the new validation + server-action tests.
- Manual smoke (browser): sign up → log in → land on `/dashboard` → click "Settings" in header → see Email + Danger zone → click Remove account → modal opens → type wrong email → Confirm stays disabled → type correct email → Confirm enables → click Confirm → land on `/` welcome page → confirm `/dashboard` now redirects to `/authenticate`, the prior public note slug now 404s, and re-attempting login with the same email/password fails.
