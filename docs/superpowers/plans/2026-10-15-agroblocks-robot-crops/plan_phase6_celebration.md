# Phase 6 — Success screen like the reference

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 6.

Screen geometry used below: the camera looks from `+x +z` (CameraRig angle π/4). A world point's screen-right offset is `(x − z)/√2` and its depth toward the viewer is `(x + z)/√2`. The robot sits at `(-2.4, 2.4)`: left of centre, at mid depth, so the result card on the right never covers it.

### Task 6.1: `celebration` world layout

**Files:**
- Create: `src/render/world/celebrationLayout.ts`, `src/render/world/celebrationLayout.test.ts`
- Modify: `src/render/world/worldTypes.ts`, `src/render/world/buildWorld.ts`

**Interfaces:**
- Consumes: `WorldDraft` (`placeNear`, `fenceLine`, `scatter`), `addClutter`, `addButterflies`, `spawnHerd`, `rectPolygon`, `rectDistance`.
- Produces: `WorldLayout` includes `'celebration'`; `CELEBRATION_ROBOT: Vec2`, `CELEBRATION_ROBOT_ZONE: Rect`, `CELEBRATION_BEDS: Rect`, `CELEBRATION_BED_CENTERS: Vec2[]`, `celebrationLayout(input, random): World`.

- [ ] **Step 1: Write the failing test**

`src/render/world/celebrationLayout.test.ts`:
```ts
import { buildWorld } from '@/render/world/buildWorld'
import { CELEBRATION_BED_CENTERS, CELEBRATION_BEDS, CELEBRATION_ROBOT, CELEBRATION_ROBOT_ZONE } from '@/render/world/celebrationLayout'
import { pointInPolygon, rectDistance } from '@/render/world/geometry'
import { FRONT_CLEARANCE, TALL_MODELS } from '@/render/world/worldCatalog'
import type { WorldDensity } from '@/render/world/worldTypes'

const BUILDINGS = ['barn', 'small-barn', 'open-barn', 'silo', 'silo-house', 'tower-windmill', 'windmill', 'water-tower', 'chicken-coop']

function celebration(density: WorldDensity = 'full') {
  return buildWorld({ layout: 'celebration', gridWidth: 0, gridHeight: 0, seed: 'celebration', density })
}

describe('buildWorld celebration', () => {
  it('is deterministic', () => {
    expect(celebration()).toEqual(celebration())
  })

  it('keeps the robot spot and the tomato beds clear', () => {
    for (const prop of celebration().props) {
      if (prop.model === 'fence' || prop.model === 'fence-gate') continue
      expect(Math.hypot(prop.x - CELEBRATION_ROBOT.x, prop.z - CELEBRATION_ROBOT.z)).toBeGreaterThanOrEqual(1.2)
      expect(rectDistance(prop, CELEBRATION_BEDS)).toBeGreaterThanOrEqual(0.4)
    }
  })

  it('keeps tall models out of the space between the camera and the robot', () => {
    for (const prop of celebration().props) {
      if (TALL_MODELS.has(prop.model) && prop.x + prop.z > 0) expect(rectDistance(prop, CELEBRATION_ROBOT_ZONE)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
  })

  it('fills the scene with buildings, animals, trees, flowers and butterflies', () => {
    const world = celebration()
    expect(world.props.length).toBeGreaterThanOrEqual(250)
    expect(world.props.filter((prop) => BUILDINGS.includes(prop.model)).length).toBeGreaterThanOrEqual(4)
    expect(world.animals.length).toBeGreaterThanOrEqual(4)
    for (const animal of world.animals) expect(pointInPolygon(animal, animal.area)).toBe(true)
    expect(world.butterflies.length).toBeGreaterThanOrEqual(5)
    expect(world.props.some((prop) => prop.model === 'fence')).toBe(true)
  })

  it('is lighter with light graphics', () => {
    expect(celebration('light').props.length).toBeLessThan(celebration().props.length * 0.6)
  })

  it('places six tomato beds next to the robot', () => {
    expect(CELEBRATION_BED_CENTERS).toHaveLength(6)
    for (const center of CELEBRATION_BED_CENTERS) expect(rectDistance(center, CELEBRATION_BEDS)).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/render/world/celebrationLayout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/render/world/worldTypes.ts`: change to `export type WorldLayout = 'farm' | 'map' | 'home' | 'celebration'`.

