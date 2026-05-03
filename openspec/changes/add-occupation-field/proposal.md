## Why

The Profile section at `/settings/profile` currently collects Name, Gender, and Birthday but has no way to capture what a user does professionally. Adding an optional Occupation field rounds out the basic identity information available in the profile.

## What Changes

- Add `occupation TEXT` nullable column to the `user` table in `lib/db.ts`
- Add `occupation` as an optional trimmed string (max 100 chars) to `updateProfileSchema` in `lib/validation.ts`
- Extend `updateProfile` server action in `app/settings/actions.ts` to read, sanitize, and persist occupation
- Add an Occupation text input to `ProfileFormView` in `app/settings/profile-form.tsx`, positioned after Birthday
- Extend the `SELECT` query and `defaultValues` in `app/settings/profile/page.tsx` to include occupation

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `account-management`: Profile section gains a new optional Occupation field; the `updateProfile` action and `updateProfileSchema` now handle occupation in addition to name/gender/birthday.

## Impact

- `lib/db.ts` — schema + idempotent `ALTER TABLE ADD COLUMN occupation TEXT`
- `lib/validation.ts` — `updateProfileSchema` extended
- `app/settings/actions.ts` — `updateProfile` reads and persists occupation
- `app/settings/profile-form.tsx` — new input field, extended `DefaultValues` interface
- `app/settings/profile/page.tsx` — extended SQL query and `ProfileRow` interface
- Tests across `__tests__/lib/validation.test.ts`, `__tests__/app/settings/actions.test.ts`, `__tests__/app/settings/profile-form.test.tsx` (or `__tests__/components/`), `__tests__/app/settings/profile/page.test.tsx`

## Non-Goals

- Occupation is not displayed outside of `/settings/profile` (no public profile, no notes UI)
- No dropdown/enum — free text only
- No character counter in the UI; a submit-time error message is sufficient

## Brainstorming Spec

Design rationale and field placement decision documented in `docs/superpowers/specs/2026-05-03-add-occupation-field-design.md`.
