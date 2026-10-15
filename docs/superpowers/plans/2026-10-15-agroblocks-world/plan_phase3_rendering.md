# AgroBlocks World — Fase 3: Renderização do mundo e fazenda integrada

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desenhar o `World` — chão, ilha, caminhos e rio em faixas curvas, centenas de props com instancing, moinhos girando — e trocar a decoração antiga da fazenda do jogo por ele.

**Architecture:** Funções puras testáveis (`ribbonGeometry`, `propMatrix`) + componentes R3F finos. Props agrupados por modelo; cada modelo vira um `InstancedMesh` por malha do GLB. Moinhos são renderizados individualmente para girar as pás.

**Spec:** seções 4.2, 5b, 6 · Leia `plan_index.md` antes.

---

### Task 3.1: Faixas de terreno e `WorldTerrain`

**Files:**
- Create: `src/render/world/ribbon.ts`, `src/render/world/WorldTerrain.tsx`, `src/render/world/worldPalette.ts`
- Test: `src/render/world/ribbon.test.ts`

**Interfaces:**
- Consumes: `World`, `Polyline`, `Vec2` (Fase 2).
- Produces: `ribbonGeometry(points: Vec2[], width: number): BufferGeometry`; `WorldTerrain({ world, withGround = true })`; `WORLD_COLORS`.

- [ ] **Step 1: Teste que falha `src/render/world/ribbon.test.ts`**

```ts
import { ribbonGeometry } from '@/render/world/ribbon'

describe('ribbonGeometry', () => {
  it('builds a strip with two vertices per sample along the line', () => {
    const geometry = ribbonGeometry([{ x: 0, z: 0 }, { x: 4, z: 0 }], 1)
    const positions = geometry.getAttribute('position')
    expect(positions.count % 2).toBe(0)
    expect(positions.count).toBeGreaterThanOrEqual(10)
    for (let index = 0; index < positions.count; index += 1) {
      expect(Math.abs(positions.getZ(index))).toBeCloseTo(0.5, 5)
      expect(positions.getY(index)).toBe(0)
    }
    expect(geometry.getIndex()?.count).toBe((positions.count / 2 - 1) * 6)
  })

  it('returns an empty geometry for lines with fewer than two points', () => {
    expect(ribbonGeometry([{ x: 0, z: 0 }], 1).getAttribute('position')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world/ribbon.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: `src/render/world/ribbon.ts`**

```ts
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'
import type { Vec2 } from '@/render/world/worldTypes'

const SAMPLES_PER_UNIT = 3
const MIN_SAMPLES = 8

export function ribbonGeometry(points: Vec2[], width: number): BufferGeometry {
  const geometry = new BufferGeometry()
  if (points.length < 2) return geometry
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(point.x, 0, point.z)), false, 'centripetal')
  const samples = Math.max(MIN_SAMPLES, Math.ceil(curve.getLength() * SAMPLES_PER_UNIT))
  const positions: number[] = []
  const indices: number[] = []
  const half = width / 2
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const normalX = -tangent.z
    const normalZ = tangent.x
    const length = Math.hypot(normalX, normalZ) || 1
    positions.push(point.x + (normalX / length) * half, 0, point.z + (normalZ / length) * half)
    positions.push(point.x - (normalX / length) * half, 0, point.z - (normalZ / length) * half)
    if (index > 0) {
      const base = (index - 1) * 2
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2)
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
```

- [ ] **Step 4: `src/render/world/worldPalette.ts`**

```ts
export const WORLD_COLORS = {
  grass: '#79bf4e',
  grassDeep: '#5fa53f',
  path: '#c9a46b',
  bank: '#d9c08a',
  water: '#4c9be8',
  cliff: '#8a7560',
  cliffDark: '#6f5c4a',
} as const
```

- [ ] **Step 5: `src/render/world/WorldTerrain.tsx`**

```tsx
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { ribbonGeometry } from '@/render/world/ribbon'
import { WORLD_COLORS } from '@/render/world/worldPalette'
import type { World } from '@/render/world/worldTypes'

