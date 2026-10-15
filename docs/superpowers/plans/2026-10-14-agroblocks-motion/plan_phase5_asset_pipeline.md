# AgroBlocks Motion — Fase 5: Pipeline de assets CC0

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converter pacotes CC0 (Kenney Nature Kit, Quaternius Ultimate Crops, Quaternius Animated Robot) em GLB otimizados em `public/models/`, com manifesto validado, créditos e orçamento de 5 MB — tudo em tempo de desenvolvimento, sem rede em runtime.

**Architecture:** Scripts Node em `scripts/assets/` (descompactar → inventariar → converter → otimizar → manifestar). Os zips ficam em `assets-src/` (fora do git). O app lê `src/render/models/manifest.generated.json` validado por Zod; manifesto vazio ⇒ cena usa os modelos procedurais atuais.

**Tech Stack:** Node 22, `unzip`, `obj2gltf`, `fbx2gltf` (ou Blender como alternativa), `@gltf-transform/core` + `functions` + `extensions`, Zod.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 5)

Leia `plan_index.md` antes de começar.

---

### Task 5.1: Manifesto tipado e registro de modelos

**Files:**
- Create: `src/render/models/manifest.ts`, `src/render/models/manifest.generated.json`
- Test: `src/render/models/manifest.test.ts`

**Interfaces:**
- Produces:
  - `REQUIRED_MODEL_IDS = ['crop-1','crop-2','crop-3','crop-4','crop-5','tree-a','tree-b','tree-c','pine','rock-a','rock-b','bush','fence','robot'] as const`
  - `OPTIONAL_MODEL_IDS = ['barn','silo','windmill','reservoir','seed-depot','straw'] as const`
  - `type ModelId`
  - `manifestSchema`, `type ModelEntry = { id; file; usage; author; license: 'CC0-1.0'; page; scale; yOffset; rotationY; bytes; clips?: { idle?; move?; success?; error? }; recolor?: Record<string, string> }`
  - `parseManifest(raw: unknown): ModelEntry[]` (inválido ⇒ `[]`)
  - `MODEL_MANIFEST: ModelEntry[]`, `modelEntry(id: ModelId): ModelEntry | undefined`, `modelUrl(entry: ModelEntry): string`
  - `MODEL_BUDGET_BYTES = 5 * 1024 * 1024`

- [ ] **Step 1: Escrever teste que falha `src/render/models/manifest.test.ts`**

```ts
import { MODEL_BUDGET_BYTES, parseManifest, REQUIRED_MODEL_IDS } from '@/render/models/manifest'

const entry = {
  id: 'robot',
  file: 'models/robot.glb',
  usage: 'robô',
  author: 'Quaternius',
  license: 'CC0-1.0',
  page: 'https://quaternius.itch.io/lowpoly-robot',
  scale: 0.4,
  yOffset: 0,
  rotationY: 0,
  bytes: 1200,
  clips: { idle: 'Idle', move: 'Walk' },
  recolor: { Main: '#f4f6f5' },
}

describe('model manifest', () => {
  it('lists the models the scene needs', () => {
    expect(REQUIRED_MODEL_IDS).toContain('robot')
    expect(REQUIRED_MODEL_IDS.filter((id) => id.startsWith('crop-'))).toHaveLength(5)
  })

  it('accepts a valid CC0 entry', () => {
    expect(parseManifest({ models: [entry] })).toEqual([entry])
  })

  it('rejects non CC0 licenses and malformed data', () => {
    expect(parseManifest({ models: [{ ...entry, license: 'CC-BY-4.0' }] })).toEqual([])
    expect(parseManifest('nope')).toEqual([])
  })

  it('keeps a 5 MB budget', () => {
    expect(MODEL_BUDGET_BYTES).toBe(5242880)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/models`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Criar `src/render/models/manifest.generated.json`**

```json
{ "models": [] }
```

- [ ] **Step 4: Implementar `src/render/models/manifest.ts`**

