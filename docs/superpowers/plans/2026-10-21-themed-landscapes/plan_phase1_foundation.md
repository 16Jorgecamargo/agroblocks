# Phase 1 — Foundation

Read `plan_index.md` first (Global Constraints, Review Focus).

### Task 1: Draw-call probe and baseline

**Files:**
- Create: `src/render/DrawCallProbe.tsx`
- Modify: `src/render/farm3d/FarmScene.tsx`, `src/features/mission-select/WorldMapScene.tsx` (mount the probe inside each `<Canvas>`)
- Create: `tests/e2e/landscapePerf.spec.ts`

**Interfaces:**
- Produces: `DrawCallProbe(): null` — every 30 frames sets `gl.domElement.dataset.drawCalls = String(gl.info.render.calls)`.
- Produces: `BASELINE = { map: number; farm: number }` inside `landscapePerf.spec.ts`.

- [ ] **Step 1: Write the e2e test** `the Horta map and mission stay under the draw-call ceiling`: seed with `saveWithProgram('garden-01', …)` from `tests/e2e/helpers.ts`, open `/#/missoes`, wait for `canvas[data-draw-calls]`, read the number; open `/#/jogar/garden-01`, read again; assert each `<=` its `BASELINE` entry. Start with `BASELINE = { map: 0, farm: 0 }`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/landscapePerf.spec.ts` — Expected: FAIL (`canvas[data-draw-calls]` never appears).
- [ ] **Step 3: Implement `DrawCallProbe`** with `useThree` + `useFrame`; mount in both scenes.
- [ ] **Step 4: Run again** — Expected: FAIL on `<= 0`, printing real numbers. Write them into `BASELINE` rounded up to the next 10. Rerun — Expected: PASS.
- [ ] **Step 5: Commit** `test(perf): draw-call probe and Horta baseline`. Ledger both baseline numbers.

Note: trail labels move every frame, so Playwright clicks on `.map-label` need `{ force: true }`; prefer navigating by URL.

### Task 2: World styles

**Files:**
- Create: `src/render/world/worldStyles.ts`, `src/render/world/worldStyles.test.ts`, `src/render/world/SceneLighting.tsx`
- Modify: `worldTypes.ts` (`World.style`), `worldThemes.ts` (`themePalette` reads the style), every layout (`farmLayout`, `worldMapLayout`, `homeLayout`, `celebrationLayout`) sets `style`, `FarmScene.tsx` and `WorldMapScene.tsx` (replace the hard-coded `<color>`, `hemisphereLight`, `directionalLight` with `<SceneLighting style={world.style} shadows={!lowGraphics} />`, keeping today's shadow-camera bounds per scene)

**Interfaces:**
```ts
export type Relief = 'flat' | 'rolling' | 'terraced'
export type BorderKind = 'hedge' | 'windbreak' | 'stoneWall' | 'meshFence' | 'woodFence' | 'mixed'
export interface WorldStyle {
  palette: WorldPaletteColors
  sky: string
  hemisphere: { sky: string; ground: string; intensity: number }
  sun: { color: string; intensity: number; position: [number, number, number] }
  relief: Relief
  border: BorderKind
}
export const TRAINING_STYLE: WorldStyle
export const WORLD_STYLES: Record<WorldId, WorldStyle>
export function styleOf(theme: WorldId | null | undefined): WorldStyle
export function SceneLighting(props: { style: WorldStyle; shadows: boolean; shadowExtent: number }): JSX.Element
```

`TRAINING_STYLE` reproduces today's scene: sky `PALETTE.sky`, hemisphere `#f1f8ff` / `PALETTE.grassDark` 0.9, sun `#ffffff` 1.5 at `[10, 18, 8]`, `flat`, `woodFence`, `DEFAULT_PALETTE`.

