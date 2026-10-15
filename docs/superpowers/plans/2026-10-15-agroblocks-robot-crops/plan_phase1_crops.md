# Phase 1 — Tomato in three stages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 4.

### Task 1.1: Procedural tomato plant

**Files:**
- Create: `src/render/crops/cropShape.ts`, `src/render/crops/cropShape.test.ts`, `src/render/crops/CropPlant.tsx`
- Modify: `src/render/farm3d/PlotTile.tsx`, `src/render/farm3d/FarmScene.tsx`, `src/features/home/HomeLandscape.tsx`, `src/render/palette.ts`, `src/render/models/modelChoice.ts`, `src/render/models/modelChoice.test.ts`, `src/render/models/manifest.ts`, `src/render/models/manifest.test.ts`, `src/render/models/generatedModels.test.ts`
- Delete: `src/render/farm3d/PlantModel.tsx`

**Interfaces:**
- Produces: `type CropStage = 'planted' | 'growing' | 'ready'`; `cropStageFor(plot: PlotState): CropStage | null`; `cropShape(stage: CropStage): CropShape`; `<CropPlant stage seed reducedMotion />`; `<HarvestedStubble />`; `PlotTile` props no longer include `growTicks`.
- Consumed later by: Task 5.2 (legend preview renders `PlotTile`), Task 6.2 (celebration beds).

- [ ] **Step 1: Write the failing tests**

`src/render/crops/cropShape.test.ts`:
```ts
import { cropShape, cropStageFor } from '@/render/crops/cropShape'

describe('cropStageFor', () => {
  it('maps plot states to the three tomato stages', () => {
    expect(cropStageFor('seeded')).toBe('planted')
    expect(cropStageFor('growing')).toBe('growing')
    expect(cropStageFor('mature')).toBe('ready')
    expect(cropStageFor('untilled')).toBeNull()
    expect(cropStageFor('tilled')).toBeNull()
    expect(cropStageFor('harvested')).toBeNull()
  })
})

describe('cropShape', () => {
  it('shows a full bush with big red tomatoes and a glow when ready', () => {
    const ready = cropShape('ready')
    const red = ready.fruits.filter((fruit) => fruit.color === 'red')
    expect(red.length).toBeGreaterThanOrEqual(5)
    for (const fruit of red) expect(fruit.radius).toBeGreaterThanOrEqual(0.08)
    expect(ready.glow).toBe(true)
  })

  it('keeps growing plants green and without glow', () => {
    const growing = cropShape('growing')
    expect(growing.fruits.filter((fruit) => fruit.color === 'red')).toHaveLength(0)
    expect(growing.glow).toBe(false)
  })

  it('makes each stage clearly bigger than the previous one', () => {
    const planted = cropShape('planted')
    const growing = cropShape('growing')
    const ready = cropShape('ready')
    expect(growing.width).toBeGreaterThanOrEqual(planted.width * 2)
    expect(ready.width).toBeGreaterThanOrEqual(growing.width * 1.25)
    expect(ready.height).toBeGreaterThan(growing.height)
    expect(ready.width).toBeLessThanOrEqual(0.8)
  })

  it('puts a soil mound only under the fresh sprout', () => {
    expect(cropShape('planted').mound).toBe(true)
    expect(cropShape('growing').mound).toBe(false)
    expect(cropShape('ready').mound).toBe(false)
  })
})
```

`src/render/models/modelChoice.test.ts` — replace the whole file with:
```ts
import * as modelChoice from '@/render/models/modelChoice'
import { robotClipFor } from '@/render/models/modelChoice'

describe('modelChoice', () => {
  it('no longer maps old decoration kinds or crop models', () => {
    expect('decorationModelId' in modelChoice).toBe(false)
    expect('cropModelId' in modelChoice).toBe(false)
    expect('cropStageFor' in modelChoice).toBe(false)
  })

  it('chooses the robot clip by priority', () => {
    expect(robotClipFor({ moving: true, failed: true, celebrating: true })).toBe('error')
    expect(robotClipFor({ moving: true, failed: false, celebrating: true })).toBe('success')
    expect(robotClipFor({ moving: true, failed: false, celebrating: false })).toBe('move')
    expect(robotClipFor({ moving: false, failed: false, celebrating: false })).toBe('idle')
  })
})
```

In `src/render/models/manifest.test.ts`, replace the test `'lists the models the scene needs'` with:
```ts
  it('lists the models the scene needs without crop models', () => {
    expect(REQUIRED_MODEL_IDS).toContain('robot')
    expect(REQUIRED_MODEL_IDS.filter((id) => id.startsWith('crop-'))).toHaveLength(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/crops src/render/models/modelChoice.test.ts src/render/models/manifest.test.ts`
Expected: FAIL — `cropShape` module not found; `cropModelId in modelChoice` is true; REQUIRED still has 5 crop ids.

- [ ] **Step 3: Implement the crop description**

