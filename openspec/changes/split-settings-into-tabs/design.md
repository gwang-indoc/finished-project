## Context

The current `/settings` page (`app/settings/page.tsx`) is a single Server Component that renders three stacked sections: Profile (name, gender, birthday), Email (read-only display), and a "Danger zone" containing the Remove account form. Mixing routine identity edits with a destructive action in the same view increases the chance of accidental clicks and leaves no room for additional settings categories without further crowding.

This change introduces a tabbed shell with two sub-routes — `/settings/profile` and `/settings/account` — sharing a common layout that runs the auth gate and renders a left-side sidebar. The brainstorming spec at `docs/superpowers/specs/2026-05-03-split-settings-into-tabs-design.md` is the primary input and contains the visual mockups and tab-label rationale.

Tech context: Next.js 16 App Router on Bun, React 19, Tailwind v4 semantic tokens. Pages default to Server Components; the only client component this change introduces is the sidebar (because it needs `usePathname()` for active-tab highlighting). All existing components (`<ProfileForm>`, `<RemoveAccountForm>`) and server actions (`updateProfile`, `removeAccount`) are reused as-is — this is a structural refactor, not a behavior change.

## Goals / Non-Goals

**Goals:**

- Separate destructive account actions (Remove account) from routine settings (Profile, Email) using sub-routes and a shared sidebar.
- Preserve the existing global-header `Settings` link unchanged by redirecting `/settings` → `/settings/profile`.
- Establish a reusable shell pattern that future settings categories can plug into without further structural change.
- Keep the auth gate as a single check at the layout level rather than duplicating it in each sub-page.

**Non-Goals:**

- Adding any tabs beyond Profile and Account in this change.
- Modifying the Remove account flow (form, server action, confirmation modal, success/error UX).
- Making the Email field editable.
- Tab persistence in query strings or localStorage — sub-routes are the persistence.
- Introducing a UI library for tabs/sidebar.
- Changing the global header.

## Decisions

### D1: Sub-routes vs client-side tabs vs query string

**Choice:** Sub-routes (`/settings/profile`, `/settings/account`) with `/settings` as a server-side redirect.

**Alternatives considered:**

- **Client-side tab state on a single `/settings` route.** Simpler to implement (one page, `useState`), but breaks deep linking, browser Back/Forward, and shareable URLs. A user landing on `/settings` from a Slack message can never link directly to "the Account tab" of someone's settings. Also forces the page to be a Client Component, losing the Server Component default.
- **Query-string driven tabs (`/settings?tab=profile`).** Solves deep linking but conflates the URL meaning ("which page are you on?") with UI state, and Next.js App Router idiomatically uses route segments for this. Two sources of truth (the param + the rendered tab) is a small but real source of bugs.
- **Sub-routes (chosen).** Each tab is a Server Component page, no client-side tab state at all, deep linking and browser history work naturally. The shared layout (`app/settings/layout.tsx`) renders the sidebar shell once. The trade-off — adding a redirect for the bare `/settings` route — is one line of code.

### D2: Auth-gate placement

**Choice:** Move the auth check from `page.tsx` up to a new `app/settings/layout.tsx`. Both child pages still independently call `auth.api.getSession` for their own data needs; the gate ensures unauthenticated users never reach the children.

**Alternatives considered:**

- **Repeat the auth check in each sub-page.** Works, but duplicates the redirect logic. If the redirect target ever changes (e.g., to a different login page), three files need editing instead of one.
- **Middleware-based auth gate.** Overkill for a single route prefix — adds a new file, runs on every request including for routes that don't need it, and Next.js middleware has different ergonomics (edge runtime, no `headers()` helper).
- **Layout-level gate (chosen).** Layouts in App Router are Server Components and CAN call `redirect()`. A single auth check at the layout protects every child. Children re-fetch the session for their own typed access, which is cheap (better-auth caches within a request).

### D3: Sidebar component — Server vs Client

**Choice:** Sidebar is a Client Component (`'use client'`) that calls `usePathname()` to mark the active tab.

**Alternatives considered:**

- **Server Component sidebar that receives the active route via props from the layout.** Layouts in App Router don't have direct access to the current pathname (only nested pages do). The pattern would require each child page to pass its pathname into a slot — fragile and verbose.
- **Server-rendered sidebar with no active state, and let each tab page render its own breadcrumb.** Loses the visual affordance of "you are here" in the sidebar itself, which is the main reason to have the sidebar.
- **Client Component using `usePathname` (chosen).** A single import (`next/navigation`'s `usePathname`), eight or so lines of JSX, and the sidebar is fully self-sufficient. The "use client" boundary stays small — content panes remain Server Components.

### D4: Tab labels — "Profile" + "Account" vs other options

**Choice:** "Profile" and "Account".

**Alternatives considered:**

- **"Settings" + "Account"** — creates a recursive "Settings tab inside /settings" mental model that confuses the page hierarchy.
- **"Profile" + "Danger zone"** — accurate but visually loud; the "Danger zone" label belongs on the section heading inside the tab, not on the navigation label that the user sees every time they open Settings.
- **"Profile" + "Account" (chosen)** — "Profile" describes identity attributes (matches what's actually in the section); "Account" leaves room to grow if password change, 2FA, sessions, or API keys are added later, without renaming the tab.

### D5: Page-heading placement

**Choice:** Move `<h1>Settings</h1>` from the current `page.tsx` up to `layout.tsx` so the heading persists across both tabs.

**Alternative considered:** Have each child page render its own `<h1>` ("Profile" / "Account"). This is simpler in isolation but means the page header changes when the user clicks tabs, which feels jumpy and loses the "Settings is the umbrella" framing. Keeping a stable `<h1>Settings</h1>` and using sidebar labels for the tab name reads better.

## Risks / Trade-offs

- **Risk:** Existing test in `__tests__/app/settings/page.test.tsx` asserts that the page renders Profile + Email + Danger zone in a specific order. After the change, the bare `/settings` page is a redirect with no content. → **Mitigation:** Replace the test with a redirect assertion; add new test files for `/settings/profile` and `/settings/account` covering their respective content.
- **Risk:** The brainstorming spec lists Email as part of the Profile tab. If a future change wants Email on its own tab (e.g., for email-change flows), this requires another route restructure. → **Mitigation:** Acceptable for now — Email is read-only and grouping it with identity attributes makes sense. The sub-route pattern established here makes the future move cheap.
- **Risk:** Server-side redirect from `/settings` to `/settings/profile` breaks any external monitoring or e2e tests that POST to `/settings`. → **Mitigation:** None exist in this codebase; the page is GET-only. Documented here so a future contributor sees the assumption.
- **Trade-off:** Adding a layout file means an extra `auth.api.getSession` call vs. one in the page (because each child page re-checks for typed access). The cost is a single in-memory session lookup, which better-auth caches within a request — negligible.

## Migration Plan

This is a structural refactor without a database change, so there is no migration in the data sense. Deployment is a single commit:

1. Add `app/settings/layout.tsx`, `app/settings/settings-sidebar.tsx`, `app/settings/profile/page.tsx`, `app/settings/account/page.tsx`.
2. Replace `app/settings/page.tsx` content with `redirect('/settings/profile')`.
3. Update tests in `__tests__/app/settings/`.

Rollback: revert the commit. No data state to undo.

## Open Questions

None at design time. Implementation can proceed.
