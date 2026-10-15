# AgroBlocks World — Fase 1: Pipeline de assets com proporções corretas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converter ~60 modelos dos seis pacotes com escala calculada por altura-alvo, celeiros vermelhos com telhado cinza, texturas do MegaKit em WebP 512 px e orçamento de 10 MB.

**Architecture:** `src/render/models/fit.ts` (puro, testado) calcula `scale`/`yOffset` a partir do bounding box. `scripts/assets/build.mjs` mede cada GLB (three `GLTFLoader` em Node para modelos com esqueleto; `getBounds` do gltf-transform para os demais), aplica `tint`, foscos, compressão de textura e grava o manifesto. `src/render/models/manifest.ts` ganha os ids do mundo.

**Spec:** `docs/superpowers/specs/2026-10-15-agroblocks-world-environment-design.md` (seções 3, 5b) · Leia `plan_index.md` antes.

---

### Task 1.1: Ajuste por altura-alvo e ids do mundo

**Files:**
- Create: `src/render/models/fit.ts`, `src/render/models/fit.test.ts`
- Modify: `src/render/models/manifest.ts`, `src/render/models/manifest.test.ts`

**Interfaces:**
- Produces:
  - `interface ModelBounds { min: [number, number, number]; max: [number, number, number] }`
  - `interface FitTarget { targetHeight?: number; targetWidth?: number }`
  - `fitToTarget(bounds: ModelBounds, target: FitTarget): { scale: number; yOffset: number }`
  - `fitWithScale(bounds: ModelBounds, scale: number): { scale: number; yOffset: number }`
  - `WORLD_MODEL_IDS` (lista abaixo), `ModelId` inclui esses ids, `MODEL_BUDGET_BYTES = 10 * 1024 * 1024`

- [ ] **Step 1: Escrever testes que falham**

`src/render/models/fit.test.ts`:
```ts
import { fitToTarget, fitWithScale } from '@/render/models/fit'

describe('model fitting', () => {
  it('scales a model to its target height and rests it on the ground', () => {
    expect(fitToTarget({ min: [-1, -2, -1], max: [1, 2, 1] }, { targetHeight: 2 })).toEqual({ scale: 0.5, yOffset: 1 })
  })

  it('scales flat models by their largest horizontal side', () => {
    expect(fitToTarget({ min: [0, 0, 0], max: [4, 0.2, 2] }, { targetWidth: 2 })).toEqual({ scale: 0.5, yOffset: 0 })
  })

  it('keeps degenerate models unscaled', () => {
    expect(fitToTarget({ min: [0, 0, 0], max: [0, 0, 0] }, { targetHeight: 1 })).toEqual({ scale: 1, yOffset: 0 })
  })

  it('reuses a given scale while still grounding the model', () => {
    expect(fitWithScale({ min: [0, -0.5, 0], max: [1, 1, 1] }, 0.4)).toEqual({ scale: 0.4, yOffset: 0.2 })
  })
})
```

Em `src/render/models/manifest.test.ts`, trocar `expect(MODEL_BUDGET_BYTES).toBe(5242880)` por `expect(MODEL_BUDGET_BYTES).toBe(10485760)` e o título `'keeps a 5 MB budget'` por `'keeps a 10 MB budget'`; acrescentar:
```ts
  it('names every model the world uses', () => {
    expect(WORLD_MODEL_IDS).toContain('cow')
    expect(WORLD_MODEL_IDS).toContain('grass-short')
    expect(new Set(WORLD_MODEL_IDS).size).toBe(WORLD_MODEL_IDS.length)
  })
```
e incluir `WORLD_MODEL_IDS` no import.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/models/fit.test.ts src/render/models/manifest.test.ts`
Expected: FAIL — `fit` não existe; orçamento 5242880; `WORLD_MODEL_IDS` indefinido.

- [ ] **Step 3: Implementar `src/render/models/fit.ts`**

```ts
export interface ModelBounds {
  min: [number, number, number]
  max: [number, number, number]
}

