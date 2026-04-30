## Why

The project has no shared text-manipulation primitives in `lib/`. Two zero-dep helpers — `slugify` and `wordCount` — are useful as building blocks for future features (slug-based public URLs derived from note titles, per-note word-count badges, etc.) and serve as a self-contained smoke test for the new `openspec/config.yaml` parallel-group rule added on 2026-04-30, which requires the proposer to mark mutually independent task units with ` [parallel]` and emit an `Invoke superpowers:subagent-driven-development …` dispatch line in `tasks.md`.

## What Changes

- Add `lib/slug.ts` exporting `slugify(input: string): string` — deterministic ASCII slug via NFD normalization, combining-mark strip, lowercase, non-`[a-z0-9]` collapse to `-`, and edge-trim. Empty input or all-non-ASCII input returns `''`.
- Add `lib/wordcount.ts` exporting `wordCount(input: string): number` — plain-text whitespace-tokenized count after `trim()`. Empty / whitespace-only input returns `0`. Does NOT walk Tiptap JSON.
- Add `__tests__/lib/slug.test.ts` and `__tests__/lib/wordcount.test.ts` with vitest cases covering the documented edge cases.

## Capabilities

### New Capabilities

- `text-utilities`: Deterministic, dependency-free text helpers under `lib/`. Initial surface is `slugify` (URL slug from arbitrary text) and `wordCount` (whitespace-tokenized word count). Defines contract for future text-manipulation primitives so callers can rely on stable semantics.

### Modified Capabilities

<!-- None. The two helpers are new utilities not yet wired into any existing capability. -->

## Impact

- **New source files only.** No existing file is modified — `lib/db.ts`, `lib/sanitize.ts`, `lib/validation.ts`, `app/`, and `components/` are all untouched.
- **No dependencies added.** Both helpers use only the standard library.
- **No schema or migration.** No `lib/db.ts` change.
- **No callers wired.** Future proposals can adopt these helpers (e.g. replace `nanoid(16)` for `notes.public_slug` with a title-derived slug, or surface a per-note word count). Wiring is intentionally out of scope here.
- **Brainstorming spec:** see `docs/superpowers/specs/2026-04-30-add-slug-and-wordcount-helpers-design.md` for the design rationale, alternatives considered, and exact behavior contract. The OpenSpec spec under `openspec/specs/text-utilities/spec.md` will reference that doc but state the requirements in the canonical spec format.

## Non-Goals

- Wiring either helper into existing routes, components, or the dashboard.
- A Tiptap-aware word counter that walks parsed Tiptap JSON. Worth a separate proposal once a real caller exists.
- Replacing `nanoid(16)` in `notes.public_slug` with a title-derived slug. Requires uniqueness handling (collision detection, suffixing) that is out of scope here.
- An `Intl`-aware or locale-aware slugify (e.g. transliteration of Cyrillic, CJK). All-non-ASCII input returns `''` and the caller is responsible for fallback.
- A second-arg options object on either helper (max length, custom separator, locale). YAGNI until a caller needs it.
