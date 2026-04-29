# Help Link Style — Welcome Page

**Date:** 2026-04-29
**Status:** Implemented

## Context

The welcome page (`app/page.tsx`) gained a Help link in the top-right corner via the `add-help-page` openspec change. The original implementation rendered the link as small gray text. This design captures the decision to refine that visual treatment.

## Decision

The Help link in the top-right corner of the welcome page renders as an **icon + text** combination:

- A small circular badge containing a `?` (question-mark)
- The label `Help` immediately after
- Muted color (`text-foreground/60`) so it stays secondary to the Log in / Sign up CTAs
- Hover state lifts to full foreground color

## Alternatives Considered

Four styles were mocked up in the visual companion and reviewed side-by-side:

- **A. Plain text link** — current, minimal but easy to miss
- **B. Outlined pill button** — looks more clickable but starts to compete with CTAs
- **C. Icon + text** ← **selected** — recognizable affordance, still secondary
- **D. Icon-only circle** — most compact but unlabeled "?" is ambiguous

Option C balances discoverability (icon adds recognition) with restraint (still small, still muted, still in the corner away from primary CTAs).

## Implementation

Single change in `app/page.tsx`:

```tsx
<Link
  href='/help'
  className='inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground'
>
  <span className='inline-flex h-4 w-4 items-center justify-center rounded-full border border-foreground/40 text-[10px] font-bold'>
    ?
  </span>
  Help
</Link>
```

Position (`absolute top-4 right-6`) and routing (`/help`) are unchanged from the prior `add-help-page` change.

## Scope

- Welcome page only (`app/page.tsx`).
- No changes to `/help` page content, layout, or routing.
- No new components, no new dependencies.

## Verification

Dev server (`bun run dev`) confirmed:
- `/` returns HTTP 200 with the new icon + text rendered in the top-right corner
- `/help` still returns HTTP 200 with no regression