```ts
import { z } from 'zod'
import generated from '@/render/models/manifest.generated.json'

export const REQUIRED_MODEL_IDS = [
  'crop-1',
  'crop-2',
  'crop-3',
  'crop-4',
  'crop-5',
  'tree-a',
  'tree-b',
  'tree-c',
  'pine',
  'rock-a',
  'rock-b',
  'bush',
  'fence',
  'robot',
] as const

export const OPTIONAL_MODEL_IDS = ['barn', 'silo', 'windmill', 'reservoir', 'seed-depot', 'straw'] as const

export type ModelId = (typeof REQUIRED_MODEL_IDS)[number] | (typeof OPTIONAL_MODEL_IDS)[number]

export const MODEL_BUDGET_BYTES = 5 * 1024 * 1024

const entrySchema = z.object({
  id: z.string(),
  file: z.string(),
  usage: z.string(),
  author: z.string(),
  license: z.literal('CC0-1.0'),
  page: z.string().url(),
  scale: z.number().positive(),
  yOffset: z.number(),
  rotationY: z.number(),
  bytes: z.number().int().positive(),
  clips: z.object({ idle: z.string(), move: z.string(), success: z.string(), error: z.string() }).partial().optional(),
  recolor: z.record(z.string(), z.string()).optional(),
})

export const manifestSchema = z.object({ models: z.array(entrySchema) })

export type ModelEntry = z.infer<typeof entrySchema>

export function parseManifest(raw: unknown): ModelEntry[] {
  const parsed = manifestSchema.safeParse(raw)
  return parsed.success ? parsed.data.models : []
}

export const MODEL_MANIFEST: ModelEntry[] = parseManifest(generated)

export function modelEntry(id: ModelId): ModelEntry | undefined {
  return MODEL_MANIFEST.find((entry) => entry.id === id)
}

export function modelUrl(entry: ModelEntry): string {
  return `${import.meta.env.BASE_URL}${entry.file}`
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/render/models && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/render/models
git commit -m "feat(assets): add typed CC0 model manifest with budget"
```

---

### Task 5.2: Scripts de conversão e geração dos GLB

**Files:**
- Create: `scripts/assets/sources.json`, `scripts/assets/inspect.mjs`, `scripts/assets/build.mjs`, `scripts/assets/fbxToGlb.py`, `scripts/assets/assets.config.json`
- Modify: `.gitignore`, `package.json` (scripts `assets:inspect`, `assets:build`)
- Create (gerados): `public/models/*.glb`, `public/models/manifest.json`, `src/render/models/manifest.generated.json`, `CREDITS.md`
- Test: `src/render/models/generatedModels.test.ts`

**Interfaces:**
- Consumes: Task 5.1.
- Produces: GLBs para todos os `REQUIRED_MODEL_IDS` (e opcionais encontrados), manifesto preenchido, `CREDITS.md`.

- [ ] **Step 1: Obter os pacotes (ação humana se a rede bloquear)**

Os sites `kenney.nl`, `opengameart.org` e `itch.io` deram erro de certificado neste computador durante o planejamento. Tente baixar; se falhar, **pare e peça ao usuário** para baixar manualmente e salvar exatamente com estes nomes:

| Arquivo | Página |
|---|---|
| `assets-src/nature-kit.zip` | https://kenney.nl/assets/nature-kit (ou https://opengameart.org/content/nature-kit) |
| `assets-src/crops.zip` | https://opengameart.org/content/lowpoly-crops-pack (Quaternius Ultimate Crops) |
| `assets-src/robot.zip` | https://quaternius.itch.io/lowpoly-robot (Animated Robot) |

Não contorne erros de certificado (sem `-k`, sem `NODE_TLS_REJECT_UNAUTHORIZED=0`).

- [ ] **Step 2: Instalar ferramentas e ignorar fontes**

```bash
npm install -D obj2gltf @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions fbx2gltf
```
Acrescentar `assets-src` ao `.gitignore`. Em `package.json` → `scripts`: `"assets:inspect": "node scripts/assets/inspect.mjs"` e `"assets:build": "node scripts/assets/build.mjs"`.

- [ ] **Step 3: Criar `scripts/assets/sources.json`**

```json
{
  "packs": [
    { "id": "nature-kit", "file": "assets-src/nature-kit.zip", "page": "https://kenney.nl/assets/nature-kit", "author": "Kenney (kenney.nl)", "license": "CC0-1.0" },
    { "id": "crops", "file": "assets-src/crops.zip", "page": "https://opengameart.org/content/lowpoly-crops-pack", "author": "Quaternius", "license": "CC0-1.0" },
    { "id": "robot", "file": "assets-src/robot.zip", "page": "https://quaternius.itch.io/lowpoly-robot", "author": "Quaternius", "license": "CC0-1.0" }
  ]
}
```

- [ ] **Step 4: Criar `scripts/assets/inspect.mjs`**