`src/render/crops/cropShape.ts`:
```ts
import type { PlotState } from '@/game/world/types'

export type CropStage = 'planted' | 'growing' | 'ready'

export interface CropLeaf {
  x: number
  y: number
  z: number
  radius: number
  squash: number
}

export interface CropFruit {
  x: number
  y: number
  z: number
  radius: number
  color: 'green' | 'red'
}

export interface CropShape {
  stemHeight: number
  leaves: CropLeaf[]
  fruits: CropFruit[]
  width: number
  height: number
  glow: boolean
  mound: boolean
}

export function cropStageFor(plot: PlotState): CropStage | null {
  if (plot === 'seeded') return 'planted'
  if (plot === 'growing') return 'growing'
  if (plot === 'mature') return 'ready'
  return null
}

function leafRing(count: number, distance: number, y: number, radius: number, squash: number, offset = 0): CropLeaf[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = offset + (index / count) * Math.PI * 2
    return { x: Math.cos(angle) * distance, y, z: Math.sin(angle) * distance, radius, squash }
  })
}

function fruitRing(count: number, distance: number, y: number, radius: number, color: CropFruit['color']): CropFruit[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.3
    return { x: Math.cos(angle) * distance, y: y + (index % 2) * 0.08, z: Math.sin(angle) * distance, radius, color }
  })
}

function measure(stemHeight: number, leaves: CropLeaf[], fruits: CropFruit[], glow: boolean, mound: boolean): CropShape {
  const parts = [...leaves, ...fruits]
  const width = Math.max(...parts.map((part) => 2 * (Math.hypot(part.x, part.z) + part.radius)))
  const height = Math.max(stemHeight, ...parts.map((part) => part.y + part.radius))
  return { stemHeight, leaves, fruits, width, height, glow, mound }
}

export function cropShape(stage: CropStage): CropShape {
  if (stage === 'planted') {
    return measure(0.12, [
      { x: 0.07, y: 0.13, z: 0, radius: 0.06, squash: 0.45 },
      { x: -0.07, y: 0.13, z: 0, radius: 0.06, squash: 0.45 },
    ], [], false, true)
  }
  if (stage === 'growing') {
    return measure(0.25, [...leafRing(5, 0.15, 0.2, 0.13, 0.75), { x: 0, y: 0.34, z: 0, radius: 0.12, squash: 0.8 }], [], false, false)
  }
  return measure(
    0.3,
    [...leafRing(6, 0.2, 0.24, 0.15, 0.75), ...leafRing(3, 0.09, 0.38, 0.13, 0.8, 0.5), { x: 0, y: 0.46, z: 0, radius: 0.1, squash: 0.85 }],
    fruitRing(6, 0.27, 0.22, 0.085, 'red'),
    true,
    false,
  )
}
```

- [ ] **Step 4: Remove crop helpers from `modelChoice` and crop ids from the manifest list**

`src/render/models/modelChoice.ts` becomes:
```ts
export type RobotClip = 'idle' | 'move' | 'success' | 'error'

export function robotClipFor({ moving, failed, celebrating }: { moving: boolean; failed: boolean; celebrating: boolean }): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  if (moving) return 'move'
  return 'idle'
}
```

`src/render/models/manifest.ts`: delete `'crop-1'` … `'crop-5'` from `REQUIRED_MODEL_IDS` and `'straw'` from `OPTIONAL_MODEL_IDS`.

`src/render/models/generatedModels.test.ts`: in `'has every required and world model in the manifest'`, change the extra list to `'barn', 'silo', 'windmill', 'reservoir'` (drop `'straw'`).

- [ ] **Step 5: Add palette colors and the plant component**

`src/render/palette.ts`: add after `fruitAlt`:
```ts
  fruitUnripe: '#9ccc4a',
  readyGlow: '#ffe27a',
```

