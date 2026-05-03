# Growing App - Claude Code Guide

> **Context Recovery**: Read this first when resuming work.
> **Project Root**: `<your-clone-of-finished-project>/`

## Behavior Guidelines

**Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and ask before implementing.

**Simplicity first.** Write the minimum code that solves the problem. No speculative features, no abstractions for single-use code, no "flexibility" that wasn't requested. If it can be 50 lines, don't write 200.

**Surgical changes.** Touch only what the request requires. Don't "improve" adjacent code, comments, or formatting. Match existing style. Remove only imports/variables made unused by _your_ changes — not pre-existing dead code.

**Goal-driven execution.** Transform tasks into verifiable goals before starting:

- "Fix the bug" → write a test that reproduces it, then make it pass
- "Add validation" → write tests for invalid inputs, then make them pass
- "Refactor X" → ensure tests pass before and after

---

## Critical Guardrails

### 🚨 NEVER Do This

1. **NEVER commit `backend/.env` or `.env`** — Contains DB credentials, already in `.gitignore`
2. **NEVER run backend without sourcing `.env`** — Use `./backend/start.sh`, not `mvn spring-boot:run` directly

---

## Commands

All scripts run on the Bun runtime (Next.js is invoked via `bun run --bun next ...`).

- `bun run dev` — start the Next.js dev server
- `bun run build` / `bun run start` — production build and serve
- `bun run lint` — ESLint (eslint-config-next, core-web-vitals + TypeScript)
- `bun run format` — oxfmt (single quotes, jsx single quotes)
- `bun run test` — vitest in watch mode
- `bun run test:run` — vitest single run (used in CI / verification)
- Run a single test file: `bun run test:run __tests__/lib/sanitize.test.ts`
- Run a single test by name: `bun run test:run -t 'sanitizes href'`

The SQLite database lives at `data/app.db` (override with `DB_PATH`). The schema is bootstrapped on import in `lib/db.ts` — there is no migration tool, so schema changes are made by editing the `CREATE TABLE IF NOT EXISTS` statements there.

`BETTER_AUTH_SECRET` must be set for auth to work in dev/prod.

## Architecture

Next.js 16 App Router on Bun, with React 19, Tailwind v4, SQLite (`bun:sqlite`), better-auth, Tiptap 3, and zod.

**Request flow for an authenticated note operation:**

1. Page or server action calls `auth.api.getSession({ headers: await headers() })` (see `lib/auth.ts`). On miss, redirect to `/authenticate`.
2. Input is validated with a zod schema from `lib/validation.ts`.
3. Title is run through `DOMPurify.sanitize(..., { ALLOWED_TAGS: [] })`; rich-text JSON is run through `sanitizeContent` → `sanitizeTipTapNode` in `lib/sanitize.ts`, which strips text marks and rewrites `href`/`src` through `sanitizeUrl` (only `http:`/`https:` survive).
4. Persisted via `db.run(...)` / `db.query(...)` against the `notes` table. Ownership is enforced inline in SQL (`WHERE id = ? AND user_id = ?`) — there is no ORM or repository layer.

**Routes (`app/`):**

- `/` welcome, `/authenticate` login/signup, `/dashboard` user's notes list, `/help` help page
- `/notes/new` create, `/notes/[id]` view, `/notes/[id]/edit` edit — each folder colocates `page.tsx`, `actions.ts` (server actions), and the client form component
- `/p/[slug]` public read-only view, gated only on `is_public = 1` (no session check)
- `/api/auth/[...all]` better-auth catch-all, wired via `toNextJsHandler(auth)`

**Sharing model:** toggling public on a note generates a `nanoid(16)` slug stored in `notes.public_slug` (unique). The public route reads by slug + `is_public = 1`. Disabling sharing flips `is_public` but keeps the slug, so re-enabling reuses the same URL.

**Rich text:** `components/rich-text-editor.tsx` is a `'use client'` Tiptap editor (StarterKit) that emits JSON via `onUpdate`. `components/tiptap-renderer.tsx` is a server component that hand-renders a whitelisted subset of Tiptap node types (`paragraph`, `heading`, `bulletList`, `orderedList`, `listItem`, `codeBlock`, `horizontalRule`, `blockquote`) and marks (`bold`, `italic`, `code`). Adding a new editor feature requires updating the renderer's switch statement _and_ the sanitizer's allowlist; otherwise content will be stripped on save or fall through to the default `<span>` on render.

## Conventions (project-specific)

- **Filenames are kebab-case** (`rich-text-editor.tsx`, not `RichTextEditor.tsx`) — applies to components and route files alike.
- **Imports use the `@/` alias** rooted at the project (configured in `tsconfig.json` and via `vite-tsconfig-paths` for vitest).
- **Server Components by default**; only add `'use client'` when interactivity requires it (forms, the editor, the share toggle).
- **Colocate** `page.tsx` + `actions.ts` + form component in the same route folder.
- **Tailwind v4 semantic tokens**: prefer `text-foreground/60`, `border-border` over raw color classes.
- **Tests** live in `__tests__/` mirroring source layout (`__tests__/lib/sanitize.test.ts` ↔ `lib/sanitize.ts`). The vitest setup (`vitest.setup.ts`) registers jest-dom matchers and `afterEach(cleanup)` for React Testing Library.

## Dev Log Practice

After completing each feature batch, the development log for that day must be updated.

Log file path: `docs/log/YYYY-MM-DD.md` — name the file by date. If the file for that day does not exist, create it.

### Each log entry should include

```md
### N. Feature Name

**Commit:** `<git hash>`

**Feature:**

- Briefly describe what was done using bullet points

**Code Review Findings, if any:**
| Severity | Issue | Fix |
|---|---|---|

**Tests:** X tests all passed, including Y newly added tests
```

### Rules

- Update the log after each commit, or at the end of each feature batch.
- Use `- [ ]` for pending items and `- [x]` for completed items.
- Keep a **To Do** section at the end of the log, listing the next batch of work or known issues.
- The task checklist should always include an **update log** step.
