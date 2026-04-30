# Add `slugify` and `wordCount` Helpers (Smoke Test for Parallel-Group Rule)

**Date:** 2026-04-30
**Status:** Approved (pending implementation)

## Context

Two motivations, one shipped together:

1. **Smoke-test the new `openspec/config.yaml` rules** added on 2026-04-30 that require the proposer to mark independent task units with ` [parallel]` and emit an `Invoke superpowers:subagent-driven-development …` dispatch line in `tasks.md`. The rule needs an actual change with provable independence to verify it fires.
2. **Stand up two zero-dep utility helpers** in `lib/` that are useful in their own right:
   - `slugify` — deterministic ASCII slug from arbitrary text (handy for future sharing/URL features beyond the existing `nanoid(16)` `notes.public_slug`).
   - `wordCount` — plain-text whitespace-tokenized word count.

Neither helper is wired into a current caller in this change. Wiring (e.g. exposing `wordCount` on note metadata, or replacing `nanoid` with a slug derived from the note title) is intentionally out of scope and would be a separate proposal.

The two helpers are mutually independent: separate files, no shared imports, no read/write overlap. That independence is exactly what the new config rule keys off.

## Decision

Add two pure-TypeScript modules under `lib/`, each with its own vitest file under `__tests__/lib/`. Style matches `lib/content.ts` — single named export, no JSDoc, no comments, no dependencies.

```ts
// lib/slug.ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

```ts
// lib/wordcount.ts
export function wordCount(input: string): number {
  const trimmed = input.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}
```

### `slugify` semantics

- Unicode normalization via `NFD`, then strip combining marks (`̀-ͯ`) — converts `café` → `cafe`, `naïve` → `naive`.
- Lowercase the entire string.
- Replace any run of non-`[a-z0-9]` characters with a single `-`.
- Strip leading/trailing `-`.
- Empty input or all-non-ASCII input collapses to `''`. Callers that need a non-empty slug must check for `''` and fall back themselves.

### `wordCount` semantics

- Plain text only. Whitespace-tokenized via `\s+` after `trim()`.
- Empty / whitespace-only input → `0` (avoids the off-by-one of `''.split(/\s+/).length === 1`).
- Does NOT walk Tiptap JSON. Note bodies in this project are Tiptap JSON; if a Tiptap-aware count is needed later, that's a separate helper (e.g. `wordCountTiptap` in `lib/content.ts` or a new module). Calling `wordCount` on the raw JSON string would count braces and field names, which is meaningless.

## Alternatives Considered

- **A. Plain-TS implementations (no deps)** ← **selected.** Matches project style (`lib/content.ts`, `lib/sanitize.ts`, etc. all hand-rolled). Smallest install footprint. Predictable behavior we own.
- **B. `slugify` npm package + a `word-count` package.** Rejected — adds dependencies for trivial logic, and `slugify`'s extensive locale options (`'sv'`, `'de'`, etc.) aren't needed for a smoke test or for the project's current English-only content.
- **C. Tiptap-aware `wordCount` that walks `lib/content.ts` parsed JSON.** Rejected for *this* change — adds coupling to Tiptap node shapes and would conflate the smoke test with a real feature. Worth a separate proposal once a caller exists (e.g. a per-note word count badge in the dashboard).
- **D. Inline `slugify` only at the future call site.** Rejected — even one call site benefits from a tested, reusable helper. The cost of `lib/slug.ts` over an inline arrow function is one file.

## Implementation

Two new source files and two new test files. No modifications to existing files. No schema changes. No new dependencies.

```
lib/slug.ts                   # new — exports slugify
lib/wordcount.ts              # new — exports wordCount
__tests__/lib/slug.test.ts    # new — covers slugify
__tests__/lib/wordcount.test.ts  # new — covers wordCount
```

Test cases (vitest, plain TS, no DOM):

**`slug.test.ts`**

- ASCII basic: `'Hello World'` → `'hello-world'`
- Diacritics: `'café'` → `'cafe'`, `'naïve'` → `'naive'`
- Punctuation collapse: `'foo!!bar??baz'` → `'foo-bar-baz'`
- Leading/trailing trim: `'--hi--'` → `'hi'`, `'   spaces   '` → `'spaces'`
- Empty input: `''` → `''`
- All-non-ASCII: `'你好'` → `''` (no fallback; caller's responsibility)

**`wordcount.test.ts`**

- Empty: `''` → `0`
- Whitespace-only: `'   '` → `0`, `'\n\t  '` → `0`
- Single word: `'hello'` → `1`
- Multiple words: `'hello world'` → `2`, `'one  two   three'` → `3`
- Leading/trailing whitespace: `'  hello world  '` → `2`
- Newlines as separators: `'a\nb\nc'` → `3`

## Scope

- `lib/slug.ts`, `lib/wordcount.ts` (new).
- `__tests__/lib/slug.test.ts`, `__tests__/lib/wordcount.test.ts` (new).
- One new capability spec under `openspec/specs/` named `text-utilities` (or similar — the proposer artifact picks the exact name) covering both helpers' contracts.
- **Out of scope:** any caller wiring (notes UI, dashboard badge, slug-based public URLs, etc.). No changes to `lib/db.ts`, `app/`, or `components/`.

## Verification

- `bun run test:run` — the existing test count plus the new cases (~8 per helper, 16 total — see Implementation section) all pass.
- `bun run lint` — clean.
- `bun run format` — clean (oxfmt).
- **Smoke-test verification of the parallel-group rule** (the secondary purpose of this change): the generated `tasks.md` MUST contain either `[parallel]` task tags + an `N.0 Invoke superpowers:subagent-driven-development …` line within a group, OR a top-of-file dispatch line listing the two groups. Absence of either marker is a bug in the rule, not in this proposal.

## Why this design supports the smoke test

The two helpers are deliberately chosen to be:

- **In separate files** (`lib/slug.ts`, `lib/wordcount.ts`) — no shared writes.
- **With no import relationship** — `wordCount` does not call `slugify` and vice versa.
- **With separate test files** — no shared test fixtures.
- **With no shared external dependency** — both depend only on the standard library.

That makes them textbook independent. If the proposer's rule does not flag them as parallel-safe, the rule itself needs adjustment.