`src/render/world/buildWorld.ts`: add `import { celebrationLayout } from '@/render/world/celebrationLayout'` and, before the farm fallback, `if (input.layout === 'celebration') return celebrationLayout(input, random)`.

`src/render/world/celebrationLayout.ts`:
```ts
import { rectDistance, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const CELEBRATION_ROBOT: Vec2 = { x: -2.4, z: 2.4 }

export const CELEBRATION_ROBOT_ZONE: Rect = { minX: -3.4, maxX: -1.4, minZ: 1.4, maxZ: 3.4 }

export const CELEBRATION_BEDS: Rect = { minX: -5, maxX: -2, minZ: -0.25, maxZ: 1.75 }

export const CELEBRATION_BED_CENTERS: Vec2[] = [-4.5, -3.5, -2.5].flatMap((x) => [0.25, 1.25].map((z) => ({ x, z })))

export function celebrationLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const lane: Polyline = { points: [{ x: -1, z: 6 }, { x: -0.6, z: 2 }, { x: 0.2, z: -2 }, { x: 1.5, z: -7 }], width: 1.1 }
  const pastureRect: Rect = { minX: 1.8, maxX: 6, minZ: -5.5, maxZ: -1.8 }
  const pasture = rectPolygon(pastureRect)
  const robotZone = rectPolygon(CELEBRATION_ROBOT_ZONE)
  const bedZone = rectPolygon({ minX: CELEBRATION_BEDS.minX - 0.4, maxX: CELEBRATION_BEDS.maxX + 0.4, minZ: CELEBRATION_BEDS.minZ - 0.4, maxZ: CELEBRATION_BEDS.maxZ + 0.4 })
  const draft = new WorldDraft(random, { grid: null, paths: [lane], river: null, keepOut: [pasture, robotZone, bedZone], frontGuard: CELEBRATION_ROBOT_ZONE })
  const open = (point: Vec2) => rectDistance(point, CELEBRATION_BEDS) >= 0.4 && Math.hypot(point.x - CELEBRATION_ROBOT.x, point.z - CELEBRATION_ROBOT.z) >= 1.2
  const framing = (point: Vec2) => open(point) && Math.hypot(point.x + 1, point.z + 1) > 7

  draft.placeNear('barn', { x: -5.8, z: -3 }, -0.9)
  draft.placeNear('tower-windmill', { x: -1.5, z: -6.5 }, -0.4)
  draft.placeNear('silo', { x: -8.5, z: -0.5 }, 0)
  draft.placeNear('small-barn', { x: 3.5, z: -9 }, 0.3)
  draft.placeNear('chicken-coop', { x: -7.5, z: 3.5 }, 0.8)
  draft.placeNear('water-tower', { x: -10, z: -5 }, 0)
  draft.placeNear('log-stack', { x: -6.8, z: 1.6 }, 0.4)

  draft.fenceLine({ x: CELEBRATION_BEDS.minX - 0.3, z: CELEBRATION_BEDS.minZ - 0.4 }, { x: CELEBRATION_BEDS.maxX + 0.3, z: CELEBRATION_BEDS.minZ - 0.4 })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ }, 1)
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.scatter(['apple-tree'], full ? 5 : 3, { minX: -11, maxX: -6, minZ: -9, maxZ: -4 }, [0.9, 1.1], open)
  draft.scatter(TREE_MODELS, full ? 40 : 18, { minX: -16, maxX: 16, minZ: -16, maxZ: 12 }, [0.9, 1.3], framing)
  draft.scatter(FOREST_MODELS, full ? 50 : 20, { minX: -26, maxX: 26, minZ: -28, maxZ: -12 }, [0.9, 1.3])
  draft.scatter(['bush', 'bush-large'], full ? 14 : 6, { minX: -9, maxX: 6, minZ: -4, maxZ: 7 }, [0.8, 1.1], open)
  addClutter(draft, { minX: -14, maxX: 12, minZ: -12, maxZ: 10 }, input.density, 320, open)

  return {
    ground: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
    island: false,
    paths: [lane],
    river: null,
    trail: [],
    props: draft.props,
    pasture,
    animals: spawnHerd(random, pasture, [['cow', 2], ['sheep', 2], ['pig', 1]], 'celebration'),
    butterflies: addButterflies(random, { minX: -5, maxX: -0.5, minZ: -0.5, maxZ: 4 }, 6),
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/render/world`
Expected: PASS. If the prop count is below 250 with `addClutter` at 320, raise the clutter `total` to 420 and ledger it; if the light-mode ratio fails, lower the light scatter counts — never weaken the test.

