## Context

The `text-utilities` capability currently exposes `slugify` (in `lib/slug.ts`) and `wordCount` (in `lib/wordcount.ts`). Both are pure, dependency-free functions covered by vitest unit tests under `__tests__/lib/`. This change adds two more pure helpers in the same shape — `truncate` and `readingTime` — and is also being used as a deliberate smoke test for `superpowers:subagent-driven-development`, since the two helpers can be implemented in disjoint files by independent subagents.

No brainstorming spec exists under `docs/superpowers/specs/` for this change because there is no UI surface; the design is captured here.

## Goals / Non-Goals

**Goals:**

- Add `truncate(input, maxLength)` and `readingTime(input)` as pure functions in `lib/`, each with its own vitest unit test.
- Keep both helpers fully independent (separate files, separate tests, no shared mutable state) so the implementation tasks can be dispatched in parallel via `superpowers:subagent-driven-development`.
- Reuse `wordCount` from `lib/wordcount.ts` inside `readingTime` rather than re-implementing word counting.

**Non-Goals:**

- No call sites are wired up. The new helpers are not consumed by any route, server action, or component in this change.
- No locale awareness, language detection, or sentence-boundary–aware truncation. The 200 wpm constant and character-count truncation are deliberately simple.
- No changes to `slugify` or `wordCount`. Their requirements stay frozen.
- No new npm dependency. Both helpers must work with built-ins plus the existing `wordCount` import.

## Decisions

### Decision 1: `truncate` cuts to exact length and replaces the last character with `…`

**Choice:** When `input.length > maxLength`, return `input.slice(0, maxLength - 1) + '…'` so the result's `.length` is exactly `maxLength` (the ellipsis is U+2026, a single UTF-16 code unit). When `input.length <= maxLength`, return `input` unchanged.

**Alternatives considered:**

- **Append `…` after `slice(0, maxLength)`**: simpler, but the returned string would be `maxLength + 1` long, which surprises callers who pass a hard upper bound (e.g., a database column width or a CSS line-clamp budget).
- **Word-boundary–aware truncation** (cut at the last whitespace before `maxLength`): nicer visually but introduces locale and tokenization concerns the rest of the capability has explicitly avoided.
- **Three-dot ASCII (`...`) instead of `…`**: takes 3 characters of the budget. The Unicode ellipsis is one character and renders identically across our targets.

**Rationale:** Keeping the result's length exactly `maxLength` matches the principle of least surprise for a function called "truncate" and is consistent with how callers tend to use it (bounded display widths). Picking U+2026 keeps the helper string-length friendly.

### Decision 2: `readingTime` reuses `wordCount` and rounds up at 200 wpm

**Choice:** `readingTime(input)` returns `Math.ceil(wordCount(input) / 200)` for non-empty input, and `0` when `wordCount(input)` is `0`.

**Alternatives considered:**

- **Round to nearest minute**: a 50-word note rounds to `0`, which feels wrong on a UI badge ("0 min read"). Ceiling never produces `0` for non-empty content.
- **Floor**: same problem as nearest, more aggressive.
- **Configurable wpm via parameter**: postpones a decision we don't need; can be added later without breaking callers.
- **Re-implement word splitting inside `readingTime`**: duplicates `wordCount`'s contract and risks divergence on edge cases (whitespace runs, tabs/newlines).

**Rationale:** 200 wpm is a widely-cited average for adult silent reading of plain prose; it's a coarse enough estimate that locale tuning is not yet warranted. Reusing `wordCount` means the two helpers stay consistent on what counts as a "word."

### Decision 3: Each helper lives in its own file under `lib/`

**Choice:** `lib/truncate.ts` and `lib/reading-time.ts`, with tests at `__tests__/lib/truncate.test.ts` and `__tests__/lib/reading-time.test.ts`.

**Alternatives considered:**

- **Single `lib/text.ts` module exporting all four helpers**: convenient but breaks the existing one-helper-per-file pattern set by `lib/slug.ts` and `lib/wordcount.ts`.
- **Group only `truncate` and `readingTime` together**: still inconsistent with the existing pattern, and would defeat the parallelism smoke test by giving both subagents the same file.

**Rationale:** Matching the existing one-file-per-helper layout keeps the capability's file structure predictable and is what makes the parallel-subagent smoke test meaningful — two file-disjoint units that satisfy `tasks.md`'s `[parallel]` rule cleanly.

## Risks / Trade-offs

- **Risk**: `truncate` operates on UTF-16 code units, so a `maxLength` that lands inside a surrogate pair could split an emoji. **Mitigation**: documented as out-of-scope; callers passing user-generated emoji content should pre-segment with `Intl.Segmenter` if grapheme-correct truncation is required. The current callers (note title/preview snippets) are not affected.
- **Risk**: The 200 wpm constant doesn't reflect non-English content or technical prose. **Mitigation**: stays a constant for now; a future change can add a parameter without breaking the current signature.
- **Risk**: `readingTime` depends on `wordCount`, so a future change to `wordCount` semantics propagates here. **Mitigation**: the two are part of the same capability and any change to `wordCount` already requires a spec delta — `readingTime`'s scenarios will be re-validated as part of that.
