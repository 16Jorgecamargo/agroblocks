# Phase 2 — Milharal pilot

Read `plan_index.md` first. Phase 1 must be complete (ledger).

### Task 5: Corn world objects

**Files:**
- Create: `src/render/world/features/cornfieldObjects.ts`, `src/render/world/Birds.tsx`
- Modify: `worldTypes.ts` (`FeatureKind` + `FEATURE_KINDS` gain `grainBin`, `grainDryer`, `cornWagon`, `scarecrow`; `World.birds?: Vec2[]`), `featureGeometry.ts` (delegate the four kinds), `worldCatalog.ts` (footprints: grainBin 1.1, grainDryer 1.3, cornWagon 1.0, scarecrow 0.4; `grainBin` and `grainDryer` count as tall for `frontGuard` — add a `TALL_FEATURES` set used by `WorldDraft.fits` in place of the inline `greenhouse || fruitTree` check)
- Test: `src/render/world/features/featureGeometry.test.ts` (the `it.each(FEATURE_KINDS)` already covers the new kinds)

**Interfaces:**
- Produces: `cornfieldGeometry(kind: 'grainBin' | 'grainDryer' | 'cornWagon' | 'scarecrow'): BufferGeometry` (merged, vertex-colored, base at y = 0).
- Produces: `Birds({ points, active }: { points: Vec2[]; active: boolean })` — one instanced mesh of small low-poly birds (2 flattened cones each), each circling its point at height 4–5, radius 1.5–3; static when `!active`.

Shapes (real references: metal grain bins, tower dryer, farm wagon, scarecrow):
- `grainBin`: 8-sided cylinder r 0.9 h 2.2 in `#c9ced3` with 3 thin darker rings `#9aa3ab`, cone roof h 0.6 `#b4bcc4`, small cap; a ladder of 2 thin boxes up one side.
- `grainDryer`: box 1.2×3.2×1.2 `#d9d9d0`, top hood `#a33b2f`, a slanted duct box to the side `#b4bcc4`.
- `cornWagon`: bed box 1.4×0.35×0.8 `#a33b2f`, 4 wheel cylinders `#3b3b3b`, a mound of 8 small yellow ears `#f2c14e` on top.
- `scarecrow`: pole `#7a5233` h 1.6, crossbar, shirt box `#4c78a8`, round straw head `#e2c46a`, flat hat cone `#a07a3a`.

- [ ] **Step 1: Add the four kinds to `FEATURE_KINDS`** only (no geometry yet).
- [ ] **Step 2: Run** `npx vitest run src/render/world/features` — Expected: FAIL for the four new kinds (geometry missing).
- [ ] **Step 3: Implement** `cornfieldObjects.ts`, catalog entries, `TALL_FEATURES`, `Birds.tsx`; render `<Birds points={world.birds ?? []} active={…} />` in both scenes.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): grain bins, dryer, wagon, scarecrow and birds for the cornfield`.

### Task 6: Cornfield map

**Files:**
- Create: `src/render/world/landscapes/cornfieldLandscape.ts`, `src/render/world/landscapes/cornfieldLandscape.test.ts`, `src/render/world/landscapes/landscapes.ts`
- Modify: `landscapeKit.ts` (move `parcels`/`freeGrid`/`largestBlock`/`trailDistance` from `worldMapLayout.ts` and export `trailFreeParcels(rect: Rect, trail: Vec2[], max: number): Rect[]`), `worldMapLayout.ts` (import them from the kit), `buildWorld.ts`

**Interfaces:**
```ts
export interface Landscape {
  map(input: WorldInput, random: () => number): World
  farm(input: WorldInput, random: () => number): World
}
export const LANDSCAPES: Partial<Record<WorldId, Landscape>>
export const cornfieldLandscape: Landscape
```
- `buildWorld`: `worldMap` with a theme in `LANDSCAPES` → `LANDSCAPES[theme].map`; `farm` with a theme in `LANDSCAPES` → `LANDSCAPES[theme].farm`; otherwise the current layouts.
- Until Task 7 lands, `cornfieldLandscape.farm` delegates to `farmLayout`.

Composition (island `WORLD_MAP_ISLAND`, trail `WORLD_TRAILS.cornfield`, path width 1.4 for the wide dirt road, color from style):
- **Landmark**: 3 `grainBin` + 1 `grainDryer` in a tight cluster (all within 4 units of their centroid), with 2 stacks of 3 `hayBale` next to them, placed in the largest trail-free parcel that is not used by corn.
- **Corn blocks**: 2–3 `cropBlock`s on `trailFreeParcels`, spacing `[0.8, 1]`, soil patch `#b99a4b`, each ≥ 20 units².
- **Details**: 1 `cornWagon` and 1 `scarecrow` at the edge of the biggest corn block; `birds` = 3 points over the corn blocks.
- **Border**: `borderBelt('windbreak', inset(WORLD_MAP_ISLAND, 0.8))`.
- **Relief**: `reliefMounds('rolling', inset(island, 4), inset(island, 1.2))`.
- **Clutter**: `edgeClutter` around the corn blocks and the landmark only. No forest scatter, no random trees, no pond, no animals.

