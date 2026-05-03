## Context

Two zero-dep utility helpers (`slugify`, `wordCount`) are being added to `lib/`. The full design rationale lives in the brainstorming spec at `docs/superpowers/specs/2026-04-30-add-slug-and-wordcount-helpers-design.md` (committed at `5d58d1b`); this document captures the decisions that bear on the OpenSpec artifacts (specs, tasks).

The change has a secondary purpose beyond the helpers themselves: it is the smoke-test artifact for the parallel-group rules added to `openspec/config.yaml` on 2026-04-30 (lines 64–65). Those rules require the proposer to mark mutually independent task units with ` [parallel]` and emit an `Invoke superpowers:subagent-driven-development …` dispatch line in `tasks.md`. The two helpers were chosen specifically because they are textbook independent (separate files, no shared imports, no read/write overlap), so `tasks.md` should produce one of:

- One group per helper, with a top-of-file dispatch line listing both groups, OR
- One combined group with both RED+GREEN pairs marked `[parallel]` and an `N.0` dispatch line.

Either form proves the rule fires.

## Goals / Non-Goals

**Goals:**

- Add `slugify` and `wordCount` to `lib/` with vitest coverage of the documented edge cases.
- Establish a new `text-utilities` capability in `openspec/specs/` that future text-helper proposals can extend (delta-add new helpers without re-litigating the conventions).
- Exercise the new `openspec/config.yaml` parallel-group rule end-to-end — proposal → tasks.md → apply — to verify it produces the expected `[parallel]` markers and dispatch line.

**Non-Goals:**

- Wiring either helper into existing routes, components, or the dashboard.
- A Tiptap-aware `wordCountTiptap` that walks parsed Tiptap JSON. Worth a separate proposal.
- Replacing `nanoid(16)` in `notes.public_slug`. Requires uniqueness handling out of scope here.
- An `Intl`/locale-aware slugify (transliteration of Cyrillic/CJK/etc.). All-non-ASCII collapses to `''`; caller handles fallback.
- A second-arg options object on either helper. YAGNI until a caller needs it.

## Decisions

### Decision 1 — Two separate modules, not one combined `lib/text.ts`

Each helper lives in its own file (`lib/slug.ts`, `lib/wordcount.ts`). This is what makes the parallel-group rule applicable: separate files = no write conflicts when two subagents implement them.

**Alternatives:**

- **A. One file `lib/text.ts` with both exports.** Simpler import surface (`import { slugify, wordCount } from '@/lib/text'`) but defeats the parallel-implementation premise of the change — two subagents both writing to one file is a guaranteed conflict. Rejected on grounds that it undermines the smoke test and offers no real ergonomic win for two unrelated functions.
- **B. One file per helper** ← **selected.** Matches existing `lib/` shape (`lib/sanitize.ts`, `lib/validation.ts`, `lib/content.ts` are each one focused module). Enables independent implementation. Future text helpers can be added as their own modules or grouped if a real coupling emerges.

### Decision 2 — Plain-TypeScript implementations, no third-party deps

Both helpers are implemented with standard-library APIs only (`String.prototype.normalize`, `replace`, `toLowerCase`, `trim`, `split`).

**Alternatives:**

- **A. `slugify` npm package + a `word-count` package.** Rejected — the project's `lib/` follows a hand-rolled style throughout (`lib/sanitize.ts` wraps `isomorphic-dompurify` but the surrounding logic is hand-rolled; `lib/content.ts` is hand-rolled; `lib/validation.ts` uses `zod` which is the validation framework, not a primitive). Adding deps for ~5 lines of logic each is not a fit. The `slugify` package's locale options are also not needed for English-only content.
- **B. Plain TS** ← **selected.** Matches project style. Predictable, owned, zero install footprint.

### Decision 3 — Empty/all-non-ASCII slug returns `''`, not a fallback

