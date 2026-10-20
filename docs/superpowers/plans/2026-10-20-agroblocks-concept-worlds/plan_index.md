# Concept Worlds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6 phases with 6 concept worlds of 10 missions each, a pre-test and post-test of 10 questions per world, a 3D low-poly farm per world with its own mission trail, themed gameplay scenery, and a teacher dashboard organized by world.

**Architecture:** A world registry (`src/game/worlds`, `src/data/worlds.ts`) owns world ids, names, concepts and mission roles. Missions gain `world` and `slot`; unlocking is recomputed by one pure function over the ordered mission list plus per-world assessments stored in `SaveData` version 2. Assessment items are grouped per world. Rendering gets a `theme` on `WorldInput` that drives palette, procedural features and crop kind, plus a new `worldMap` layout with one trail per world. The dashboard model aggregates per world.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 5 (jsdom), Playwright, zod 4, zustand 5, motion 14, three.js via @react-three/fiber, Upstash Redis behind Vercel Functions.

**Spec:** `docs/superpowers/specs/2026-10-20-concept-worlds-design.md`

## Global Constraints

- Never write code comments (`//`, `/* */`, `{/* */}`) in any `.ts`, `.tsx`, `.mjs` file.
- Identifiers, functions and file names in English; every user-facing text in PT-BR.
- Commit messages never mention Claude or Anthropic and carry no `Co-Authored-By` trailer.
- Desktop only; no mobile work.
- Files under `server/`, `api/` and `src/shared/` use relative imports with `.js` extensions and never import `@/…`; `src/shared/` imports nothing except `zod`.
- No `duration: <number>` literal outside `src/motion/presets.ts`.
- No new block types and no interpreter changes; the only engine addition is the pre-run block limit `rules.maxBlocks`.
- World order and names: `garden` Horta (sequência), `cornfield` Milharal (repetição), `orchard` Pomar (condições), `greenhouse` Estufa (sensores), `barnyard` Celeiro (variáveis), `homestead` Fazenda completa (eficiência).
- Every world: exactly 10 missions, slots 1–10 with roles learn (1–3), practice (4–6), challenge (7–8), debug (9), final (10).
- Every world: pre-test and post-test of exactly 10 items each, paired (`pairId`), one correct option per item, no skip button, no feedback during the test.
- The next world opens only after the previous world's post-test is stored.
- Every mission has `referenceSolution` that completes it, 4 hints, `solutionExplanation`, `efficiency` references.
- Old saves (`version: 1`) load without being flagged corrupt; the training stays one mission `m0-training`.

## Review Focus

1. A browser holding an old `version: 1` save opens the game — it must load as version 2 keeping `runId`, `student` and `tutorial`, with no corrupt flag (Task 2 test `migrates a version 1 save`).
2. A student finishes mission 10 of a world and closes the tab before the post-test — next visit the post-test node is the current step, the next world stays locked, "Continuar missão" leads to the post-test (Task 2 test `points to the post-test when missions are done`, Task 10 test).
3. A student replays a mission of an already finished world — no pre-test redirect, nothing gets relocked (Task 2 test `never relocks`, Task 7 test).
4. An outdated client sends a snapshot in the old format — the server answers 400, never 500 (Task 4 test).
5. A program with more blocks than `maxBlocks` is run — a clear log message names the limit, nothing runs and no attempt is recorded (Task 5 test).

## Phases (execute in order)

1. `plan_phase1_foundation.md` — Tasks 1–4: world registry and mission model, save v2 with unlock rules, per-world assessment model, run snapshot and server.
2. `plan_phase2_content.md` — Tasks 5–11: block limit rule, then the 10 missions and 20 test items of each world (one task per world).
3. `plan_phase3_flow.md` — Tasks 12–13: assessment pages per world and the student flow (guards, results, home, labels).
4. `plan_phase4_scenery.md` — Tasks 14–17: themes and procedural features, themed crops and gameplay farm, world map layouts with distinct trails, new missions screen.
5. `plan_phase5_dashboard.md` — Tasks 18–19: dashboard model per world, dashboard views and CSV.
6. `plan_phase6_e2e_docs.md` — Task 20: end-to-end flows and documentation.

Branch: create `feat/concept-worlds` from `main` before Task 1.

Verification commands used throughout:
- Unit: `npx vitest run --maxWorkers=2`
- Types: `npx tsc --noEmit -p .`
- Comments guard: `grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts server api --include='*.ts' --include='*.tsx' --include='*.mjs'` prints nothing
- Build: `npm run build`
- E2E: `pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test`
