# Occupancy Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every scene builds an invisible top-down occupancy grid that decides where people, tractors and animals may stand and walk, and where each work animation may happen.

**Architecture:** After a landscape places its content, `buildOccupancy` rasterizes the finished `World` (roads, water, fences, objects, crops, trees, mission markers, mission grid) into a 0.25-unit grid. Per-agent masks (person, tractor, animal) dilate the blocked cells by the agent's clearance. Work spots come from the objects themselves; A* on the masks turns landscape "jobs" into `Actor` routes; animals get the free cells of their own pen and never overlap each other. Nothing of it is drawn in the game.

**Tech Stack:** TypeScript, three (math only), Vitest, React 19 + @react-three/fiber for the dev-only viewer.

**Spec:** `docs/superpowers/specs/2026-10-21-occupancy-grid-design.md`

## Global Constraints

- The grid is never visible to the player; it draws nothing in the game.
- Cell size 0.25 world units; grid built once per scene, never per frame.
- Deterministic: same seed, same grid, same routes, same animal cells.
- Birds and butterflies are out of scope.
- People and tractors do not avoid each other; they only avoid the scene.
- Animals never pass through each other: spawn without overlap and only accept a walk that keeps a species-sized gap from every other animal's position and course.
- An actor with no valid spot or no path is not created.
- People and tractors never cross mission markers (the trail hexagons, radius 0.8) or the mission grid; they walk around them.
- People enter pens only through the gate gap; animals never leave their pen.
- Draw-call ceiling unchanged (310 map, 390 mission).
- No code comments; identifiers and file names in English (CLAUDE.md).
- Another session edits `actorGeometry.ts`, `workerPose.ts` and `Actors.tsx` for looks; this plan does not touch those three files.

## Review Focus

- A spot squeezed between two beds on a cell that is technically free but too narrow for a person → the person mask's clearance must reject it (Task 2.1).
- A tractor job whose waypoints sit on a road crossing a mission marker → the path bends around the marker or the tractor is dropped (Task 4.1).
- Smallest mission grids (2×1, 3×1) where the road starts right at the grid edge → no route point on mission-grid cells (Task 6.1).
- A pen whose trough or shelter fills most of it → animals still get free cells or are dropped, never placed on the trough or on another animal (Task 5.1).
- Light graphics (`density: 'light'`) removes some crops → work spots still require a real crop next to them (Task 6.1).

## Phases (execute in order)

1. `plan_phase1_grid.md` — occupancy grid, object shapes, rasterizing a world.
2. `plan_phase2_paths.md` — agent masks, line of sight, A*.
3. `plan_phase3_spots.md` — work spots per task.
4. `plan_phase4_jobs.md` — jobs become actor routes; landscapes switch from hand routes to jobs.
5. `plan_phase5_animals.md` — animals walk only on free cells of their pen and never through each other.
6. `plan_phase6_verify.md` — contract tests in every world, dev-only viewer, perf check, ADR.
