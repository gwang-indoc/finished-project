## Context

The app is a Next.js 15 note-taking application. The welcome page (`app/page.tsx`) is a simple static page with Log in and Sign up links. There are no existing help or documentation pages.

## Goals / Non-Goals

**Goals:**
- Add a static `/help` page with feature documentation accessible without login.
- Add a Help link on the welcome page pointing to `/help`.

**Non-Goals:**
- In-app contextual tooltips or onboarding flows.
- Help content for authenticated users (e.g., dashboard-level help).
- CMS-driven or dynamic help content.

## Decisions

**Static page over dynamic content**
The help content is fixed documentation that doesn't change per-user. A static Next.js Server Component is the simplest approach — no data fetching, no auth required.

**Welcome page placement**
The Help link is positioned in the top-right corner of the welcome page using absolute/fixed positioning or a flex header row. This keeps it out of the primary CTA area (Log in / Sign up) while remaining discoverable.

**No separate layout**
The help page reuses the root layout to stay consistent with the rest of the app without introducing a new layout wrapper.

## Risks / Trade-offs

- [Content staleness] Help text may drift from actual app behavior over time → Keep content minimal and high-level so it doesn't need frequent updates.

## Migration Plan

Deploy as a normal feature — no migrations, no rollback concern. Both changes (new page, new link) are additive.