```js
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx', '.obj'])
const sources = JSON.parse(await readFile('scripts/assets/sources.json', 'utf8'))
const lines = []

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (MODEL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full)
  }
  return files
}

for (const pack of sources.packs) {
  const target = path.join('assets-src', 'extracted', pack.id)
  await mkdir(target, { recursive: true })
  execFileSync('unzip', ['-o', '-q', pack.file, '-d', target], { stdio: 'inherit' })
  lines.push(`## ${pack.id}`)
  for (const file of await walk(target)) {
    const size = (await stat(file)).size
    lines.push(`${path.relative(target, file)}\t${size}`)
  }
}

await writeFile('assets-src/inventory.txt', lines.join('\n'))
console.log(lines.join('\n'))
```

Run: `npm run assets:inspect`
Expected: lista de arquivos por pacote salva em `assets-src/inventory.txt`.

- [ ] **Step 5: Preencher `scripts/assets/assets.config.json` a partir do inventário**

Formato (um objeto por modelo; `source` é o caminho relativo dentro de `assets-src/extracted/<pack>` como aparece no inventário; prefira `.glb`/`.gltf` > `.fbx` > `.obj` quando o mesmo modelo existir em vários formatos):
```json
{
  "models": [
    { "id": "crop-1", "pack": "crops", "source": "<caminho>", "usage": "planta: semente", "scale": 1, "yOffset": 0, "rotationY": 0 },
    { "id": "robot", "pack": "robot", "source": "<caminho>", "usage": "robô agrícola", "scale": 1, "yOffset": 0, "rotationY": 0,
      "clips": { "idle": "<clipe>", "move": "<clipe>", "success": "<clipe>", "error": "<clipe>" },
      "recolor": { "<material>": "#f4f6f5" } }
  ]
}
```

Regras de escolha (obrigatórias):
- **crop-1…crop-5:** uma única cultura com fruto visível no estágio final, na ordem tomate › abóbora › cenoura › a primeira disponível; estágio 1 = menor/semente, 5 = maduro com fruto. `usage`: "planta: semente", "planta: broto", "planta: crescendo", "planta: quase madura", "planta: madura".
- **tree-a, tree-b, tree-c:** três árvores de copa larga diferentes do Nature Kit (nomes como `tree_default`, `tree_oak`, `tree_fat`, `tree_detailed`).
- **pine:** um pinheiro (`tree_pine*`). **rock-a / rock-b:** uma pedra grande e uma pequena (`rock_large*`, `rock_small*`). **bush:** um arbusto (`plant_bush*`). **fence:** um trecho de cerca simples (`fence_simple*` ou `fence_planks*`).
- **robot:** arquivo principal do Animated Robot. Liste os clipes com `node -e "const {NodeIO}=require('@gltf-transform/core');new NodeIO().read(process.argv[1]).then(d=>console.log(d.getRoot().listAnimations().map(a=>a.getName())))" <arquivo.glb>` depois da primeira conversão, e mapeie: `idle` ← nome contendo "Idle"; `move` ← "Walk" ou "Run"; `success` ← "ThumbsUp", "Dance" ou "Yes"; `error` ← "No" ou "Death". `recolor`: mapeie o material do corpo para `#f4f6f5` e o dos olhos/visor para `#46e3ff` (liste materiais com `listMaterials().map(m=>m.getName())`).
- **Opcionais** (`barn`, `silo`, `windmill`, `reservoir`, `seed-depot`, `straw`): inclua só se houver modelo adequado em algum pacote; senão omita (a cena usa a versão procedural).
- `scale`/`yOffset`/`rotationY`: comece com 1/0/0; ajuste na verificação visual da Fase 6 para que um canteiro ocupe ~0,9 unidade e o robô ~0,9 de altura.

- [ ] **Step 6: Criar `scripts/assets/fbxToGlb.py`**

```python
import sys
import bpy

arguments = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=arguments[0])
bpy.ops.export_scene.gltf(filepath=arguments[1], export_format='GLB', export_animations=True)
```

- [ ] **Step 7: Criar `scripts/assets/build.mjs`**

```js
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import obj2gltf from 'obj2gltf'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, resample, weld } from '@gltf-transform/functions'

const REQUIRED = ['crop-1', 'crop-2', 'crop-3', 'crop-4', 'crop-5', 'tree-a', 'tree-b', 'tree-c', 'pine', 'rock-a', 'rock-b', 'bush', 'fence', 'robot']
const BUDGET = 5 * 1024 * 1024
const OUT = 'public/models'
const TMP = 'assets-src/tmp'

const config = JSON.parse(await readFile('scripts/assets/assets.config.json', 'utf8'))
const sources = JSON.parse(await readFile('scripts/assets/sources.json', 'utf8'))
const packs = new Map(sources.packs.map((pack) => [pack.id, pack]))
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

const missing = REQUIRED.filter((id) => !config.models.some((model) => model.id === id))
if (missing.length > 0) {
  console.error(`Modelos obrigatórios sem configuração: ${missing.join(', ')}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
