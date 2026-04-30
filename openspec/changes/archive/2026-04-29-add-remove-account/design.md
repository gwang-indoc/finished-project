## Context

The app is a Next.js 16 App Router project on Bun with React 19, SQLite (`bun:sqlite`), better-auth (email + password), Tiptap, and zod. Auth is session-based; routes are gated server-side via `auth.api.getSession({ headers: await headers() })` (see `lib/auth.ts`, `app/dashboard/page.tsx`, `app/notes/[id]/page.tsx`). Notes belong to a user via `notes.user_id` with a plain FK to `user(id)` — no `ON DELETE CASCADE`. Same for `session.userId` and `account.userId`. `PRAGMA foreign_keys = ON` is set in `lib/db.ts`, so out-of-order deletes will fail.

There is no settings page today and no profile menu in the global header (`components/header.tsx`); the header has only the "NextNotes" brand (linking to `/dashboard`) and a Logout button (when signed in).

The brainstorming spec at `docs/superpowers/specs/2026-04-29-remove-account-design.md` captures the five decisions reached during the brainstorming flow plus the rejected alternatives. This document focuses on the technical mechanics.

## Goals / Non-Goals

**Goals:**

- Give a signed-in user a self-service way to permanently remove their account and all of their data.
- Confirm the destructive action with friction proportional to its irreversibility (typed-email confirmation).
- Keep the deletion atomic — either every row is gone or nothing changes.
- Trust the session, never the form, for the user identity used in SQL.
- Touch a minimal surface: 3 new files, 2 edited files, no schema migration, no new dependencies.

**Non-Goals:**

- Profile editing of any kind (rename, change email, change password).
- Data export before deletion.
- Soft delete or any recovery flow.
- Schema migration to add `ON DELETE CASCADE` on the relevant FKs.
- Building a profile dropdown — the new "Settings" link in the header is a plain `<Link>`.
- Component test for the disabled-until-match button logic (intentionally deferred — flagged as optional follow-up).

## Decisions

### Decision 1: Hard delete with explicit transactional cascade

The `removeAccount` server action runs a single SQLite transaction that issues four `DELETE` statements in dependency order:

```ts
db.transaction((userId: string) => {
  db.run('DELETE FROM notes   WHERE user_id = ?', [userId]);
  db.run('DELETE FROM session WHERE userId  = ?', [userId]);
  db.run('DELETE FROM account WHERE userId  = ?', [userId]);
  db.run('DELETE FROM user    WHERE id      = ?', [userId]);
})(session.user.id);
```

The order matters because `PRAGMA foreign_keys = ON` is active and the FKs lack `ON DELETE CASCADE`. Children come first (`notes` → `session` → `account`), parent last (`user`). SQLite's transaction guarantees atomicity: any failure rolls everything back, leaving the database unchanged.

**Alternatives considered:**

- *Add `ON DELETE CASCADE` via schema migration.* SQLite does not support `ALTER TABLE ... ADD CONSTRAINT`. The migration would require `CREATE TABLE notes_new ... ON DELETE CASCADE`, `INSERT INTO notes_new SELECT * FROM notes`, `DROP TABLE notes`, `ALTER TABLE notes_new RENAME TO notes`, repeated for `session` and `account`. The `session` and `account` tables are managed by better-auth — recreating them risks subtle drift from upstream. The explicit-deletes approach keeps everything inside the action and avoids touching better-auth-managed schema.
- *Use a hypothetical better-auth `deleteUser` API.* better-auth ships a user-deletion plugin in some configurations but it isn't enabled here, and even if it were it wouldn't know about the `notes` table — we'd still need explicit cleanup for app-owned tables. Net-neutral complexity at best, more moving parts at worst.

### Decision 2: Confirmation by typed-email match (not password, not click-only)

The `RemoveAccountForm` displays the user's email and a text input. The Confirm button sets `disabled` based on `confirmEmail.trim() === userEmail` evaluated client-side. The same equality check runs server-side as the first assertion in the action, so the client gating is purely a UX hint — it cannot be bypassed.

**Alternatives considered:**

- *Password re-entry.* Reuses better-auth's password verification, but most users don't remember their password during a "delete my account" flow and would bounce off the action. Type-email is recoverable (the email is shown right above the input).
- *Two-button confirmation modal.* Lowest friction, lowest safety. Rejected — irreversible action deserves a deliberate keystroke commitment.
- *Type a fixed phrase like "DELETE MY ACCOUNT".* Works, but typing your own email already personalizes the moment without needing a second copy-pastable string.

### Decision 3: New `/settings` route reachable via plain header link

The route is a Server Component at `app/settings/page.tsx` that auth-gates with `auth.api.getSession`, redirects to `/authenticate` on miss, and renders the user's email plus the danger-zone card. The form is a co-located client component.

The header gets a single new `<Link href='/settings'>Settings</Link>` rendered between the brand and the Logout button, gated on the same `user` prop the Logout button already gates on. This means the link only appears when signed in.

**Alternatives considered:**

- *Inline danger-zone on `/dashboard`.* No new route, but clutters the daily-use surface with a one-time-use destructive action. Rejected.
- *Profile dropdown in the header.* Pattern apps grow into eventually, but unwarranted for a single new menu item. Reversible later.
- *Settings link inside the dashboard body.* Less consistent than the global header — `/settings` should be reachable from anywhere the user is signed in.

### Decision 4: Sign out and redirect to `/` (welcome) post-deletion

After the transaction commits, the action calls better-auth's `signOut` server-side (or clears the session cookie directly via `cookies()` if needed) and `redirect('/')`. The user just intentionally severed all auth state — landing on the welcome page is the natural "you're a stranger here now" surface.

**Alternative considered:**

- *Redirect to `/authenticate`.* Confusing — the user just deleted their account; presenting them with a sign-in form invites the question "wait, can I sign back in?". Rejected.

### Decision 5: Trust the session for the user identity, not the form

The action uses `session.user.id` for every SQL parameter. The form's `confirmEmail` value is only used as a confirmation gate, never as a lookup key. Even if an attacker submitted a different valid email through a tampered form, the SQL would only ever delete the session-owner's data.

The `confirmEmail` is still zod-validated at the action boundary as defense in depth.

## Risks / Trade-offs

- **[Risk]** Public note URLs (`/p/<slug>`) immediately 404 after deletion. → **Mitigation:** documented in the spec scenario; users see the danger-zone copy "all of your notes" before confirming.
- **[Risk]** A user with two open browser tabs could submit the deletion twice. → **Mitigation:** the second submission's `getSession` returns null (session was destroyed) and redirects to `/authenticate`. Idempotent at the data layer because the user row is already gone.
- **[Risk]** A future better-auth update could change session-cookie management in a way that breaks our explicit `cookies()` clear. → **Mitigation:** prefer better-auth's own `signOut` API and only fall back to manual cookie clear if the API is unavailable; document the fallback in the action's comment.
- **[Trade-off]** No schema migration today means `ON DELETE CASCADE` will need to be added by hand the next time a feature needs cascade behavior on these FKs. Acceptable — when that need arises, the migration can be done in its own change with proper attention.
- **[Trade-off]** No `RemoveAccountForm` component test means the disabled-until-match logic isn't pinned by automated coverage. Server-side check is authoritative, so the client gating is a UX hint only — acceptable risk. Optional follow-up flagged.

## Migration Plan

No data migration. Deploy by merging. Rollback by reverting the change set; users who haven't yet deleted their accounts are unaffected. Users who *have* deleted their accounts cannot be restored — the action documents this irreversibility prominently in the confirmation modal.

## Open Questions

None.
