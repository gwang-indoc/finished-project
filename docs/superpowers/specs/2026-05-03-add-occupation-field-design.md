# Add Occupation Field to Profile Section — Design Spec

**Date:** 2026-05-03
**Author:** Brainstorming session, approved 2026-05-03
**Status:** Approved — ready for `/opsx:propose` artifact generation

## Goal

Add an optional free-text `occupation` field to the Profile section at `/settings/profile`, alongside the existing Name, Gender, and Birthday fields.

## Approach

A straightforward additive change following the exact same pattern used for `gender` and `birthday`. No new abstractions needed — extend the existing DB column, validation schema, server action, form component, and profile page query.

## Architecture

### Database (`lib/db.ts`)

Add `occupation TEXT` nullable column to the `user` table using the same idempotent `PRAGMA table_info` guard already used for `gender` and `birthday`:

```ts
if (!userColumns.includes('occupation')) {
  db.run('ALTER TABLE user ADD COLUMN occupation TEXT');
}
```

The `CREATE TABLE IF NOT EXISTS` statement also gains `occupation TEXT` so new databases have the column from the start.

### Validation (`lib/validation.ts`)

Add `occupation` to `updateProfileSchema` as an optional trimmed string:

```ts
occupation: z.string().trim().max(100, 'Occupation is too long').optional(),
```

- Optional (not required)
- Max 100 characters (matches the Name field cap)
- Trimmed for consistency with the existing Name field

### Server Action (`app/settings/actions.ts`)

- Read `occupation` from `formData.get('occupation')`
- Sanitize via `DOMPurify.sanitize(..., { ALLOWED_TAGS: [] })` (same as `name`)
- Treat empty string after sanitization as `null` (use `cleanOccupation || null` before passing to DB)
- Include in the `UPDATE user SET ...` statement

### Form Component (`app/settings/profile-form.tsx`)

- Extend `DefaultValues` interface: `occupation: string | null`
- Add a `<input type="text" name="occupation" ...>` after the Birthday field and before the Save button
- Inline field error display matching the existing pattern (`role="alert"`, red text)

### Profile Page (`app/settings/profile/page.tsx`)

- Extend `ProfileRow` interface: `occupation: string | null`
- Add `occupation` to the `SELECT` query
- Pass `occupation` in `defaultValues`

## Field Position

Name → Gender → Birthday → **Occupation** → Save button

## Validation Rules

| Rule | Value |
|---|---|
| Required | No (optional) |
| Max length | 100 characters |
| Sanitization | DOMPurify strip-all (same as Name) |
| Trim | Yes |

## Non-Goals

- Not a dropdown/enum — occupation is free-text only
- Not displayed anywhere outside of `/settings/profile` (no public profile page, no notes UI)
- Not adding any character counter UI — the error message on submit is sufficient

## Testing Strategy

| Test file | What it verifies |
|---|---|
| `__tests__/lib/validation.test.ts` | `occupation` optional, max 100 chars, trims whitespace |
| `__tests__/app/settings/actions.test.ts` | `updateProfile` reads, sanitizes, and persists `occupation`; omitted field leaves column unchanged |
| `__tests__/app/settings/profile-form.test.tsx` (or `__tests__/components/profile-form.test.tsx`) | Form renders occupation input with correct `defaultValue`; field error displays on validation failure |
| `__tests__/app/settings/profile/page.test.tsx` | Page passes `occupation` default value to `<ProfileForm>` |

### E2E (per project rule — UI change)

Playwright MCP automation or manual smoke test:
- Sign in → navigate to `/settings/profile`
- Confirm occupation input is present and empty for a new user
- Type an occupation value → Save → reload → confirm value persists