`src/render/crops/CropPlant.tsx`:
```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderGeometry, IcosahedronGeometry, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, SphereGeometry, type Group, type Mesh } from 'three'
import { cropShape, type CropStage } from '@/render/crops/cropShape'
import { PALETTE } from '@/render/palette'

function flat(color: string, emissive = '#000000', emissiveIntensity = 0): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.02, emissive, emissiveIntensity })
}

const MATERIALS = {
  leaf: flat(PALETTE.leaf),
  leafDark: flat(PALETTE.leafDark),
  stem: flat(PALETTE.leafDark),
  red: flat(PALETTE.fruit, PALETTE.fruit, 0.18),
  green: flat(PALETTE.fruitUnripe),
  soil: flat(PALETTE.soilTilled),
  straw: flat(PALETTE.straw),
  glow: new MeshBasicMaterial({ color: PALETTE.readyGlow, transparent: true, opacity: 0.6, depthWrite: false }),
  spark: new MeshBasicMaterial({ color: PALETTE.readyGlow }),
}

const GEOMETRIES = {
  leaf: new IcosahedronGeometry(1, 0),
  fruit: new IcosahedronGeometry(1, 1),
  stem: new CylinderGeometry(0.02, 0.03, 1, 5),
  mound: new SphereGeometry(0.14, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
  ring: new RingGeometry(0.36, 0.44, 24),
  spark: new IcosahedronGeometry(0.06, 0),
  stalk: new CylinderGeometry(0.015, 0.02, 0.12, 4),
}

interface CropPlantProps {
  stage: CropStage
  seed: number
  reducedMotion: boolean
}

export function CropPlant({ stage, seed, reducedMotion }: CropPlantProps) {
  const shape = cropShape(stage)
  const sway = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const spark = useRef<Group>(null)
  const animated = shape.glow && !reducedMotion

  useFrame(({ clock }) => {
    if (!animated) return
    const time = clock.elapsedTime + seed
    if (sway.current) sway.current.rotation.z = Math.sin(time * 1.6) * 0.04
    if (ring.current) {
      const pulse = 1 + Math.sin(time * 3) * 0.08
      ring.current.scale.set(pulse, pulse, 1)
    }
    if (spark.current) {
      spark.current.position.y = shape.height + 0.18 + Math.sin(time * 2.4) * 0.05
      spark.current.rotation.y = time * 1.5
    }
  })

  return (
    <group rotation={[0, seed % (Math.PI * 2), 0]}>
      {shape.mound && <mesh geometry={GEOMETRIES.mound} material={MATERIALS.soil} castShadow />}
      {shape.glow && <mesh ref={ring} geometry={GEOMETRIES.ring} material={MATERIALS.glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} />}
      <group ref={sway}>
        <mesh geometry={GEOMETRIES.stem} material={MATERIALS.stem} position={[0, shape.stemHeight / 2, 0]} scale={[1, shape.stemHeight, 1]} />
        {shape.leaves.map((leaf, index) => (
          <mesh
            key={`leaf-${index}`}
            geometry={GEOMETRIES.leaf}
            material={index % 2 === 0 ? MATERIALS.leaf : MATERIALS.leafDark}
            position={[leaf.x, leaf.y, leaf.z]}
            scale={[leaf.radius, leaf.radius * leaf.squash, leaf.radius]}
            castShadow
          />
        ))}
        {shape.fruits.map((fruit, index) => (
          <mesh
            key={`fruit-${index}`}
            geometry={GEOMETRIES.fruit}
            material={fruit.color === 'red' ? MATERIALS.red : MATERIALS.green}
            position={[fruit.x, fruit.y, fruit.z]}
            scale={fruit.radius}
            castShadow
          />
        ))}
      </group>
      {animated && (
        <group ref={spark} position={[0, shape.height + 0.18, 0]}>
          <mesh geometry={GEOMETRIES.spark} material={MATERIALS.spark} />
        </group>
      )}
    </group>
  )
}

export function HarvestedStubble() {
  return (
    <group>
      {[-0.18, 0, 0.18].map((x, index) => (
        <mesh key={x} geometry={GEOMETRIES.stalk} material={MATERIALS.straw} position={[x, 0.05, (index - 1) * 0.12]} rotation={[0, index, 0.3]} />
      ))}
    </group>
  )
}
```

- [ ] **Step 6: Use the plant in `PlotTile` and drop `growTicks`**

In `src/render/farm3d/PlotTile.tsx`:
- Replace the imports of `PlantModel` and `cropModelId, cropStageFor` with:
```ts
import { CropPlant, HarvestedStubble } from "@/render/crops/CropPlant";
import { cropStageFor } from "@/render/crops/cropShape";
```
- Remove `growTicks` from `PlotTileProps`, from `Soil` parameters and from `PlotTile` parameters and the `<Soil … />` call.
- Add `seed: number` to the `Soil` props (`Omit<PlotTileProps, "position"> & { seed: number }`) and in `PlotTile` compute and pass it:
```ts
  const seed = Math.abs(position[0] * 12.9898 + position[2] * 78.233) % (Math.PI * 2);
```
- Replace the crop IIFE and the harvested block inside `Soil` with:
```tsx
      {(() => {
        const stage = cropStageFor(cell.plot);
        if (stage === null) return null;
        return (
          <group position={[0, BED_HEIGHT, 0]}>
            <SpringIn key={stage} enabled={!reducedMotion}>
              <CropPlant stage={stage} seed={seed} reducedMotion={reducedMotion} />
            </SpringIn>
          </group>
        );
      })()}
      {cell.plot === "harvested" && (
        <group position={[0, BED_HEIGHT, 0]}>
          <HarvestedStubble />
        </group>
      )}
```
- `src/render/farm3d/FarmScene.tsx`: remove `growTicks` from the destructured props and the `growTicks={growTicks}` attribute on `<PlotTile>` (the prop stays in `FarmSceneProps`).
- `src/features/home/HomeLandscape.tsx`: remove `growTicks={4}` from `<PlotTile>`.
- Delete `src/render/farm3d/PlantModel.tsx`.

Run: `grep -rn "PlantModel\|cropModelId\|growTicks={" src`
Expected: no lines.

- [ ] **Step 7: Run tests and typecheck**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS (all suites).

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat(crops): procedural three-stage tomato with a glowing ready state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
