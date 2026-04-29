## 1. Implementation

- [x] 1.1 Edit `components/share-toggle.tsx`:
  - Replace the `useState('')` for `origin` and the `useEffect(() => { setOrigin(window.location.origin); }, [])` block with a single `useSyncExternalStore` call: `const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => '');`.
  - Update the import on line 3 from `import { useActionState, useState, useEffect } from 'react';` to `import { useActionState, useState, useSyncExternalStore } from 'react';`.
  - Leave the `copied` state, the `slug && origin` URL guard, the form action, the toggle button, and all JSX untouched. (Per `design.md` Decision 1; matches `docs/superpowers/specs/2026-04-29-share-toggle-lint-fix-design.md`.)
- [x] 1.2 No RED-failing-test scaffolding is required for this group — the change is a behavior-preserving refactor with no DOM-testable assertion that does not restate the implementation. The new `note-sharing` requirement is intentionally not paired with a component test in this change (per `design.md` Decision 3); the brainstorming spec calls out that a follow-up change can add `__tests__/components/share-toggle.test.tsx` if/when component-test infrastructure for this surface is desirable.
- [x] 1.3 Run `superpowers:requesting-code-review` on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. Verification & dev log

- [x] 2.1 Run `bun run lint` and confirm clean (the previously-failing `react-hooks/set-state-in-effect` at `share-toggle.tsx:23` should be gone, and no new violations introduced).
- [x] 2.2 Run `bun run test:run` and confirm all 42 existing tests still pass (no new tests added — see task 1.2).
- [x] 2.3 Start `bun run dev` and smoke-test the share flow: open a note view page, toggle public sharing on, confirm the absolute URL `http://localhost:3000/p/<slug>` appears in the read-only input after hydration, and confirm the Copy button writes that URL to the clipboard. Confirm there are no React hydration warnings in the browser console.
- [x] 2.4 Append a new numbered entry to `docs/log/2026-04-29.md` per the Dev Log Practice in `CLAUDE.md` (commit hash, feature summary bullet points referencing the `useSyncExternalStore` refactor and the new `note-sharing` capability requirement, code-review findings table, tests line). Update the existing To Do section to mark the share-toggle lint fix item complete.
- [x] 2.5 Run `superpowers:verification-before-completion` (confirm fresh `bun run lint` and `bun run test:run` outputs, grep `components/share-toggle.tsx` for stray `console.log` / debug code, diff review against `design.md` and `proposal.md` to ensure scope didn't drift — the diff should be confined to `components/share-toggle.tsx` plus the openspec change folder, the brainstorming spec, and the dev log).
- [x] 2.6 Run `superpowers:requesting-code-review` on the diff for group 2; address CRITICAL/HIGH findings before moving on.