| world | grass / grassDeep / path | sky | sun color · intensity · position | relief | border |
|---|---|---|---|---|---|
| garden | `#7cc35a` `#63a945` `#c9a46b` | `#cfeefc` | `#fff6e0` · 1.5 · `[10, 18, 8]` | flat | hedge |
| cornfield | `#cdbd62` `#b5a54d` `#b88f55` | `#f6d9a8` | `#ffcf86` · 1.6 · `[14, 10, 4]` | rolling | windbreak |
| orchard | `#5fa845` `#4a8f37` `#8cc06a` | `#d6ecf5` | `#fff0dc` · 1.3 · `[8, 18, 10]` | terraced | stoneWall |
| greenhouse | `#8cc9a0` `#72b088` `#d9d2c3` | `#e3f4f4` | `#f2fbff` · 1.4 · `[6, 20, 6]` | flat | meshFence |
| barnyard | `#b9b071` `#a19858` `#a9875b` | `#f3e3c8` | `#ffe2b0` · 1.45 · `[12, 14, 6]` | flat | woodFence |
| homestead | `DEFAULT_PALETTE` | `#cfe8f5` | `#ffffff` · 1.5 · `[10, 18, 8]` | rolling | mixed |

Hemisphere per world: `sky` = the world's sky, `ground` = its `grassDeep`, intensity 0.9.

- [ ] **Step 1: Write failing tests** in `worldStyles.test.ts`:
  - the 6 skies are distinct, the 6 grass colors are distinct, and the 6 `` `${relief}/${border}` `` pairs are distinct;
  - `styleOf(null)` equals `TRAINING_STYLE`; `styleOf('cornfield').sun.color === '#ffcf86'`;
  - `buildWorld({ layout: 'worldMap', theme: 'orchard', … }).style` equals `WORLD_STYLES.orchard`.
