## Why

The `/settings` page today is a single vertical scroll with three stacked sections — Profile, Email, and a red "Danger zone" containing the Remove account form. Mixing routine identity edits with a destructive, irreversible action in the same view increases the chance of accidental clicks and crowds the page as more settings categories are added later. Splitting Remove account into its own tab visually and structurally separates safe edits from destructive ones, and establishes a tabbed shell that future categories (notifications, sessions, etc.) can plug into without further restructuring.

This proposal is grounded in the brainstorming session captured in `docs/superpowers/specs/2026-05-03-split-settings-into-tabs-design.md`.

## What Changes

- Convert `/settings` from a single page to a tabbed shell with a left-side vertical sidebar at `≥md` breakpoint, stacking above the content at narrower widths.
- Introduce two sibling routes: `/settings/profile` (Profile + Email) and `/settings/account` (Remove account).
- The bare `/settings` route becomes a server-side redirect to `/settings/profile` so the existing header "Settings" link continues to work without modification.
- Lift the auth gate from `app/settings/page.tsx` up to a new `app/settings/layout.tsx` that wraps both child routes and renders the sidebar shell.
- The page heading `<h1>Settings</h1>` moves into `layout.tsx` so it persists across both tabs.
- Tab labels: "Profile" (Profile + Email) and "Account" (Danger zone + Remove account form).

## Capabilities

### New Capabilities

_None — this change reorganizes existing functionality._

### Modified Capabilities

- `account-management`: the existing requirements describing the structure of `/settings` (a single page that "displays the user's email address and an account-removal form", with the visual order "page heading, Profile section, Email section, Danger zone") need updating. After this change, `/settings` redirects to `/settings/profile`, the email and account-removal form live on separate sub-routes, and the visual order claim no longer applies because the sections are no longer co-located.

## Impact

- **Routes:** new `/settings/profile` and `/settings/account` routes; `/settings` becomes a redirect.
- **Files added:** `app/settings/layout.tsx`, `app/settings/settings-sidebar.tsx`, `app/settings/profile/page.tsx`, `app/settings/account/page.tsx`.
- **Files modified:** `app/settings/page.tsx` (collapses to a one-line `redirect`).
- **Files reused as-is:** `app/settings/actions.ts`, `app/settings/profile-form.tsx`, `app/settings/remove-account-form.tsx`.
- **Tests:** existing `__tests__/app/settings/page.test.tsx` is rewritten as a redirect assertion; new test files cover layout, sub-pages, and sidebar active-tab behavior.
- **No schema, no server-action, no auth-gate semantics changes.** The Remove account flow itself is byte-for-byte identical post-change.
- **Header:** unchanged. The "Settings" link still points to `/settings`.

## Non-Goals

- Not adding any new tabs beyond Profile and Account in this change.
- Not modifying the Remove account flow (form, server action, success/error UX, modal pattern, or session-trusted user-id logic).
- Not making the Email field editable — it stays a read-only display.
- Not introducing tab persistence via query strings or localStorage — sub-routes are the persistence.
- Not adding a UI library for the sidebar — raw Tailwind, consistent with the rest of the codebase.
- Not changing the global header in any way.
