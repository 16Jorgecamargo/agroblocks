# AgroBlocks — Fase 4: Editor Blockly, toolbox e serializer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blocos custom PT-BR ligados às ações reais do motor, tema visual, toolbox gerada por missão, conversão JSON do Blockly ↔ AST e componente React do editor.

**Architecture:** O serializer trabalha sobre o JSON de `Blockly.serialization.workspaces.save()` (função pura, testável sem Blockly). `programToWorkspaceJson` faz o caminho inverso (programas iniciais de missão e testes de ida e volta). Só `definitions/`, `toolbox/registerFlyouts.ts` e `editor/` importam Blockly.

**Tech Stack:** Blockly (versão estável instalada na Fase 1), React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 5)

Leia `plan_index.md` antes de começar.

---

### Task 4.1: Tipos de bloco, blocos custom, tema e toolbox

**Files:**
- Create: `src/blocks/blockTypes.ts`
- Create: `src/blocks/definitions/blockIcons.ts`
- Create: `src/blocks/definitions/customBlocks.ts`
- Create: `src/blocks/definitions/theme.ts`
- Create: `src/blocks/toolbox/buildToolbox.ts`
- Create: `src/blocks/toolbox/registerFlyouts.ts`
- Test: `src/blocks/toolbox/buildToolbox.test.ts`, `src/blocks/definitions/customBlocks.test.ts`

**Interfaces:**
- Consumes: `ActionType`, `SensorType`.
- Produces:
  - `BLOCK_TYPES` (tupla) e `type BlockType`
  - `ACTION_BLOCKS: Partial<Record<string, ActionType>>`, `SENSOR_BLOCKS: Partial<Record<string, SensorType>>`
  - `BLOCK_FOR_ACTION: Record<ActionType, BlockType>`, `BLOCK_FOR_SENSOR: Record<SensorType, BlockType>`
  - `BLOCK_LABELS: Record<string, string>`
  - `ALL_BLOCKS: BlockType[]`
  - `defineCustomBlocks(): void` (idempotente; também aplica locale pt-BR)
  - `agroTheme: Blockly.Theme`
  - `interface ToolboxItem`, `interface ToolboxCategory`, `interface ToolboxJson`
  - `buildToolbox(allowed: readonly BlockType[]): ToolboxJson`
  - `PROCEDURE_FLYOUT_KEY = 'AGRO_PROCEDURES'`, `registerProcedureFlyout(workspace: Blockly.WorkspaceSvg): void`

- [ ] **Step 1: Criar `src/blocks/blockTypes.ts`**

```ts
import type { ActionType, SensorType } from '@/game/world/types'

export const BLOCK_TYPES = [
  'when_run',
  'robot_move_forward',
  'robot_turn_left',
  'robot_turn_right',
  'farm_prepare_soil',
  'farm_plant',
  'farm_water',
  'farm_harvest',
  'farm_collect',
  'sensor_plot_empty',
  'sensor_soil_dry',
  'sensor_plant_mature',
  'sensor_obstacle_ahead',
  'sensor_has_seeds',
  'controls_repeat_ext',
  'controls_whileUntil',
  'controls_if',
  'logic_compare',
  'logic_operation',
  'logic_negate',
  'logic_boolean',
  'math_number',
  'math_arithmetic',
  'variables_set',
  'variables_get',
  'math_change',
  'procedures_defnoreturn',
  'procedures_callnoreturn',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

export const ALL_BLOCKS: BlockType[] = [...BLOCK_TYPES]

export const BLOCK_FOR_ACTION: Record<ActionType, BlockType> = {
  moveForward: 'robot_move_forward',
  turnLeft: 'robot_turn_left',
  turnRight: 'robot_turn_right',
  prepareSoil: 'farm_prepare_soil',
  plant: 'farm_plant',
  water: 'farm_water',
  harvest: 'farm_harvest',
  collectResources: 'farm_collect',
}

export const BLOCK_FOR_SENSOR: Record<SensorType, BlockType> = {
  isPlotEmpty: 'sensor_plot_empty',
  isSoilDry: 'sensor_soil_dry',
  isPlantMature: 'sensor_plant_mature',
  isObstacleAhead: 'sensor_obstacle_ahead',
  hasSeeds: 'sensor_has_seeds',
}

export const ACTION_BLOCKS: Partial<Record<string, ActionType>> = Object.fromEntries(
  Object.entries(BLOCK_FOR_ACTION).map(([action, block]) => [block, action as ActionType]),
)

export const SENSOR_BLOCKS: Partial<Record<string, SensorType>> = Object.fromEntries(
  Object.entries(BLOCK_FOR_SENSOR).map(([sensor, block]) => [block, sensor as SensorType]),
)

export const BLOCK_LABELS: Record<string, string> = {
  when_run: 'quando executar',
  controls_repeat_ext: 'repita',
  controls_whileUntil: 'enquanto',
  controls_if: 'se',
  logic_compare: 'comparar',
  logic_operation: 'e / ou',
  logic_negate: 'não',
  math_arithmetic: 'conta',
  variables_set: 'definir variável',
  math_change: 'alterar variável',
  procedures_defnoreturn: 'procedimento',
}
```

- [ ] **Step 2: Escrever testes que falham**

`src/blocks/toolbox/buildToolbox.test.ts`:
```ts
import { buildToolbox } from '@/blocks/toolbox/buildToolbox'

describe('buildToolbox', () => {
  it('includes only categories with allowed blocks', () => {
    const toolbox = buildToolbox(['robot_move_forward', 'robot_turn_left', 'farm_harvest'])
    expect(toolbox.kind).toBe('categoryToolbox')
    expect(toolbox.contents.map((category) => category.name)).toEqual(['Movimento', 'Agricultura'])
    expect(toolbox.contents[0].contents?.map((item) => item.type)).toEqual(['robot_move_forward', 'robot_turn_left'])
  })

  it('adds a shadow number to repeat blocks', () => {
    const toolbox = buildToolbox(['controls_repeat_ext'])
    expect(toolbox.contents[0].contents?.[0]).toEqual({
      kind: 'block',
      type: 'controls_repeat_ext',
      inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } } },
    })
  })

  it('offers both if and if-else when controls_if is allowed', () => {
    const items = buildToolbox(['controls_if']).contents[0].contents ?? []
    expect(items).toEqual([
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
    ])
  })

  it('uses dynamic categories for variables and procedures', () => {
    const toolbox = buildToolbox(['variables_set', 'procedures_defnoreturn'])
    expect(toolbox.contents).toEqual([
      { kind: 'category', name: 'Variáveis', categorystyle: 'variable_category', custom: 'VARIABLE' },
      { kind: 'category', name: 'Procedimentos', categorystyle: 'procedure_category', custom: 'AGRO_PROCEDURES' },
    ])
  })

  it('never lists the when_run hat in the toolbox', () => {
    const toolbox = buildToolbox(['when_run', 'robot_move_forward'])
    const types = toolbox.contents.flatMap((category) => category.contents ?? []).map((item) => item.type)
    expect(types).not.toContain('when_run')
  })
})
```

