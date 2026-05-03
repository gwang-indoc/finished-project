# Split /settings into Profile + Account tabs — Design Spec

**Date:** 2026-05-03
**Author:** Brainstorming session, approved 2026-05-03
**Status:** Approved — ready for `/opsx:propose` artifact generation

## Goal

Move the Remove-account form out of the current monolithic `/settings` page and into a separate left-sidebar tab, so that destructive account actions are visually and structurally separated from routine profile/email settings.

## Approach

Convert `/settings` from a single page to a tabbed layout with a vertical left sidebar. Two tabs: **Profile** (name, gender, birthday, email) and **Account** (Remove account form). Each tab is its own Next.js sub-route, sharing a common layout that renders the sidebar shell and runs the auth gate.

This is the standard "settings shell" pattern used by Stripe, GitHub, Notion. Considered and rejected: (a) a separate top-level `/account` route with a new header link — adds nav clutter and makes the conceptual boundary fuzzy; (b) client-side tab state without route changes — loses deep-linking and breaks browser history.

## Architecture

```
/settings
  ├─ layout.tsx          (Server Component: auth gate + sidebar shell)
  ├─ page.tsx            (redirect → /settings/profile)
  ├─ settings-sidebar.tsx (Client Component: usePathname for active tab)
  ├─ actions.ts          (existing — unchanged)
  ├─ profile-form.tsx    (existing — unchanged)
  ├─ remove-account-form.tsx (existing — unchanged)
  ├─ profile/
  │   └─ page.tsx        (Profile + Email sections)
  └─ account/
      └─ page.tsx        (Danger zone + Remove account)
```

### Routing

| URL                 | Behavior                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `/settings`         | Server-side `redirect('/settings/profile')`. Keeps the header "Settings" link working without changes. |
| `/settings/profile` | Renders Profile (name/gender/birthday) + Email sections.                                               |
| `/settings/account` | Renders Danger zone + `<RemoveAccountForm>`.                                                           |

### Auth gate

Lifted from `page.tsx` up to `layout.tsx`. The layout calls `auth.api.getSession({ headers: await headers() })` once; on miss, `redirect('/authenticate')`. Both child pages still re-fetch the session for their own data needs (better-auth caches within a request, so this is cheap).

### Sidebar component

`settings-sidebar.tsx` is a `'use client'` component because it needs `usePathname()` for active-tab highlighting. It renders two `<Link>`s pointing to `/settings/profile` and `/settings/account`. Layout passes nothing to it — pathname is read directly.

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/account', label: 'Account' },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  // render <Link>s; active when pathname === tab.href
}
```

## Visual / layout

### Sidebar styling (Tailwind v4 semantic tokens)

- **Active tab:** `bg-foreground/10 font-medium text-foreground`.
- **Inactive tab:** `text-foreground/60 hover:bg-foreground/5 hover:text-foreground`.
- **Padding:** `px-3 py-2` per tab; rounded `rounded-md`.

### Page layout

- **≥md (≥768px):** `<div class="flex gap-6 p-8">` with `<aside class="w-44 flex-none">` sidebar and `<div class="flex-1">` content.
- **<md:** sidebar stacks above content (`flex-col md:flex-row`); tabs render as a horizontal pill row.

### Page heading

The `<h1>Settings</h1>` heading currently inside `page.tsx` moves up to `layout.tsx` so it's persistent across both tabs.

## Tab labels — rationale

- **"Profile"** rather than "Settings" — avoids the recursive "Settings tab inside /settings". Accurately describes the content (identity attributes).
- **"Account"** rather than "Danger zone" or "Remove account" — leaves room to grow (future password change, 2FA, sessions, etc.) without renaming.

## Behavior unchanged

- Header "Settings" link continues to point to `/settings`. The redirect handles the rest.
- Server actions `updateProfile` and `removeAccount` stay in `app/settings/actions.ts`. Both child pages import from this single file.
- `<ProfileForm>` and `<RemoveAccountForm>` are reused as-is, just rendered from different parent pages.
- Email displays as a read-only field on the Profile tab (same `<p>` as today, no editing).

## Testing strategy

| Test file                                          | What it verifies                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `__tests__/app/settings/page.test.tsx`             | Replace existing test: assert redirect to `/settings/profile`.                                                          |
| `__tests__/app/settings/layout.test.tsx`           | Auth gate redirects to `/authenticate` when no session; renders the sidebar + children when authenticated.              |
| `__tests__/app/settings/profile/page.test.tsx`     | Renders Profile + Email sections; passes correct defaults to `<ProfileForm>`.                                           |
| `__tests__/app/settings/account/page.test.tsx`     | Renders Danger zone heading + `<RemoveAccountForm>` with the correct `userEmail` prop.                                  |
| `__tests__/app/settings/settings-sidebar.test.tsx` | Mock `usePathname()` from `next/navigation`; assert active-tab class on `/settings/profile` and on `/settings/account`. |

### E2E (per project rule)

Per `openspec/config.yaml` (UI changes require an E2E task before verification-before-completion), `tasks.md` will include either:

- **Manual smoke test:** sign in → navigate to `/settings` → confirm redirect to Profile tab → click Account tab → confirm Remove account form appears → navigate back via browser Back → confirm Profile tab is active again.
- **Or Playwright MCP automation** if the runner has browser tools available, executing the same flow.

## What we are NOT doing (Non-goals)

- Not adding new tabs beyond Profile and Account in this change.
- Not changing the Remove account flow itself (form, server action, success/error UX all stay).
- Not adding a "Save" button to the Email field (Email stays read-only as today).
- Not adding tab persistence in a query string or localStorage — sub-routes ARE the persistence.
- Not introducing a UI library for the sidebar (raw Tailwind, consistent with the rest of the codebase).

## Open questions / risks

None at design time. The change is a structural refactor of an existing page; all the components that render content already exist.

One implementation note: when running tests for the new sub-pages, vitest must mock `next/navigation`'s `redirect` and `usePathname` consistently with how the existing `__tests__/app/settings/page.test.tsx` does it. Reuse the same mocking pattern.