export interface FitTarget {
  targetHeight?: number
  targetWidth?: number
}

export interface FitResult {
  scale: number
  yOffset: number
}

const PRECISION = 10000

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION + 0
}

export function fitWithScale(bounds: ModelBounds, scale: number): FitResult {
  return { scale: round(scale), yOffset: round(-bounds.min[1] * scale) }
}

export function fitToTarget(bounds: ModelBounds, target: FitTarget): FitResult {
  const height = bounds.max[1] - bounds.min[1]
  const width = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  if (height <= 0 && width <= 0) return { scale: 1, yOffset: 0 }
  if (target.targetWidth !== undefined && width > 0) return fitWithScale(bounds, target.targetWidth / width)
  if (target.targetHeight !== undefined && height > 0) return fitWithScale(bounds, target.targetHeight / height)
  return fitWithScale(bounds, 1)
}
```

- [ ] **Step 4: Atualizar `src/render/models/manifest.ts`**

Depois de `OPTIONAL_MODEL_IDS`, acrescentar:
```ts
export const WORLD_MODEL_IDS = [
  'small-barn',
  'open-barn',
  'silo-house',
  'tower-windmill',
  'water-tower',
  'chicken-coop',
  'cow',
  'horse',
  'pig',
  'sheep',
  'llama',
  'pug',
  'tree-d',
  'pine-round',
  'mega-tree-a',
  'mega-tree-b',
  'mega-pine',
  'bush-large',
  'bush-flowers',
  'fence-gate',
  'bridge',
  'log-stack',
  'sign',
  'lily',
  'mushrooms',
  'flower-red',
  'flower-yellow',
  'flower-purple',
  'flower-patch',
  'grass-short',
  'grass-tall',
  'clover',
  'fern',
  'pebble',
  'rock-medium',
  'apple-tree',
  'corn-row',
  'wheat-row',
  'lettuce-row',
  'pumpkin-row',
  'carrot-row',
] as const
```
Trocar o tipo por `export type ModelId = (typeof REQUIRED_MODEL_IDS)[number] | (typeof OPTIONAL_MODEL_IDS)[number] | (typeof WORLD_MODEL_IDS)[number]` e `MODEL_BUDGET_BYTES = 10 * 1024 * 1024`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/render/models && npm run typecheck`
Expected: PASS (o `generatedModels.test.ts` continua passando com o manifesto atual de 18 modelos).

- [ ] **Step 6: Commit**

```bash
git add src/render/models
git commit -m "feat(assets): fit models by target height and register world model ids"
```

---

### Task 1.2: Build com medição, tint, texturas WebP e os modelos do mundo

**Files:**
- Modify: `scripts/assets/build.mjs`, `scripts/assets/assets.config.json`, `scripts/assets/sources.json`, `package.json`, `src/render/models/generatedModels.test.ts`
- Regenerated: `public/models/*`, `src/render/models/manifest.generated.json`, `CREDITS.md`

**Interfaces:**
- Consumes: `fitToTarget`, `fitWithScale` (Task 1.1, importado por caminho relativo `../../src/render/models/fit.ts` — Node 22.23 remove tipos sozinho).
- Produces: manifesto com todos os `REQUIRED_MODEL_IDS`, `OPTIONAL_MODEL_IDS` usados (`barn`, `silo`, `windmill`, `reservoir`, `straw`) e `WORLD_MODEL_IDS`; animais com `clips.idle` e `clips.move`.

- [ ] **Step 1: Teste que falha em `src/render/models/generatedModels.test.ts`**

