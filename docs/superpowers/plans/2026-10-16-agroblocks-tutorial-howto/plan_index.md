# Guided Tutorial with How-To Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the training mission's centre bubble with a 15-step guided tutorial: spotlight + anchored callouts on the real UI, and an animated replica dialog that shows each gesture before the student practises it.

**Architecture:** Pure data (`tutorialScript.ts`) and a pure state machine (`tutorialMachine.ts`) decide the step; `GameplayPage` feeds signals through a tiny signal bus. A full-screen spotlight (`clip-path` evenodd) dims and blocks everything except `[data-tutorial]` targets, with a callout placed by a pure function. How-to animations are data scripts (`howtoScripts.ts`) evaluated by a pure `replicaAt` and drawn by HTML replica components.

**Tech Stack:** React 19, TypeScript, motion 14 (`motion/react`), Vitest + Testing Library (jsdom, globals), Playwright, Blockly 13.

**Spec:** `docs/superpowers/specs/2026-10-16-agroblocks-tutorial-howto-design.md`

## Execution order

1. `plan_phase1_core.md` — Task 1.1 types + script, Task 1.2 machine + signal bus
2. `plan_phase2_spotlight.md` — Task 2.1 geometry, Task 2.2 spotlight + callout components
3. `plan_phase3_howto.md` — Task 3.1 replica engine, Task 3.2 scripts, Task 3.3 replica + dialog
4. `plan_phase4_overlay.md` — Task 4.1 overlay + bar, Task 4.2 gameplay integration
5. `plan_phase5_verify.md` — Task 5.1 E2E, Task 5.2 docs, visual verification, final review

## Global Constraints

- Never write comments in code (`grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts --include='*.ts' --include='*.tsx' --include='*.mjs'` must print nothing).
- Variables, functions and files in English; UI text in PT-BR.
- Desktop only; no mobile work.
- Durations come from `DURATIONS` in `src/motion/presets.ts`; no loose timing numbers in components (script beat times in `howtoScripts.ts` are data, allowed).
- Reduced motion (`useMotionPrefs().reduced`) disables loops and pulses.
- Unit tests: `npx vitest run --maxWorkers=2`. E2E: `pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Directory has a trailing space: always quote `"/Users/jorgecamargo/Desktop/Informatica na educaçao "`.

## Review Focus

1. Student repeats the tutorial after earlier visits: hints already used up to the locked last hint (`canRevealHint` false) — step 10 must still complete (opening Dicas counts as the reveal when no hint can be revealed). Test in Task 4.2.
2. Entering a step whose condition is already true (stack already ≥ 2 at step 5, Passo a passo already on at step 9) — must complete instead of waiting forever. Test in Task 4.1.
3. Run ends before Parar at step 8 (short program, success or error) — notice shown, partial reset, step still waits for run then stop. Test in Task 1.2.
4. Layout shifts while running (grid columns animate) — spotlight holes and callout follow the targets every frame. Covered by `useTargetRects` rAF loop in Task 2.2; checked visually in Task 5.2.
5. Mission succeeds before step 13 (student builds the right program at step 11) — no skipping; notice explains the experiment. Test in Task 1.2.