- [ ] **Step 1: Write failing tests** in `cornfieldLandscape.test.ts` (build with `buildWorld({ layout: 'worldMap', theme: 'cornfield', seed: 'cornfield', density, gridWidth: 0, gridHeight: 0 })`):
  - `has a grain-bin landmark`: 3 `grainBin` + 1 `grainDryer`, all within 4 of their centroid;
  - `grows corn in big blocks`: ≥ 2 patches with area ≥ 20 and every `cornStalk` inside one of them;
  - `keeps the road clear`: every feature farther than `0.7 + footprint` from the trail polyline and farther than 1.6 from each node;
  - `keeps trees on the windbreak`: every `TREE_MODELS` prop within 1.5 of the island edge;
  - `keeps clutter low`: clutter props ≤ `CLUTTER_CEILING.map`;
  - `is the same on every visit`: two builds `toEqual`;
  - `stays recognisable in light graphics`: landmark still present and fewer `cornStalk` than in `full`;
  - `rolls`: `mounds.length >= 6`; `style` equals `WORLD_STYLES.cornfield`.
- [ ] **Step 2: Run** `npx vitest run src/render/world/landscapes/cornfieldLandscape.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the move of the parcel helpers, `cornfieldLandscape.map`, `LANDSCAPES`, and the `buildWorld` dispatch.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS (`worldTrails.test.ts` cornfield cases included; if a threshold there pins the old zone layout, e.g. `count('cornfield', 'cornStalk') >= 80`, keep it passing or ledger a ruling).
- [ ] **Step 5: Commit** `feat(render): cornfield map as a corn farm with grain bins and windbreak`.

### Task 7: Cornfield mission farm

**Files:**
- Modify: `cornfieldLandscape.ts` (`farm`), `cornfieldLandscape.test.ts`, `src/render/world/buildWorld.test.ts` (the existing `keeps the grid of %s clear and visible` case passes `theme: mission.world`)
- Modify: `src/render/farm3d/FarmScene.tsx` (the dark grid base uses `world.style.palette.grassDeep` instead of `PALETTE.grassDark` when a theme is set)

Composition around a grid of `width × height` centered at the origin (`hw`, `hh` = half sizes), `core = grid expanded by 9`:
- **Landmark**: bin cluster (3 `grainBin`, 1 `grainDryer`, hay stacks) behind the grid, centered near `(-hw - 5, -hh - 5)` — the side away from the camera.
- **Corn blocks**: one block along the left side (`x < -hw - 1.5`) and one along the back (`z < -hh - 1.5`), each ≥ 18 units², leaving 1.2 clear around the grid.
- **Front side** (`x + z > 0`): only low things — the dirt road (width 1.4) from the grid's front edge out to the border, 1 `cornWagon`, 1 `scarecrow`, 2–3 `hayBale`.
- **Border**: `borderBelt('windbreak', core, random, [road exit])`.
- **Relief**: `reliefMounds('rolling', core, expand(core, 10))`; ground rect = `expand(core, 12)`.
- `birds`: 3 points over the corn blocks. No river, no pasture, no animals, no barn/house/pond from the base farm.

- [ ] **Step 1: Write failing tests** (`buildWorld({ layout: 'farm', theme: 'cornfield', … })`):
  - `it.each(cornfield grid sizes)` — sizes from `MISSIONS.filter((m) => m.world === 'cornfield').map((m) => gridSizeOf(m.map.cells))`, deduplicated:
    - nothing (feature or non-fence prop) within `GRID_CLEARANCE` of the grid;
    - no `grainBin`/`grainDryer`/tree with `x + z > 0` within `FRONT_CLEARANCE` of the grid;
    - the bin landmark exists with its centroid at `x + z < 0`;
    - ≥ 2 corn patches, every `cornStalk` inside one;
  - `is a new place, not the base farm`: `river === null`, `pasture === null`, `animals.length === 0`, and no prop model in `['barn', 'reservoir', 'chicken-coop', 'tower-windmill', 'water-tower']`;
  - clutter ≤ `CLUTTER_CEILING.farm`; same-seed builds `toEqual`.
- [ ] **Step 2: Run** `npx vitest run src/render/world/landscapes src/render/world/buildWorld.test.ts` — Expected: FAIL (farm still delegates to `farmLayout`).
- [ ] **Step 3: Implement** `cornfieldLandscape.farm`.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS. Extend `landscapePerf.spec.ts` with the cornfield map (`/#/missoes` after a garden-done save, next world) and `/#/jogar/cornfield-01`, both `<= BASELINE`. Run it — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): cornfield mission scene is its own corn farm`.

### Task 8: Pilot checkpoint (hard stop)

- [ ] **Step 1:** Screenshot at 1440×900 the cornfield map and missions `cornfield-01` (smallest grid) and the largest cornfield grid, in normal and light graphics (Playwright, URL navigation, seeded save). Save under the session scratchpad.
- [ ] **Step 2:** Show the screenshots to the user, with the draw-call numbers against the baseline. Ask for approval or changes.
- [ ] **Step 3:** Apply requested changes with the same TDD loop; record each as a ledger ruling. Do not start Phase 3 until the user approves.
- [ ] **Step 4:** Push only if the user asks.
