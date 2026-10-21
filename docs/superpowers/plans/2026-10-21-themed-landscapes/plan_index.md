# Themed Landscapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every concept world gets its own style and a composed landscape — on the mission-select map and as a brand-new mission scene around the plot grid — instead of scattered objects over one shared base farm.

**Architecture:** A per-world `WorldStyle` registry (colors, light, sky, relief, border) feeds both scenes. A small landscape kit places big themed blocks, a landmark, a border belt and edge-only clutter; each world has one blueprint file that builds its map and its mission farm with that kit. Every feature kind is drawn through one instanced renderer built from merged low-poly geometries (the pattern `CornField.tsx` introduced).

**Tech Stack:** React 19, TypeScript, @react-three/fiber + three, Vitest (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-themed-landscapes-design.md`

## Global Constraints

- Low-poly always, flat colors, no textures; new objects are geometry built in code. No third-party model downloads.
- The plot grid and the 60 missions do not change; only what surrounds the grid changes.
- The map trail of each world (`WORLD_TRAILS`) keeps its shape; nothing crosses it; no path over water without a bridge, no path over crops.
- Training (`theme === null`) keeps the current `farmLayout`.
- "Gráficos leves" (`density: 'light'`) still exists and makes each scene lighter.
- No code comments; identifiers and file names in English (CLAUDE.md).
- No Claude attribution in commits (user memory).
- Performance ceiling: no world may exceed the draw calls the Horta scenes have at the baseline measured in Task 1.

## Review Focus

1. Mission grids of every size used by the 60 missions (smallest and largest `width × height`): blocks, landmark and border must never overlap the grid or its clearance — pinned by Task 7's `it.each` over every distinct grid size.
2. Camera framing in the mission: tall landmarks on the camera side (`x + z > 0`) would hide the robot — pinned by the `frontGuard` assertion in Task 7 and each world's farm test.
3. `density: 'light'`: blueprints must still place the landmark and blocks, only fewer details — pinned in Task 4 kit tests and each world's tests.
4. Seeds: the same world must look the same on every visit (deterministic) — pinned in Task 6 (`buildWorld` twice, deep-equal).
5. Fruit tints and other per-instance color variety must survive instancing — pinned in Task 3 (`groupFeatures` keys by kind + tint).

## Prerequisite

The concept-worlds plan must be closed first: its Task 20 (E2E world flow and docs) and its final review. This plan's perf checks run on the same Playwright setup, which currently has 11 timing-out specs.

## Execution order

| Phase | File | Tasks |
|---|---|---|
| 1 Foundation | `plan_phase1_foundation.md` | 1 draw-call probe and baseline · 2 world styles · 3 instanced features · 4 landscape kit |
| 2 Milharal pilot | `plan_phase2_cornfield_pilot.md` | 5 corn objects · 6 cornfield map · 7 cornfield mission farm · 8 pilot checkpoint (user approves) |
| 3 Horta and Pomar | `plan_phase3_garden_orchard.md` | 9 garden objects · 10 garden map + farm · 11 orchard objects · 12 orchard map + farm |
| 4 Estufa and Celeiro | `plan_phase4_greenhouse_barnyard.md` | 13 greenhouse objects · 14 greenhouse map + farm · 15 barnyard objects · 16 barnyard map + farm |
| 5 Fazenda completa and cleanup | `plan_phase5_homestead_cleanup.md` | 17 homestead map + farm · 18 remove old zones, perf e2e, docs |

Task 8 is a hard stop: show the Milharal screenshots to the user and wait for approval before Phase 3.

## File map

- Create `src/render/world/worldStyles.ts` — `WorldStyle`, `WORLD_STYLES`, `styleOf(theme)`.
- Create `src/render/world/SceneLighting.tsx` — sky color, hemisphere and sun from a style.
- Create `src/render/DrawCallProbe.tsx` — writes `gl.info.render.calls` to the canvas `data-draw-calls`.
- Create `src/render/world/features/featureGeometry.ts` — `featureGeometry(kind, tint?)` registry of merged geometries; `mergeParts`, `part`, `compose` helpers (moved from `CornField.tsx`).
- Create `src/render/world/features/<world>Objects.ts` — one file per world with that world's new geometries.
- Create `src/render/world/InstancedFeatures.tsx` — replaces `WorldFeatures.tsx` and `CornField.tsx`.
- Create `src/render/world/landscapes/landscapeKit.ts` — block, landmark, border, relief and edge-clutter helpers.
- Create `src/render/world/landscapes/<world>Landscape.ts` — `<world>Map(input, random)` and `<world>Farm(input, random)`.
- Create `src/render/world/landscapes/landscapes.ts` — `LANDSCAPES: Record<WorldId, Landscape>`.
- Modify `buildWorld.ts`, `worldTypes.ts`, `worldCatalog.ts`, `WorldTerrain.tsx`, `FarmScene.tsx`, `WorldMapScene.tsx`.
- Delete at the end: `addThemeFeatures` and feature lists in `worldThemes.ts`, `ZONES` and zone code in `worldMapLayout.ts`, `WorldFeatures.tsx`, `CornField.tsx`.
