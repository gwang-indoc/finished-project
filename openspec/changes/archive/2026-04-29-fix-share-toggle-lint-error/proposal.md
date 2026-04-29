## Why

`bun run lint` fails on `components/share-toggle.tsx:23` with `react-hooks/set-state-in-effect`. The component reads `window.location.origin` once on mount with a `useState('') + useEffect(setOrigin)` pattern, which the lint rule correctly flags as a cascading-render anti-pattern. The pattern was introduced to keep server and client first-render in sync, but React 18 ships `useSyncExternalStore` for exactly this case: reading a browser-only external value with SSR-safe semantics. Switching to it makes the lint clean without suppressing the rule and without changing the component's observable behavior. Brainstorming validated the approach; the design spec is at `docs/superpowers/specs/2026-04-29-share-toggle-lint-fix-design.md`.

## What Changes

- Replace the `useState('') + useEffect(setOrigin)` pair in `components/share-toggle.tsx` with `useSyncExternalStore(() => () => {}, () => window.location.origin, () => '')`. Drop the now-unused `useEffect` import.
- No prop, no callsite, no server action, and no UX changes. SSR/first-render still shows no public URL block; after hydration the absolute URL appears, identical to today.

## Capabilities

### New Capabilities

- `note-sharing`: captures the previously implicit guarantee that the share toggle's public URL renders SSR-safely — i.e., the server-rendered HTML and the client's first paint do not include the absolute URL, and the URL only appears after hydration. This is the exact behavioral contract the `useSyncExternalStore` refactor preserves; documenting it now keeps future implementations from regressing into a hydration-mismatch pattern.

### Modified Capabilities

_None._

## Non-Goals

- No spec/requirement changes.
- No UX changes (the displayed URL, copy behavior, and toggle remain identical).
- No new test coverage for `share-toggle.tsx` — adding component tests is a separate concern and would be its own change.
- No changes to other components or other lint rules.
- No suppression of the lint rule.

## Impact

- Code: `components/share-toggle.tsx` (single file; ~6 lines changed).
- Lint: clears the only outstanding `bun run lint` error on the branch.
- Specs: new `note-sharing` capability spec with one requirement covering SSR-safe rendering of the public URL (see Capabilities above).
- Tests: existing 42 tests continue to pass; no new tests added.
- Brainstorming spec: `docs/superpowers/specs/2026-04-29-share-toggle-lint-fix-design.md` (already written, captures the React 18 pattern decision and rejected alternatives).
- Dev log: a new entry will be added to `docs/log/2026-04-29.md` per the Dev Log Practice.