- [ ] **Step 5: Commit**

```bash
git add src/render/world
git commit -m "feat(world): celebration layout with farmyard, tomato beds, pasture and framing trees

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6.2: Celebration scene and results layout

**Files:**
- Modify: `src/features/results/CelebrationScene.tsx`, `src/features/results/ResultsPage.tsx`, `src/features/results/ResultsPage.css`, `src/features/results/ResultsPage.test.tsx`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: Task 6.1 exports; `RobotShowcase({ clip, tool, reducedMotion })` (Task 3.2); `PlotTile` (Task 1.1); `SceneWithSplash({ children: (onReady) => ReactNode, label })`.
- Produces: `CelebrationScene({ reducedMotion, lowGraphics, onReady })` default export.

- [ ] **Step 1: Write the failing tests**

In `src/features/results/ResultsPage.test.tsx`, at the end of `'shows real attempt data, separates correctness from efficiency and links forward'`, add:
```tsx
    const actions = screen.getByRole('group', { name: 'Próximos passos' })
    expect([...actions.querySelectorAll('button, a')].map((item) => item.textContent?.trim())).toEqual(['Ver solução', 'Tentar novamente', 'Próxima fase'])
```

Append to `tests/e2e/motion.spec.ts`:
```ts
test('the success screen renders a full 3D celebration without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution, ['m1-first-harvest']) })
  await page.goto('/#/resultado/m1-first-harvest')
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.locator('.results__scene canvas')).toBeVisible()
  await expect(page.locator('.results__scene .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  expect(errors).toEqual([])
})
```

- [ ] **Step 2: Run the unit test to verify it fails**

Run: `npx vitest run src/features/results/ResultsPage.test.tsx`
Expected: FAIL — no group named "Próximos passos".

- [ ] **Step 3: Scene**

Replace `src/features/results/CelebrationScene.tsx` with:
```tsx
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotShowcase } from '@/render/farm3d/RobotModel'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { CELEBRATION_BED_CENTERS, CELEBRATION_ROBOT } from '@/render/world/celebrationLayout'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'

interface CelebrationSceneProps {
  reducedMotion: boolean
  lowGraphics: boolean
  onReady?: () => void
}

