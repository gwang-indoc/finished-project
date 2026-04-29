## Why

The welcome page currently renders the Help link in the top-right corner, where it sits above the centered hero on first view. The product preference is to move it to the bottom-right corner so the top of the page stays visually clean while keeping Help discoverable for users who finish reading the hero. Brainstorming has already validated this position via the visual companion; the resulting design spec is at `docs/superpowers/specs/2026-04-29-help-link-position-design.md`.

## What Changes

- Move the Help link wrapper in `app/page.tsx` from `absolute top-4 right-6` to `absolute right-6 bottom-4`. Inner `<Link>` markup, classes, icon badge, label, and hover state are unchanged.
- Update the `welcome-page` capability spec so the Help-link requirement and its first scenario reference the bottom-right corner instead of the top-right.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `welcome-page`: the requirement "Welcome page includes a Help link in the top-right corner" and its "User sees Help link" scenario change to reference the bottom-right corner. The link's existence, navigation target (`/help`), and visual separation from the Log in / Sign up CTAs are unchanged.

## Non-Goals

- No change to the Help link's visual treatment (icon badge + "Help" label + muted color stays as-is).
- No change to `/help` page content, layout, or routing.
- No change to the welcome page hero (title, tagline, Log in / Sign up CTAs).
- No new components, dependencies, or tests.

## Impact

- Code: `app/page.tsx` (single className edit).
- Specs: `openspec/specs/welcome-page/spec.md` (wording-only change).
- Brainstorming spec: `docs/superpowers/specs/2026-04-29-help-link-position-design.md` (already written, captures the position decision).
- No API, database, dependency, or test changes.