`src/blocks/definitions/customBlocks.test.ts`:
```ts
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { BLOCK_FOR_ACTION, BLOCK_FOR_SENSOR } from '@/blocks/blockTypes'

describe('defineCustomBlocks', () => {
  it('registers every action, sensor and the when_run hat', () => {
    defineCustomBlocks()
    defineCustomBlocks()
    for (const type of [...Object.values(BLOCK_FOR_ACTION), ...Object.values(BLOCK_FOR_SENSOR), 'when_run']) {
      expect(Blockly.Blocks[type]).toBeDefined()
    }
  })

  it('creates sensor blocks with Boolean output', () => {
    defineCustomBlocks()
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('sensor_soil_dry')
    expect(block.outputConnection?.getCheck()).toEqual(['Boolean'])
    expect(block.tooltip).toBeTruthy()
    workspace.dispose()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/blocks/toolbox src/blocks/definitions`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 4: Implementar `src/blocks/definitions/blockIcons.ts` e `src/blocks/definitions/customBlocks.ts`**

`src/blocks/definitions/blockIcons.ts` (ícones SVG brancos como data URI, iguais em estilo à referência visual):
```ts
function svg(paths: string): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`
}

export const BLOCK_ICONS = {
  play: svg('<path d="M7 4l12 8-12 8z" fill="white"/>'),
  forward: svg('<path d="M12 20V5"/><path d="M5 11l7-7 7 7"/>'),
  turnLeft: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  turnRight: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
  prepare: svg('<path d="M4 20h16"/><path d="M7 20l3-8h4l3 8"/><path d="M12 12V4"/>'),
  seed: svg('<path d="M12 21V11"/><path d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z"/>'),
  water: svg('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
  harvest: svg('<path d="M4 10h16l-2 10H6z"/><path d="M8 10l4-6 4 6"/>'),
  collect: svg('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V5h8v3"/><path d="M12 12v5"/><path d="M9.5 14.5L12 17l2.5-2.5"/>'),
}
```

`src/blocks/definitions/customBlocks.ts`:
```ts
import * as Blockly from 'blockly'
import * as ptBr from 'blockly/msg/pt-br'
import { BLOCK_ICONS } from '@/blocks/definitions/blockIcons'

let defined = false

function icon(src: string, alt: string) {
  return { type: 'field_image', src, width: 18, height: 18, alt }
}

function actionBlock(type: string, text: string, tooltip: string, style: string, src: string) {
  return {
    type,
    message0: `%1 ${text}`,
    args0: [icon(src, text)],
    previousStatement: null,
    nextStatement: null,
    style,
    tooltip,
  }
}

function sensorBlock(type: string, message: string, tooltip: string) {
  return { type, message0: message, output: 'Boolean', style: 'sensor_blocks', tooltip }
}

const DEFINITIONS = [
  {
    type: 'when_run',
    message0: '%1 quando executar %2 %3',
    args0: [icon(BLOCK_ICONS.play, 'executar'), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
    style: 'event_blocks',
    tooltip: 'O programa começa aqui. Encaixe os comandos dentro deste bloco.',
  },
  actionBlock('robot_move_forward', 'mover para frente', 'O robô anda uma casa na direção para onde está virado. Gasta 1 de energia.', 'movement_blocks', BLOCK_ICONS.forward),
  actionBlock('robot_turn_left', 'virar à esquerda', 'O robô gira 90° para a esquerda sem sair do lugar.', 'movement_blocks', BLOCK_ICONS.turnLeft),
  actionBlock('robot_turn_right', 'virar à direita', 'O robô gira 90° para a direita sem sair do lugar.', 'movement_blocks', BLOCK_ICONS.turnRight),
  actionBlock('farm_prepare_soil', 'preparar solo', 'Prepara o canteiro vazio ou colhido para receber sementes.', 'farm_blocks', BLOCK_ICONS.prepare),
  actionBlock('farm_plant', 'plantar semente', 'Planta uma semente no solo preparado. Gasta 1 semente.', 'farm_blocks', BLOCK_ICONS.seed),
  actionBlock('farm_water', 'regar canteiro', 'Molha o solo do canteiro. Gasta 1 de água. Plantas só crescem em solo molhado.', 'farm_blocks', BLOCK_ICONS.water),
  actionBlock('farm_harvest', 'colher planta', 'Colhe a planta do canteiro se ela estiver madura.', 'farm_blocks', BLOCK_ICONS.harvest),
  actionBlock('farm_collect', 'coletar recursos', 'No reservatório, enche a água. No depósito, repõe as sementes.', 'farm_blocks', BLOCK_ICONS.collect),
  sensorBlock('sensor_plot_empty', 'o canteiro está vazio?', 'Verdadeiro se não há planta no canteiro onde o robô está.'),
  sensorBlock('sensor_soil_dry', 'o solo está seco?', 'Verdadeiro se o solo do canteiro atual está seco.'),
  sensorBlock('sensor_plant_mature', 'a planta está madura?', 'Verdadeiro se a planta do canteiro atual pode ser colhida.'),
  sensorBlock('sensor_obstacle_ahead', 'existe obstáculo à frente?', 'Verdadeiro se há obstáculo ou borda do mapa na frente do robô.'),
  sensorBlock('sensor_has_seeds', 'há sementes disponíveis?', 'Verdadeiro se o robô ainda tem sementes.'),
]

export function defineCustomBlocks(): void {
  if (defined) return
  Blockly.setLocale(ptBr as unknown as Record<string, string>)
  Blockly.common.defineBlocksWithJsonArray(DEFINITIONS)
  defined = true
}
```

Se o TypeScript não resolver tipos de `blockly/msg/pt-br`, crie `src/blocks/definitions/blocklyLocale.d.ts` com:
```ts
declare module 'blockly/msg/pt-br' {
  const messages: Record<string, string>
  export = messages
}
```

- [ ] **Step 5: Implementar `src/blocks/definitions/theme.ts`**

Cores das categorias seguem a referência visual (spec, seção 6 › Design system). Amarelos usam tom escurecido para o texto branco continuar legível.

```ts
import * as Blockly from 'blockly'

function style(primary: string, secondary: string, tertiary: string) {
  return { colourPrimary: primary, colourSecondary: secondary, colourTertiary: tertiary }
}

export const agroTheme = Blockly.Theme.defineTheme('agroblocks', {
  name: 'agroblocks',
  base: Blockly.Themes.Classic,
  blockStyles: {
    event_blocks: { ...style('#c98b12', '#e0a526', '#9a6a0c'), hat: 'cap' },
    movement_blocks: style('#4c8df6', '#78a9f8', '#2f6fd6'),
    farm_blocks: style('#3fa34d', '#67bb72', '#2b7a37'),
    sensor_blocks: style('#c98b12', '#e0a526', '#9a6a0c'),
    loop_blocks: style('#8e5be8', '#a984ee', '#6b3fc4'),
    logic_blocks: style('#8e5be8', '#a984ee', '#6b3fc4'),
    math_blocks: style('#3d9aa3', '#64b2b9', '#2a7178'),
    variable_blocks: style('#f07c2a', '#f39b5a', '#c35f17'),
    procedure_blocks: style('#e0508f', '#e87aab', '#b5336d'),
  },
  categoryStyles: {
    movement_category: { colour: '#4c8df6' },
    farm_category: { colour: '#3fa34d' },
    sensor_category: { colour: '#e0a526' },
    control_category: { colour: '#8e5be8' },
    number_category: { colour: '#3d9aa3' },
    variable_category: { colour: '#f07c2a' },
    procedure_category: { colour: '#e0508f' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#f5f7f0',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#13261c',
    flyoutBackgroundColour: '#eef3ea',
    flyoutForegroundColour: '#13261c',
    scrollbarColour: '#b9dca8',
    insertionMarkerColour: '#183d2d',
  },
  fontStyle: { family: 'Inter, system-ui, sans-serif', weight: '600', size: 12 },
  startHats: true,
})
```

- [ ] **Step 6: Implementar `src/blocks/toolbox/buildToolbox.ts`**

```ts
import type { BlockType } from '@/blocks/blockTypes'

export interface ToolboxItem {
  kind: 'block'
  type: BlockType
  inputs?: Record<string, { shadow: { type: string; fields: Record<string, unknown> } }>
  extraState?: Record<string, unknown>
}

export interface ToolboxCategory {
  kind: 'category'
  name: string
  categorystyle: string
  contents?: ToolboxItem[]
  custom?: string
}

export interface ToolboxJson {
  kind: 'categoryToolbox'
  contents: ToolboxCategory[]
}

const numberShadow = (value: number) => ({ shadow: { type: 'math_number', fields: { NUM: value } } })

const ITEMS: Partial<Record<BlockType, ToolboxItem[]>> = {
  controls_repeat_ext: [{ kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: numberShadow(3) } }],
  controls_if: [
    { kind: 'block', type: 'controls_if' },
    { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
  ],
  logic_compare: [{ kind: 'block', type: 'logic_compare', inputs: { A: numberShadow(0), B: numberShadow(0) } }],
  math_arithmetic: [{ kind: 'block', type: 'math_arithmetic', inputs: { A: numberShadow(1), B: numberShadow(1) } }],
}

const STATIC_CATEGORIES: { name: string; style: string; types: BlockType[] }[] = [
  { name: 'Movimento', style: 'movement_category', types: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right'] },
  {
    name: 'Agricultura',
    style: 'farm_category',
    types: ['farm_prepare_soil', 'farm_plant', 'farm_water', 'farm_harvest', 'farm_collect'],
  },
  {
    name: 'Sensores',
    style: 'sensor_category',
    types: ['sensor_plot_empty', 'sensor_soil_dry', 'sensor_plant_mature', 'sensor_obstacle_ahead', 'sensor_has_seeds'],
  },
  {
    name: 'Controle',
    style: 'control_category',
    types: ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'],
  },
  { name: 'Números', style: 'number_category', types: ['math_number', 'math_arithmetic'] },
]

function itemsFor(type: BlockType): ToolboxItem[] {
  return ITEMS[type] ?? [{ kind: 'block', type }]
}

export function buildToolbox(allowed: readonly BlockType[]): ToolboxJson {
  const allowedSet = new Set(allowed)
  const contents: ToolboxCategory[] = STATIC_CATEGORIES.flatMap((category) => {
    const items = category.types.filter((type) => allowedSet.has(type)).flatMap(itemsFor)
    return items.length > 0 ? [{ kind: 'category' as const, name: category.name, categorystyle: category.style, contents: items }] : []
  })
  if (allowedSet.has('variables_set')) {
    contents.push({ kind: 'category', name: 'Variáveis', categorystyle: 'variable_category', custom: 'VARIABLE' })
  }
  if (allowedSet.has('procedures_defnoreturn')) {
    contents.push({ kind: 'category', name: 'Procedimentos', categorystyle: 'procedure_category', custom: 'AGRO_PROCEDURES' })
  }
  return { kind: 'categoryToolbox', contents }
}
```

- [ ] **Step 7: Implementar `src/blocks/toolbox/registerFlyouts.ts`**

```ts
import * as Blockly from 'blockly'

export const PROCEDURE_FLYOUT_KEY = 'AGRO_PROCEDURES'

export function registerProcedureFlyout(workspace: Blockly.WorkspaceSvg): void {
  workspace.registerToolboxCategoryCallback(PROCEDURE_FLYOUT_KEY, (target) => {
    const [definitions] = Blockly.Procedures.allProcedures(target)
    return [
      { kind: 'block', type: 'procedures_defnoreturn', fields: { NAME: 'minha_tarefa' } },
      ...definitions.map(([name]) => ({ kind: 'block', type: 'procedures_callnoreturn', extraState: { name } })),
    ]
  })
}
```

Se a assinatura do callback na versão instalada exigir outro tipo de retorno, ajuste o tipo (`Blockly.utils.toolbox.FlyoutItemInfoArray`) sem mudar o conteúdo.

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/blocks/toolbox src/blocks/definitions && npm run typecheck`
Expected: PASS. Se o import de `blockly` falhar no jsdom, adicione `server: { deps: { inline: ['blockly'] } }` dentro de `test` em `vite.config.ts` e rode de novo.

- [ ] **Step 9: Commit**

```bash
git add src/blocks vite.config.ts
git commit -m "feat(blocks): add custom Portuguese blocks, theme and mission toolbox builder"
```

---

### Task 4.2: Serializer JSON → AST e conversão AST → JSON

**Files:**
- Create: `src/blocks/serializer/workspaceJson.ts`
- Create: `src/blocks/serializer/serializeWorkspace.ts`
- Create: `src/blocks/serializer/programToWorkspaceJson.ts`
- Test: `src/blocks/serializer/serializeWorkspace.test.ts`, `src/blocks/serializer/roundTrip.test.ts`

**Interfaces:**
- Consumes: `Program`, `Stmt`, `Expr`, `CompareOp` (Fase 3), `ACTION_BLOCKS`, `SENSOR_BLOCKS`, `BLOCK_FOR_ACTION`, `BLOCK_FOR_SENSOR`, `BLOCK_LABELS`.
- Produces:
  - `interface BlockJson`, `interface WorkspaceJson`, `DEFAULT_WORKSPACE_JSON: WorkspaceJson`, `WHEN_RUN_ID = 'when-run'`
  - `interface SerializeIssue { blockId: string | null; message: string }`
  - `type SerializeResult = { ok: true; program: Program; blockCount: number; warnings: SerializeIssue[]; looseBlockIds: string[] } | { ok: false; errors: SerializeIssue[]; looseBlockIds: string[] }`
  - `serializeWorkspace(json: WorkspaceJson): SerializeResult`
  - `programToWorkspaceJson(program: Program): WorkspaceJson`

`blockCount` = blocos não-sombra dentro de `quando executar` e procedimentos, contando a definição do procedimento e excluindo o chapéu.

- [ ] **Step 1: Criar `src/blocks/serializer/workspaceJson.ts`**

```ts
export interface BlockInputJson {
  block?: BlockJson
  shadow?: BlockJson
}

export interface BlockJson {
  type: string
  id: string
  x?: number
  y?: number
  deletable?: boolean
  fields?: Record<string, unknown>
  inputs?: Record<string, BlockInputJson>
  next?: BlockInputJson
  extraState?: Record<string, unknown>
  enabled?: boolean
  disabledReasons?: string[]
}

export interface WorkspaceJson {
  blocks?: { languageVersion: number; blocks: BlockJson[] }
  variables?: { name: string; id: string; type?: string }[]
}

export const WHEN_RUN_ID = 'when-run'

export const DEFAULT_WORKSPACE_JSON: WorkspaceJson = {
  blocks: { languageVersion: 0, blocks: [{ type: 'when_run', id: WHEN_RUN_ID, x: 40, y: 40, deletable: false }] },
}
```

- [ ] **Step 2: Escrever teste que falha `src/blocks/serializer/serializeWorkspace.test.ts`**

```ts
import { serializeWorkspace } from '@/blocks/serializer/serializeWorkspace'
import { stripBlockIds } from '@/blocks/interpreter/stripBlockIds'
import type { BlockJson, WorkspaceJson } from '@/blocks/serializer/workspaceJson'

function workspace(blocks: BlockJson[], variables: WorkspaceJson['variables'] = []): WorkspaceJson {
  return { blocks: { languageVersion: 0, blocks }, variables }
}

function hat(first?: BlockJson): BlockJson {
  return { type: 'when_run', id: 'hat', inputs: first ? { DO: { block: first } } : undefined }
}

const move = (id: string, next?: BlockJson): BlockJson => ({
  type: 'robot_move_forward',
  id,
  next: next ? { block: next } : undefined,
})

describe('serializeWorkspace', () => {
  it('reads a chain of actions under the hat', () => {
    const result = serializeWorkspace(workspace([hat(move('a', move('b')))]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toEqual([
      { kind: 'action', action: 'moveForward', blockId: 'a' },
      { kind: 'action', action: 'moveForward', blockId: 'b' },
    ])
    expect(result.blockCount).toBe(2)
  })

  it('reads repeat with a shadow number without counting the shadow', () => {
    const repeat: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      inputs: { TIMES: { shadow: { type: 'math_number', id: 's', fields: { NUM: 4 } } }, DO: { block: move('m') } },
    }
    const result = serializeWorkspace(workspace([hat(repeat)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      { kind: 'repeat', times: { kind: 'number', value: 4 }, body: [{ kind: 'action', action: 'moveForward' }] },
    ])
    expect(result.blockCount).toBe(2)
  })

  it('reads if with else-if and else as a nested chain', () => {
    const sensor = (id: string, type: string): BlockJson => ({ type, id })
    const ifBlock: BlockJson = {
      type: 'controls_if',
      id: 'if',
      extraState: { elseIfCount: 1, hasElse: true },
      inputs: {
        IF0: { block: sensor('s1', 'sensor_soil_dry') },
        DO0: { block: { type: 'farm_water', id: 'w' } },
        IF1: { block: sensor('s2', 'sensor_plant_mature') },
        DO1: { block: { type: 'farm_harvest', id: 'h' } },
        ELSE: { block: move('m') },
      },
    }
    const result = serializeWorkspace(workspace([hat(ifBlock)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      {
        kind: 'if',
        cond: { kind: 'sensor', sensor: 'isSoilDry' },
        then: [{ kind: 'action', action: 'water' }],
        else: [
          {
            kind: 'if',
            cond: { kind: 'sensor', sensor: 'isPlantMature' },
            then: [{ kind: 'action', action: 'harvest' }],
            else: [{ kind: 'action', action: 'moveForward' }],
          },
        ],
      },
    ])
  })

  it('treats while UNTIL as a negated while', () => {
    const loop: BlockJson = {
      type: 'controls_whileUntil',
      id: 'w',
      fields: { MODE: 'UNTIL' },
      inputs: { BOOL: { block: { type: 'sensor_obstacle_ahead', id: 's' } }, DO: { block: move('m') } },
    }
    const result = serializeWorkspace(workspace([hat(loop)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main[0])).toMatchObject({
      kind: 'while',
      cond: { kind: 'not', value: { kind: 'sensor', sensor: 'isObstacleAhead' } },
    })
  })

  it('reads variables by id and comparisons', () => {
    const setBlock: BlockJson = {
      type: 'variables_set',
      id: 'set',
      fields: { VAR: { id: 'v1' } },
      inputs: { VALUE: { block: { type: 'math_number', id: 'n', fields: { NUM: 2 } } } },
      next: {
        block: {
          type: 'controls_if',
          id: 'if',
          inputs: {
            IF0: {
              block: {
                type: 'logic_compare',
                id: 'c',
                fields: { OP: 'LT' },
                inputs: {
                  A: { block: { type: 'variables_get', id: 'g', fields: { VAR: { id: 'v1' } } } },
                  B: { shadow: { type: 'math_number', id: 'n2', fields: { NUM: 5 } } },
                },
              },
            },
          },
        },
      },
    }
    const result = serializeWorkspace(workspace([hat(setBlock)], [{ name: 'contador', id: 'v1' }]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      { kind: 'setVar', name: 'contador', value: { kind: 'number', value: 2 } },
      {
        kind: 'if',
        cond: { kind: 'compare', op: 'LT', left: { kind: 'var', name: 'contador' }, right: { kind: 'number', value: 5 } },
        then: [],
      },
    ])
    expect(result.warnings).toEqual([])
  })

  it('reads procedures and calls', () => {
    const definition: BlockJson = {
      type: 'procedures_defnoreturn',
      id: 'def',
      fields: { NAME: 'cuidar' },
      inputs: { STACK: { block: { type: 'farm_prepare_soil', id: 'p' } } },
    }
    const callBlock: BlockJson = { type: 'procedures_callnoreturn', id: 'call', extraState: { name: 'cuidar' } }
    const result = serializeWorkspace(workspace([definition, hat(callBlock)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program)).toEqual({
      main: [{ kind: 'call', name: 'cuidar' }],
      procedures: { cuidar: [{ kind: 'action', action: 'prepareSoil' }] },
    })
    expect(result.blockCount).toBe(3)
  })

  it('fails when the hat block is missing', () => {
    const result = serializeWorkspace(workspace([move('a')]))
    expect(result).toEqual({
      ok: false,
      errors: [{ blockId: null, message: 'Coloque o bloco "quando executar" no programa.' }],
      looseBlockIds: ['a'],
    })
  })

  it('fails with the owner block id when a condition is empty', () => {
    const result = serializeWorkspace(workspace([hat({ type: 'controls_if', id: 'if' })]))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual([{ blockId: 'if', message: 'O bloco "se" está sem condição.' }])
  })

  it('fails on calls to missing procedures and on recursion', () => {
    const missing = serializeWorkspace(
      workspace([hat({ type: 'procedures_callnoreturn', id: 'c', extraState: { name: 'nada' } })]),
    )
    expect(missing.ok).toBe(false)
    const recursive = serializeWorkspace(
      workspace([
        {
          type: 'procedures_defnoreturn',
          id: 'def',
          fields: { NAME: 'a' },
          inputs: { STACK: { block: { type: 'procedures_callnoreturn', id: 'self', extraState: { name: 'a' } } } },
        },
        hat(),
      ]),
    )
    expect(recursive.ok).toBe(false)
    if (recursive.ok) return
    expect(recursive.errors[0]).toEqual({ blockId: 'self', message: 'O procedimento "a" chama a si mesmo. Recursão não é permitida.' })
  })

  it('rejects procedures with parameters', () => {
    const result = serializeWorkspace(
      workspace([{ type: 'procedures_defnoreturn', id: 'def', fields: { NAME: 'p' }, extraState: { params: [{ name: 'x' }] } }, hat()]),
    )
    expect(result.ok).toBe(false)
  })

  it('ignores loose blocks with a warning', () => {
    const result = serializeWorkspace(workspace([hat(move('a')), move('loose')]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toHaveLength(1)
    expect(result.looseBlockIds).toEqual(['loose'])
    expect(result.warnings).toContainEqual({ blockId: 'loose', message: 'Este bloco não está conectado ao programa e será ignorado.' })
  })

  it('warns about variables that are read but never set', () => {
    const loop: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      inputs: { TIMES: { block: { type: 'variables_get', id: 'g', fields: { VAR: { id: 'v' } } } } },
    }
    const result = serializeWorkspace(workspace([hat(loop)], [{ name: 'n', id: 'v' }]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.warnings[0].message).toBe('A variável "n" é usada antes de receber um valor. Ela começará valendo 0.')
  })

  it('skips blocks disabled from the context menu, including their contents', () => {
    const disabledLoop: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      disabledReasons: ['MANUALLY_DISABLED'],
      inputs: { TIMES: { shadow: { type: 'math_number', id: 'n', fields: { NUM: 3 } } }, DO: { block: move('inside') } },
      next: { block: { type: 'robot_turn_left', id: 't', enabled: false, next: { block: move('after') } } },
    }
    const result = serializeWorkspace(workspace([hat(disabledLoop)]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toEqual([{ kind: 'action', action: 'moveForward', blockId: 'after' }])
    expect(result.blockCount).toBe(1)
  })

  it('rejects a duplicated hat block pasted by the student', () => {
    const result = serializeWorkspace(workspace([hat(move('a')), { type: 'when_run', id: 'hat-2' }]))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContainEqual({ blockId: 'hat-2', message: 'Use apenas um bloco "quando executar".' })
  })

  it('accepts an empty program', () => {
    const result = serializeWorkspace(workspace([hat()]))
    expect(result.ok && result.program.main).toEqual([])
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/blocks/serializer`
Expected: FAIL — `serializeWorkspace` não encontrado.

- [ ] **Step 4: Implementar `src/blocks/serializer/serializeWorkspace.ts`**

```ts
import type { CompareOp, Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { ACTION_BLOCKS, BLOCK_LABELS, SENSOR_BLOCKS } from '@/blocks/blockTypes'
import type { BlockJson, WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export interface SerializeIssue {
  blockId: string | null
  message: string
}

export type SerializeResult =
  | { ok: true; program: Program; blockCount: number; warnings: SerializeIssue[]; looseBlockIds: string[] }
  | { ok: false; errors: SerializeIssue[]; looseBlockIds: string[] }

interface CallRef {
  name: string
  blockId: string
  owner: string | null
}

const COMPARE_OPS: CompareOp[] = ['EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE']

function child(block: BlockJson, input: string): { block: BlockJson; shadow: boolean } | undefined {
  const slot = block.inputs?.[input]
  if (slot?.block) return { block: slot.block, shadow: false }
  if (slot?.shadow) return { block: slot.shadow, shadow: true }
  return undefined
}

function isDisabled(block: BlockJson): boolean {
  return block.enabled === false || (block.disabledReasons?.length ?? 0) > 0
}

function labelOf(block: BlockJson): string {
  return BLOCK_LABELS[block.type] ?? block.type
}

class Reader {
  errors: SerializeIssue[] = []
  blockCount = 0
  readVariables = new Set<string>()
  setVariables = new Set<string>()
  calls: CallRef[] = []
  owner: string | null = null

  constructor(private readonly variableNames: Map<string, string>) {}

  statements(first: BlockJson | undefined): Stmt[] {
    const result: Stmt[] = []
    let current = first
    while (current) {
      if (!isDisabled(current)) {
        const stmt = this.statement(current)
        if (stmt) result.push(stmt)
      }
      current = current.next?.block
    }
    return result
  }

  private statement(block: BlockJson): Stmt | null {
    this.blockCount += 1
    const blockId = block.id
    const action = ACTION_BLOCKS[block.type]
    if (action) return { kind: 'action', action, blockId }
    switch (block.type) {
      case 'controls_repeat_ext':
        return {
          kind: 'repeat',
          times: this.input(block, 'TIMES', 'número de repetições'),
          body: this.statements(child(block, 'DO')?.block),
          blockId,
        }
      case 'controls_whileUntil': {
        const cond = this.input(block, 'BOOL', 'condição')
        return {
          kind: 'while',
          cond: block.fields?.MODE === 'UNTIL' ? { kind: 'not', value: cond } : cond,
          body: this.statements(child(block, 'DO')?.block),
          blockId,
        }
      }
      case 'controls_if':
        return this.ifChain(block, 0)
      case 'variables_set': {
        const name = this.variableName(block)
        this.setVariables.add(name)
        return { kind: 'setVar', name, value: this.input(block, 'VALUE', 'valor'), blockId }
      }
      case 'math_change': {
        const name = this.variableName(block)
        this.setVariables.add(name)
        return { kind: 'changeVar', name, delta: this.input(block, 'DELTA', 'valor'), blockId }
      }
      case 'procedures_callnoreturn': {
        const name = String(block.extraState?.name ?? '')
        this.calls.push({ name, blockId, owner: this.owner })
        return { kind: 'call', name, blockId }
      }
      default:
        this.errors.push({ blockId, message: `O bloco "${labelOf(block)}" não pode ser usado como comando.` })
        return null
    }
  }

  private ifChain(block: BlockJson, index: number): Stmt {
    const elseIfCount = Number(block.extraState?.elseIfCount ?? 0)
    const hasElse = Boolean(block.extraState?.hasElse)
    const cond = this.input(block, `IF${index}`, 'condição')
    const then = this.statements(child(block, `DO${index}`)?.block)
    if (index < elseIfCount) return { kind: 'if', cond, then, else: [this.ifChain(block, index + 1)], blockId: block.id }
    if (hasElse) return { kind: 'if', cond, then, else: this.statements(child(block, 'ELSE')?.block), blockId: block.id }
    return { kind: 'if', cond, then, blockId: block.id }
  }

  private input(owner: BlockJson, inputName: string, label: string): Expr {
    const found = child(owner, inputName)
    if (!found) {
      this.errors.push({ blockId: owner.id, message: `O bloco "${labelOf(owner)}" está sem ${label}.` })
      return { kind: 'boolean', value: false }
    }
    if (!found.shadow) this.blockCount += 1
    return this.expression(found.block)
  }

  private expression(block: BlockJson): Expr {
    const sensor = SENSOR_BLOCKS[block.type]
    if (sensor) return { kind: 'sensor', sensor, blockId: block.id }
    switch (block.type) {
      case 'math_number':
        return { kind: 'number', value: Number(block.fields?.NUM ?? 0) }
      case 'logic_boolean':
        return { kind: 'boolean', value: block.fields?.BOOL === 'TRUE' }
      case 'variables_get': {
        const name = this.variableName(block)
        this.readVariables.add(name)
        return { kind: 'var', name }
      }
      case 'logic_compare': {
        const op = COMPARE_OPS.find((candidate) => candidate === block.fields?.OP) ?? 'EQ'
        return {
          kind: 'compare',
          op,
          left: this.input(block, 'A', 'valor da esquerda'),
          right: this.input(block, 'B', 'valor da direita'),
        }
      }
      case 'logic_operation':
        return {
          kind: 'logic',
          op: block.fields?.OP === 'OR' ? 'OR' : 'AND',
          left: this.input(block, 'A', 'condição da esquerda'),
          right: this.input(block, 'B', 'condição da direita'),
        }
      case 'logic_negate':
        return { kind: 'not', value: this.input(block, 'BOOL', 'condição') }
      case 'math_arithmetic': {
        const op = block.fields?.OP
        if (op !== 'ADD' && op !== 'MINUS') {
          this.errors.push({ blockId: block.id, message: 'Use apenas soma ou subtração no bloco de conta.' })
        }
        return {
          kind: 'arith',
          op: op === 'MINUS' ? 'MINUS' : 'ADD',
          left: this.input(block, 'A', 'primeiro valor'),
          right: this.input(block, 'B', 'segundo valor'),
        }
      }
      default:
        this.errors.push({ blockId: block.id, message: `O bloco "${labelOf(block)}" não pode ser usado como valor.` })
        return { kind: 'boolean', value: false }
    }
  }

  private variableName(block: BlockJson): string {
    const reference = block.fields?.VAR as { id?: string; name?: string } | undefined
    return this.variableNames.get(reference?.id ?? '') ?? reference?.name ?? 'variável'
  }
}

function recursiveCalls(calls: CallRef[]): CallRef[] {
  const edges = new Map<string, Set<string>>()
  for (const call of calls) {
    if (call.owner === null) continue
    const targets = edges.get(call.owner) ?? new Set<string>()
    targets.add(call.name)
    edges.set(call.owner, targets)
  }
  const reaches = (from: string, target: string, seen: Set<string>): boolean => {
    for (const next of edges.get(from) ?? []) {
      if (next === target) return true
      if (seen.has(next)) continue
      seen.add(next)
      if (reaches(next, target, seen)) return true
    }
    return false
  }
  return calls.filter((call) => call.owner !== null && (call.name === call.owner || reaches(call.name, call.owner, new Set())))
}

export function serializeWorkspace(json: WorkspaceJson): SerializeResult {
  const topBlocks = json.blocks?.blocks ?? []
  const variableNames = new Map((json.variables ?? []).map((variable) => [variable.id, variable.name]))
  const reader = new Reader(variableNames)
  const hats = topBlocks.filter((block) => block.type === 'when_run')
  const definitions = topBlocks.filter((block) => block.type === 'procedures_defnoreturn')
  const looseBlockIds = topBlocks
    .filter((block) => block.type !== 'when_run' && block.type !== 'procedures_defnoreturn')
    .map((block) => block.id)

  if (hats.length === 0) reader.errors.push({ blockId: null, message: 'Coloque o bloco "quando executar" no programa.' })
  if (hats.length > 1) reader.errors.push({ blockId: hats[1].id, message: 'Use apenas um bloco "quando executar".' })

  const procedures: Record<string, Stmt[]> = {}
  for (const definition of definitions) {
    const name = String(definition.fields?.NAME ?? '').trim()
    const params = (definition.extraState?.params as unknown[] | undefined) ?? []
    if (params.length > 0) {
      reader.errors.push({ blockId: definition.id, message: 'Procedimentos com parâmetros não são suportados.' })
      continue
    }
    if (!name) {
      reader.errors.push({ blockId: definition.id, message: 'Dê um nome ao procedimento.' })
      continue
    }
    if (procedures[name]) {
      reader.errors.push({ blockId: definition.id, message: `Já existe um procedimento chamado "${name}".` })
      continue
    }
    reader.blockCount += 1
    reader.owner = name
    procedures[name] = reader.statements(child(definition, 'STACK')?.block)
  }

  reader.owner = null
  const main = hats[0] ? reader.statements(child(hats[0], 'DO')?.block) : []

  for (const call of reader.calls) {
    if (!(call.name in procedures)) {
      reader.errors.push({ blockId: call.blockId, message: `O procedimento "${call.name}" não existe.` })
    }
  }
  for (const call of recursiveCalls(reader.calls)) {
    reader.errors.push({
      blockId: call.blockId,
      message: `O procedimento "${call.owner}" chama a si mesmo. Recursão não é permitida.`,
    })
  }

  if (reader.errors.length > 0) return { ok: false, errors: reader.errors, looseBlockIds }

  const warnings: SerializeIssue[] = [
    ...[...reader.readVariables]
      .filter((name) => !reader.setVariables.has(name))
      .map((name) => ({
        blockId: null,
        message: `A variável "${name}" é usada antes de receber um valor. Ela começará valendo 0.`,
      })),
    ...looseBlockIds.map((blockId) => ({
      blockId,
      message: 'Este bloco não está conectado ao programa e será ignorado.',
    })),
  ]
  return { ok: true, program: { main, procedures }, blockCount: reader.blockCount, warnings, looseBlockIds }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/blocks/serializer/serializeWorkspace.test.ts`
Expected: PASS.

- [ ] **Step 6: Escrever teste que falha `src/blocks/serializer/roundTrip.test.ts`**

```ts
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import { serializeWorkspace } from '@/blocks/serializer/serializeWorkspace'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { stripBlockIds } from '@/blocks/interpreter/stripBlockIds'
import {
  act,
  and,
  arith,
  bool,
  call,
  changeVar,
  compare,
  ifThen,
  not,
  program,
  repeat,
  sensor,
  setVar,
  variable,
  whileDo,
} from '@/blocks/interpreter/programBuilder'

const sample = program(
  [
    setVar('agua', 3),
    repeat(2, [call('cuidar'), act('moveForward')]),
    whileDo(not(sensor('isObstacleAhead')), [
      ifThen(and(sensor('isSoilDry'), compare('GT', variable('agua'), 0)), [act('water'), changeVar('agua', -1)], [act('turnLeft')]),
      act('moveForward'),
    ]),
    ifThen(bool(true), [repeat(arith('ADD', variable('agua'), 1), [act('harvest')])]),
  ],
  { cuidar: [act('prepareSoil'), act('plant')] },
)

describe('program ↔ workspace JSON', () => {
  it('round-trips through the pure serializer', () => {
    const result = serializeWorkspace(programToWorkspaceJson(sample))
    if (!result.ok) throw new Error(JSON.stringify(result.errors))
    expect(stripBlockIds(result.program)).toEqual(stripBlockIds(sample))
  })

  it('round-trips through a real headless Blockly workspace', () => {
    defineCustomBlocks()
    const workspace = new Blockly.Workspace()
    Blockly.serialization.workspaces.load(programToWorkspaceJson(sample) as object, workspace)
    const saved = Blockly.serialization.workspaces.save(workspace) as WorkspaceJson
    workspace.dispose()
    const result = serializeWorkspace(saved)
    if (!result.ok) throw new Error(JSON.stringify(result.errors))
    expect(stripBlockIds(result.program)).toEqual(stripBlockIds(sample))
  })

  it('marks the generated hat as not deletable', () => {
    const json = programToWorkspaceJson(program([]))
    expect(json.blocks?.blocks.find((block) => block.type === 'when_run')?.deletable).toBe(false)
  })
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/blocks/serializer/roundTrip.test.ts`
Expected: FAIL — `programToWorkspaceJson` não encontrado.

- [ ] **Step 8: Implementar `src/blocks/serializer/programToWorkspaceJson.ts`**

```ts
import type { Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { BLOCK_FOR_ACTION, BLOCK_FOR_SENSOR } from '@/blocks/blockTypes'
import { WHEN_RUN_ID, type BlockJson, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export function programToWorkspaceJson(program: Program): WorkspaceJson {
  let counter = 0
  const nextId = () => {
    counter += 1
    return `gen-${counter}`
  }
  const variableIds = new Map<string, string>()
  const variableField = (name: string) => {
    const existing = variableIds.get(name)
    if (existing) return { id: existing }
    const id = `var-${variableIds.size + 1}`
    variableIds.set(name, id)
    return { id }
  }

  const expression = (expr: Expr): BlockJson => {
    switch (expr.kind) {
      case 'number':
        return { type: 'math_number', id: nextId(), fields: { NUM: expr.value } }
      case 'boolean':
        return { type: 'logic_boolean', id: nextId(), fields: { BOOL: expr.value ? 'TRUE' : 'FALSE' } }
      case 'var':
        return { type: 'variables_get', id: nextId(), fields: { VAR: variableField(expr.name) } }
      case 'sensor':
        return { type: BLOCK_FOR_SENSOR[expr.sensor], id: nextId() }
      case 'compare':
        return {
          type: 'logic_compare',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
      case 'logic':
        return {
          type: 'logic_operation',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
      case 'not':
        return { type: 'logic_negate', id: nextId(), inputs: { BOOL: { block: expression(expr.value) } } }
      case 'arith':
        return {
          type: 'math_arithmetic',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
    }
  }

  const chain = (stmts: Stmt[]): BlockJson | undefined => {
    const blocks = stmts.map(statement)
    for (let index = blocks.length - 2; index >= 0; index -= 1) blocks[index].next = { block: blocks[index + 1] }
    return blocks[0]
  }

  const body = (stmts: Stmt[]) => {
    const first = chain(stmts)
    return first ? { block: first } : {}
  }

  const statement = (stmt: Stmt): BlockJson => {
    switch (stmt.kind) {
      case 'action':
        return { type: BLOCK_FOR_ACTION[stmt.action], id: nextId() }
      case 'repeat':
        return {
          type: 'controls_repeat_ext',
          id: nextId(),
          inputs: { TIMES: { block: expression(stmt.times) }, DO: body(stmt.body) },
        }
      case 'while':
        return {
          type: 'controls_whileUntil',
          id: nextId(),
          fields: { MODE: 'WHILE' },
          inputs: { BOOL: { block: expression(stmt.cond) }, DO: body(stmt.body) },
        }
      case 'if':
        return stmt.else
          ? {
              type: 'controls_if',
              id: nextId(),
              extraState: { hasElse: true },
              inputs: { IF0: { block: expression(stmt.cond) }, DO0: body(stmt.then), ELSE: body(stmt.else) },
            }
          : {
              type: 'controls_if',
              id: nextId(),
              inputs: { IF0: { block: expression(stmt.cond) }, DO0: body(stmt.then) },
            }
      case 'setVar':
        return {
          type: 'variables_set',
          id: nextId(),
          fields: { VAR: variableField(stmt.name) },
          inputs: { VALUE: { block: expression(stmt.value) } },
        }
      case 'changeVar':
        return {
          type: 'math_change',
          id: nextId(),
          fields: { VAR: variableField(stmt.name) },
          inputs: { DELTA: { block: expression(stmt.delta) } },
        }
      case 'call':
        return { type: 'procedures_callnoreturn', id: nextId(), extraState: { name: stmt.name } }
    }
  }

  const procedureBlocks: BlockJson[] = Object.entries(program.procedures).map(([name, stmts], index) => ({
    type: 'procedures_defnoreturn',
    id: nextId(),
    x: 420,
    y: 40 + index * 260,
    fields: { NAME: name },
    inputs: { STACK: body(stmts) },
  }))

  const hat: BlockJson = {
    type: 'when_run',
    id: WHEN_RUN_ID,
    x: 40,
    y: 40,
    deletable: false,
    inputs: { DO: body(program.main) },
  }

  return {
    blocks: { languageVersion: 0, blocks: [...procedureBlocks, hat] },
    variables: [...variableIds].map(([name, id]) => ({ name, id })),
  }
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run src/blocks && npm run typecheck`
Expected: PASS. Se o teste headless falhar porque o Blockly salva `inputs: { DO: {} }` vazio ou campos extras, ajuste apenas `programToWorkspaceJson`/`child()` para tolerar entradas vazias — o AST esperado não muda.

- [ ] **Step 10: Commit**

```bash
git add src/blocks/serializer
git commit -m "feat(blocks): convert Blockly workspace JSON to program AST and back"
```

---

### Task 4.3: Componente `BlocklyEditor`

**Files:**
- Create: `src/blocks/editor/safeLoad.ts`
- Create: `src/blocks/editor/BlocklyEditor.tsx`
- Create: `src/blocks/editor/BlocklyEditor.css`
- Test: `src/blocks/editor/safeLoad.test.ts`

**Interfaces:**
- Consumes: `defineCustomBlocks`, `agroTheme`, `registerProcedureFlyout`, `ToolboxJson`, `WorkspaceJson`, `DEFAULT_WORKSPACE_JSON`.
- Produces:
```ts
interface BlocklyEditorProps {
  toolbox: ToolboxJson
  initialJson: WorkspaceJson | null
  readOnly: boolean
  highlightBlockId: string | null
  errorBlock: { id: string; message: string } | null
  looseBlockIds: string[]
  onChange: (json: WorkspaceJson) => void
  onBlockEvent?: (kind: 'added' | 'removed') => void
  onLoadFailed?: () => void
}
export function BlocklyEditor(props: BlocklyEditorProps): JSX.Element
```
- `loadWorkspaceSafely(workspace: Blockly.Workspace, json: WorkspaceJson | null): boolean` — carrega o JSON salvo; se falhar, carrega o padrão e retorna `false`; sempre garante o chapéu `quando executar`.
Comportamento: injeta o workspace quando `toolbox` ou `initialJson` mudam (o pai deve memoizar ambos por missão); chama `onChange` uma vez após carregar e a cada evento não-UI; `onBlockEvent` em `BLOCK_CREATE`/`BLOCK_DELETE` feitos pelo usuário; camada de bloqueio quando `readOnly`.

- [ ] **Step 1: Escrever teste que falha `src/blocks/editor/safeLoad.test.ts`**

Um programa salvo corrompido ou incompatível (ex.: tipo de bloco inexistente) não pode derrubar o editor.

```ts
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { loadWorkspaceSafely } from '@/blocks/editor/safeLoad'
import { DEFAULT_WORKSPACE_JSON, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

describe('loadWorkspaceSafely', () => {
  beforeAll(() => defineCustomBlocks())

  it('loads a valid workspace', () => {
    const workspace = new Blockly.Workspace()
    expect(loadWorkspaceSafely(workspace, DEFAULT_WORKSPACE_JSON)).toBe(true)
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    workspace.dispose()
  })

  it('falls back to the default workspace when the saved one cannot be loaded', () => {
    const workspace = new Blockly.Workspace()
    const broken: WorkspaceJson = { blocks: { languageVersion: 0, blocks: [{ type: 'bloco_que_nao_existe', id: 'x' }] } }
    expect(loadWorkspaceSafely(workspace, broken)).toBe(false)
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    expect(workspace.getAllBlocks(false)).toHaveLength(1)
    workspace.dispose()
  })

  it('adds the hat block when a saved workspace lost it', () => {
    const workspace = new Blockly.Workspace()
    loadWorkspaceSafely(workspace, { blocks: { languageVersion: 0, blocks: [{ type: 'robot_move_forward', id: 'm' }] } })
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    workspace.dispose()
  })
})
```

Run: `npx vitest run src/blocks/editor` → Expected: FAIL (módulo não encontrado).

- [ ] **Step 2: Implementar `src/blocks/editor/safeLoad.ts`**

```ts
import * as Blockly from 'blockly'
import { DEFAULT_WORKSPACE_JSON, WHEN_RUN_ID, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export function loadWorkspaceSafely(workspace: Blockly.Workspace, json: WorkspaceJson | null): boolean {
  let loaded = true
  Blockly.Events.disable()
  try {
    try {
      Blockly.serialization.workspaces.load((json ?? DEFAULT_WORKSPACE_JSON) as object, workspace)
    } catch {
      loaded = false
      workspace.clear()
      Blockly.serialization.workspaces.load(DEFAULT_WORKSPACE_JSON as object, workspace)
    }
    if (workspace.getBlocksByType('when_run', false).length === 0) {
      Blockly.serialization.blocks.append({ type: 'when_run', id: WHEN_RUN_ID, x: 40, y: 40, deletable: false }, workspace)
    }
  } finally {
    Blockly.Events.enable()
  }
  return loaded && json !== null
}
```

Run: `npx vitest run src/blocks/editor` → Expected: PASS.

- [ ] **Step 3: Implementar `src/blocks/editor/BlocklyEditor.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { agroTheme } from '@/blocks/definitions/theme'
import { registerProcedureFlyout } from '@/blocks/toolbox/registerFlyouts'
import type { ToolboxJson } from '@/blocks/toolbox/buildToolbox'
import { loadWorkspaceSafely } from '@/blocks/editor/safeLoad'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import './BlocklyEditor.css'

interface BlocklyEditorProps {
  toolbox: ToolboxJson
  initialJson: WorkspaceJson | null
  readOnly: boolean
  highlightBlockId: string | null
  errorBlock: { id: string; message: string } | null
  looseBlockIds: string[]
  onChange: (json: WorkspaceJson) => void
  onBlockEvent?: (kind: 'added' | 'removed') => void
  onLoadFailed?: () => void
}

const LOOSE_CLASS = 'agro-loose-block'

function saveWorkspace(workspace: Blockly.Workspace): WorkspaceJson {
  return Blockly.serialization.workspaces.save(workspace) as WorkspaceJson
}

export function BlocklyEditor({
  toolbox,
  initialJson,
  readOnly,
  highlightBlockId,
  errorBlock,
  looseBlockIds,
  onChange,
  onBlockEvent,
  onLoadFailed,
}: BlocklyEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const callbacksRef = useRef({ onChange, onBlockEvent, onLoadFailed })

  useEffect(() => {
    callbacksRef.current = { onChange, onBlockEvent, onLoadFailed }
  }, [onChange, onBlockEvent, onLoadFailed])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    defineCustomBlocks()
    const workspace = Blockly.inject(host, {
      toolbox,
      theme: agroTheme,
      renderer: 'zelos',
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: 0.85, maxScale: 2, minScale: 0.4 },
      grid: { spacing: 24, length: 2, colour: '#dfe8d6', snap: true },
    })
    registerProcedureFlyout(workspace)
    const restored = loadWorkspaceSafely(workspace, initialJson)
    if (initialJson && !restored) callbacksRef.current.onLoadFailed?.()
    callbacksRef.current.onChange(saveWorkspace(workspace))

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent) return
      if (event.type === Blockly.Events.BLOCK_CREATE) callbacksRef.current.onBlockEvent?.('added')
      if (event.type === Blockly.Events.BLOCK_DELETE) callbacksRef.current.onBlockEvent?.('removed')
      callbacksRef.current.onChange(saveWorkspace(workspace))
    }
    workspace.addChangeListener(listener)
    const observer = new ResizeObserver(() => Blockly.svgResize(workspace))
    observer.observe(host)
    workspaceRef.current = workspace
    return () => {
      observer.disconnect()
      workspace.dispose()
      workspaceRef.current = null
    }
  }, [toolbox, initialJson])

  useEffect(() => {
    workspaceRef.current?.highlightBlock(highlightBlockId)
  }, [highlightBlockId])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    for (const block of workspace.getAllBlocks(false)) block.setWarningText(null)
    if (errorBlock) {
      const block = workspace.getBlockById(errorBlock.id)
      block?.setWarningText(errorBlock.message)
      workspace.highlightBlock(errorBlock.id)
    }
  }, [errorBlock])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    for (const block of workspace.getAllBlocks(false)) block.getSvgRoot().classList.remove(LOOSE_CLASS)
    for (const id of looseBlockIds) {
      const root = workspace.getBlockById(id)
      root?.getDescendants(false).forEach((block) => block.getSvgRoot().classList.add(LOOSE_CLASS))
    }
  }, [looseBlockIds])

  return (
    <div className="blockly-editor">
      <div ref={hostRef} className="blockly-editor__host" aria-label="Editor de blocos do programa" />
      {readOnly && (
        <div className="blockly-editor__lock" role="status">
          Edição bloqueada durante a execução. Pare ou reinicie para editar.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Criar `src/blocks/editor/BlocklyEditor.css`**

```css
.blockly-editor {
  position: relative;
  height: 100%;
  min-height: 420px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.blockly-editor__host {
  position: absolute;
  inset: 0;
}

.blockly-editor__lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  background: rgb(21 34 28 / 0.08);
  color: var(--color-text);
  font-weight: 600;
  cursor: not-allowed;
  z-index: 70;
}

.blockly-editor .agro-loose-block {
  opacity: 0.45;
}

.blockly-editor .blocklyTreeLabel,
.blockly-editor .blocklyToolboxCategoryLabel {
  font-family: var(--font-sans);
  font-weight: 600;
}

.blockly-editor .blocklyToolboxCategory,
.blockly-editor .blocklyTreeRow {
  min-height: 40px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  margin: 2px 6px;
}

.blockly-editor .blocklyToolboxCategory .blocklyTreeIcon,
.blockly-editor .blocklyTreeRow .blocklyTreeIcon {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: currentColor;
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sem erros. Se algum nome de API do Blockly instalado divergir (`getBlocksByType`, `setWarningText`, `isUiEvent`), consulte `node_modules/blockly/core/*.d.ts` e use o equivalente com o mesmo comportamento.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/editor
git commit -m "feat(blocks): add React Blockly editor with highlighting and read-only lock"
```

O editor é exercitado de ponta a ponta pela página de gameplay (Fase 8) e pelos testes E2E (Fase 11).
