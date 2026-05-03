## 1. Validation schema

- [x] 1.1 RED — extend `__tests__/lib/validation.test.ts` with cases for `removeAccountSchema`: valid email passes; missing email fails; non-email string fails; oversized email (>254 chars) fails. Run `bun run test:run __tests__/lib/validation.test.ts` and confirm the new cases fail (the schema doesn't exist yet).
- [x] 1.2 GREEN — add `removeAccountSchema = z.object({ confirmEmail: z.string().email().max(254) })` to `lib/validation.ts`. Re-run `bun run test:run __tests__/lib/validation.test.ts` and confirm all cases pass.
- [x] 1.3 Run `superpowers:requesting-code-review` on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. Server action

- [x] 2.1 RED — create `__tests__/app/settings/actions.test.ts`. **Discovered during apply:** `bun:sqlite` is a Bun built-in and vitest spawns workers under Node, so importing `lib/db` for real DB assertions fails with "Cannot bundle Node.js built-in 'bun:sqlite'". Switched approach: mock `@/lib/db` (record `db.run` calls; model `db.transaction`'s wrapper shape) and assert on mock interactions. Spec scenarios about real cascade rollback / FK semantics are now verified by manual smoke (task 4.3) rather than automated. Four cases land:
  - Matching email + valid session → `db.transaction` is called once and `db.run` is called with the four expected DELETE statements (notes → session → account → user) using the session userId; redirect throws `NEXT_REDIRECT`; signOut attempted.
  - Mismatched email → action returns `{ error: 'Email did not match' }`; no `db.run` calls; no signOut.
  - No session → action redirects to `/authenticate`; no `db.run` calls.
  - Tampered `confirmEmail` matching a different user's email → action returns `{ error: 'Email did not match' }`; no `db.run` calls.

  Run `bun run test:run __tests__/app/settings/actions.test.ts` and confirm RED before the action exists, GREEN after.

- [x] 2.2 GREEN — create `app/settings/actions.ts` with the `removeAccount` server action. Per `design.md` Decision 1, run the four `DELETE` statements inside `db.transaction(...)` in order: `notes` → `session` → `account` → `user`. Per Decision 5, use `session.user.id` for every SQL parameter (never `confirmEmail`). After the transaction commits, sign out via better-auth's API (fall back to clearing the session cookie via `cookies()` only if the API surface is unavailable — leave a one-line comment noting the fallback is a fallback). Then `redirect('/')` per Decision 4. Re-run the test file and confirm all four cases pass.
- [x] 2.3 Run `superpowers:requesting-code-review` on the diff for group 2; address CRITICAL/HIGH findings before moving on.

## 3. Settings page + remove-account form

- [x] 3.1 Create `app/settings/page.tsx` as a Server Component. Auth-gate via `auth.api.getSession({ headers: await headers() })`; on miss, `redirect('/authenticate')`. Render the user's email in a small read-only block, then a "Danger zone" card containing the `<RemoveAccountForm>` (imported from the co-located client component). Match the existing `app/dashboard/page.tsx` layout idiom (`<div className='p-8'>`, `text-foreground/60` semantic tokens, etc.).
- [x] 3.2 Create `app/settings/remove-account-form.tsx` as a `'use client'` component. Use `useActionState` to call the `removeAccount` action. Track typed value in local `useState`. Compute `disabled = trimmed !== userEmail` and apply to the Confirm button (per `design.md` Decision 2). Render the action's `error` field inline if returned. The "open modal" behavior can be a local `useState<'closed' | 'open'>` — no portal/library needed; an inline `<dialog>` or a conditional `<div>` is fine. Keep the visual treatment consistent with the project (no new color palette).
- [x] 3.3 Add a Settings link to `components/header.tsx`: `<Link href='/settings'>Settings</Link>` rendered before the existing Logout button, gated on the same `user` prop the Logout button is gated on (per `design.md` Decision 3). Match the existing link's text styling (`text-sm text-foreground/60 hover:text-foreground`).
- [x] 3.4 No new automated test for `RemoveAccountForm` or the header in this change — per `design.md` Risks/Trade-offs, the disabled-until-match logic is a UX hint over an authoritative server check, and the header change is one prop-gated `<Link>`. Both are covered by the manual smoke in task 4.3 and the Group 2 server-action test.
- [x] 3.5 Run `superpowers:requesting-code-review` on the diff for group 3; address CRITICAL/HIGH findings before moving on.

## 4. Verification & dev log

- [x] 4.1 Run `bun run lint` and confirm clean (no new violations introduced).
- [x] 4.2 Run `bun run test:run` and confirm all tests pass — the existing 42 plus the new validation + server-action tests.
- [x] 4.3 Manual smoke test in `bun run dev`:
  - **Automated portion (done in apply session):** dev server starts cleanly; `/` returns 200; `/settings` returns 307 redirect to `/authenticate` (auth-gate works); `/settings` route compiles without errors.
  - **User-driven portion (to be performed before merging the branch — flagged in the dev log):**
    - Sign up as a fresh user; create at least two notes and toggle one of them public (record the public URL).
    - Verify the new Settings link appears in the header on every page.
    - Navigate to `/settings`; confirm the email is shown and the Danger zone is visible.
    - Click Remove account; type an obviously-wrong email; confirm the Confirm button stays disabled.
    - Type the correct email; confirm the Confirm button enables; click it.
    - Land on `/` welcome page.
    - Visit `/dashboard` — confirm it redirects to `/authenticate`.
    - Visit the previously-public note URL — confirm it returns 404.
    - Try to sign in with the same email/password — confirm it fails (account is gone).
    - Confirm no React hydration warnings in the browser console throughout.
- [x] 4.4 Append a new numbered entry to `docs/log/2026-04-29.md` per the Dev Log Practice in `CLAUDE.md` (commit hash, feature summary bullets covering the new `/settings` route, the type-email confirmation, the transactional cascade, and the new `account-management` capability spec; code-review findings table summarizing groups 1–3; tests line including the new test files).
- [x] 4.5 Run `superpowers:verification-before-completion` (fresh `bun run lint`, fresh `bun run test:run`, grep new files for stray `console.log` / debug code, diff review against `design.md` to confirm scope didn't drift).
- [x] 4.6 Run `superpowers:requesting-code-review` on the diff for group 4; address CRITICAL/HIGH findings before moving on.
