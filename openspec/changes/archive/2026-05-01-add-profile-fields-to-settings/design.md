## Context

The Settings page (`app/settings/page.tsx`) currently renders only the user's email and the remove-account form. This change adds a Profile section that lets the signed-in user view and edit their `name`, `gender`, and `birthday`. The brainstorming pass produced an approved design spec at `docs/superpowers/specs/2026-05-01-add-profile-fields-to-settings-design.md`, which is the primary input for this document.

Constraints:

- No migration tool. Schema is bootstrapped via `CREATE TABLE IF NOT EXISTS` in `lib/db.ts`. Schema additions for an existing database have to be applied idempotently at import time.
- The `user` table is owned by better-auth. Two new columns are added to that table rather than introducing a new joined table.
- Project convention is vitest at three layers (lib, server-action, component) with no real-browser E2E framework.

## Goals / Non-Goals

**Goals:**

- A Profile section on `/settings` that displays the user's current `name`, `gender`, `birthday` and allows editing all three through one form.
- A single server action that validates input with zod, sanitizes `name`, and persists via a session-trusted parameterised UPDATE.
- An idempotent schema-extension path: fresh installs and the existing database both end up with the same columns after `lib/db.ts` runs.
- Three-layer vitest coverage: validation rules, server-action behavior, form component behavior.

**Non-Goals:**

- Avatar / `image` upload.
- Email editing or any change that would require re-verification.
- Public exposure of profile fields outside the owner's Settings page.
- Multi-device session invalidation when a profile changes.
- Real-browser / Playwright E2E tests — explicitly deferred to a future, separate proposal.

## Decisions

### 1. Extend the existing `user` table rather than create a separate `user_profile` table

Add `gender TEXT` and `birthday TEXT` (both nullable) to the existing better-auth `user` table.

**Why:** `name` already lives on `user`; co-locating `gender` and `birthday` keeps a single read for profile state, avoids a JOIN on every settings load, and means `removeAccount` keeps working untouched (the `DELETE FROM user` cascade naturally cleans up the new columns).

**Alternatives considered:**

- _Separate `user_profile` table_ with a `userId` FK. Cleaner isolation from better-auth's table, but adds a JOIN on every settings/session-adjacent read and complicates `removeAccount`. **Rejected** — overhead is not justified for two scalar columns.
- _Single JSON `profile` column._ Loses zod-level type guarantees, fails to index, and removes the structural pressure to keep profile fields explicit. **Rejected.**
- _External migration tool_ (drizzle-kit, kysely, etc.). Disproportionate tooling churn for two columns; out of step with the rest of the project. **Rejected.**

### 2. Idempotent ALTER TABLE inside `lib/db.ts`

Extend the `user` `CREATE TABLE IF NOT EXISTS` block to include `gender TEXT` and `birthday TEXT`. Immediately after that block, introspect via `PRAGMA table_info(user)` and run `ALTER TABLE user ADD COLUMN ...` for any missing column. Both columns stay nullable.

**Why:** Matches this project's "no migration tool" convention. Fresh installs and the existing `data/app.db` both reach the same schema after a single import. Existing user rows simply have `NULL` for the new columns until the user saves their profile, so no functionality breaks.

**Alternatives considered:**

- _DROP and recreate the table._ Destructive and unnecessary. **Rejected.**
- _Catch the ALTER TABLE error if the column already exists._ Works in SQLite but relies on error-message string matching; introspecting `PRAGMA table_info` is more deterministic. **Rejected.**
- _Force every existing user to backfill on next sign-in._ Out of scope and creates a worse first-time UX. **Rejected.**

### 3. All three fields required at the form / zod layer; columns nullable in the DB

The form (and `updateProfileSchema`) refuses to save unless `name`, `gender`, and `birthday` are all valid. The DB columns for `gender` and `birthday` are nullable, so existing accounts are not broken at deploy time.

**Why:** Existing users do not have profile data yet. Required-at-DB-level would either reject every existing row or force a backfill. Required-at-form-level keeps the contract for new saves, lets existing users keep using the rest of the app, and prompts them inline the next time they open `/settings`.

**Alternatives considered:**

- _NOT NULL columns + default values._ Forces synthetic data into rows the user never confirmed. **Rejected.**
- _All three optional at the form layer._ Weakens the contract; the design intent is that a saved profile is complete. **Rejected.**

### 4. Gender as a fixed enum stored as kebab-case literals

Persist `gender` as one of `'male' | 'female' | 'non-binary' | 'prefer-not-to-say'`. The form maps these to human-readable labels in the dropdown.