await mkdir(TMP, { recursive: true })

async function toGlb(input, output) {
  const extension = path.extname(input).toLowerCase()
  if (extension === '.glb' || extension === '.gltf') {
    await io.write(output, await io.read(input))
    return
  }
  if (extension === '.obj') {
    await writeFile(output, await obj2gltf(input, { binary: true }))
    return
  }
  if (extension === '.fbx') {
    try {
      execFileSync('npx', ['fbx2gltf', '--binary', '--input', input, '--output', output.replace(/\.glb$/, '')], { stdio: 'inherit' })
    } catch {
      execFileSync('blender', ['--background', '--python', 'scripts/assets/fbxToGlb.py', '--', input, output], { stdio: 'inherit' })
    }
    return
  }
  throw new Error(`Formato não suportado: ${input}`)
}

const manifest = []
for (const model of config.models) {
  const pack = packs.get(model.pack)
  if (!pack) throw new Error(`Pacote desconhecido: ${model.pack}`)
  const input = path.join('assets-src', 'extracted', model.pack, model.source)
  const raw = path.join(TMP, `${model.id}.glb`)
  const output = path.join(OUT, `${model.id}.glb`)
  await toGlb(input, raw)
  const document = await io.read(raw)
  await document.transform(dedup(), prune(), weld(), resample(), quantize())
  await io.write(output, document)
  const bytes = (await stat(output)).size
  manifest.push({
    id: model.id,
    file: `models/${model.id}.glb`,
    usage: model.usage,
    author: pack.author,
    license: pack.license,
    page: pack.page,
    scale: model.scale,
    yOffset: model.yOffset,
    rotationY: model.rotationY,
    bytes,
    ...(model.clips ? { clips: model.clips } : {}),
    ...(model.recolor ? { recolor: model.recolor } : {}),
  })
}

const total = manifest.reduce((sum, entry) => sum + entry.bytes, 0)
if (total > BUDGET) {
  console.error(`Modelos somam ${(total / 1048576).toFixed(2)} MB, acima do limite de 5 MB`)
  process.exit(1)
}

const json = JSON.stringify({ models: manifest }, null, 2)
await writeFile(path.join(OUT, 'manifest.json'), json)
await writeFile('src/render/models/manifest.generated.json', json)
await copyFile(path.join(OUT, 'manifest.json'), path.join(TMP, 'manifest.backup.json'))

const credits = [
  '# Créditos dos assets',
  '',
  'Todos os modelos 3D são CC0 1.0 (domínio público) e foram convertidos para GLB por `scripts/assets/build.mjs`.',
  '',
  '| Modelo | Uso | Autor | Origem |',
  '|---|---|---|---|',
  ...manifest.map((entry) => `| ${entry.id} | ${entry.usage} | ${entry.author} | ${entry.page} |`),
  '',
  'Ícones, interface e modelos procedurais de reserva são originais do projeto.',
  '',
]
await writeFile('CREDITS.md', credits.join('\n'))
console.log(`OK: ${manifest.length} modelos, ${(total / 1048576).toFixed(2)} MB`)
```

O script não pode ter comentários. Se `quantize()` deixar algum modelo visualmente deformado na Fase 6, remova-o da cadeia e registre a decisão.

- [ ] **Step 8: Escrever teste que falha `src/render/models/generatedModels.test.ts`**

```ts
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { MODEL_BUDGET_BYTES, MODEL_MANIFEST, REQUIRED_MODEL_IDS } from '@/render/models/manifest'

describe('generated models', () => {
  it('has every required model in the manifest', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of REQUIRED_MODEL_IDS) expect(ids).toContain(id)
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
})
```

Run: `npx vitest run src/render/models/generatedModels.test.ts`
Expected: FAIL — manifesto vazio.

- [ ] **Step 9: Gerar os modelos**

Run: `npm run assets:build`
Expected: `OK: N modelos, X MB` com X ≤ 5; arquivos em `public/models/`; `CREDITS.md` criado.

Run: `npx vitest run src/render/models && npm run typecheck`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add .gitignore package.json package-lock.json scripts/assets public/models src/render/models CREDITS.md
git commit -m "feat(assets): convert CC0 crops, nature kit and animated robot to optimized GLB"
```
