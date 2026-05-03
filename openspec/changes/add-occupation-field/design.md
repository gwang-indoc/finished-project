## Context

The Profile section at `/settings/profile` collects Name, Gender, and Birthday. A fifth column, `occupation`, is being added to round out the user's basic identity information. The existing pattern for optional profile fields (`gender`, `birthday`) is well-established across `lib/db.ts`, `lib/validation.ts`, `app/settings/actions.ts`, `app/settings/profile-form.tsx`, and `app/settings/profile/page.tsx`. This change follows that pattern exactly.

Reference: `docs/superpowers/specs/2026-05-03-add-occupation-field-design.md`

## Goals / Non-Goals

**Goals:**
- Add an optional `occupation` text field to the Profile section
- Store it as a nullable TEXT column on the `user` table
- Validate at the server action boundary (max 100 chars, trimmed, sanitized)
- Display it in `ProfileFormView` after Birthday

**Non-Goals:**
- Displaying occupation outside `/settings/profile`
- Dropdown / enum values
- Character counter in the UI
- Making the field required

## Decisions

### Decision 1: Free text, not enum

**Choice:** Plain `<input type="text">`, not a `<select>`.

**Alternatives considered:**
- Predefined dropdown (e.g., "Engineer", "Designer", "Student", …) — rejected because the set of occupations is open-ended; any fixed list would frustrate users whose role isn't on it, and maintenance overhead is high.

**Rationale:** Free text is more inclusive, zero maintenance, and consistent with how `name` is handled.

### Decision 2: Empty string stored as NULL

**Choice:** After DOMPurify sanitization, `cleanOccupation || null` is passed to the DB UPDATE. An empty form submission stores NULL, not `""`.

**Alternatives considered:**
- Store `""` — semantically different from "not set" and harder to query against. All other optional profile fields use NULL for unset.

**Rationale:** Consistency with `gender` and `birthday` (both NULL when unset).

### Decision 3: Max 100 characters

**Choice:** `z.string().trim().max(100)`.

**Alternatives considered:**
- Max 200 chars — consistent with note titles, but occupation is a label, not a title; 100 covers "Senior Principal Software Engineer" with room to spare.

**Rationale:** 100 chars matches the Name field cap, keeps the constraint simple and predictable.

### Decision 4: Sanitize via DOMPurify strip-all

**Choice:** Same sanitization as `name` — `DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })`.

**Alternatives considered:**
- No sanitization (occupation is plain text) — rejected for defense in depth. If the value ever appears in a rendered context, tags must already be stripped.

**Rationale:** Uniform treatment of user-supplied text fields.

## Risks / Trade-offs

- **Existing DB rows** — users who signed up before this change have `occupation = NULL`. This is correct behavior (field is optional). The idempotent `ALTER TABLE ADD COLUMN` handles this.
- **No server-side length enforcement in DB** — SQLite TEXT has no length constraint; enforcement is purely at the zod layer. Acceptable: consistent with `name` and `gender`.

## Migration Plan

1. `lib/db.ts` bootstrap adds the column idempotently on next server start — no manual migration step.
2. Existing rows remain unchanged (NULL occupation).
3. No rollback concern: the column is additive and nullable.

## Open Questions

None. Design is fully specified.
