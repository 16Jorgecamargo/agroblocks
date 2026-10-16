# Teacher Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students register name and school when starting a farm, every run is sent to an Upstash Redis store through Vercel Functions, and a password-protected teacher dashboard shows every student, run, tutorial outcome, mission attempt and assessment answer.

**Architecture:** Shared, dependency-free snapshot types and validation live in `src/shared/` (relative imports only, so Vercel Functions can import them). Framework-agnostic request handlers live in `server/` and are mounted twice: by thin Web-standard Vercel Functions in `api/`, and by a Vite dev/preview plugin backed by an in-memory store for local work and E2E. The client keeps the local `SaveData` as source of truth and pushes a debounced full snapshot per run; the dashboard is a pure model over all snapshots plus React views.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 5 (jsdom), Playwright, zod 4, zustand 5, motion 14, `@upstash/redis`, Node `crypto` (HMAC tokens), Vercel Functions (Web `Request`/`Response`).

**Spec:** `docs/superpowers/specs/2026-10-16-agroblocks-teacher-dashboard-design.md`

## Global Constraints

- Never write code comments (`//`, `/* */`, `{/* */}`) in any `.ts`, `.tsx`, `.mjs` file.
- Identifiers, functions and file names in English; every user-facing text in PT-BR.
- Commit messages never mention Claude or Anthropic and carry no `Co-Authored-By` trailer.
- Desktop only; no mobile work.
- Files under `server/`, `api/` and `src/shared/` use **relative imports with `.js` extensions** and never import `@/…`.
- `src/shared/` imports nothing except `zod`.
- No `duration: <number>` literal outside `src/motion/presets.ts` (guard test `src/motion/noLooseDurations.test.ts`).
- Teacher password value `dashboard` lives only in env `TEACHER_PASSWORD` (dev plugin default), never in the client bundle.
- Name: ≥ 2 words of ≥ 2 letters, ≤ 80 chars. School: 3–120 chars. Both trimmed with internal spaces collapsed.
- Snapshot body > 512 KB → 413. > 2000 attempts or pseudocode > 4000 chars → 400.
- Token TTL 12 h; wrong password answers 401 after a 400 ms wait.
- Sync debounce 2000 ms; pending key `agroblocks:sync-pending:v1`; school history key `agroblocks:schools:v1` (max 10); teacher token key `agroblocks:teacher-token` in `sessionStorage`.

## Review Focus

1. Vercel's Node runtime loading `api/*.ts` that import `../server/*.js` and `../src/shared/*.js` under `"type": "module"` — a module-resolution failure would make every request 500; Task 6 adds `server/functions.test.ts` importing the `api/` files directly through Vitest.
2. A student who reloads the page mid-debounce — the pending snapshot must still go out on the next start; Task 8 tests `resumePending` from storage.
3. Old saves with `participantCode` and no `runId` — must load without being flagged corrupt; Task 2 tests the migration.
4. Teacher token forged or expired, or the server missing env vars — must answer 401/503, never 500 or data; Task 5 tests tampered/expired tokens and missing config.
5. Same student typed with different accents/casing/spacing (`José  da Silva` vs `jose da silva`) — must group under one student; Task 13 tests grouping across such variants.

## Phases (execute in order)

1. `plan_phase1_student_data.md` — Tasks 1–3: shared student/snapshot helpers, `SaveData` migration, store actions.
2. `plan_phase2_server.md` — Tasks 4–7: stores, tokens and handlers, Vercel Functions, Vite dev API.
3. `plan_phase3_sync.md` — Task 8: snapshot conversion and debounced sync.
4. `plan_phase4_student_flow.md` — Tasks 9–11: StudentDialog, Home/Settings flows, tutorial outcome.
5. `plan_phase5_dashboard.md` — Tasks 12–16: teacher API client and gate, dashboard model, demo/CSV, page, student detail.
6. `plan_phase6_e2e_docs.md` — Tasks 17–18: E2E and documentation.

Branch: create `feat/teacher-dashboard` from `main` before Task 1.

Verification commands used throughout:
- Unit: `npx vitest run --maxWorkers=2`
- Types: `npx tsc --noEmit -p .`
- Comments guard: `grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts server api --include='*.ts' --include='*.tsx' --include='*.mjs'` prints nothing
- E2E: `pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test`