const PATH_HEIGHT = 0.012
const BANK_HEIGHT = 0.008
const WATER_HEIGHT = 0.02
const BANK_EXTRA = 0.6
const CLIFF_DEPTH = 2.4

export function WorldTerrain({ world, withGround = true }: { world: World; withGround?: boolean }) {
  const paths = useMemo(() => world.paths.map((path) => ribbonGeometry(path.points, path.width)), [world])
  const bank = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width + BANK_EXTRA) : null), [world])
  const water = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width) : null), [world])
  const { ground } = world
  const width = ground.maxX - ground.minX
  const depth = ground.maxZ - ground.minZ
  const centerX = (ground.minX + ground.maxX) / 2
  const centerZ = (ground.minZ + ground.maxZ) / 2

  return (
    <group>
      {withGround && (
        <mesh position={[centerX, -0.05, centerZ]} receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={WORLD_COLORS.grass} roughness={0.95} flatShading />
        </mesh>
      )}
      {world.island && (
        <>
          <mesh position={[centerX, -0.1 - CLIFF_DEPTH / 2, centerZ]}>
            <boxGeometry args={[width, CLIFF_DEPTH, depth]} />
            <meshStandardMaterial color={WORLD_COLORS.cliff} roughness={1} flatShading />
          </mesh>
          <mesh position={[centerX, -0.1 - CLIFF_DEPTH - 0.4, centerZ]} scale={[0.92, 1, 0.92]}>
            <boxGeometry args={[width, 0.8, depth]} />
            <meshStandardMaterial color={WORLD_COLORS.cliffDark} roughness={1} flatShading />
          </mesh>
        </>
      )}
      {paths.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, PATH_HEIGHT, 0]} receiveShadow>
          <meshStandardMaterial color={WORLD_COLORS.path} roughness={1} side={DoubleSide} />
        </mesh>
      ))}
      {bank && (
        <mesh geometry={bank} position={[0, BANK_HEIGHT, 0]} receiveShadow>
          <meshStandardMaterial color={WORLD_COLORS.bank} roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {water && (
        <mesh geometry={water} position={[0, WATER_HEIGHT, 0]}>
          <meshStandardMaterial color={WORLD_COLORS.water} roughness={0.25} metalness={0} side={DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/render/world/ribbon.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/render/world
git commit -m "feat(world): draw ground, island, paths and river as smooth ribbons"
```

---

### Task 3.2: Props com instancing e moinhos girando

**Files:**
- Create: `src/render/world/instancing.ts`, `src/render/world/InstancedModel.tsx`, `src/render/world/SpinningProp.tsx`, `src/render/world/WorldProps.tsx`
- Modify: `src/motion/presets.ts` (durações novas)
- Test: `src/render/world/instancing.test.ts`

**Interfaces:**
- Consumes: `modelEntry`, `modelUrl`, `ModelBoundary`, `useClonedScene` (`src/render/models/Model.tsx`), `World`, `PropItem`, `TALL_MODELS`, `isClutter`.
- Produces: `propMatrix(prop, entry): Matrix4`; `groupProps(props): Map<ModelId, PropItem[]>`; `InstancedModel({ id, props, shadows })`; `SpinningProp({ prop, active })`; `WorldProps({ world, shadows, ambient })`; `DURATIONS.windmill` já existe (8 s); acrescenta `clipFade: 0.25`, `animalIdleMin: 2`, `animalIdleMax: 6`, `animalStepMin: 0.6`, `butterflyLoop: 6`, `wingFlap: 0.25`, `lilyBob: 3.2`, `splashHold: 0.4`.

- [ ] **Step 1: Teste que falha `src/render/world/instancing.test.ts`**

```ts
import { Quaternion, Vector3 } from 'three'
import { groupProps, propMatrix } from '@/render/world/instancing'

describe('instancing helpers', () => {
  it('places, rotates and scales a prop using its manifest fit', () => {
    const matrix = propMatrix({ model: 'tree-a', x: 3, z: -2, rotation: Math.PI / 2, scale: 2 }, { scale: 0.5, yOffset: 0.1, rotationY: 0 })
    const position = new Vector3()
    const rotation = new Quaternion()
    const scale = new Vector3()
    matrix.decompose(position, rotation, scale)
    expect(position.x).toBeCloseTo(3)
    expect(position.y).toBeCloseTo(0.2)
    expect(position.z).toBeCloseTo(-2)
    expect(scale.x).toBeCloseTo(1)
    expect(new Vector3(1, 0, 0).applyQuaternion(rotation).z).toBeCloseTo(-1)
  })

  it('groups props by model', () => {
    const groups = groupProps([
      { model: 'tree-a', x: 0, z: 0, rotation: 0, scale: 1 },
      { model: 'cow', x: 1, z: 1, rotation: 0, scale: 1 },
      { model: 'tree-a', x: 2, z: 2, rotation: 0, scale: 1 },
    ])
    expect(groups.get('tree-a')).toHaveLength(2)
    expect(groups.get('cow')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world/instancing.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: `src/render/world/instancing.ts`**

```ts
import { Matrix4, Quaternion, Vector3 } from 'three'
import type { ModelId } from '@/render/models/manifest'
import type { PropItem } from '@/render/world/worldTypes'

const UP = new Vector3(0, 1, 0)

export function propMatrix(prop: PropItem, entry: { scale: number; yOffset: number; rotationY: number }): Matrix4 {
  const size = entry.scale * prop.scale
  return new Matrix4().compose(
    new Vector3(prop.x, entry.yOffset * prop.scale, prop.z),
    new Quaternion().setFromAxisAngle(UP, prop.rotation + entry.rotationY),
    new Vector3(size, size, size),
  )
}

export function groupProps(props: PropItem[]): Map<ModelId, PropItem[]> {
  const groups = new Map<ModelId, PropItem[]>()
  for (const prop of props) {
    const list = groups.get(prop.model)
    if (list) list.push(prop)
    else groups.set(prop.model, [prop])
  }
  return groups
}
```

- [ ] **Step 4: `src/render/world/InstancedModel.tsx`**

```tsx
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Matrix4, type BufferGeometry, type InstancedMesh, type Material, type Mesh, type Object3D } from 'three'
import { modelEntry, modelUrl, type ModelEntry, type ModelId } from '@/render/models/manifest'
import { ModelBoundary } from '@/render/models/Model'
import { propMatrix } from '@/render/world/instancing'
import type { PropItem } from '@/render/world/worldTypes'

interface MeshPart {
  geometry: BufferGeometry
  material: Material | Material[]
  matrix: Matrix4
}

function meshParts(scene: Object3D): MeshPart[] {
  scene.updateMatrixWorld(true)
  const toRoot = new Matrix4().copy(scene.matrixWorld).invert()
  const parts: MeshPart[] = []
  scene.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    parts.push({ geometry: mesh.geometry, material: mesh.material, matrix: new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld) })
  })
  return parts
}

function InstancedPart({ part, matrices, shadows }: { part: MeshPart; matrices: Matrix4[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const combined = new Matrix4()
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, combined.multiplyMatrices(matrix, part.matrix)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices, part])
  return <instancedMesh key={matrices.length} ref={ref} args={[part.geometry, part.material, matrices.length]} castShadow={shadows} receiveShadow />
}

function InstancedParts({ entry, props, shadows }: { entry: ModelEntry; props: PropItem[]; shadows: boolean }) {
  const { scene } = useGLTF(modelUrl(entry))
  const parts = useMemo(() => meshParts(scene), [scene])
  const matrices = useMemo(() => props.map((prop) => propMatrix(prop, entry)), [props, entry])
  return (
    <>
      {parts.map((part, index) => (
        <InstancedPart key={index} part={part} matrices={matrices} shadows={shadows} />
      ))}
    </>
  )
}

export function InstancedModel({ id, props, shadows }: { id: ModelId; props: PropItem[]; shadows: boolean }) {
  const entry = modelEntry(id)
  if (!entry || props.length === 0) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <InstancedParts entry={entry} props={props} shadows={shadows} />
      </Suspense>
    </ModelBoundary>
  )
}
```

- [ ] **Step 5: Durações em `src/motion/presets.ts`**

No objeto `DURATIONS`, acrescentar (antes de `} as const`):
```ts
  clipFade: 0.25,
  animalIdleMin: 2,
  animalIdleMax: 6,
  animalStepMin: 0.6,
  butterflyLoop: 6,
  wingFlap: 0.25,
  lilyBob: 3.2,
  splashHold: 0.4,
```

- [ ] **Step 6: `src/render/world/SpinningProp.tsx`**

```tsx
import { Suspense, useEffect, useMemo } from 'react'
import { animate } from 'motion'
import type { Object3D } from 'three'
import { DURATIONS } from '@/motion/presets'
import { modelEntry, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import type { PropItem } from '@/render/world/worldTypes'

const BLADE_PATTERN = /blade|wing|fan|propel|rotor|sail|wheel/i

function findBlades(root: Object3D): Object3D | null {
  let found: Object3D | null = null
  root.traverse((child) => {
    if (!found && child !== root && BLADE_PATTERN.test(child.name)) found = child
  })
  return found
}

function SpinningBody({ entry, prop, active }: { entry: ModelEntry; prop: PropItem; active: boolean }) {
  const object = useClonedScene(entry)
  const blades = useMemo(() => findBlades(object), [object])
  useEffect(() => {
    if (!blades || !active) return
    const start = blades.rotation.z
    const controls = animate(blades.rotation, { z: [start, start + Math.PI * 2] }, { duration: DURATIONS.windmill, repeat: Infinity, ease: 'linear' })
    return () => controls.stop()
  }, [blades, active])
  const size = entry.scale * prop.scale
  return (
    <primitive
      object={object}
      position={[prop.x, entry.yOffset * prop.scale, prop.z]}
      rotation={[0, prop.rotation + entry.rotationY, 0]}
      scale={[size, size, size]}
    />
  )
}

export function SpinningProp({ prop, active }: { prop: PropItem; active: boolean }) {
  const entry = modelEntry(prop.model)
  if (!entry) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <SpinningBody entry={entry} prop={prop} active={active} />
      </Suspense>
    </ModelBoundary>
  )
}
```

Antes de seguir, liste os nomes dos nós dos moinhos para confirmar o padrão:
Run: `node -e "const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');for(const f of ['windmill','tower-windmill'])new NodeIO().registerExtensions(ALL_EXTENSIONS).read('public/models/'+f+'.glb').then(d=>console.log(f,d.getRoot().listNodes().map(n=>n.getName()).join(',')))"`
Expected: algum nó com nome de pás. Se o nome não casar com `BLADE_PATTERN`, acrescente a palavra exata ao padrão e registre no ledger; se as pás girarem no eixo errado na verificação visual, troque `z` por `x` e registre.

- [ ] **Step 7: `src/render/world/WorldProps.tsx`**

```tsx
import { useMemo } from 'react'
import type { ModelId } from '@/render/models/manifest'
import { InstancedModel } from '@/render/world/InstancedModel'
import { groupProps } from '@/render/world/instancing'
import { SpinningProp } from '@/render/world/SpinningProp'
import { isClutter } from '@/render/world/worldCatalog'
import type { World } from '@/render/world/worldTypes'

const SPINNING: ReadonlySet<ModelId> = new Set<ModelId>(['windmill', 'tower-windmill'])
const INDIVIDUAL: ReadonlySet<ModelId> = new Set<ModelId>([...SPINNING, 'lily'])

export function WorldProps({ world, shadows, ambient }: { world: World; shadows: boolean; ambient: boolean }) {
  const groups = useMemo(() => groupProps(world.props.filter((prop) => !INDIVIDUAL.has(prop.model))), [world])
  const spinning = useMemo(() => world.props.filter((prop) => SPINNING.has(prop.model)), [world])
  return (
    <group>
      {[...groups.entries()].map(([id, props]) => (
        <InstancedModel key={id} id={id} props={props} shadows={shadows && !isClutter(id)} />
      ))}
      {spinning.map((prop, index) => (
        <SpinningProp key={`${prop.model}-${index}`} prop={prop} active={ambient} />
      ))}
    </group>
  )
}
```
(As vitórias-régias entram na Fase 4, com balanço.)

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/render src/motion && npm run typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/render/world src/motion/presets.ts
git commit -m "feat(world): render world props with instancing and spinning windmills"
```

---

### Task 3.3: Fazenda do jogo usa o mundo

**Files:**
- Modify: `src/render/farm3d/FarmScene.tsx`, `src/render/FarmView.tsx`

**Interfaces:**
- Consumes: `buildWorld`, `WorldTerrain`, `WorldProps`.
- Produces: `FarmSceneProps` ganha `onReady?: () => void` (usado na Fase 5); a cena da fazenda não usa mais `generateDecorations`/`Decorations`.

- [ ] **Step 1: Teste**

Os testes de `FarmView` e `GameplayPage` rodam em 2D (sem canvas). O comportamento novo é visual e coberto pela verificação desta task e pelo E2E "renders the 3D farm without runtime errors" / "loads only local assets". Rodar antes de mudar para ter a linha de base:
Run: `npx vitest run src/render src/features/gameplay --maxWorkers=2`
Expected: PASS (linha de base).

- [ ] **Step 2: Atualizar `src/render/farm3d/FarmScene.tsx`**

- Imports: remover `generateDecorations` (manter `cellToWorld`), remover `Decorations`; acrescentar `import { buildWorld } from '@/render/world/buildWorld'`, `import { WorldProps } from '@/render/world/WorldProps'`, `import { WorldTerrain } from '@/render/world/WorldTerrain'`.
- Desestruturar `onReady` das props.
- Trocar o `useMemo` de `decorations` por:
```tsx
  const world = useMemo(
    () => buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: seedKey, density: lowGraphics ? 'light' : 'full' }),
    [width, height, seedKey, lowGraphics],
  )
```
- No `<Canvas …>` acrescentar `onCreated={() => onReady?.()}`.
- Trocar o `directionalLight` por:
```tsx
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />
```
- Remover o `mesh` de grama grande (`boxGeometry args={[width + 18, 0.1, height + 16]}`); manter o `mesh` escuro sob o grid.
- Trocar `<Decorations items={decorations} animate={!reducedMotion && !lowGraphics} />` por:
```tsx
      <WorldTerrain world={world} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={!reducedMotion && !lowGraphics} />
```

Em `src/render/FarmView.tsx`, acrescentar `onReady?: () => void` em `FarmSceneProps`.

- [ ] **Step 3: Rodar**

Run: `npm run typecheck && npx vitest run src/render src/features/gameplay --maxWorkers=2`
Expected: PASS.

- [ ] **Step 4: Verificação visual**

`npx vite --port 5179 --strictPort` em segundo plano; no navegador (Playwright MCP, 1440×900) abrir `#/jogar/m1-first-harvest`, clicar "Começar", screenshot da `.gameplay__farm`. Conferir contra `.playwright-mcp/ref/gameplay.png`: grid visível e livre; cercas em volta do grid; caminho de terra até o pátio; celeiro vermelho com telhado cinza atrás; rio com ponte à direita; chão cheio de grama/flores; nenhuma árvore tampando canteiros. Aproximar/afastar e girar a câmera nas 4 posições. Fechar o navegador ao terminar (a máquina tem pouca memória).

- [ ] **Step 5: Commit**

```bash
git add src/render
git commit -m "feat(world): surround the gameplay farm with the full world"
```
