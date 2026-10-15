# AgroBlocks Robot, Crops, Fences, Legend, HUD and Celebration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the thin tomato, stretched fences and Quaternius robot with procedural versions in the style of the reference image, add a paged legend dialog, hide unused resource chips and rebuild the success screen with a full scene.

**Architecture:** Everything new is procedural geometry driven by pure, unit-tested descriptions: `cropShape` (tomato), `fencePieces` (fence), `poseAt`/`clipForStep`/`blendPose` (robot animation), `visibleResources` (HUD), `LEGEND_PAGES` (legend) and a `celebration` layout in `buildWorld`. React Three Fiber components only apply those descriptions. GLBs for robot, crops, straw and fences leave the asset pipeline at the end.

**Tech Stack:** React 19.3, TypeScript 7, Vite 8, Vitest 5, React Three Fiber 9, drei 10, three 0.186, motion 14.2, zustand 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-15-agroblocks-robot-crops-celebration-design.md`

## Execution order

1. `plan_phase1_crops.md` — Task 1.1 tomato in 3 stages
2. `plan_phase2_fences.md` — Task 2.1 procedural timber fences
3. `plan_phase3_robot.md` — Task 3.1 pose engine, Task 3.2 robot rig and wiring, Task 3.3 soil burst effect
4. `plan_phase4_hud.md` — Task 4.1 resource chips only when used
5. `plan_phase5_legend.md` — Task 5.1 legend data, Task 5.2 legend dialog with 3D preview
6. `plan_phase6_celebration.md` — Task 6.1 celebration layout, Task 6.2 success screen
7. `plan_phase7_cleanup_verify.md` — Task 7.1 asset cleanup, Task 7.2 docs, visual and performance verification, final review

## Global Constraints

- Never write comments in code (`//`, `/* */`, `{/* */}`).
- Variables, functions, types and file names in English; UI text in PT-BR.
- Branch `feat/agroblocks-motion`; project path has a trailing space: always quote `"/Users/jorgecamargo/Desktop/Informatica na educaçao "`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Unit tests: `npx vitest run --maxWorkers=2` (low memory machine). E2E: `npx playwright test` (builds and serves on 4173). Close any Playwright MCP browser before full suites.
- Dev server for visual checks: `npx vite --port 5179 --strictPort`.
- Materials are matte (`flatShading`, roughness 0.85, metalness 0.02) like `Flat` in `src/render/farm3d/materials.tsx`.
- "Reduzir animações" (`reducedMotion`) must stop every looping 3D motion added here; "Gráficos leves" (`lowGraphics`) keeps working.
- Model budget stays ≤ 10 MB (`MODEL_BUDGET_BYTES`).

## Review Focus

1. Running at 4x speed (step ≈ 150 ms): every one-shot robot clip must still complete and return to rest before the next step starts; no arm frozen mid-swing — pinned by `clipSecondsFor` tests in Task 3.1.
2. The same action twice in a row (two `prepareSoil` on consecutive cells): the clip must replay, not stay still — pinned by `playKey` restart in Task 3.2 (manual check in Task 7.2) and `clipForStep` test that ignores stale `robotMoved`.
3. Growth ticks during a move step (`plotChanged` to `growing`/`mature`, `moistureChanged` to `dry`) must not trigger farm clips — pinned by `clipForStep` tests in Task 3.1.
4. A mission whose reference solution never harvests but allows `farm_harvest` (Fase 2, 3, 6): the Colheita chip is hidden and harvest flights must not crash when the target element is missing — pinned in Task 4.1.
5. Opening the legend repeatedly / switching pages fast must not create one WebGL context per page — pinned by Task 5.2 test asserting a single preview container and by the single `Canvas` design.

---