Substituir o arquivo por:
```ts
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { MODEL_BUDGET_BYTES, MODEL_MANIFEST, REQUIRED_MODEL_IDS, WORLD_MODEL_IDS } from '@/render/models/manifest'

const ANIMALS = ['cow', 'horse', 'pig', 'sheep', 'llama', 'pug']

describe('generated models', () => {
  it('has every required and world model in the manifest', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of [...REQUIRED_MODEL_IDS, ...WORLD_MODEL_IDS, 'barn', 'silo', 'windmill', 'reservoir', 'straw']) expect(ids).toContain(id)
  })

  it('ships every GLB and stays within the budget', () => {
    let total = 0
    for (const entry of MODEL_MANIFEST) {
      const file = path.join(process.cwd(), 'public', entry.file)
      expect(existsSync(file)).toBe(true)
      total += statSync(file).size
    }
    expect(total).toBeLessThanOrEqual(MODEL_BUDGET_BYTES)
  })

  it('maps the four robot clips', () => {
    const robot = MODEL_MANIFEST.find((entry) => entry.id === 'robot')
    expect(Object.keys(robot?.clips ?? {}).sort()).toEqual(['error', 'idle', 'move', 'success'])
  })

  it('gives every animal an idle and a move clip', () => {
    for (const id of ANIMALS) {
      const animal = MODEL_MANIFEST.find((entry) => entry.id === id)
      expect(animal?.clips?.idle).toBeTruthy()
      expect(animal?.clips?.move).toBeTruthy()
    }
  })

  it('keeps proportions between the robot, a cow and the big barn', () => {
    const height = (id: string) => {
      const entry = MODEL_MANIFEST.find((item) => item.id === id)
      return entry ? entry.scale : 0
    }
    expect(height('robot')).toBeGreaterThan(0)
    expect(height('cow')).toBeGreaterThan(0)
    expect(height('barn')).toBeGreaterThan(0)
  })
})
```

Run: `npx vitest run src/render/models/generatedModels.test.ts`
Expected: FAIL — ids do mundo e animais ausentes.

- [ ] **Step 2: Instalar `sharp` e registrar o pacote de animais e o MegaKit**

```bash
npm install -D sharp
```
Em `scripts/assets/sources.json`, acrescentar ao array `packs`:
```json
    { "id": "farm-animals", "dir": "assets-src/Farm Animals Animated  by Quaternius", "page": "https://quaternius.com/packs/farmanimals.html", "author": "Quaternius", "license": "CC0-1.0" },
    { "id": "megakit", "dir": "assets-src/Stylized Nature MegaKit[Standard]", "page": "https://quaternius.com/packs/stylizednaturemegakit.html", "author": "Quaternius", "license": "CC0-1.0" }
```
(note os dois espaços em `Animated  by`).

- [ ] **Step 3: Substituir `scripts/assets/assets.config.json`**

