Invoke superpowers:subagent-driven-development to dispatch groups 1, 2 in parallel; one subagent per group. Group 3 runs sequentially after both groups 1 and 2 complete (it depends on the full test suite passing and on both source files being on disk for the diff review).

## 1. `slugify` helper

- [x] 1.1 RED — create `__tests__/lib/slug.test.ts` with vitest cases covering every scenario in `specs/text-utilities/spec.md` for the `slugify` requirement: ASCII basic (`'Hello World'` → `'hello-world'`), diacritics (`'café'` → `'cafe'`, `'naïve'` → `'naive'`), punctuation collapse (`'foo!!bar??baz'` → `'foo-bar-baz'`), leading/trailing trim (`'--hi--'` → `'hi'`, `'   spaces   '` → `'spaces'`), empty input (`''` → `''`), all-non-ASCII input (`'你好'` → `''`). Import via `import { slugify } from '@/lib/slug'`. Run `bun run test:run __tests__/lib/slug.test.ts` and confirm RED — the import resolves to a missing module.
- [x] 1.2 GREEN — create `lib/slug.ts` exporting `slugify(input: string): string` per `design.md` Decisions 1–3. Implementation chains `normalize('NFD')` → strip combining marks (`U+0300`–`U+036F`) → `toLowerCase()` → replace `[^a-z0-9]+` with `-` → strip leading/trailing `-`. No JSDoc, no comments, no dependencies (matches `lib/content.ts` style). Re-run `bun run test:run __tests__/lib/slug.test.ts` and confirm GREEN — every scenario from spec passes.
- [x] 1.3 Run superpowers:requesting-code-review on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. `wordCount` helper

- [x] 2.1 RED — create `__tests__/lib/wordcount.test.ts` with vitest cases covering every scenario in `specs/text-utilities/spec.md` for the `wordCount` requirement: empty (`''` → `0`), whitespace-only (`'   '` → `0`, `'\n\t  '` → `0`), single word (`'hello'` → `1`), multiple words (`'hello world'` → `2`), runs of whitespace (`'one  two   three'` → `3`), leading/trailing trim (`'  hello world  '` → `2`), newlines/tabs as separators (`'a\nb\nc'` → `3`, `'a\tb c'` → `3`). Import via `import { wordCount } from '@/lib/wordcount'`. Run `bun run test:run __tests__/lib/wordcount.test.ts` and confirm RED — the import resolves to a missing module.
- [x] 2.2 GREEN — create `lib/wordcount.ts` exporting `wordCount(input: string): number` per `design.md` Decision 4. Implementation: `const trimmed = input.trim(); if (trimmed === '') return 0; return trimmed.split(/\s+/).length;`. No JSDoc, no comments, no dependencies. Re-run `bun run test:run __tests__/lib/wordcount.test.ts` and confirm GREEN — every scenario from spec passes.
- [x] 2.3 Run superpowers:requesting-code-review on the diff for group 2; address CRITICAL/HIGH findings before moving on.

## 3. Verification & dev log

- [x] 3.1 Run `bun run lint` and confirm clean (no new violations introduced by either helper or its tests).
- [x] 3.2 Run `bun run test:run` and confirm all tests pass — the previous green count plus the new `slug` + `wordcount` cases (target: previous count + ~16 new).
- [x] 3.3 Smoke-test verification of the parallel-group rule (the secondary purpose of this change per `design.md` Context): confirm this `tasks.md` contains the top-of-file dispatch line `Invoke superpowers:subagent-driven-development to dispatch groups 1, 2 in parallel; one subagent per group.` If the line is missing, the bug is in the new `openspec/config.yaml` rule, not in this proposal — flag it in the dev log entry and open a follow-up rather than silently shipping.
- [x] 3.4 Append a new numbered entry to `docs/log/2026-04-30.md` per the Dev Log Practice in `CLAUDE.md` (commit hash, feature summary covering both helpers and the new `text-utilities` capability spec, code-review findings table summarizing groups 1–3, tests line including the two new test files, and an explicit note on whether the parallel-group rule produced the expected dispatch line).
- [x] 3.5 Run superpowers:verification-before-completion (fresh `bun run lint`, fresh `bun run test:run`, grep `lib/slug.ts` and `lib/wordcount.ts` for stray `console.log` or other debug code, diff review against `design.md` to confirm scope didn't drift — specifically that no caller wiring leaked in).
- [x] 3.6 Run superpowers:requesting-code-review on the diff for group 3; address CRITICAL/HIGH findings before moving on.
