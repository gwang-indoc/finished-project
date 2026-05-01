## Why

The `text-utilities` capability already provides `slugify` and `wordCount`. Two more plain-text helpers are commonly needed when surfacing notes (preview cards, list rows, share previews): a length-bounded truncation with an ellipsis, and a coarse reading-time estimate. Adding them now keeps text manipulation centralized in `lib/` rather than open-coding it at call sites later.

This change also serves as a smoke test for `superpowers:subagent-driven-development`: the two helpers live in disjoint files with disjoint tests and can be implemented in parallel by separate subagents.

## What Changes

- Add `truncate(input: string, maxLength: number): string` in `lib/truncate.ts` that returns the input unchanged when its length is `<= maxLength`, otherwise returns the input cut to `maxLength` characters with a single trailing `…` (U+2026) replacing the last character of the cut so the returned string's length is exactly `maxLength`.
- Add `readingTime(input: string): number` in `lib/reading-time.ts` that returns an estimated reading time in whole minutes (rounded up) at 200 words per minute, reusing the existing `wordCount` helper. Empty or whitespace-only input returns `0`.
- Add unit tests at `__tests__/lib/truncate.test.ts` and `__tests__/lib/reading-time.test.ts`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `text-utilities`: add two new requirements — a string truncation helper and a reading-time estimator — alongside the existing `slugify` and `wordCount` helpers.

## Impact

- **New files**: `lib/truncate.ts`, `lib/reading-time.ts`, `__tests__/lib/truncate.test.ts`, `__tests__/lib/reading-time.test.ts`.
- **Touched files**: none — both helpers are additive and do not modify existing code paths.
- **Dependencies**: none. Uses only the existing `wordCount` import.
- **Routes / DB / UI**: no changes. Pure backend lib code.

## Non-Goals

- No call sites are wired up in this change. Surfacing truncated previews or reading-time badges in the UI is out of scope and will be proposed separately if needed.
- Locale-aware reading speed, language detection, or sentence-boundary–aware truncation are all out of scope. The 200 wpm constant and character-count truncation are deliberately simple.
- No changes to `slugify` or `wordCount`.
