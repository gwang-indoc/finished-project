# Help Link Position — Welcome Page

**Date:** 2026-04-29
**Status:** Approved (pending implementation)

## Context

The welcome page (`app/page.tsx`) currently renders a Help link in the top-right corner (`absolute top-4 right-6`) using the icon-plus-text treatment captured in `2026-04-29-help-link-style-design.md`. The product preference is to move that link to the bottom-right corner so the top of the hero is uncluttered. The visual treatment (badge `?` + "Help" label, muted color) is unchanged — only the vertical position moves.

## Decision

The Help link on the welcome page renders in the **bottom-right corner**:

- Wrapper class changes from `absolute top-4 right-6` to `absolute right-6 bottom-4`
- Inner `<Link>` markup, classes, icon badge, label, and hover state are unchanged
- The hero (title, tagline, Log in / Sign up CTAs) stays vertically centered

## Alternatives Considered

A side-by-side mockup of the two positions was reviewed in the visual companion:

- **A. Top-right (current)** — established by the `add-help-page` change; familiar but slightly competes for attention with the hero on first view
- **B. Bottom-right (selected)** — keeps the link discoverable for users who finish reading the hero, leaves the top of the page visually clean, mirrors common "help" placements in lightweight web apps

Other corners were not considered: the link must stay on the right edge to remain visually separated from the centered Log in / Sign up CTAs, and bottom-left would be unusual for a Help affordance in a left-to-right layout.

## Implementation

Single change in `app/page.tsx`:

```tsx
// before
<div className='absolute top-4 right-6'>

// after
<div className='absolute right-6 bottom-4'>
```

The inner `<Link>` and its children (icon badge + "Help" label) are not modified.

The capability spec at `openspec/specs/welcome-page/spec.md` is updated so the requirement title, requirement statement, and the "User sees Help link" scenario reference the bottom-right corner instead of top-right. The "Help link navigates to help page" scenario is unchanged.

## Scope

- Welcome page only (`app/page.tsx`).
- Welcome page spec wording (`openspec/specs/welcome-page/spec.md`).
- No changes to `/help` page content, layout, or routing.
- No changes to the Help link's visual treatment.
- No new components, no new dependencies, no new tests (positional-class change with no behavior to assert beyond the existing scenarios).

## Verification

After implementation:

- `bun run dev` and confirm `/` returns HTTP 200 and renders the Help link in the bottom-right corner with the existing icon + text styling.
- `/help` continues to return HTTP 200.
- `bun run lint` passes.