export default function CelebrationScene({ reducedMotion, lowGraphics, onReady }: CelebrationSceneProps) {
  const world = useMemo(() => buildWorld({ layout: 'celebration', gridWidth: 0, gridHeight: 0, seed: 'celebration', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const alive = !reducedMotion && !lowGraphics

  return (
    <Canvas
      orthographic
      shadows={!lowGraphics}
      dpr={lowGraphics ? 1 : [1, 2]}
      camera={{ position: [16, 16, 16], zoom: 60, near: -200, far: 400 }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig gridWidth={3} gridHeight={3} quarterTurns={0} zoomLevel={1.15} showcase={false} reducedMotion={reducedMotion} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <WorldTerrain world={world} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
      <Herd animals={world.animals} active={alive} />
      <Butterflies points={world.butterflies} active={alive} />
      {CELEBRATION_BED_CENTERS.map((center) => (
        <PlotTile
          key={`${center.x}:${center.z}`}
          cell={{ terrain: 'soil', plot: 'mature', moisture: 'dry', growth: 0 }}
          position={[center.x, 0, center.z]}
          isGoal={false}
          reducedMotion={reducedMotion}
        />
      ))}
      <group position={[CELEBRATION_ROBOT.x, 0, CELEBRATION_ROBOT.z]} rotation={[0, Math.PI / 4, 0]} scale={1.3}>
        <RobotShowcase clip="success" tool="crate" reducedMotion={reducedMotion} />
      </group>
    </Canvas>
  )
}
```

- [ ] **Step 4: Results page**

In `src/features/results/ResultsPage.tsx`:
- Add `import { SceneWithSplash } from '@/render/SceneWithSplash'`; remove `Suspense` from the `react` import if no longer used.
- Read `lowGraphics` with `const lowGraphics = useSettingsStore((store) => store.settings.lowGraphics)`.
- Replace the scene block with:
```tsx
      <div className="results__scene" aria-hidden="true">
        {show3d ? (
          <SceneWithSplash label="Preparando a comemoração…">
            {(onReady) => <CelebrationScene reducedMotion={reduced} lowGraphics={lowGraphics} onReady={onReady} />}
          </SceneWithSplash>
        ) : (
          <div className="home-scene--fallback" />
        )}
      </div>
```
- Replace `<motion.div className="results__actions" …>` opening tag with `<motion.div className="results__actions" role="group" aria-label="Próximos passos" variants={staggerContainer(0.08, 0.6)} initial="hidden" animate="visible">`.

In `src/features/results/ResultsPage.css`:
- `.results__scene`: add `overflow: hidden;` and append the rule:
```css
.results__scene::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 45%, rgb(19 31 41 / 0.35));
  pointer-events: none;
}
```
- `.results__card`: replace its `box-shadow` with `box-shadow: 0 8px 0 rgb(0 0 0 / 0.12), 0 24px 60px rgb(0 0 0 / 0.35);` and add `border: 2px solid #e6e1d3;`.
- `.results__title`: replace `font-family: Inter, system-ui, sans-serif;` with `font-family: var(--font-display);` and set `font-size: 2.1rem;`.
- `.results__star`: add `padding: 8px; border-radius: 50%; background: #fff4cc;`.
- `.results__box`: set `background: #ffffff;` and `border: 2px solid #ebe7dc;`.
- Replace the rules `.results__actions`, `.results__actions > div` and `.results__next` with:
```css
.results__actions {
  display: grid;
  grid-template-columns: auto auto minmax(200px, 1fr);
  gap: 12px;
}
```
  (keep `.results__actions .game-button { width: 100%; white-space: nowrap; }`).
- In `@media (max-width: 760px)`: replace `.results__actions { flex-direction: column; }` with `.results__actions { grid-template-columns: 1fr; }` and add `.results__content { align-content: end; padding-top: 42vh; }` inside the same media block (merge with the existing `.results__content` rule there).

- [ ] **Step 5: Run unit tests and typecheck**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 6: Visual tuning (required)**

Dev server on 5179, Playwright MCP at 1440×900 and 390×844, open the results page of a completed mission (seed the save as in the E2E above or finish Fase 1). Compare with `.playwright-mcp/ref/result.png`:
- Robot with the crate fully visible left of the card, about the height of the card's stat boxes; tomato beds right behind it; barn, windmill and trees behind; no sky or ground edge visible.
- If the robot is too small/large, change `zoomLevel` (1.0–1.4) or the robot `scale` (1.1–1.6); if a building hides the robot, move it in `celebrationLayout.ts` (rerun Task 6.1 tests). Ledger each change.
- Mobile: robot visible above the card.
Close the browser.

- [ ] **Step 7: E2E**

Run: `npx playwright test`
Expected: PASS (16 tests).

- [ ] **Step 8: Commit**

```bash
git add -A src tests
git commit -m "feat(results): full celebration scene with the robot holding a tomato crate and a reference-style card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
