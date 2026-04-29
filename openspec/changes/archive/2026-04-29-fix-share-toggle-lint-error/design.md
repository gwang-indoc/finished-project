## Context

`components/share-toggle.tsx` is a client component used by the note view page (`app/notes/[id]/page.tsx`) to expose three things to the user: a public-sharing toggle (server action), a read-only input that shows the absolute public URL (`<origin>/p/<slug>`), and a Copy button. To build the absolute URL, the component needs `window.location.origin`, which only exists on the client.

The current implementation uses the well-known but lint-flagged pattern:

```tsx
const [origin, setOrigin] = useState('');
useEffect(() => {
  setOrigin(window.location.origin);
}, []);
```

This approach was correct in spirit — it kept the SSR HTML and the client's first paint aligned (`origin = ''` on both, URL block hidden by the `slug && origin` guard), then flipped to the real origin after mount — but ESLint's `react-hooks/set-state-in-effect` (a `core-web-vitals` rule under `eslint-config-next`) correctly flags it as a cascading-render anti-pattern.

The brainstorming spec at `docs/superpowers/specs/2026-04-29-share-toggle-lint-fix-design.md` is the primary input for this design. It captures the rejected alternatives in detail. This document focuses on the technical mechanics and the spec coverage we are adding.

## Goals / Non-Goals

**Goals:**

- Make `bun run lint` clean by removing the only outstanding violation (`share-toggle.tsx:23`).
- Preserve the exact observable rendering behavior: SSR/first paint shows no public URL block; after hydration, the absolute URL appears.
- Use the React-blessed pattern for reading a browser-only external value with SSR support (`useSyncExternalStore`).
- Capture the SSR-safe-rendering behavior as a `note-sharing` capability requirement so the contract survives future refactors.

**Non-Goals:**

- Adding component test coverage for `share-toggle.tsx`. There is no `__tests__/components/share-toggle.test.tsx` today; introducing one is a separate change with a different rationale.
- Refactoring the rest of the file (the `copied` state, the toggle button, the form action wiring all stay as-is).
- Changing the displayed URL format, the copy behavior, or the toggle's visual treatment.
- Suppressing the lint rule.
- Adding a project-wide `note-sharing` spec covering the toggle, the public route (`/p/[slug]`), or the server action — the new spec is intentionally minimal (one requirement), scoped to the rendering guarantee this refactor preserves.

## Decisions

### Decision 1: `useSyncExternalStore` over the rejected alternatives

Replace the `useState` + `useEffect` pair with:

```tsx
const origin = useSyncExternalStore(
  () => () => {},                  // subscribe — no-op
  () => window.location.origin,    // getSnapshot — client
  () => '',                        // getServerSnapshot — server
);
```

`useSyncExternalStore` is React 18's official mechanism for reading from a non-React data source while staying SSR-safe. The `getServerSnapshot` callback returns `''` on the server, matching the empty initial state of the current implementation; `getSnapshot` returns the real origin on the client; React handles the transition without producing a hydration mismatch warning. The empty `subscribe` callback is correct here because `window.location.origin` does not change during the page's lifetime — there is nothing to subscribe to.

**Alternatives considered (full reasoning lives in the brainstorming spec):**

- *Render a relative URL, read origin only inside the copy handler.* Removes the need for `origin` during render but degrades the displayed URL from absolute to relative. Rejected on UX grounds.
- *`// eslint-disable-next-line react-hooks/set-state-in-effect`.* Suppresses a rule that exists for a real reason. Rejected as a code smell when a clean fix exists.
- *Lazy `useState` initializer with a `typeof window` guard.* Avoids the `useEffect` but produces SSR-vs-CSR divergence (server `''`, client `"https://…"`) and triggers React 18 hydration warnings. Rejected.

### Decision 2: Capture the SSR-safe rendering as a new minimal `note-sharing` capability

The spec delta introduces one ADDED requirement under a new `note-sharing` capability: "Public note URL renders without SSR/CSR hydration mismatch", with two scenarios — one for the pre-hydration state (URL hidden), one for the post-hydration state (absolute URL visible).

The motivation is twofold: (a) OpenSpec requires at least one delta per change, so a pure refactor needs *some* spec surface, and (b) the SSR-safe contract is exactly what the refactor preserves and is genuinely worth recording so a future developer cannot regress it back into a hydration-mismatch pattern under a different lint rule.

**Alternatives considered:**

- *Add a "lint cleanliness" capability.* Artificial — lint rules are tooling, not user-facing requirements. Rejected.
- *Cover the entire note-sharing surface (toggle, public route, server action) in this spec.* Tempting (the capability is currently undocumented), but scope creep for a lint fix. Rejected — a focused minimal spec is honest about what *this* change is preserving; broadening coverage belongs in its own change.

### Decision 3: No new component tests

The refactor preserves observable behavior. The two scenarios in the new spec are testable in principle (RTL + server-component render harness), but the project does not currently have any component tests for `share-toggle.tsx`, and writing the harness for a single behavior assertion is a much larger commitment than this change warrants. Manual smoke testing (`bun run dev` + toggle public + verify URL + copy) covers the verification need today.

**Alternatives considered:**

- *Add a `react-testing-library` test asserting the URL appears after hydration.* Would require a fixture for the `useActionState` initial state, mocking `window.location.origin`, and async act/await semantics. Disproportionate for a refactor. Rejected — but flagged in the proposal as a possible follow-up change.
- *Add a regression test that imports the component and asserts on the file's source (e.g., that `useSyncExternalStore` is imported).* Tests implementation, not behavior. Rejected.

## Risks / Trade-offs

- **[Risk]** `useSyncExternalStore` requires React 18+ — confirmed: `package.json` is on React 19, well within range. **→ Mitigation:** none needed.
- **[Risk]** A future React lint or framework change could deprecate the pattern. **→ Mitigation:** none needed today; the new spec requirement is implementation-agnostic ("renders without hydration mismatch") so a later swap to an even better hook would not invalidate it.
- **[Trade-off]** The new spec adds a public commitment that the URL must not appear pre-hydration. If a future redesign decides to render a placeholder URL during SSR (e.g., from a `NEXT_PUBLIC_BASE_URL`), the spec would need to be updated. That is a feature, not a bug — forcing such a change to surface in the spec is the point.

## Migration Plan

No migration. Single-file refactor, deploy by merging, rollback by reverting. No data, no flags, no staged rollout.

## Open Questions

None.