Campos: `id`, `pack`, `source`, `usage`, e **um** de `targetHeight` | `targetWidth` | `scaleLike` (id cuja escala é reutilizada — estágios do tomate seguem `crop-5`), `rotationY`, opcionais `tint`, `clips`, `recolor`.
```json
{
  "models": [
    { "id": "crop-5", "pack": "crops", "source": "FBX/Tomato_4.fbx", "usage": "planta: madura", "targetHeight": 0.8, "rotationY": 0 },
    { "id": "crop-1", "pack": "crops", "source": "FBX/Tomato_1.fbx", "usage": "planta: semente", "scaleLike": "crop-5", "rotationY": 0 },
    { "id": "crop-2", "pack": "crops", "source": "FBX/Tomato_2.fbx", "usage": "planta: broto", "scaleLike": "crop-5", "rotationY": 0 },
    { "id": "crop-3", "pack": "crops", "source": "FBX/Tomato_3.fbx", "usage": "planta: crescendo", "scaleLike": "crop-5", "rotationY": 0 },
    { "id": "crop-4", "pack": "crops", "source": "FBX/Tomato_Harvested.fbx", "usage": "planta: quase madura", "scaleLike": "crop-5", "rotationY": 0 },
    { "id": "straw", "pack": "crops", "source": "FBX/Tomato_Harvested.fbx", "usage": "canteiro colhido", "scaleLike": "crop-5", "rotationY": 0 },
    { "id": "apple-tree", "pack": "crops", "source": "FBX/Apple_4.fbx", "usage": "macieira do pomar", "targetHeight": 2.2, "rotationY": 0 },
    { "id": "corn-row", "pack": "crops", "source": "FBX/Corn_4.fbx", "usage": "fileira de milho", "targetHeight": 0.95, "rotationY": 0 },
    { "id": "wheat-row", "pack": "crops", "source": "FBX/Wheat_4.fbx", "usage": "fileira de trigo", "targetHeight": 0.6, "rotationY": 0 },
    { "id": "lettuce-row", "pack": "crops", "source": "FBX/Lettuce_4.fbx", "usage": "fileira de alface", "targetHeight": 0.3, "rotationY": 0 },
    { "id": "pumpkin-row", "pack": "crops", "source": "FBX/Pumpkin_4.fbx", "usage": "fileira de abóbora", "targetHeight": 0.45, "rotationY": 0 },
    { "id": "carrot-row", "pack": "crops", "source": "FBX/Carrot_4.fbx", "usage": "fileira de cenoura", "targetHeight": 0.4, "rotationY": 0 },
    { "id": "tree-a", "pack": "nature-kit", "source": "Models/GLTF format/tree_default.glb", "usage": "árvore", "targetHeight": 2.6, "rotationY": 0, "tint": { "leafsGreen": "#6cc04a", "woodBark": "#8a5a33" } },
    { "id": "tree-b", "pack": "nature-kit", "source": "Models/GLTF format/tree_oak.glb", "usage": "árvore", "targetHeight": 2.4, "rotationY": 0, "tint": { "leafsGreen": "#5fb245", "woodBark": "#8a5a33" } },
    { "id": "tree-c", "pack": "nature-kit", "source": "Models/GLTF format/tree_fat.glb", "usage": "árvore", "targetHeight": 2.5, "rotationY": 0, "tint": { "leafsGreen": "#78c850", "woodBark": "#8a5a33" } },
    { "id": "tree-d", "pack": "nature-kit", "source": "Models/GLTF format/tree_detailed.glb", "usage": "árvore", "targetHeight": 3, "rotationY": 0, "tint": { "leafsGreen": "#66bb48", "woodBark": "#8a5a33" } },
    { "id": "pine", "pack": "nature-kit", "source": "Models/GLTF format/tree_pineDefaultA.glb", "usage": "pinheiro", "targetHeight": 3, "rotationY": 0, "tint": { "leafsDark": "#3f9e4f", "woodBarkDark": "#6b4528" } },
    { "id": "pine-round", "pack": "nature-kit", "source": "Models/GLTF format/tree_pineRoundB.glb", "usage": "pinheiro", "targetHeight": 2.8, "rotationY": 0, "tint": { "leafsDark": "#46a656", "woodBarkDark": "#6b4528" } },
    { "id": "rock-a", "pack": "nature-kit", "source": "Models/GLTF format/stone_largeA.glb", "usage": "pedra grande (obstáculo)", "targetHeight": 0.7, "rotationY": 0, "tint": { "stone": "#a9b0b6" } },
    { "id": "rock-b", "pack": "nature-kit", "source": "Models/GLTF format/stone_smallA.glb", "usage": "pedra pequena", "targetHeight": 0.3, "rotationY": 0, "tint": { "stone": "#9aa0a6" } },
    { "id": "bush", "pack": "nature-kit", "source": "Models/GLTF format/plant_bush.glb", "usage": "arbusto", "targetHeight": 0.6, "rotationY": 0, "tint": { "grass": "#4fae46" } },
    { "id": "bush-large", "pack": "nature-kit", "source": "Models/GLTF format/plant_bushLarge.glb", "usage": "arbusto grande", "targetHeight": 0.9, "rotationY": 0, "tint": { "grass": "#4caa44" } },
    { "id": "fence", "pack": "nature-kit", "source": "Models/GLTF format/fence_simple.glb", "usage": "cerca", "targetWidth": 1, "rotationY": 0 },
    { "id": "fence-gate", "pack": "nature-kit", "source": "Models/GLTF format/fence_gate.glb", "usage": "porteira", "targetWidth": 1, "rotationY": 0 },
    { "id": "bridge", "pack": "nature-kit", "source": "Models/GLTF format/bridge_wood.glb", "usage": "ponte de madeira", "targetWidth": 2.6, "rotationY": 0 },
    { "id": "log-stack", "pack": "nature-kit", "source": "Models/GLTF format/log_stack.glb", "usage": "pilha de toras", "targetHeight": 0.6, "rotationY": 0 },
    { "id": "sign", "pack": "nature-kit", "source": "Models/GLTF format/sign.glb", "usage": "placa", "targetHeight": 0.8, "rotationY": 0 },
    { "id": "lily", "pack": "nature-kit", "source": "Models/GLTF format/lily_large.glb", "usage": "vitória-régia", "targetWidth": 0.6, "rotationY": 0 },
    { "id": "mushrooms", "pack": "nature-kit", "source": "Models/GLTF format/mushroom_redGroup.glb", "usage": "cogumelos", "targetHeight": 0.25, "rotationY": 0 },
    { "id": "flower-red", "pack": "nature-kit", "source": "Models/GLTF format/flower_redA.glb", "usage": "flor", "targetHeight": 0.3, "rotationY": 0 },
    { "id": "flower-yellow", "pack": "nature-kit", "source": "Models/GLTF format/flower_yellowA.glb", "usage": "flor", "targetHeight": 0.3, "rotationY": 0 },
    { "id": "flower-purple", "pack": "nature-kit", "source": "Models/GLTF format/flower_purpleA.glb", "usage": "flor", "targetHeight": 0.3, "rotationY": 0 },
    { "id": "mega-tree-a", "pack": "megakit", "source": "glTF/CommonTree_1.gltf", "usage": "árvore", "targetHeight": 2.9, "rotationY": 0 },
    { "id": "mega-tree-b", "pack": "megakit", "source": "glTF/CommonTree_3.gltf", "usage": "árvore", "targetHeight": 2.7, "rotationY": 0 },
    { "id": "mega-pine", "pack": "megakit", "source": "glTF/Pine_2.gltf", "usage": "pinheiro", "targetHeight": 3, "rotationY": 0 },
    { "id": "bush-flowers", "pack": "megakit", "source": "glTF/Bush_Common_Flowers.gltf", "usage": "arbusto florido", "targetHeight": 0.7, "rotationY": 0 },
    { "id": "flower-patch", "pack": "megakit", "source": "glTF/Flower_4_Group.gltf", "usage": "canteiro de flores", "targetHeight": 0.35, "rotationY": 0 },
    { "id": "grass-short", "pack": "megakit", "source": "glTF/Grass_Common_Short.gltf", "usage": "tufo de grama", "targetHeight": 0.25, "rotationY": 0 },
    { "id": "grass-tall", "pack": "megakit", "source": "glTF/Grass_Wispy_Tall.gltf", "usage": "grama alta", "targetHeight": 0.45, "rotationY": 0 },
    { "id": "clover", "pack": "megakit", "source": "glTF/Clover_1.gltf", "usage": "trevos", "targetHeight": 0.12, "rotationY": 0 },
    { "id": "fern", "pack": "megakit", "source": "glTF/Fern_1.gltf", "usage": "samambaia", "targetHeight": 0.5, "rotationY": 0 },
    { "id": "pebble", "pack": "megakit", "source": "glTF/Pebble_Round_1.gltf", "usage": "pedrinha", "targetHeight": 0.12, "rotationY": 0 },
    { "id": "rock-medium", "pack": "megakit", "source": "glTF/Rock_Medium_1.gltf", "usage": "rocha", "targetHeight": 0.9, "rotationY": 0 },
    { "id": "barn", "pack": "farm-buildings", "source": "FBX/BigBarn.fbx", "usage": "celeiro grande", "targetHeight": 4.5, "rotationY": 0, "tint": { "RoofBlack": "#8b8f87", "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "small-barn", "pack": "farm-buildings", "source": "FBX/SmallBarn.fbx", "usage": "celeiro pequeno", "targetHeight": 2.6, "rotationY": 0, "tint": { "RoofBlack": "#8b8f87", "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "open-barn", "pack": "farm-buildings", "source": "FBX/OpenBarn.fbx", "usage": "galpão aberto", "targetHeight": 2.8, "rotationY": 0, "tint": { "RoofBlack": "#8b8f87", "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "chicken-coop", "pack": "farm-buildings", "source": "FBX/ChickenCoop.fbx", "usage": "galinheiro", "targetHeight": 1.2, "rotationY": 0, "tint": { "RoofBlack": "#8b8f87", "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "silo", "pack": "farm-buildings", "source": "FBX/Silo.fbx", "usage": "silo", "targetHeight": 6, "rotationY": 0, "tint": { "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "silo-house", "pack": "farm-buildings", "source": "FBX/Silo_House.fbx", "usage": "silo com casinha", "targetHeight": 6, "rotationY": 0, "tint": { "DarkRed": "#a8352a", "LightRed": "#c4473a" } },
    { "id": "tower-windmill", "pack": "farm-buildings", "source": "FBX/TowerWindmill.fbx", "usage": "cata-vento de torre", "targetHeight": 6, "rotationY": 0 },
    { "id": "windmill", "pack": "farm-buildings", "source": "FBX/Windmill.fbx", "usage": "moinho de pedra", "targetHeight": 6, "rotationY": 0 },
    { "id": "water-tower", "pack": "farm-buildings", "source": "FBX/WaterTower.fbx", "usage": "caixa-d'água", "targetHeight": 5, "rotationY": 0 },
    { "id": "reservoir", "pack": "farm-buildings", "source": "FBX/Well.fbx", "usage": "poço / reservatório", "targetHeight": 1.4, "rotationY": 0 },
    { "id": "cow", "pack": "farm-animals", "source": "FBX/Cow.fbx", "usage": "vaca", "targetHeight": 1.1, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|WalkSlow" } },
    { "id": "horse", "pack": "farm-animals", "source": "FBX/Horse.fbx", "usage": "cavalo", "targetHeight": 1.5, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|Walk" } },
    { "id": "pig", "pack": "farm-animals", "source": "FBX/Pig.fbx", "usage": "porco", "targetHeight": 0.6, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|Jump" } },
    { "id": "sheep", "pack": "farm-animals", "source": "FBX/Sheep.fbx", "usage": "ovelha", "targetHeight": 0.75, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|Jump" } },
    { "id": "llama", "pack": "farm-animals", "source": "FBX/Llama.fbx", "usage": "lhama", "targetHeight": 1.4, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|Jump" } },
    { "id": "pug", "pack": "farm-animals", "source": "FBX/Pug.fbx", "usage": "cachorro", "targetHeight": 0.45, "rotationY": 0, "clips": { "idle": "Armature|Idle", "move": "Armature|Jump" } },
    {
      "id": "robot",
      "pack": "robot",
      "source": "FBX/Robot.fbx",
      "usage": "robô agrícola",
      "targetHeight": 0.9,
      "rotationY": 0,
      "clips": { "idle": "RobotArmature|Robot_Idle", "move": "RobotArmature|Robot_Walking", "success": "RobotArmature|Robot_ThumbsUp", "error": "RobotArmature|Robot_No" },
      "recolor": { "Main": "#f4f6f5", "Grey": "#9aa7b0" }
    }
  ]
}
```