- [ ] **Step 2: Run** `npx vitest run src/render/world/worldStyles.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the registry, `World.style`, `SceneLighting`, and wire both scenes. Remove `WORLD_THEMES[*].palette`; `themePalette` returns `styleOf(theme).palette`.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS, clean.
- [ ] **Step 5: Commit** `feat(render): per-world style with its own sky, light and palette`.

### Task 3: Instanced features

**Files:**
- Create: `src/render/world/features/featureGeometry.ts`, `src/render/world/features/featureGeometry.test.ts`, `src/render/world/InstancedFeatures.tsx`
- Modify: `worldTypes.ts` (`WorldFeature.y?: number`; export runtime `FEATURE_KINDS` behind `FeatureKind`), `FarmScene.tsx`, `WorldMapScene.tsx`
- Delete: `src/render/world/WorldFeatures.tsx`, `src/render/world/CornField.tsx`, `src/render/world/CornField.test.ts` (its two cases move to `featureGeometry.test.ts`)

**Interfaces:**
```ts
export function compose(position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number]): Matrix4
export function part(geometry: BufferGeometry, color: string, matrix: Matrix4): BufferGeometry
export function mergeParts(parts: BufferGeometry[]): BufferGeometry
export function featureGeometry(kind: FeatureKind, tint?: string): BufferGeometry
export function featureGlass(kind: FeatureKind): BufferGeometry | null
export function groupFeatures(features: WorldFeature[]): Map<string, WorldFeature[]>
export const SWAYING: ReadonlySet<FeatureKind>
export function InstancedFeatures(props: { features: WorldFeature[]; ambient: boolean; shadows: boolean }): JSX.Element
```
- `featureGeometry` is memoized per `kind|tint`. Existing kinds (`cornStalk`, `fruitTree`, `greenhouse`, `vegetableBed`, `hayBale`, `trough`) are ported 1:1 from `WorldFeatures.tsx`. `fruitTree` uses `tint` for the fruit parts. `featureGlass` returns the transparent parts (greenhouse glass), else `null`.
- `groupFeatures` keys are `` `${kind}|${tint ?? ''}` ``.
- `InstancedFeatures`: one `instancedMesh` per group with `meshLambertMaterial vertexColors flatShading`, plus one transparent (`opacity 0.35`) instanced mesh per group whose kind has glass. `SWAYING` = `cornStalk`, `fruitTree`: matrices updated each frame when `ambient`; others set once.

- [ ] **Step 1: Write failing tests** in `featureGeometry.test.ts`:
  - `it.each(FEATURE_KINDS)('%s builds one colored geometry standing on the ground')`: `color.count === position.count`, `position.count > 0`, `boundingBox.min.y` within ±0.1 of 0;
  - `groupFeatures` puts two fruit trees with different tints in two groups and two corn stalks in one;
  - `featureGeometry('cornStalk') === featureGeometry('cornStalk')`;
  - the two corn cases from `CornField.test.ts`.
- [ ] **Step 2: Run** `npx vitest run src/render/world/features` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement**; render `InstancedFeatures` where `WorldFeatures` was; apply `feature.y ?? 0`.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS. `npx playwright test tests/e2e/landscapePerf.spec.ts` — Expected: PASS (ledger the new numbers).
- [ ] **Step 5: Commit** `perf(render): every world feature drawn by instancing`.

### Task 4: Landscape kit

**Files:**
- Create: `src/render/world/landscapes/landscapeKit.ts`, `src/render/world/landscapes/landscapeKit.test.ts`
- Modify: `worldTypes.ts` (`GroundPatch.height?: number`; `World.mounds?: Mound[]`; `FeatureKind` gains `hedge`, `stoneWall`, `meshFence`), `featureGeometry.ts` (the three border geometries, each a 1-unit segment along x), `worldCatalog.ts` (`FEATURE_FOOTPRINTS` for new kinds), `WorldTerrain.tsx` (patch box top at `height ?? 0.02`; render `world.mounds` as low-poly `coneGeometry` hills, 7 radial segments, in `palette.grassDeep`)

**Interfaces:**
```ts
export interface Block { rect: Rect; color: string; height?: number }
export interface Mound { x: number; z: number; radius: number; height: number }
export function cropBlock(draft: WorldDraft, block: Block, feature: FeatureKind, spacing: [number, number], random: () => number, options?: { tints?: string[]; jitter?: number }): GroundPatch
export function landmark(draft: WorldDraft, kind: FeatureKind | ModelId, at: Vec2, rotation: number, scale?: number): void
export function borderBelt(draft: WorldDraft, border: BorderKind, rect: Rect, random: () => number, gaps?: Vec2[]): void
export function edgeClutter(draft: WorldDraft, blocks: Rect[], density: WorldDensity, random: () => number, perBlock?: number): void
export function reliefMounds(relief: Relief, outside: Rect, bounds: Rect, random: () => number): Mound[]
export const CLUTTER_CEILING = { map: 60, farm: 80 }
```
- `cropBlock` fills the rect in rows by `spacing` with `jitter` (default 0.1) and sets each feature's `y` to `block.height ?? 0`; returns the patch to push into `World.patches`.
- `landmark` places by hand: models via `draft.force`, features pushed unconditionally (needs `WorldDraft.forceFeature(kind, point, rotation, scale, tint?, y?)`).
- `borderBelt` walks the rect perimeter: `hedge` / `stoneWall` / `meshFence` place segments every 1 unit rotated along the side; `windbreak` places `TREE_MODELS` every 1.6; `woodFence` uses `draft.fenceLine`; `mixed` gives the four sides hedge, stoneWall, woodFence, windbreak in that order. Points within 1.2 of any `gaps` entry are skipped.
- `edgeClutter` places at most `perBlock` (default 6; `light` halves it) `CLUTTER_MODELS` 0.4–0.9 outside each block edge.
- `reliefMounds('rolling', outside, bounds)` returns 6–10 mounds inside `bounds` and outside `outside`; `flat` and `terraced` return `[]`.

- [ ] **Step 1: Write failing tests** in `landscapeKit.test.ts`:
  - `cropBlock` keeps every feature inside `block.rect` and sets `y` to `block.height`;
  - `borderBelt('hedge', rect, …, [gap])` puts every feature within 0.3 of the perimeter and none within 1.2 of `gap`; `'mixed'` produces hedge, stoneWall, fence and tree pieces;
  - `edgeClutter` with three blocks places ≤ 18 clutter props in `full` and ≤ 9 in `light`, none inside a block;
  - `reliefMounds('rolling', …)` returns ≥ 6 mounds, none inside `outside`; `'flat'` returns `[]`;
  - `landmark(draft, 'silo', p, 0)` adds the prop even inside a keep-out zone.
- [ ] **Step 2: Run** `npx vitest run src/render/world/landscapes` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the kit, `forceFeature`, the three border geometries and the terrain changes.
- [ ] **Step 4: Run** `npx vitest run src/render && npx tsc --noEmit -p .` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): landscape kit with blocks, landmark, border belt and edge clutter`.
