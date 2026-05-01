## Why

The Settings page currently only displays a user's email and a remove-account control. There is no way for a signed-in user to record or update basic personal profile information (name, gender, birthday). This change adds those fields so the Settings page becomes a real account-management surface and the application has structured profile data to surface in future features.

A brainstorming pass has already produced a design spec at `docs/superpowers/specs/2026-05-01-add-profile-fields-to-settings-design.md`, which is the source of truth for UX, validation, and migration choices.

## What Changes

- Add a new "Profile" section to `/settings`, placed between the page heading and the existing Email section, with three editable fields: `name`, `gender`, `birthday`.
- All three fields are required at the form / zod layer. The "Save profile" button submits a single server action that updates them atomically.
- Extend the better-auth `user` table with two nullable columns: `gender TEXT` and `birthday TEXT` (ISO `YYYY-MM-DD`). `name` already exists on `user` and continues to be written via the same column.
- Schema migration follows this project's "no migration tool" convention: extend the `CREATE TABLE IF NOT EXISTS user` block in `lib/db.ts` so fresh installs include the new columns, and add an idempotent block immediately after that introspects `PRAGMA table_info(user)` and runs `ALTER TABLE user ADD COLUMN ...` for any missing column on existing databases.
- Add `updateProfileSchema` to `lib/validation.ts` (zod) covering name length, gender enum membership, and birthday format / range (1900-01-01 through today).
- Add an `updateProfile` server action in `app/settings/actions.ts` that resolves the session, validates input with zod, sanitizes `name` via DOMPurify, runs a session-trusted parameterised UPDATE, and `revalidatePath('/settings')`.
- Add a new `<ProfileForm>` `'use client'` component at `app/settings/profile-form.tsx` that uses `useActionState`, prefilled from a `db.query` for the current user's profile row.
- Add vitest coverage at three layers (validation, server action, component) — no E2E framework is introduced.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `account-management`: Settings page gains a Profile section with editable name / gender / birthday backed by a new `updateProfile` action. New requirements describe Profile rendering, Profile update behavior, and the session-trusted, validated, sanitized save flow.

## Impact

- **Code**:
  - `lib/db.ts` — extended `user` CREATE TABLE; new idempotent ALTER TABLE block.
  - `lib/validation.ts` — new `updateProfileSchema` and `Gender` enum constant.
  - `app/settings/page.tsx` — extra `db.query` for `name / gender / birthday`; renders `<ProfileForm>`.
  - `app/settings/actions.ts` — new `updateProfile` server action.
  - `app/settings/profile-form.tsx` — new client component.
  - `__tests__/lib/validation.test.ts` — new test cases for `updateProfileSchema`.
  - `__tests__/app/settings/actions.test.ts` — new file covering `updateProfile`.
  - `__tests__/components/profile-form.test.tsx` — new file covering the form.
- **Specs**: delta spec for `account-management` adds Profile-related requirements.
- **Dependencies**: no new packages; uses existing `zod`, `isomorphic-dompurify`, `better-auth`, `bun:sqlite`.
- **Database**: schema-additive only, fully idempotent. Existing rows have NULL `gender` / `birthday` until the user saves their profile. Existing functionality (notes, sharing, removeAccount) is unaffected.
- **APIs**: no public/external API surface changes; only an internal server action.

## Non-Goals

- Avatar / `image` upload (the existing `image` column on `user` is untouched).
- Email editing (would require a re-verification flow).
- Public exposure of profile fields on `/p/<slug>` or anywhere else; profile is private to the owner.
- Multi-device session invalidation triggered by profile changes.
- Real-browser / Playwright E2E tests — explicitly deferred. This change keeps the project's existing vitest-only convention.