**Why:** Cheap to validate (zod enum), trivially indexable if needed later, and stable under future i18n (labels can change without schema migration). The four-value set was selected during brainstorming as the inclusive minimum.

**Alternatives considered:**

- _Free-text input._ Unbounded write, harder to query, easier to accumulate junk. **Rejected.**
- _Two values only (male/female)._ Excludes users who do not fit the binary; rejected on inclusivity grounds during brainstorming.
- _Dropdown plus optional self-describe text field._ Adds a second column and a second validation path for marginal user-reach gain. **Rejected** for this iteration; can be added later as ADDED Requirements without breaking existing data.

### 5. Birthday as ISO `YYYY-MM-DD` via native `<input type="date">`

The form uses `<input type="date">`. The server stores the string verbatim, validating both shape (`/^\d{4}-\d{2}-\d{2}$/`) and calendar validity (`Date.parse`), and bounding it between `1900-01-01` and today.

**Why:** Cheapest, most accessible, browser-native picker. ISO-string storage avoids timezone complications (a calendar date has no timezone) and lets us keep the column as plain `TEXT` consistent with the rest of the schema.

**Alternatives considered:**

- _Three dropdowns (year / month / day)._ More clicks and more code for the same data. **Rejected.**
- _Free-text input._ Bad UX for picking historical years. **Rejected.**
- _SQLite `DATE` storage._ Not a real type in SQLite (it stores strings/ints under the hood). No advantage over TEXT here. **Rejected.**

### 6. Session-trusted UPDATE; zero use of form-supplied user identifiers

The `updateProfile` server action resolves the user via `auth.api.getSession(...)` and uses `session.user.id` as the only `WHERE` parameter. The form has no `userId` field; even if it did, the action would ignore it. SQL is parameterised end-to-end.

**Why:** Mirrors the existing `removeAccount` pattern — "Account-removal action trusts the session, not the form". Same threat model: a tampered submission cannot reach another user's row.

### 7. `name` is sanitized through DOMPurify before persist

`name` is run through `DOMPurify.sanitize(name, { ALLOWED_TAGS: [] })` server-side before the UPDATE.

**Why:** Matches the existing note-title pattern. `name` will eventually be rendered in HTML contexts (page heading, share metadata, etc.). Stripping all tags at the boundary is cheaper and less error-prone than relying on every render site to escape.

## Risks / Trade-offs

- **Writing directly to a better-auth-owned column (`user.name`).** → The rest of the project already does this for similar fields, and there is no in-memory better-auth cache to invalidate. Documented in the design spec so future implementers don't get surprised.
- **Idempotent ALTER TABLE depends on `PRAGMA table_info` semantics.** → SQLite's `PRAGMA table_info` is stable across versions and bun:sqlite supports it. The block is unit-testable indirectly via "running `lib/db.ts` twice does not throw" once the columns exist.
- **Birthday "must be a real past date" depends on server clock.** → Acceptable; we'd rather refuse a future birthday than accept it. No timezone math is performed.
- **`gender` enum is fixed.** → Adding a future option is a code change (zod literal + dropdown label). This is a deliberate trade-off vs. free-text, and acceptable.
- **No real-browser E2E tests.** → Per existing project convention. Mitigated by three-layer vitest coverage. A separate proposal can introduce Playwright if/when desired.

## Migration Plan

1. Merge updates `lib/db.ts`. On the next dev/prod boot the bootstrap runs once: `CREATE TABLE IF NOT EXISTS` is unchanged for an existing DB (table already exists), then the `PRAGMA table_info` block adds the missing `gender` / `birthday` columns idempotently.
2. Existing user rows now have `NULL gender / NULL birthday`. The app continues to work normally for them.
3. The next time an existing user opens `/settings`, the Profile form pre-fills `name` from the current value, leaves `gender` / `birthday` empty, and surfaces validation errors until they fill all three fields and save. They can ignore the page entirely if they prefer; nothing else gates on profile completeness.
4. Rollback: drop the new columns and revert `lib/db.ts`. Saved profile data is lost but no other behavior breaks. (Recommend forward-fix instead — the additions are non-breaking.)

## Open Questions

- None blocking. The design spec at `docs/superpowers/specs/2026-05-01-add-profile-fields-to-settings-design.md` notes one minor convention: gender values are stored as kebab-case literals; the dropdown is responsible for the value↔label mapping. This is encoded in the implementation, not left ambiguous.
