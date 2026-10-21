# Phase 5 — Fazenda completa and cleanup

Read `plan_index.md` and the shared contract in `plan_phase3_garden_orchard.md` (Task 10).

### Task 17: Homestead objects, map and farm

**Files:**
- Create: `src/render/world/features/homesteadObjects.ts`, `src/render/world/landscapes/homesteadLandscape.ts`, `homesteadLandscape.test.ts`
- Modify: `worldTypes.ts` (`farmhouse`), `featureGeometry.ts`, `worldCatalog.ts` (footprint 1.8, tall), `landscapes.ts`

Shape: `farmhouse` two-storey box `#f1e6d2` with a gable roof `#a33b2f`, porch with 3 posts, door and 4 windows `#7fb7c9`, chimney.

Composition (style: rolling, mixed border, midday light) — one small piece of each earlier world, each in its own block:
- **Map**: landmark `farmhouse` with the `water-tower` model beside it; one corn block, one fruit block (single tint), 2 `greenhouseBay`s in a row, one bed block, one small paddock with `[['cow', 2], ['sheep', 2]]`; `borderBelt('mixed')`; `reliefMounds('rolling')`.
- **Farm**: farmhouse + water tower behind the grid; corn block on the left, fruit block at the back, bed block on the left-front (low), small paddock back-left; mixed border with a gap.

- [ ] **Step 1: Write failing tests**: `describeLandscape({ world: 'homestead', landmark: ['farmhouse', 'water-tower'], crops: ['cornStalk', 'fruitTree', 'vegetableBed'], minBlocks: { map: 4, farm: 3 } })` plus `shows a piece of every world` (map has ≥ 1 of `cornStalk`, `fruitTree`, `greenhouseBay`, `vegetableBed` and ≥ 1 animal).
- [ ] **Step 2:** `npx vitest run src/render/world/features src/render/world/landscapes` — Expected: FAIL. **Step 3:** implement. **Step 4:** `npx vitest run src/render && npx tsc --noEmit -p .` + perf spec — Expected: PASS. **Step 5:** commit `feat(render): homestead map and mission scene around a farmhouse`.

### Task 18: Remove the old zones, all-worlds perf check, docs

**Files:**
- Modify: `landscapes.ts` (`LANDSCAPES: Record<WorldId, Landscape>`), `buildWorld.ts` (themed worlds always use `LANDSCAPES`; `worldMap` without a theme keeps `worldMapLayout` only if something still calls it — otherwise delete `worldMapLayout`'s zone code and keep only `WORLD_MAP_ISLAND` in the kit), `worldThemes.ts` (drop `features`, `FEATURE_COUNTS`, corn patch code, `addThemeFeatures`; keep `crop`), `farmLayout.ts` (stop calling `addThemeFeatures`), tests that pinned the old zones (`worldTrails.test.ts` "world map landscapes", `worldThemes.test.ts`): delete cases now covered by the contract, keep the trail-shape cases
- Modify: `tests/e2e/landscapePerf.spec.ts` (loop over the 6 worlds: map + first mission, each `<= BASELINE`)
- Create: `docs/decisions/0013-themed-landscapes.md`
- Modify: `README.md` (one paragraph: each world has its own style and its own mission scene)

- [ ] **Step 1:** Make `LANDSCAPES` a full `Record` and remove the fallback; run `npx tsc --noEmit -p .` — Expected: errors only where old zone code is still referenced. Remove that code until clean.
- [ ] **Step 2:** `npx vitest run` — Expected: PASS (whole suite). Ledger the count.
- [ ] **Step 3:** `npx playwright test tests/e2e/landscapePerf.spec.ts` — Expected: 12 measurements, all `<= BASELINE`. Ledger the table.
- [ ] **Step 4:** Write the decision record (context: "amontoado de objetos" and shared base farm; decision: style registry + kit + one blueprint per world + instanced features; consequences: new objects go in `features/<world>Objects.ts`, new worlds need a `Landscape`; perf ceiling and how to measure it) and the README paragraph. Run the comment guard used by the project and `npm run build` — Expected: clean.
- [ ] **Step 5:** Commit `refactor(render): themed landscapes replace the old zones; docs`.

Then follow superpowers:executing-plans "Final Review" for the whole branch.