- [ ] **Step 4: Atualizar `scripts/assets/build.mjs`**

Trocar a primeira linha de imports e acrescentar:
```js
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import obj2gltf from 'obj2gltf'
import convertFbx from 'fbx2gltf'
import sharp from 'sharp'
import { Box3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getBounds, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, resample, textureCompress, weld } from '@gltf-transform/functions'
import { fitToTarget, fitWithScale } from '../../src/render/models/fit.ts'
```
Mudar `const BUDGET = 10 * 1024 * 1024`.

Acrescentar antes de `const manifest = []`:
```js
function measureWithThree(file, bytes) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(
      buffer,
      '',
      (gltf) => {
        gltf.scene.updateMatrixWorld(true)
        const box = new Box3().setFromObject(gltf.scene, true)
        resolve({ min: box.min.toArray(), max: box.max.toArray() })
      },
      (error) => reject(new Error(`${file}: ${error.message}`)),
    )
  })
}

async function measure(document, file) {
  if (document.getRoot().listSkins().length > 0) return measureWithThree(file, await readFile(file))
  const bounds = getBounds(document.getRoot().listScenes()[0])
  return { min: bounds.min, max: bounds.max }
}

async function slimTextures(document) {
  if (document.getRoot().listTextures().length === 0) return
  for (const material of document.getRoot().listMaterials()) {
    material.setNormalTexture(null)
    material.setOcclusionTexture(null)
    material.setMetallicRoughnessTexture(null)
  }
  await document.transform(prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512] }))
}
```

