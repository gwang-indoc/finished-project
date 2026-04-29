## 1. Implementation

- [x] 1.1 Edit `app/page.tsx`: change the Help link wrapper className from `absolute top-4 right-6` to `absolute right-6 bottom-4`. Leave the inner `<Link>` (icon badge + "Help" label + classes) untouched. (Per `design.md` Decision 1; matches the position decision in `docs/superpowers/specs/2026-04-29-help-link-position-design.md`.)
- [x] 1.2 No RED-failing-test scaffolding is required for this group — the change introduces no new behavior; it's a positional Tailwind class swap with no DOM-testable assertion beyond restating the implementation (per `design.md` Decision 3). The two existing `welcome-page` scenarios continue to cover "Help link is shown" and "Help link navigates to `/help`".
- [x] 1.3 Run `superpowers:requesting-code-review` on the diff for group 1; address CRITICAL/HIGH findings before moving on.

## 2. Verification & dev log

- [x] 2.1 Start `bun run dev` and confirm `/` returns HTTP 200 with the Help link rendered in the bottom-right corner using the existing icon-badge + "Help" styling; confirm `/help` still returns HTTP 200 with no regression.
- [x] 2.2 Run `bun run lint` and confirm clean. _Pre-existing failure in `components/share-toggle.tsx:23` (`react-hooks/set-state-in-effect`) verified to exist on a clean tree before this change; no new violations introduced by `app/page.tsx`. Documented in dev log; tracked separately._
- [x] 2.3 Run `bun run test:run` and confirm all tests pass (no new tests added — see task 1.2).
- [x] 2.4 Update `docs/log/2026-04-29.md` per the Dev Log Practice in `CLAUDE.md` (add a new numbered entry: commit hash, feature summary bullet points, code-review findings table, tests line). Create the file if it doesn't exist for today.
- [x] 2.5 Run `superpowers:verification-before-completion` (confirm `bun run test:run` output, grep `app/page.tsx` for stray `console.log` / debug code, diff review against the design doc to ensure scope didn't drift).
- [x] 2.6 Run `superpowers:requesting-code-review` on the diff for group 2; address CRITICAL/HIGH findings before moving on.
