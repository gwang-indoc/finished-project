# Share Toggle — Fix `react-hooks/set-state-in-effect` Lint Error

**Date:** 2026-04-29
**Status:** Approved (pending implementation)

## Context

`bun run lint` currently fails on `components/share-toggle.tsx:23`:

```tsx
const [origin, setOrigin] = useState('');
useEffect(() => {
  setOrigin(window.location.origin);  // ← react-hooks/set-state-in-effect
}, []);
```

The pattern exists for a real reason: `window.location.origin` is browser-only, so the component starts with `origin = ''` on the server and on the client's first render (matching SSR HTML), then flips to the actual origin after `useEffect` runs. The conditional `slug && origin ? `${origin}/p/${slug}` : null` ensures the public URL block does not render until `origin` is populated, so there is no SSR/CSR text mismatch.

The lint rule is correct: calling `setState` synchronously inside `useEffect` produces a cascading render. React 18 ships a hook designed for exactly this scenario — reading a browser-only external value with SSR-safe semantics — `useSyncExternalStore`.

This refactor was flagged as a pre-existing failure during the `move-help-link-to-bottom-right` change (see `docs/log/2026-04-29.md`), and is being addressed in its own change so the lint surface is fully clean going forward.

## Decision

Replace the `useState` + `useEffect` pair with `useSyncExternalStore`:

```tsx
import { useActionState, useState, useSyncExternalStore } from 'react';

// inside the component:
const origin = useSyncExternalStore(
  () => () => {},                  // no subscription — origin does not change
  () => window.location.origin,    // client snapshot
  () => '',                        // server snapshot
);
```

- The observable behavior is identical: SSR and first client render see `origin = ''`; after hydration, `origin = window.location.origin`. The `slug && origin` guard continues to gate the URL block, so no hydration mismatch.
- The `subscribe` callback is a no-op because `window.location.origin` is stable for the page's lifetime.
- The `useState` for `copied` is unrelated and stays.
- The `useEffect` import is dropped if it has no other uses in the file.

## Alternatives Considered

- **A. `useSyncExternalStore`** ← **selected.** React-blessed pattern for browser-only values with SSR support; lint clean; intent-revealing.
- **B. Render a relative URL, read origin only inside the copy handler.** Removes the need for origin during render entirely, but changes the UX — the input would display `/p/<slug>` instead of the absolute URL the user is about to share. Rejected on UX grounds.
- **C. `// eslint-disable-next-line react-hooks/set-state-in-effect`.** Pragmatic but suppresses a rule that exists for a real performance reason (cascading renders). Rejected as a code smell when a clean fix exists.
- **D. Lazy `useState` initializer with `typeof window` guard.** Avoids the `useEffect`, but the server-rendered HTML (`origin = ''`) and the client's first render (`origin = "https://..."`) would diverge, causing a React 18 hydration mismatch warning. Rejected.

## Implementation

Single file: `components/share-toggle.tsx`. Approximate diff:

```diff
-import { useActionState, useState, useEffect } from 'react';
+import { useActionState, useState, useSyncExternalStore } from 'react';
@@
   const [copied, setCopied] = useState(false);
-  const [origin, setOrigin] = useState('');
-
-  useEffect(() => {
-    setOrigin(window.location.origin);
-  }, []);
+  const origin = useSyncExternalStore(
+    () => () => {},
+    () => window.location.origin,
+    () => '',
+  );
```

No callers change. `app/notes/[id]/page.tsx` continues to render `<ShareToggle ... />` with the same props.

## Scope

- `components/share-toggle.tsx` only.
- No spec/capability change — this is an implementation refactor that preserves observable behavior. No `openspec/specs/` requirement is added or modified.
- No new dependencies.
- No changes to the share server action (`app/notes/[id]/actions.ts`) or any persistence.

## Verification

- `bun run lint` is clean (the only pre-existing error was at `share-toggle.tsx:23` and this change resolves it).
- `bun run test:run` passes (existing 42 tests; no new tests are required for a behavior-preserving refactor — see Decision rationale below).
- Manual smoke test in `bun run dev`: open a note's view page, toggle public sharing on, confirm the absolute URL appears once after hydration and the Copy button writes that URL to the clipboard.

## Why no new tests

The refactor preserves the externally observable behavior of the component (URL appears after hydration, copy button writes the absolute URL). Asserting "the component uses `useSyncExternalStore` instead of `useState`+`useEffect`" via DOM testing would just restate the implementation. The existing routing/sharing tests in `__tests__/` are unaffected. If a regression test for the URL-rendering logic is wanted, it should be a separate change scoped to "add component test coverage for share-toggle."
