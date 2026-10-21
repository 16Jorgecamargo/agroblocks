# Phase 3 — Horta and Pomar

Read `plan_index.md` first. Start only after Task 8 is approved by the user (ledger line). Apply any style rulings from Task 8 here too.

Every world from here on follows the same pattern as the cornfield: an objects task (new `FeatureKind`s + geometries, covered by `featureGeometry.test.ts`'s `it.each(FEATURE_KINDS)`), then a landscape task (map + farm, covered by the shared contract below plus world-specific tests).

### Task 9: Garden objects

**Files:**
- Create: `src/render/world/features/gardenObjects.ts`
- Modify: `worldTypes.ts` (`toolShed`, `compostBins`, `wateringCan`, `chicken`), `featureGeometry.ts`, `worldCatalog.ts` (footprints: toolShed 1.3, compostBins 0.9, wateringCan 0.25, chicken 0.25; `toolShed` tall), `InstancedFeatures.tsx` (`PECKING` set = `chicken`: each instance bobs its head-down tilt `sin(time * 3 + index)` around x when `ambient`)

Shapes: `toolShed` wood box 1.6×1.4×1.2 `#9c6b43` with a gable roof `#5d7a3a`, door `#6b4a2e`, two watering cans by the door; `compostBins` 3 open slatted boxes `#8a6448` with dark soil `#4a3626`; `wateringCan` small green `#4f9a3a` body + spout; `chicken` white body `#f4f1e8`, red comb `#d9473c`, yellow beak, ~0.35 tall.

- [ ] **Step 1:** add the kinds to `FEATURE_KINDS`. **Step 2:** `npx vitest run src/render/world/features` — Expected: FAIL for the new kinds. **Step 3:** implement. **Step 4:** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS. **Step 5:** commit `feat(render): tool shed, compost, watering can and chickens for the garden`.

### Task 10: Shared landscape contract + garden map and farm

**Files:**
- Create: `src/render/world/landscapes/landscapeContract.ts` (test helper, imported only by tests), `src/render/world/landscapes/gardenLandscape.ts`, `src/render/world/landscapes/gardenLandscape.test.ts`
- Modify: `cornfieldLandscape.test.ts` (use the contract for the shared cases), `landscapes.ts` (register `garden`)

**Interfaces:**
```ts
export interface LandscapeExpectations {
  world: WorldId
  landmark: (FeatureKind | ModelId)[]
  crops: FeatureKind[]
  minBlocks: { map: number; farm: number }
}
export function describeLandscape(expect: LandscapeExpectations): void
```
`describeLandscape` registers, for both `map` and every distinct grid size of that world's missions in `farm`:
- the landmark kinds/models are present (map: anywhere; farm: centroid at `x + z < 0`);
- ≥ `minBlocks.map` / `minBlocks.farm` ground patches and every feature of a `crops` kind inside one;
- map: nothing within `0.7 + footprint` of the trail nor 1.6 of a node; trees only on the border belt (within 1.5 of the island edge);
- farm: nothing within `GRID_CLEARANCE` of the grid; no tall feature/model at `x + z > 0` within `FRONT_CLEARANCE`; no prop model in `['barn', 'reservoir', 'chicken-coop', 'tower-windmill', 'water-tower']` unless listed in `landmark`; `river === null` unless the world declares a pond;
- clutter ≤ `CLUTTER_CEILING`; same-seed builds `toEqual`; `light` keeps the landmark; `style` equals `WORLD_STYLES[world]`.

Garden composition (style: flat, hedge border, bright morning):
- **Map**: landmark `toolShed` + `compostBins` + 2 `wateringCan` together; 3–4 bed blocks (`vegetableBed`, spacing `[1.9, 1.3]`, soil `#8a6448`) on trail-free parcels, each with a low `hedge` around it; a chicken run: small `woodFence` rect with the `chicken-coop` model and 4 `chicken`; island border `hedge`; flower clutter (`flower-*`) on block edges only; butterflies over the beds.
- **Farm**: tool shed + compost behind the grid; one bed block on the left, one at the back; chicken run on the left-front (low only); hedge border around `core` with a gap where the path leaves; butterflies.
- Garden lists `chicken-coop` in its `landmark` models, so the base-farm check allows it.

- [ ] **Step 1: Write failing tests**: `describeLandscape({ world: 'garden', landmark: ['toolShed', 'compostBins'], crops: ['vegetableBed'], minBlocks: { map: 3, farm: 2 } })` plus `the chickens live in their run` (every `chicken` inside the run's fence rect) and `beds are hedged` (≥ 1 `hedge` feature within 0.6 of each bed patch edge).
- [ ] **Step 2: Run** `npx vitest run src/render/world/landscapes` — Expected: FAIL (garden not registered).
- [ ] **Step 3: Implement** the contract helper, refactor the cornfield tests to use it (they keep passing), and the garden landscape.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS. Add garden map/farm to `landscapePerf.spec.ts` (they must stay `<= BASELINE`, which was measured on the old Horta) and run it — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): garden map and mission scene as a kitchen garden`.

### Task 11: Orchard objects

**Files:**
- Create: `src/render/world/features/orchardObjects.ts`
- Modify: `worldTypes.ts` (`packingShed`, `crateStack`, `orchardLadder`), `featureGeometry.ts`, `worldCatalog.ts` (footprints 1.6 / 0.6 / 0.4; `packingShed` tall)

Shapes: `packingShed` open-sided shed: 4 posts, pitched roof `#a33b2f` 2.4×1.8, a few crates inside; `crateStack` 2×2×2 wooden crates `#b98a52` with red `#e0473c` and orange `#f29a2e` fruit tops; `orchardLadder` A-frame ladder `#c49a63` ~1.6 tall.

- [ ] Steps 1–5 as in Task 9. Commit `feat(render): packing shed, crates and ladders for the orchard`.

### Task 12: Orchard map and farm

**Files:**
- Create: `src/render/world/landscapes/orchardLandscape.ts`, `orchardLandscape.test.ts`
- Modify: `landscapes.ts`

Composition (style: terraced, stoneWall border, soft light, grass paths):
- **Map**: 3 orchard blocks of `fruitTree` in straight rows (spacing `[2.4, 2.4]`, tints `#e0473c`, `#f29a2e`, `#f2c94c`, one tint per block so each block reads as one fruit), on terraces: block patches with `height` 0.25, 0.5 and 0.75, color `#5f9e44`; trees get `y` = patch height; `orchardLadder` leaning by 2 trees; landmark `packingShed` + 3 `crateStack` beside it; island border `stoneWall`.
- **Farm**: two terraced blocks (left and back), packing shed + crates behind the grid, a `crateStack` and the path in front, `stoneWall` border with a gap.

- [ ] **Step 1: Write failing tests**: `describeLandscape({ world: 'orchard', landmark: ['packingShed', 'crateStack'], crops: ['fruitTree'], minBlocks: { map: 3, farm: 2 } })` plus `each block grows one fruit` (all trees in a patch share a tint) and `terraces step up` (patch heights include 3 distinct values > 0 on the map, and every tree's `y` equals its patch height).
- [ ] **Step 2:** run — Expected: FAIL. **Step 3:** implement. **Step 4:** `npx vitest run src/render && npx tsc --noEmit -p .` + perf spec for orchard — Expected: PASS. **Step 5:** commit `feat(render): orchard map and mission scene with terraced fruit blocks`.