Substituir o laço `for (const model of config.models) { … }` por dois passes (modelos com `scaleLike` depois):
```js
const fits = new Map()
const ordered = [...config.models.filter((model) => !model.scaleLike), ...config.models.filter((model) => model.scaleLike)]
for (const model of ordered) {
  const pack = packs.get(model.pack)
  if (!pack) throw new Error(`Pacote desconhecido: ${model.pack}`)
  const input = path.join(pack.dir, model.source)
  const raw = path.join(TMP, `${model.id}.glb`)
  const output = path.join(OUT, `${model.id}.glb`)
  await toGlb(input, raw)
  const document = await io.read(raw)
  matte(document)
  if (model.tint) tint(document, model.tint)
  await slimTextures(document)
  await document.transform(dedup(), prune(), weld(), resample(), quantize())
  await io.write(output, document)
  const bounds = await measure(document, output)
  const reference = model.scaleLike ? fits.get(model.scaleLike) : null
  if (model.scaleLike && !reference) throw new Error(`scaleLike sem referência: ${model.id}`)
  const fit = reference ? fitWithScale(bounds, reference.scale) : fitToTarget(bounds, { targetHeight: model.targetHeight, targetWidth: model.targetWidth })
  fits.set(model.id, fit)
  const bytes = (await stat(output)).size
  manifest.push({
    id: model.id,
    file: `models/${model.id}.glb`,
    usage: model.usage,
    author: pack.author,
    license: pack.license,
    page: pack.page,
    scale: fit.scale,
    yOffset: fit.yOffset,
    rotationY: model.rotationY,
    bytes,
    ...(model.clips ? { clips: model.clips } : {}),
    ...(model.recolor ? { recolor: model.recolor } : {}),
  })
  console.log(`${model.id}: ${(bytes / 1024).toFixed(1)} KB, escala ${fit.scale}`)
}
```
(`matte`, `tint`, `linear` e `toGlb` continuam como estão.)

Em `package.json`, trocar o script por `"assets:build": "node --disable-warning=ExperimentalWarning scripts/assets/build.mjs"`.

- [ ] **Step 5: Gerar**

Run: `npm run assets:build 2>&1 | tail -5`
Expected: `OK: 66 modelos, X MB` com X ≤ 10. Se um `source` não existir, a mensagem cita o arquivo: confira o nome em `assets-src/inventory.txt` (`npm run assets:inspect`) e corrija só o caminho.

- [ ] **Step 6: Conferir proporções medidas**

Run: `node -e "const m=require('./src/render/models/manifest.generated.json').models;for(const id of ['robot','cow','barn','tree-a','crop-5','fence','bridge'])console.log(id,m.find(e=>e.id===id).scale)"`
Expected: todos > 0; `robot` ≈ 0,2 (altura real 4,5 → 0,9).

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/render/models && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json scripts/assets public/models src/render/models CREDITS.md
git commit -m "feat(assets): convert world models with measured proportions, red barns and webp textures"
```