`slugify('')`, `slugify('   ')`, `slugify('你好')` all return `''`. The function does not invent a fallback (e.g. `'untitled'` or a random ID).

**Alternatives:**

- **A. Throw on empty.** Rejected — pure utility helpers should not throw; it pushes try/catch into every caller.
- **B. Return a fallback like `'untitled'` or `nanoid(8)`.** Rejected — the helper does not know the caller's domain. A note titled `'你好'` should become `'untitled'`, but a tag named `'你好'` might want to surface a transliteration. Caller decides.
- **C. Return `''` and document it** ← **selected.** Trivial caller-side guard (`const s = slugify(title); if (!s) return fallback();`). Matches how `URL.canParse` and similar standard-library helpers signal "no result."

### Decision 4 — `wordCount` is plain-text, not Tiptap-aware

The helper takes a `string` and tokenizes on whitespace. It does NOT accept Tiptap JSON. Calling `wordCount(noteBodyJson)` would count braces and field names — the type system does not prevent this, the docstring/spec does.

**Alternatives:**

- **A. Single `wordCount` that detects Tiptap JSON and walks it.** Rejected — couples a generic helper to a specific document model, requires a JSON parse + node walker, and "auto-detect" is fragile (a note that happens to start with `{` would be misclassified).
- **B. Two helpers: `wordCount(string)` and `wordCountTiptap(json)`.** Future-friendly but the second helper has no caller today.
- **C. Plain-text only for now** ← **selected.** Adds the primitive. A Tiptap-aware variant can be added later as either a separate module or an export from `lib/content.ts` once a real caller (e.g. dashboard word-count badge) lands.

### Decision 5 — New capability `text-utilities` rather than extending an existing one

The four existing capabilities (`account-management`, `help-page`, `note-sharing`, `welcome-page`) are user-facing features, not infrastructure primitives. A capability for `lib/` text helpers belongs in its own bucket so future proposals can ADD requirements without polluting feature specs.

**Alternatives:**

- **A. Add to `note-sharing` since slugs are URL-shaped.** Rejected — the helper is generic, not coupled to sharing. If `note-sharing` later starts using `slugify`, that's a wiring change, not a capability merge.
- **B. New `text-utilities` capability** ← **selected.** Names what the capability covers; allows future text helpers (`pluralize`, `truncate`, etc.) to land as ADDED Requirements without spec sprawl.

## Risks / Trade-offs

| Risk                                                                                                                                 | Mitigation                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All-non-ASCII strings collapse to `''` and a caller forgets to handle that case, producing an empty slug somewhere user-visible.** | Spec scenarios explicitly cover `slugify('你好') === ''`. Tests will lock the behavior. Future caller proposals will need to specify their fallback.                                                                          |
| **A future caller that needs Tiptap-aware word counts uses `wordCount` on stringified JSON and gets nonsense numbers.**              | Spec scenarios pin `wordCount`'s contract to plain text. The `text-utilities` capability is the right place to add a `wordCountTiptap` requirement when a caller appears, with its own scenario covering Tiptap node walking. |
| **The smoke test produces a `tasks.md` without `[parallel]` markers, masking a bug in the new `config.yaml` rule.**                  | Verification step in tasks.md (and in the brainstorming spec) explicitly checks for the markers. If absent, the rule itself needs adjustment — file a follow-up rather than silently shipping.                                |
| **`String.prototype.normalize('NFD')` runtime cost on very long inputs.**                                                            | Negligible at note-title scale (typical ≤ 200 chars). If a caller ever passes a multi-MB string, that caller is the wrong place; document `slugify` as title-grade input. Not a real risk for current callers.                |

## Migration Plan

None — no schema change, no breaking change, no callers. The helpers can be deleted in a future proposal if they prove unused, since nothing depends on them at landing time.

## Open Questions

None — the brainstorming step resolved the behavior contract, edge cases, and scope boundaries. If a question surfaces during apply, pause and update this document per the existing `/opsx:apply` guardrails.
