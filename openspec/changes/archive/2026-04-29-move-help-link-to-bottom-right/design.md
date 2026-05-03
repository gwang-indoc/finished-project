## Context

The welcome page (`app/page.tsx`) is a Server Component with a centered hero (title, tagline, Log in / Sign up CTAs) and a single secondary affordance: a Help link wrapped in `<div className='absolute top-4 right-6'>`. The link itself uses the icon-badge + text treatment captured in `docs/superpowers/specs/2026-04-29-help-link-style-design.md`. The product preference is to keep that visual treatment but reposition the link to the bottom-right corner, leaving the top of the page uncluttered.

The brainstorming spec at `docs/superpowers/specs/2026-04-29-help-link-position-design.md` is the primary input for this design — the position decision and alternatives review (top-right vs. bottom-right via the visual companion) are captured there. This document focuses on the technical mechanics inside the repo.

## Goals / Non-Goals

**Goals:**

- Move the Help link to the bottom-right corner of the welcome page with a single Tailwind class swap.
- Update the `welcome-page` capability spec so the requirement and "User sees Help link" scenario reference the bottom-right corner instead of the top-right.
- Keep `app/page.tsx` a Server Component (no `'use client'` introduced).
- Keep the change small enough to review at a glance.

**Non-Goals:**

- Restyling the link (badge size, label, hover state, color tokens stay as-is).
- Touching `/help` or any other route.
- Adding new components, utilities, or dependencies.
- Adding tests beyond what the existing scenarios already cover (no behavior is being added — only positional class wording).

## Decisions

### Decision 1: One-line className swap, no extraction into a component

Change `<div className='absolute top-4 right-6'>` to `<div className='absolute right-6 bottom-4'>`. Leave the inner `<Link>` untouched.

**Alternatives considered:**

- _Extract a `HelpCornerLink` component._ Would be premature — there's exactly one usage and no second site asking for it. YAGNI.
- _Use a layout-level slot (e.g., a corner-anchored helper rendered in `app/layout.tsx`)._ Out of scope: the Help link is welcome-page-specific today, and a layout-level slot expands the blast radius for a positional tweak.

The class-swap fits the existing pattern — the welcome page is already a flat, single-file Server Component with absolute-positioned children. Adding indirection for one element makes the file harder to scan, not easier.

### Decision 2: Update the existing `welcome-page` requirement instead of adding a new one

The requirement name in `openspec/specs/welcome-page/spec.md` currently encodes the position ("…in the top-right corner"). Two operations are needed: rename the requirement (top-right → bottom-right in the header) and modify the requirement text plus the "User sees Help link" scenario wording. The "Help link navigates to help page" scenario is unchanged.

The delta uses `RENAMED Requirements` (FROM/TO) for the header change followed by `MODIFIED Requirements` under the new name, carrying the full updated requirement body and both scenarios. This preserves history through the archive step and avoids the loss-of-detail pitfall called out in the openspec instructions.

**Alternatives considered:**

- _REMOVED + ADDED._ Cleaner-looking delta, but loses the lineage between the old and new requirement at archive time. Since this is the same capability being repositioned (not deprecated and reintroduced), RENAMED + MODIFIED is the correct shape.
- _Keep the requirement name generic ("…in a designated corner") and only MODIFY the body._ Tempting but vague — capability specs in this project encode the meaningful positional choice in the requirement name (the "top-right corner" naming was deliberate), and a generic name hides the regression we're trying to prevent.

### Decision 3: No new tests

The existing welcome-page scenarios cover both required behaviors (Help link is rendered; Help link navigates to `/help`). The spec change is wording-only on the first scenario; the second scenario is unchanged. There is no new behavior to assert, so the TDD checkpoint in tasks.md verifies the existing scenarios still pass after the class swap rather than RED-failing-test-first for a new test.

**Alternatives considered:**

- _Add a frontend RTL test asserting the link is positioned at the bottom-right._ Tailwind classnames are not testable through DOM assertions in a useful way (you'd be asserting `bottom-4` is in `className`, which restates the implementation). Skipped.

## Risks / Trade-offs

- **[Risk]** Bottom-right corners can collide with browser scroll bars on very short viewports or with chat/widget bubbles if any are added later. **→ Mitigation:** the welcome page has no scroll under normal viewport sizes (centered hero, no overflow) and no widget infrastructure. Re-evaluate if either is introduced.
- **[Risk]** The visual companion mockup confirmed the bottom-right placement reads cleanly with the current centered hero, but a future redesign that lengthens the hero could push the CTAs into visual proximity with the Help link. **→ Mitigation:** out of scope; revisit at the redesign.
- **[Trade-off]** Discoverability shifts from "first thing seen at the top" to "discoverable after the hero is read." That is the explicit product intent of this change.

## Migration Plan

No migration. This is a static positional className change with a wording-only spec update. Deploy by merging; rollback by reverting the commit. No data, no flags, no staged rollout.

## Open Questions

None.
