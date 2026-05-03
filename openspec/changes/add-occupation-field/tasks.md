## 1. lib layer — validation schema and DB column

- [x] 1.0 Invoke superpowers:subagent-driven-development to dispatch the [parallel] units in this group; one subagent owns one RED+GREEN pair (or one standalone task) end-to-end including self-review.
- [x] 1.1 [parallel] RED — add failing tests for `occupation` in `__tests__/lib/validation.test.ts`: (a) optional — form submitted without `occupation` passes; (b) max 100 chars — 101-char string rejected with "Occupation is too long"; (c) trim — leading/trailing whitespace stripped; (d) over-100 after trim is rejected. Run `bun run test:run __tests__/lib/validation.test.ts` and confirm FAIL.
- [x] 1.2 [parallel] GREEN — in `lib/validation.ts`, add `occupation: z.string().trim().max(100, 'Occupation is too long').optional()` to `updateProfileSchema`. Run `bun run test:run __tests__/lib/validation.test.ts` and confirm all pass.
- [x] 1.3 [parallel] RED — add failing tests for the `occupation` column in `__tests__/lib/db.test.ts` (or the closest existing db test file): (a) fresh DB includes `occupation` column; (b) bootstrapping twice is a no-op. Run `bun run test:run` on that file and confirm FAIL.
- [x] 1.4 [parallel] GREEN — in `lib/db.ts`, add `occupation TEXT` to the `CREATE TABLE IF NOT EXISTS user` statement and add an idempotent guard after the existing `birthday` guard:
  ```ts
  if (!userColumns.includes('occupation')) {
    db.run('ALTER TABLE user ADD COLUMN occupation TEXT');
  }
  ```
  Run the db test file and confirm all pass.
- [x] 1.Z Run superpowers:requesting-code-review on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. application layer — action, form, page

- [x] 2.0 Invoke superpowers:subagent-driven-development to dispatch the [parallel] units in this group; one subagent owns one RED+GREEN pair (or one standalone task) end-to-end including self-review.
- [x] 2.1 [parallel] RED — in `__tests__/app/settings/actions.test.ts`, add tests for `updateProfile` with occupation: (a) valid occupation persisted (verify `db.run` called with occupation value); (b) empty occupation stored as NULL (pass `''`, verify `db.run` called with `null`); (c) HTML in occupation is stripped (verify DOMPurify strips tags); (d) occupation over 100 chars returns `fieldErrors.occupation`. Run `bun run test:run __tests__/app/settings/actions.test.ts` and confirm FAIL.
- [x] 2.2 [parallel] GREEN — in `app/settings/actions.ts`, extend `updateProfile`.
- [x] 2.3 [parallel] RED — in `__tests__/components/profile-form.test.tsx`, add tests for occupation input.
- [x] 2.4 [parallel] GREEN — in `app/settings/profile-form.tsx`, add occupation field.
- [x] 2.5 [parallel] RED — in `__tests__/app/settings/profile/page.test.tsx`, add tests for occupation defaultValues.
- [x] 2.6 [parallel] GREEN — in `app/settings/profile/page.tsx`, extend SELECT and defaultValues.
- [x] 2.Z Run superpowers:requesting-code-review on the diff for group 2; address CRITICAL/HIGH findings before moving on.

## 3. E2E and verification

- [x] 3.1 Automated E2E test via mcp__plugin_playwright_playwright__* tools — sign in as an existing user → navigate to `/settings/profile` → confirm the Occupation input is present and empty → type `"Software Engineer"` into the field → click Save profile → reload the page → confirm the Occupation field is prefilled with `"Software Engineer"` → clear the field → save again → reload → confirm the field is empty (stored as NULL, rendered blank).
- [x] 3.2 Run superpowers:verification-before-completion (`bun run test:run` + grep for `console.log` in changed files + full diff review).
- [x] 3.Z Run superpowers:requesting-code-review on the final diff; address CRITICAL/HIGH findings before closing.
