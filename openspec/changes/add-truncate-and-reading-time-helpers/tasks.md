## 1. Implement truncate and readingTime helpers

- [x] 1.0 Invoke superpowers:subagent-driven-development to dispatch the [parallel] units in this group; one subagent owns one RED+GREEN pair (or one standalone task) end-to-end including self-review.
- [x] 1.1 RED — write failing vitest cases for `truncate(input, maxLength)` in `__tests__/lib/truncate.test.ts` covering: input shorter than the limit returned unchanged, input equal to the limit returned unchanged, longer input cut to exactly `maxLength` with the last char replaced by `…`, empty input returned unchanged, and the `truncate('abcdef', 4) === 'abc…'` boundary case. Run `bun run test:run __tests__/lib/truncate.test.ts` and confirm the suite fails because `lib/truncate.ts` does not exist yet. [parallel]
- [x] 1.2 GREEN — implement `truncate(input: string, maxLength: number): string` in `lib/truncate.ts` per the spec (return input when `length <= maxLength`; otherwise `input.slice(0, maxLength - 1) + '…'`). Use `superpowers:test-driven-development`. Re-run `bun run test:run __tests__/lib/truncate.test.ts` until green.
- [x] 1.3 RED — write failing vitest cases for `readingTime(input)` in `__tests__/lib/reading-time.test.ts` covering: empty input → `0`, whitespace-only → `0`, short input rounds up to `1`, exactly 200 words → `1`, 201 words → `2`, 600 words → `3`. Run `bun run test:run __tests__/lib/reading-time.test.ts` and confirm the suite fails because `lib/reading-time.ts` does not exist yet. [parallel]
- [x] 1.4 GREEN — implement `readingTime(input: string): number` in `lib/reading-time.ts` per the spec (`Math.ceil(wordCount(input) / 200)`, returning `0` when `wordCount(input)` is `0`). Reuse `wordCount` from `@/lib/wordcount`. Use `superpowers:test-driven-development`. Re-run `bun run test:run __tests__/lib/reading-time.test.ts` until green.
- [x] 1.Z Run superpowers:requesting-code-review on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. Verify and log

- [x] 2.1 Run `bun run test:run` and confirm the entire suite passes (existing tests + the newly added `truncate` and `readingTime` tests).
- [x] 2.2 Run `bun run lint` and `bun run format` to confirm the new files are clean.
- [x] 2.3 Append an entry to `docs/log/2026-05-01.md` (create the file if absent) following the dev-log template in `CLAUDE.md`: feature description, commit hash, code-review findings table, and tests-passed count.
- [x] 2.4 Run superpowers:verification-before-completion (bun run test:run + grep for console.log + diff review).
- [x] 2.Z Run superpowers:requesting-code-review on the diff for group 2; address CRITICAL/HIGH findings before moving on.
