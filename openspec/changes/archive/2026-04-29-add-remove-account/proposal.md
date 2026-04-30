## Why

Today there is no way for a signed-in user to remove their own account — the only way is for someone to hand-edit the SQLite database. This change adds a self-service "Remove account" flow so users can delete their account and all of their data themselves. The flow uses the strongest hard-delete posture (cascade through all four tables) and a type-email confirmation to make the destructive nature deliberate. Brainstorming validated the approach via the visual companion; the design spec is at `docs/superpowers/specs/2026-04-29-remove-account-design.md`.

## What Changes

- Add a new `/settings` route (Server Component) that auth-gates with `auth.api.getSession`, redirects to `/authenticate` on miss, and renders the user's email plus a "Danger zone" card containing a Remove account button.
- Add a `'use client'` `RemoveAccountForm` component on `/settings` that owns the typed-email input. The Confirm button stays disabled until the typed value matches `session.user.email` exactly (case-sensitive, after `.trim()`).
- Add a `removeAccount` server action that zod-validates the typed email, asserts it matches the session email, performs `DELETE FROM notes / session / account / user` for the session user inside one SQLite transaction, signs out, and redirects to `/`.
- Add a `removeAccountSchema` to `lib/validation.ts`.
- Add a plain `<Link href='/settings'>Settings</Link>` to `components/header.tsx`, gated on the same `user` prop the Logout button uses (visible only when signed in).

## Capabilities

### New Capabilities

- `account-management`: covers user-initiated account operations. This change introduces the capability with one requirement (account removal). Future related work — change email, change password, account export — can `MODIFY` this same capability rather than spawning new mini-capabilities.

### Modified Capabilities

_None._

## Non-Goals

- No profile editing on `/settings` (rename, change email, change password).
- No "Export your data first" flow before deletion.
- No soft delete or recovery window — deletion is immediate and permanent.
- No schema migration to add `ON DELETE CASCADE` on the FKs (would require destructive `DROP TABLE` / `CREATE TABLE` on better-auth-managed tables; explicit transactional deletes are simpler and self-contained).
- No replacement of the existing header with a profile dropdown — the Settings link is a plain text link next to Logout. Reversible later if a settings menu grows.
- No new component test for the `RemoveAccountForm`'s disabled-until-match logic in this change. Server-action behavior IS covered.

## Impact

- Code: 3 new files (`app/settings/{page.tsx, actions.ts, remove-account-form.tsx}`), 2 edited files (`components/header.tsx`, `lib/validation.ts`).
- DB: no schema migration. `notes` / `session` / `account` / `user` rows for the deleted user are removed in a single transaction; public URLs (`/p/<slug>`) immediately 404.
- Auth: better-auth session is cleared after the cascade; no changes to the better-auth config itself.
- Dependencies: none added.
- Tests: extend `__tests__/lib/validation.test.ts` for `removeAccountSchema`; add `__tests__/app/settings/actions.test.ts` for the server action driven by a temp SQLite `DB_PATH`.
- Specs: new `account-management` capability spec with one requirement covering the account-removal contract.
- Brainstorming spec: `docs/superpowers/specs/2026-04-29-remove-account-design.md` (already written, captures all five decisions and rejected alternatives).
- Dev log: a new entry will be added to `docs/log/2026-04-29.md` per the Dev Log Practice.
