# Add personal profile fields to Settings page — design spec

**Date:** 2026-05-01
**Capability:** `account-management`
**Status:** Approved (brainstorming complete)

## Goal

Let signed-in users view and edit their personal profile (name, gender, birthday) on `/settings`. The existing Email and Danger-zone sections are unchanged.

## Scope

**In scope**

- A new "Profile" section on `/settings`, placed above the existing Email section.
- Three editable fields: `name`, `gender`, `birthday`. All three are **required at the form level**.
- A single "Save profile" form action that updates all three at once.
- Schema additions for `gender` and `birthday` on the existing better-auth `user` table.
- Form-level inline validation errors and a "Saved" success indicator.

**Out of scope (non-goals)**

- Avatar / `image` upload (the existing `image` column on `user` is untouched).
- Email editing — would require re-verification flow.
- Public visibility of profile fields (no exposure on `/p/<slug>` or anywhere else).
- Multi-device session invalidation on profile change.
- E2E / real-browser tests — kept aligned with this project's existing vitest-only convention. A separate proposal can introduce Playwright if/when desired.

## UX

### Layout

```
/settings
  Profile  ← new section
    Name      [text input, prefilled]
    Gender    [select: Male / Female / Non-binary / Prefer not to say]
    Birthday  [<input type="date">, prefilled]
    [Save profile]    inline "Saved" or error messages
  Email          (unchanged)
  Danger zone    (unchanged)
```

The Profile section sits between the page heading and the Email section. The form mirrors the existing visual style of the rest of `/settings` (border, rounded corners, semantic Tailwind tokens).

### Field input choices

- **Name** — single text input. Trimmed; sanitized server-side via `DOMPurify.sanitize(name, { ALLOWED_TAGS: [] })`, matching the pattern used for note titles.
- **Gender** — fixed dropdown with four values: `Male`, `Female`, `Non-binary`, `Prefer not to say`. Persisted as the lowercase, hyphenated form (e.g. `prefer-not-to-say`).
- **Birthday** — native HTML5 `<input type="date">`. Stored as ISO `YYYY-MM-DD`.

### Required-field handling for existing users

DB columns for `gender` and `birthday` stay nullable so existing accounts are not retroactively broken. Required-ness is enforced **at the form / zod layer**: the next time an existing user opens `/settings` the form will surface validation errors until they fill in all three fields and save. The user can continue using the rest of the app (notes, sharing) without filling out their profile.

## Data model

Two new columns added to the existing better-auth `user` table:

| Column     | Type | Constraint | Notes                  |
| ---------- | ---- | ---------- | ---------------------- |
| `gender`   | TEXT | NULL ok    | Stored as enum literal |
| `birthday` | TEXT | NULL ok    | ISO `YYYY-MM-DD`       |

`name` is already on the `user` table (NOT NULL, owned by better-auth). It continues to be written via the same column.

### Migration approach

This project has no migration tool — `lib/db.ts` bootstraps schema via `CREATE TABLE IF NOT EXISTS` at import time. To match that convention:

1. Extend the `user` `CREATE TABLE IF NOT EXISTS` statement so fresh installs include `gender` and `birthday` from the start.
2. Immediately after that statement, add an idempotent block that introspects the existing table (`PRAGMA table_info(user)`) and runs `ALTER TABLE user ADD COLUMN gender TEXT` / `ALTER TABLE user ADD COLUMN birthday TEXT` only for any column that is missing. This makes startup safe on both fresh databases and the existing `data/app.db`.

**Alternatives considered**

- _Separate `user_profile` table_ with `userId` FK. Cleaner isolation from better-auth's table, but adds a JOIN on every settings/session-adjacent read and complicates the existing `removeAccount` cascade. **Rejected** — cost outweighs benefit for two scalar columns.
- _Single JSON `profile` column._ Flexible, but loses zod-level type guarantees, fails to index cleanly, and removes the structural pressure that keeps profile fields explicit. **Rejected.**
- _External migration tool_ (drizzle-kit / kysely). Significant tooling churn for two columns; out of step with the rest of the project. **Rejected.**

## Validation (`lib/validation.ts`)

New `updateProfileSchema` (zod):

```ts
const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const;

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  gender: z.enum(GENDERS),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      const min = new Date('1900-01-01');
      return d <= today && d >= min;
    }, 'Birthday must be a real date between 1900-01-01 and today'),
});
```

The `name` value is later sanitized with `DOMPurify.sanitize(name, { ALLOWED_TAGS: [] })` (matching note titles) before persisting.

## Server action (`app/settings/actions.ts`)

Add `updateProfile(prevState, formData) -> { success?: boolean; error?: string; fieldErrors?: Record<string, string> }`:

1. Resolve session via `auth.api.getSession({ headers: await headers() })`. On miss, redirect to `/authenticate` (mirrors `removeAccount`).
2. Build the input object from `formData`, then `updateProfileSchema.safeParse(...)`. On failure, return `{ error: 'Invalid input', fieldErrors: zodErrorMap }` for inline display.
3. Sanitize `name` via DOMPurify.
4. Run a single parameterised UPDATE keyed by `session.user.id` (never the form):
   ```sql
   UPDATE user
      SET name = ?, gender = ?, birthday = ?, updatedAt = datetime('now')
    WHERE id = ?
   ```
5. `revalidatePath('/settings')` so the freshly persisted values render on the next read.
6. Return `{ success: true }` so the form can show a transient "Saved" indicator.

Security notes:

- The action **never** trusts a `userId` from the form. The `WHERE id = ?` parameter comes from `session.user.id`.
- Inputs are validated before they touch SQL. SQL is parameterised (`db.run('... ?', [...])`) — no template-string interpolation.

## Page (`app/settings/page.tsx`)

Stays a Server Component. Today it only needs `session.user.email`. Now it also needs the persisted `gender` and `birthday`, so:

1. After the auth check, run `db.query('SELECT name, gender, birthday FROM user WHERE id = ?').get(session.user.id)` to fetch the current profile.
2. Pass the row into a new `<ProfileForm>` client component as `defaultValues`.

Page layout: insert the Profile `<section>` between the page `<h1>` and the existing Email `<section>`. Email and Danger-zone sections are unmodified.

## Form component (`app/settings/profile-form.tsx`)

New `'use client'` component, following the shape of `RemoveAccountForm`:

- Props: `defaultValues: { name: string; gender: string | null; birthday: string | null }`.
- `useActionState(updateProfile, initialState)` for the action.
- Three controlled inputs (or uncontrolled with `defaultValue`), one per field, each rendering its `fieldErrors[field]` inline beneath the input.
- A single "Save profile" submit button, disabled while `isPending`.
- A transient "Saved" message rendered next to the submit button when `state.success`. Cleared on the next input change so it doesn't lie about staleness.
- Uses Tailwind v4 semantic tokens (`text-foreground/60`, `border-border`) consistent with the rest of `/settings`.

## Testing

All tests use vitest, matching the existing project convention. **No E2E / Playwright** — explicitly out of scope.

### `__tests__/lib/validation.test.ts` (extending existing file)

Tests for `updateProfileSchema`:

- Valid input passes (typical case).
- Missing any one of name / gender / birthday → fails.
- `name` empty after trim → fails.
- `name` longer than 100 chars → fails.
- `gender` not in the enum → fails.
- `birthday` wrong format → fails.
- `birthday` in the future → fails.
- `birthday` before 1900-01-01 → fails.
- `birthday` exists but is calendar-invalid (e.g. `2026-02-30`) → fails.

### `__tests__/app/settings/actions.test.ts` (new)

Tests for `updateProfile`:

- Unauthenticated request → redirects to `/authenticate`, no DB writes.
- Authenticated + invalid input → returns `{ error, fieldErrors }`, no DB writes.
- Authenticated + valid input → updates exactly the session-user's row, returns `{ success: true }`.
- Authenticated + valid input → `name` is sanitized (HTML / script content stripped before persist).
- The action **never** uses any user identifier from the form.

### `__tests__/components/profile-form.test.tsx` (new)

Tests for `<ProfileForm>`:

- Renders with provided `defaultValues` prefilled in each input.
- Shows inline error messages from `state.fieldErrors`.
- Shows the "Saved" indicator when `state.success` is true.
- Submit button is disabled while pending.

## Risks and open questions

- **better-auth `name` column** — we're writing to a column owned by better-auth's adapter. Direct SQL UPDATE is what the rest of this project also does for similar fields, and there's no client-side better-auth cache to invalidate. Documented here so the implementer doesn't get surprised.
- **DOMPurify in a server-only context** — already used elsewhere in the project (`lib/sanitize.ts`), so no new dependency.
- **Time-zone handling for `birthday`** — `<input type="date">` produces a calendar date with no timezone; we store and compare it as a plain ISO string. No conversion needed.

## Acceptance criteria

1. Visiting `/settings` while signed in displays a Profile section above Email with three prefilled inputs (Name / Gender / Birthday).
2. Submitting the Profile form with all three valid values updates the user's `user` row and shows a "Saved" indicator.
3. Submitting with any field invalid or empty surfaces an inline error and writes nothing to the DB.
4. The action redirects unauthenticated requests to `/authenticate`.
5. `bun run test:run` is green; new tests at the validation, action, and component layers all pass.
