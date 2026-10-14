# AgroBlocks — Fase 6: Missões declarativas e progresso

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sete missões (Treinamento + Fases 1–6) como dados tipados, cada uma com solução de referência comprovadamente válida por teste; progresso persistido com desbloqueio, tentativas, dicas, programas salvos e avaliações.

**Architecture:** Missões vivem em `src/data/missions/` e só descrevem dados. `src/game/missions/missionTypes.ts` define o formato; `toControllerMission` converte para o controller. Progresso é lógica pura em `src/game/progress/`; persistência validada por Zod em `src/services/storage/`; Zustand em `src/stores/progressStore.ts`.

**Tech Stack:** TypeScript, Zod, Zustand, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 7)

Leia `plan_index.md` antes de começar.

---

### Task 6.1: Tipo de missão, conversão para o controller e análise de blocos usados

**Files:**
- Create: `src/game/missions/missionTypes.ts`
- Create: `src/game/missions/toControllerMission.ts`
- Create: `src/blocks/analysis/programBlockTypes.ts`
- Test: `src/blocks/analysis/programBlockTypes.test.ts`

**Interfaces:**
- Consumes: `Program`, `Stmt`, `Expr`, `BlockType`, `BLOCK_FOR_ACTION`, `BLOCK_FOR_SENSOR`, `Objective`, `Constraint`, `EfficiencyReference`, `Robot`, `WorldResources`, `ErrorCode`, `createInitialState`, `DEFAULT_STEP_LIMIT`, `ControllerMission`.
- Produces:
  - `type MissionConcept = 'interface' | 'sequencing' | 'repetition' | 'conditionals' | 'sensors' | 'variables' | 'efficiency'`
  - `CONCEPT_LABELS: Record<MissionConcept, string>`
  - `interface MissionDefinition` (abaixo)
  - `toControllerMission(mission: MissionDefinition): ControllerMission`
  - `programBlockTypes(program: Program): Set<BlockType>` (literais numéricos não contam: viram sombras no editor)

- [ ] **Step 1: Criar `src/game/missions/missionTypes.ts`**

```ts
import type { Program } from '@/blocks/interpreter/ast'
import type { BlockType } from '@/blocks/blockTypes'
import type { EfficiencyReference } from '@/game/missions/efficiency'
import type { Constraint, Objective } from '@/game/missions/goals'
import type { ErrorCode, Robot, WorldResources } from '@/game/world/types'

export type MissionConcept =
  | 'interface'
  | 'sequencing'
  | 'repetition'
  | 'conditionals'
  | 'sensors'
  | 'variables'
  | 'efficiency'

export const CONCEPT_LABELS: Record<MissionConcept, string> = {
  interface: 'Interface do jogo',
  sequencing: 'Sequenciamento',
  repetition: 'Repetição (laços)',
  conditionals: 'Condicionais (se / senão)',
  sensors: 'Sensores e laço enquanto',
  variables: 'Variáveis e recursos',
  efficiency: 'Depuração e eficiência',
}

export interface MissionDefinition {
  id: string
  order: number
  title: string
  concept: MissionConcept
  difficulty: 1 | 2 | 3
  tutorial?: boolean
  briefing: { conceptIntro: string; goalText: string; demo?: Program }
  map: { cells: string[] }
  robot: Robot
  resources: WorldResources
  growTicks: number
  rules: { forbidWaterWet?: boolean; stepLimit?: number }
  allowedBlocks: BlockType[]
  initialProgram?: Program
  objectives: Objective[]
  constraints?: Constraint[]
  efficiency: EfficiencyReference
  hints: [string, string, string, string]
  solutionExplanation: string
  referenceSolution: Program
  commonMistakes?: Partial<Record<ErrorCode, string>>
}
```

- [ ] **Step 2: Criar `src/game/missions/toControllerMission.ts`**

```ts
import { DEFAULT_STEP_LIMIT } from '@/blocks/interpreter/interpreter'
import type { ControllerMission } from '@/game/execution/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { createInitialState } from '@/game/world/createInitialState'

export function toControllerMission(mission: MissionDefinition): ControllerMission {
  return {
    initialState: createInitialState(mission),
    rules: {
      growTicks: mission.growTicks,
      forbidWaterWet: mission.rules.forbidWaterWet ?? false,
      mistakes: mission.commonMistakes,
    },
    goals: { objectives: mission.objectives, constraints: mission.constraints },
    stepLimit: mission.rules.stepLimit ?? DEFAULT_STEP_LIMIT,
  }
}
```

- [ ] **Step 3: Escrever teste que falha `src/blocks/analysis/programBlockTypes.test.ts`**

```ts
import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { act, call, compare, ifThen, not, program, repeat, sensor, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'

describe('programBlockTypes', () => {
  it('collects statement and expression block types', () => {
    const types = programBlockTypes(
      program(
        [
          repeat(3, [act('moveForward')]),
          whileDo(not(sensor('isObstacleAhead')), [ifThen(compare('EQ', variable('n'), 2), [call('p')])]),
          setVar('n', 0),
        ],
        { p: [act('harvest')] },
      ),
    )
    expect([...types].sort()).toEqual(
      [
        'controls_repeat_ext',
        'robot_move_forward',
        'controls_whileUntil',
        'logic_negate',
        'sensor_obstacle_ahead',
        'controls_if',
        'logic_compare',
        'variables_get',
        'procedures_callnoreturn',
        'procedures_defnoreturn',
        'variables_set',
        'farm_harvest',
      ].sort(),
    )
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/blocks/analysis/programBlockTypes.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 5: Implementar `src/blocks/analysis/programBlockTypes.ts`**

```ts
import type { Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { BLOCK_FOR_ACTION, BLOCK_FOR_SENSOR, type BlockType } from '@/blocks/blockTypes'

function collectExpr(expr: Expr, types: Set<BlockType>): void {
  switch (expr.kind) {
    case 'number':
      return
    case 'boolean':
      types.add('logic_boolean')
      return
    case 'var':
      types.add('variables_get')
      return
    case 'sensor':
      types.add(BLOCK_FOR_SENSOR[expr.sensor])
      return
    case 'compare':
      types.add('logic_compare')
      collectExpr(expr.left, types)
      collectExpr(expr.right, types)
      return
    case 'logic':
      types.add('logic_operation')
      collectExpr(expr.left, types)
      collectExpr(expr.right, types)
      return
    case 'not':
      types.add('logic_negate')
      collectExpr(expr.value, types)
      return
    case 'arith':
      types.add('math_arithmetic')
      collectExpr(expr.left, types)
      collectExpr(expr.right, types)
      return
  }
}

function collectStmts(stmts: Stmt[], types: Set<BlockType>): void {
  for (const stmt of stmts) {
    switch (stmt.kind) {
      case 'action':
        types.add(BLOCK_FOR_ACTION[stmt.action])
        break
      case 'repeat':
        types.add('controls_repeat_ext')
        collectExpr(stmt.times, types)
        collectStmts(stmt.body, types)
        break
      case 'while':
        types.add('controls_whileUntil')
        collectExpr(stmt.cond, types)
        collectStmts(stmt.body, types)
        break
      case 'if':
        types.add('controls_if')
        collectExpr(stmt.cond, types)
        collectStmts(stmt.then, types)
        if (stmt.else) collectStmts(stmt.else, types)
        break
      case 'setVar':
        types.add('variables_set')
        collectExpr(stmt.value, types)
        break
      case 'changeVar':
        types.add('math_change')
        collectExpr(stmt.delta, types)
        break
      case 'call':
        types.add('procedures_callnoreturn')
        break
    }
  }
}

export function programBlockTypes(program: Program): Set<BlockType> {
  const types = new Set<BlockType>()
  collectStmts(program.main, types)
  const bodies = Object.values(program.procedures)
  if (bodies.length > 0) types.add('procedures_defnoreturn')
  for (const body of bodies) collectStmts(body, types)
  return types
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/blocks/analysis && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/missions src/blocks/analysis
git commit -m "feat(missions): add mission definition type and controller conversion"
```

---

### Task 6.2: Dados das sete missões com soluções de referência

**Files:**
- Create: `src/data/missions/helpers.ts`
- Create: `src/data/missions/mission00Training.ts`
- Create: `src/data/missions/mission01FirstHarvest.ts`
- Create: `src/data/missions/mission02RowPlanting.ts`
- Create: `src/data/missions/mission03SmartIrrigation.ts`
- Create: `src/data/missions/mission04AutoHarvest.ts`
- Create: `src/data/missions/mission05LimitedResources.ts`
- Create: `src/data/missions/mission06EfficientFarm.ts`
- Create: `src/data/missions/index.ts`
- Test: `src/data/missions/missions.test.ts`

**Interfaces:**
- Consumes: `MissionDefinition`, builder de programas, `toControllerMission`, `runProgram`, `validateMission`, `programBlockTypes`, `UNLIMITED_RESOURCES`.
- Produces:
  - `rectCells(x: number, y: number, width: number, height: number): CellRef[]`, `rowCells(y: number, fromX: number, toX: number): CellRef[]`
  - `MISSIONS: MissionDefinition[]` (ordenado por `order`)
  - `getMission(id: string): MissionDefinition | undefined`
  - `getNextMission(id: string): MissionDefinition | undefined`
  - IDs: `m0-training`, `m1-first-harvest`, `m2-row-planting`, `m3-smart-irrigation`, `m4-auto-harvest`, `m5-limited-resources`, `m6-efficient-farm`

Coordenadas: `x` cresce para Leste, `y` para Sul. Legenda do mapa na spec, seção 7.

- [ ] **Step 1: Escrever teste que falha `src/data/missions/missions.test.ts`**

```ts
import { MISSIONS, getMission, getNextMission } from '@/data/missions'
import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { runProgram } from '@/blocks/interpreter/runProgram'
import { act, program, repeat, ifThen, sensor } from '@/blocks/interpreter/programBuilder'
import type { Program } from '@/blocks/interpreter/ast'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { validateMission } from '@/game/missions/validateMission'
import type { MissionDefinition } from '@/game/missions/missionTypes'

function play(mission: MissionDefinition, code: Program) {
  const controllerMission = toControllerMission(mission)
  const result = runProgram(code, controllerMission.initialState, controllerMission.rules, controllerMission.stepLimit)
  return { ...result, validation: validateMission(result.state, controllerMission.goals) }
}

function mission(id: string): MissionDefinition {
  const found = getMission(id)
  if (!found) throw new Error(`missing ${id}`)
  return found
}

describe('missions', () => {
  it('has seven missions with unique ids and consecutive order', () => {
    expect(MISSIONS.map((item) => item.order)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(new Set(MISSIONS.map((item) => item.id)).size).toBe(7)
    expect(getNextMission('m1-first-harvest')?.id).toBe('m2-row-planting')
    expect(getNextMission('m6-efficient-farm')).toBeUndefined()
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s is solvable by its reference solution', (_id, item) => {
    const result = play(item, item.referenceSolution)
    expect(result.outcome.status).toBe('completed')
    expect(result.validation.success).toBe(true)
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s reference uses only allowed blocks', (_id, item) => {
    const allowed = new Set(item.allowedBlocks)
    for (const type of programBlockTypes(item.referenceSolution)) expect(allowed.has(type)).toBe(true)
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s has four hints and efficiency references', (_id, item) => {
    expect(item.hints.every((hint) => hint.length > 10)).toBe(true)
    expect(item.efficiency.referenceActions).toBeGreaterThan(0)
    expect(item.efficiency.referenceBlocks).toBeGreaterThan(0)
  })

  it('mission 0 punishes one move too many with an obstacle', () => {
    const result = play(mission('m0-training'), program([act('moveForward'), act('moveForward'), act('moveForward')]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('HIT_OBSTACLE')
  })

  it('mission 1 fails when the robot harvests before turning', () => {
    const result = play(mission('m1-first-harvest'), program([repeat(3, [act('moveForward')]), act('harvest')]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NOTHING_TO_HARVEST')
  })

  it('mission 2 hits the fence when repeating seven times', () => {
    const result = play(mission('m2-row-planting'), program([repeat(7, [act('moveForward'), act('prepareSoil'), act('plant')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('HIT_OBSTACLE')
  })

  it('mission 3 forbids watering wet soil', () => {
    const result = play(mission('m3-smart-irrigation'), program([repeat(6, [act('moveForward'), act('water')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('WATER_WASTED')
  })

  it('mission 4 forbids harvesting immature plants', () => {
    const result = play(mission('m4-auto-harvest'), program([repeat(6, [act('moveForward'), act('harvest')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('PLANT_NOT_MATURE')
  })

  it('mission 5 runs out of water without visiting the reservoir', () => {
    const result = play(
      mission('m5-limited-resources'),
      program([repeat(6, [act('moveForward'), act('plant'), act('water')])]),
    )
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NO_WATER')
  })

  it('mission 6 initial program contains a bug that occupies a planted plot', () => {
    const item = mission('m6-efficient-farm')
    if (!item.initialProgram) throw new Error('mission 6 needs an initial program')
    const result = play(item, item.initialProgram)
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('PLOT_OCCUPIED')
  })

  it.each(MISSIONS.filter((item) => item.briefing.demo).map((item) => [item.id, item] as const))(
    '%s demo runs without errors and does not solve the mission',
    (_id, item) => {
      const demo = item.briefing.demo
      if (!demo) throw new Error('missing demo')
      const result = play(item, demo)
      expect(result.outcome.status).toBe('completed')
      expect(result.validation.success).toBe(false)
    },
  )

  it('missions 1 to 3 offer a demonstration', () => {
    expect(MISSIONS.filter((item) => item.briefing.demo).map((item) => item.order)).toEqual([1, 2, 3])
  })

  it('mission 3 checking the sensor without else is still valid', () => {
    const result = play(
      mission('m3-smart-irrigation'),
      program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
    )
    expect(result.validation.success).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/data/missions`
Expected: FAIL — `@/data/missions` não encontrado.

- [ ] **Step 3: Criar `src/data/missions/helpers.ts`**

```ts
import type { CellRef } from '@/game/missions/goals'

export function rectCells(x: number, y: number, width: number, height: number): CellRef[] {
  const cells: CellRef[] = []
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) cells.push([column, row])
  }
  return cells
}

export function rowCells(y: number, fromX: number, toX: number): CellRef[] {
  return rectCells(fromX, y, toX - fromX + 1, 1)
}
```

- [ ] **Step 4: Criar `src/data/missions/mission00Training.ts`**

```ts
import { act, program } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const mission00Training: MissionDefinition = {
  id: 'm0-training',
  order: 0,
  title: 'Treinamento',
  concept: 'interface',
  difficulty: 1,
  tutorial: true,
  briefing: {
    conceptIntro:
      'Um programa é uma lista de instruções que o robô segue, uma de cada vez, de cima para baixo. Neste treinamento você vai aprender a montar, executar e corrigir um programa.',
    goalText: 'Leve o robô até a planta madura e colha.',
  },
  map: { cells: ['. . . . .', '. . m # .', '. . . . .'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 3,
  rules: {},
  allowedBlocks: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right', 'farm_harvest'],
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 3, referenceBlocks: 3 },
  hints: [
    'O robô segue os blocos na ordem em que estão encaixados, de cima para baixo.',
    'Conte quantas casas existem entre o robô e a planta.',
    'Use os blocos da categoria Movimento e depois o bloco "colher planta" (Agricultura).',
    'Exemplo: mover para frente, mover para frente, colher planta.',
  ],
  solutionExplanation:
    'O robô andou duas casas até a planta e então colheu. Cada bloco virou exatamente uma ação, na ordem em que foi encaixado.',
  referenceSolution: program([act('moveForward'), act('moveForward'), act('harvest')]),
  commonMistakes: {
    HIT_OBSTACLE: 'O robô passou da planta e bateu na pedra. Remova um bloco "mover para frente".',
  },
}
```

- [ ] **Step 5: Criar `src/data/missions/mission01FirstHarvest.ts`**

```ts
import { act, program } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const mission01FirstHarvest: MissionDefinition = {
  id: 'm1-first-harvest',
  order: 1,
  title: 'Primeira colheita',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro:
      'Sequenciamento: a ordem das instruções muda o resultado. O robô não adivinha o caminho — ele executa exatamente o que você montar.',
    goalText: 'Leve o robô até a planta madura no alto do mapa e colha.',
    demo: program([act('moveForward'), act('turnLeft'), act('turnRight')]),
  },
  map: { cells: ['. . . . .', '. . . m .', '. . # . .', '. # . . .', '. . . . .'] },
  robot: { x: 0, y: 4, facing: 'N' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 3,
  rules: {},
  allowedBlocks: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right', 'farm_harvest'],
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 8, referenceBlocks: 8 },
  hints: [
    'Planeje o caminho inteiro antes de montar os blocos.',
    'O robô começa virado para cima. Em que ponto ele precisa virar?',
    'Você vai precisar de blocos de Movimento (mover e virar) e de "colher planta".',
    'Comece com: mover para frente, mover para frente, mover para frente, virar à direita...',
  ],
  solutionExplanation:
    'O algoritmo é uma sequência: três passos para cima, uma virada à direita, três passos para a direita e a colheita. Trocar a ordem de qualquer bloco leva o robô a outro lugar.',
  referenceSolution: program([
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('harvest'),
  ]),
  commonMistakes: {
    HIT_OBSTACLE: 'Há pedras no meio da fazenda. Suba pela coluna da esquerda antes de virar.',
    NOTHING_TO_HARVEST: 'O robô colheu no lugar errado. Confira se ele chegou na planta antes do bloco "colher".',
  },
}
```

- [ ] **Step 6: Criar `src/data/missions/mission02RowPlanting.ts`**

```ts
import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const mission02RowPlanting: MissionDefinition = {
  id: 'm2-row-planting',
  order: 2,
  title: 'Plantação em série',
  concept: 'repetition',
  difficulty: 1,
  briefing: {
    conceptIntro:
      'Repetição: quando o mesmo grupo de comandos aparece várias vezes, um laço "repita N vezes" faz o trabalho com menos blocos.',
    goalText: 'Prepare o solo e plante uma semente em cada um dos 6 canteiros da fileira.',
    demo: program([act('moveForward'), act('prepareSoil'), act('plant')]),
  },
  map: { cells: ['X X X X X X X X', '. . . . . . . #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: 6, water: null, energy: null, seedCapacity: 6, waterCapacity: null },
  growTicks: 3,
  rules: {},
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_prepare_soil',
    'farm_plant',
    'farm_harvest',
    'controls_repeat_ext',
  ],
  objectives: [{ kind: 'cellsInState', cells: rowCells(1, 1, 6), state: 'seeded' }],
  efficiency: { referenceActions: 18, referenceBlocks: 4 },
  hints: [
    'Observe: o trabalho em cada canteiro é sempre o mesmo.',
    'Para cada canteiro o robô precisa andar, preparar e plantar. Quantos canteiros existem?',
    'Procure o bloco "repita" na categoria Controle.',
    'Exemplo parcial: repita 6 vezes: mover para frente, preparar solo, ...',
  ],
  solutionExplanation:
    'O laço repetiu três ações (mover, preparar, plantar) seis vezes. Com 4 blocos você fez o trabalho de 18.',
  referenceSolution: program([repeat(6, [act('moveForward'), act('prepareSoil'), act('plant')])]),
  commonMistakes: {
    HIT_OBSTACLE: 'O laço repetiu vezes demais e o robô chegou na cerca. Conte os canteiros de novo.',
    NO_SEEDS: 'Você tem exatamente 6 sementes, uma por canteiro.',
    SOIL_NOT_READY: 'Prepare o solo antes de plantar.',
  },
}
```

- [ ] **Step 7: Criar `src/data/missions/mission03SmartIrrigation.ts`**

```ts
import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const mission03SmartIrrigation: MissionDefinition = {
  id: 'm3-smart-irrigation',
  order: 3,
  title: 'Irrigação inteligente',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro:
      'Condicionais: o bloco "se" deixa o robô decidir. Ele só executa os comandos de dentro quando a condição é verdadeira. Com "senão" você diz o que fazer quando ela é falsa.',
    goalText: 'Deixe os 6 canteiros com solo molhado sem regar nenhum que já esteja molhado.',
    demo: program([act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])]),
  },
  map: { cells: ['X X X X X X X X', '. s sw s sw sw s #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: null, water: 4, energy: null, seedCapacity: null, waterCapacity: 4 },
  growTicks: 20,
  rules: { forbidWaterWet: true },
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_water',
    'farm_harvest',
    'sensor_soil_dry',
    'controls_repeat_ext',
    'controls_if',
  ],
  objectives: [{ kind: 'cellsWet', cells: rowCells(1, 1, 6) }],
  constraints: [{ kind: 'maxWaterUsed', value: 3 }],
  efficiency: { referenceActions: 9, referenceBlocks: 5 },
  hints: [
    'Nem todo canteiro precisa de água. O robô precisa olhar antes de agir.',
    'A condição que importa é: o solo está seco?',
    'Use o bloco "se" (Controle) com o sensor "o solo está seco?" (Sensores).',
    'Exemplo parcial: repita 6 vezes: mover para frente, se o solo está seco?: ...',
  ],
  solutionExplanation:
    'Em cada canteiro o robô perguntou "o solo está seco?". Só quando a resposta foi sim ele regou. Assim a água foi usada apenas onde era necessária.',
  referenceSolution: program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
  commonMistakes: {
    WATER_WASTED: 'Este canteiro já estava molhado. Verifique com o sensor antes de regar.',
    NO_WATER: 'A água acabou porque o robô regou canteiros que não precisavam.',
  },
}
```

- [ ] **Step 8: Criar `src/data/missions/mission04AutoHarvest.ts`**

```ts
import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

const harvestRow = () =>
  whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])

export const mission04AutoHarvest: MissionDefinition = {
  id: 'm4-auto-harvest',
  order: 4,
  title: 'Colheita automatizada',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro:
      'Sensores + laço "enquanto": o robô repete os comandos enquanto uma condição for verdadeira, sem você precisar contar as casas.',
    goalText: 'Colha as 7 plantas maduras das duas fileiras sem tocar nas que ainda estão crescendo.',
  },
  map: { cells: ['X X X X X X X X', '. m g m m g m #', '. g m g m m g #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 50,
  rules: {},
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_prepare_soil',
    'farm_plant',
    'farm_water',
    'farm_harvest',
    'sensor_plot_empty',
    'sensor_soil_dry',
    'sensor_plant_mature',
    'sensor_obstacle_ahead',
    'controls_repeat_ext',
    'controls_whileUntil',
    'controls_if',
    'logic_negate',
  ],
  objectives: [{ kind: 'harvestAtLeast', count: 7 }],
  efficiency: { referenceActions: 22, referenceBlocks: 17 },
  hints: [
    'Algumas plantas ainda não estão prontas. O robô precisa verificar cada uma.',
    'Duas perguntas importam: a planta está madura? existe obstáculo à frente?',
    'Combine "enquanto" com "não" e o sensor de obstáculo; dentro, use "se" com o sensor de maturidade.',
    'Exemplo parcial: enquanto não (existe obstáculo à frente?): mover para frente, se a planta está madura?: colher planta',
  ],
  solutionExplanation:
    'O laço "enquanto" fez o robô andar até a cerca sem contar casas. Em cada canteiro o sensor de maturidade decidiu se ele colhia. Depois o robô desceu para a segunda fileira e repetiu a mesma lógica.',
  referenceSolution: program([harvestRow(), act('turnRight'), act('moveForward'), act('turnRight'), harvestRow()]),
  commonMistakes: {
    PLANT_NOT_MATURE: 'Esta planta ainda está crescendo. Use o sensor "a planta está madura?" antes de colher.',
    HIT_OBSTACLE: 'O robô chegou na cerca. Use o sensor de obstáculo para saber quando parar.',
  },
}
```

- [ ] **Step 9: Criar `src/data/missions/mission05LimitedResources.ts`**

```ts
import { act, changeVar, compare, ifThen, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const mission05LimitedResources: MissionDefinition = {
  id: 'm5-limited-resources',
  order: 5,
  title: 'Recursos limitados',
  concept: 'variables',
  difficulty: 3,
  briefing: {
    conceptIntro:
      'Variáveis guardam valores que mudam durante o programa, como quantos canteiros já foram regados. Com elas o robô sabe a hora de voltar ao reservatório.',
    goalText: 'Plante e regue os 6 canteiros. O tanque do robô começa vazio e só carrega 3 de água por vez.',
  },
  map: { cells: ['X X X X X X X X', 'R t t t t t t #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: 6, water: 0, energy: null, seedCapacity: 6, waterCapacity: 3 },
  growTicks: 50,
  rules: {},
  allowedBlocks: [
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
    'math_number',
    'math_arithmetic',
    'variables_set',
    'variables_get',
    'math_change',
  ],
  objectives: [
    { kind: 'cellsInState', cells: rowCells(1, 1, 6), state: 'seeded' },
    { kind: 'cellsWet', cells: rowCells(1, 1, 6) },
  ],
  constraints: [
    { kind: 'maxWaterUsed', value: 6 },
    { kind: 'maxSeedsUsed', value: 6 },
  ],
  efficiency: { referenceActions: 30, referenceBlocks: 21 },
  hints: [
    'O tanque não dá para todos os canteiros. Em algum momento o robô precisa voltar ao reservatório.',
    'Conte quantos canteiros já foram regados. Quando a conta chegar a 3, é hora de reabastecer.',
    'Crie uma variável (Variáveis) e use "se" com o bloco de comparação (Controle).',
    'Exemplo parcial: coletar recursos, plantados ← 0, repita 6 vezes: mover, plantar, regar, plantados ← plantados + 1, se plantados = 3: ...',
  ],
  solutionExplanation:
    'A variável contou os canteiros cuidados. Quando chegou a 3, o robô deu meia-volta, reabasteceu no reservatório e voltou ao ponto onde parou. Sem a variável ele não saberia quando a água acabaria.',
  referenceSolution: program([
    act('collectResources'),
    setVar('plantados', 0),
    repeat(6, [
      act('moveForward'),
      act('plant'),
      act('water'),
      changeVar('plantados', 1),
      ifThen(compare('EQ', variable('plantados'), 3), [
        act('turnLeft'),
        act('turnLeft'),
        repeat(3, [act('moveForward')]),
        act('collectResources'),
        act('turnLeft'),
        act('turnLeft'),
        repeat(3, [act('moveForward')]),
      ]),
    ]),
  ]),
  commonMistakes: {
    NO_WATER: 'O tanque esvaziou. Comece coletando água e volte ao reservatório a cada 3 regas.',
    NOT_AT_SUPPLY: 'O robô só coleta água em cima do reservatório.',
  },
}
```

- [ ] **Step 10: Criar `src/data/missions/mission06EfficientFarm.ts`**

```ts
import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { ALL_BLOCKS } from '@/blocks/blockTypes'
import { rectCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Program } from '@/blocks/interpreter/ast'

function farmProgram(secondTurn: 'turnLeft' | 'turnRight'): Program {
  return program(
    [
      repeat(2, [
        repeat(3, [call('cuidar'), act('moveForward')]),
        call('cuidar'),
        act('turnRight'),
        act('moveForward'),
        act('turnRight'),
        repeat(3, [call('cuidar'), act('moveForward')]),
        call('cuidar'),
        act(secondTurn),
        act('moveForward'),
        act(secondTurn),
      ]),
    ],
    { cuidar: [act('prepareSoil'), act('plant'), act('water')] },
  )
}

export const mission06EfficientFarm: MissionDefinition = {
  id: 'm6-efficient-farm',
  order: 6,
  title: 'Fazenda eficiente',
  concept: 'efficiency',
  difficulty: 3,
  briefing: {
    conceptIntro:
      'Depuração e eficiência: programas reais têm erros. Encontre o bug no programa pronto, corrija-o e use laços aninhados e procedimentos para escrever menos blocos.',
    goalText: 'Prepare, plante e regue os 16 canteiros da área 4×4 sem acabar a energia.',
  },
  map: { cells: ['. . . .', '. . . .', '. . . .', '. . . .', 'R X X S'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: { seeds: 16, water: 16, energy: 70, seedCapacity: 16, waterCapacity: 16 },
  growTicks: 99,
  rules: {},
  allowedBlocks: ALL_BLOCKS,
  initialProgram: farmProgram('turnRight'),
  objectives: [
    { kind: 'cellsInState', cells: rectCells(0, 0, 4, 4), state: 'seeded' },
    { kind: 'cellsWet', cells: rectCells(0, 0, 4, 4) },
  ],
  efficiency: { referenceActions: 72, referenceBlocks: 19 },
  hints: [
    'O programa inicial quase funciona. Execute passo a passo e observe onde o robô sai do caminho.',
    'Depois da segunda fileira o robô precisa descer, não subir. Qual virada está errada?',
    'Compare as viradas das duas mudanças de fileira (Movimento).',
    'A segunda mudança de fileira deve usar "virar à esquerda" duas vezes, com "mover para frente" no meio.',
  ],
  solutionExplanation:
    'O procedimento "cuidar" reuniu preparar, plantar e regar. Laços aninhados percorreram as fileiras em zigue-zague. O bug estava na direção da segunda virada: com "virar à direita" o robô voltava para a fileira já plantada.',
  referenceSolution: farmProgram('turnLeft'),
  commonMistakes: {
    PLOT_OCCUPIED: 'O robô voltou a um canteiro que já foi plantado. Confira a direção das viradas entre as fileiras.',
    NO_ENERGY: 'A energia acabou. Evite passos desnecessários.',
  },
}
```

- [ ] **Step 11: Criar `src/data/missions/index.ts`**

```ts
import { mission00Training } from '@/data/missions/mission00Training'
import { mission01FirstHarvest } from '@/data/missions/mission01FirstHarvest'
import { mission02RowPlanting } from '@/data/missions/mission02RowPlanting'
import { mission03SmartIrrigation } from '@/data/missions/mission03SmartIrrigation'
import { mission04AutoHarvest } from '@/data/missions/mission04AutoHarvest'
import { mission05LimitedResources } from '@/data/missions/mission05LimitedResources'
import { mission06EfficientFarm } from '@/data/missions/mission06EfficientFarm'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const MISSIONS: MissionDefinition[] = [
  mission00Training,
  mission01FirstHarvest,
  mission02RowPlanting,
  mission03SmartIrrigation,
  mission04AutoHarvest,
  mission05LimitedResources,
  mission06EfficientFarm,
].sort((a, b) => a.order - b.order)

export function getMission(id: string): MissionDefinition | undefined {
  return MISSIONS.find((mission) => mission.id === id)
}

export function getNextMission(id: string): MissionDefinition | undefined {
  const current = getMission(id)
  return current ? MISSIONS.find((mission) => mission.order === current.order + 1) : undefined
}
```

- [ ] **Step 12: Rodar e ver passar**

Run: `npx vitest run src/data && npm run typecheck`
Expected: PASS. Se alguma solução de referência falhar, corrija o **mapa ou a solução** daquela missão (nunca relaxe o teste) e documente a mudança na mensagem de commit.

- [ ] **Step 13: Commit**

```bash
git add src/data
git commit -m "feat(missions): add training and six educational missions with verified reference solutions"
```

---

### Task 6.3: Progresso — lógica pura, persistência e store

**Files:**
- Create: `src/game/progress/types.ts`
- Create: `src/game/progress/progression.ts`
- Create: `src/services/storage/saveDataSchema.ts`
- Create: `src/services/storage/saveStorage.ts`
- Create: `src/stores/progressStore.ts`
- Test: `src/game/progress/progression.test.ts`, `src/services/storage/saveStorage.test.ts`, `src/stores/progressStore.test.ts`

**Interfaces:**
- Consumes: `ErrorCode`, `ERROR_CODES`, `ResourceUsage`, `EfficiencyStars`, `MISSIONS`, `readJson`, `writeJson`, `safeStorage`.
- Produces:
  - Tipos: `AttemptOutcome = 'success' | 'objectiveFailed' | 'error'`, `AttemptRecord`, `AttemptInput`, `BestResult`, `MissionStatus`, `MissionProgress`, `AssessmentForm = 'pre' | 'post'`, `AssessmentResponse`, `SaveData`, `MissionRef`, `MAX_HINTS = 4`
  - `createInitialSave(missions: MissionRef[], now: string): SaveData`
  - `syncMissions(save: SaveData, missions: MissionRef[]): SaveData`
  - `recordAttempt(save: SaveData, input: AttemptInput, missions: MissionRef[]): SaveData`
  - `registerHint(save: SaveData, missionId: string): SaveData`
  - `storeProgram(save: SaveData, missionId: string, json: string): SaveData`
  - `setParticipantCode(save: SaveData, code: string | null): SaveData`
  - `storeAssessment(save: SaveData, response: AssessmentResponse): SaveData`
  - `hasProgress(save: SaveData): boolean`
  - `continueMissionId(save: SaveData, missions: MissionRef[]): string | null`
  - `failedAttempts(save: SaveData, missionId: string): number`
  - `isBetterResult(candidate: BestResult, current: BestResult | null): boolean`
  - `SAVE_KEY = 'agroblocks:v1'`, `CORRUPT_KEY = 'agroblocks:corrupt'`, `loadSave(storage, missions, now): SaveData`, `writeSave(storage, save): void`
  - `useProgressStore` com `{ save; recordAttempt(input): AttemptRecord; registerHint(missionId); storeProgram(missionId, json); setParticipantCode(code); storeAssessment(response); resetProgress() }`

- [ ] **Step 1: Criar `src/game/progress/types.ts`**

```ts
import type { EfficiencyStars } from '@/game/missions/efficiency'
import type { ErrorCode, ResourceUsage } from '@/game/world/types'

export const MAX_HINTS = 4

export type AttemptOutcome = 'success' | 'objectiveFailed' | 'error'

export interface AttemptRecord {
  id: string
  missionId: string
  attemptNumber: number
  timestamp: string
  outcome: AttemptOutcome
  errorCode: ErrorCode | null
  actions: number
  blocks: number
  usage: ResourceUsage
  hintsUsed: number
  efficiencyStars: EfficiencyStars | null
  pseudocode: string
}

export type AttemptInput = Omit<AttemptRecord, 'id' | 'attemptNumber' | 'hintsUsed'>

export interface BestResult {
  actions: number
  blocks: number
  usage: ResourceUsage
  efficiencyStars: EfficiencyStars
}

export type MissionStatus = 'locked' | 'available' | 'completed'

export interface MissionProgress {
  status: MissionStatus
  attempts: number
  bestResult: BestResult | null
  hintsUsed: number
  errorCounts: Partial<Record<ErrorCode, number>>
  savedProgram: string | null
}

export type AssessmentForm = 'pre' | 'post'

export interface AssessmentResponse {
  form: AssessmentForm
  startedAt: string
  completedAt: string
  skipped: boolean
  answers: Record<string, number>
}

export interface SaveData {
  version: 1
  participantCode: string | null
  createdAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: { pre: AssessmentResponse | null; post: AssessmentResponse | null }
}

export interface MissionRef {
  id: string
  order: number
}
```

- [ ] **Step 2: Escrever testes que falham**

`src/game/progress/progression.test.ts`:
```ts
import {
  continueMissionId,
  createInitialSave,
  failedAttempts,
  hasProgress,
  isBetterResult,
  recordAttempt,
  registerHint,
  storeProgram,
  syncMissions,
} from '@/game/progress/progression'
import type { AttemptInput } from '@/game/progress/types'

const missions = [
  { id: 'a', order: 0 },
  { id: 'b', order: 1 },
  { id: 'c', order: 2 },
  { id: 'd', order: 3 },
]
const now = '2026-10-14T12:00:00.000Z'

function attempt(missionId: string, outcome: AttemptInput['outcome'], actions = 10): AttemptInput {
  return {
    missionId,
    timestamp: now,
    outcome,
    errorCode: outcome === 'error' ? 'HIT_OBSTACLE' : null,
    actions,
    blocks: 4,
    usage: { seeds: 1, water: 2, energy: 3 },
    efficiencyStars: outcome === 'success' ? 2 : null,
    pseudocode: 'quando executar:',
  }
}

describe('progression', () => {
  it('starts with the first two missions available and the rest locked', () => {
    const save = createInitialSave(missions, now)
    expect(Object.values(save.missions).map((progress) => progress.status)).toEqual(['available', 'available', 'locked', 'locked'])
    expect(hasProgress(save)).toBe(false)
    expect(continueMissionId(save, missions)).toBeNull()
  })

  it('records failed attempts and error counts without unlocking', () => {
    const save = recordAttempt(createInitialSave(missions, now), attempt('b', 'error'), missions)
    expect(save.missions.b).toMatchObject({ status: 'available', attempts: 1, errorCounts: { HIT_OBSTACLE: 1 } })
    expect(save.missions.c.status).toBe('locked')
    expect(save.attempts[0]).toMatchObject({ id: 'b-1', attemptNumber: 1, hintsUsed: 0 })
    expect(failedAttempts(save, 'b')).toBe(1)
    expect(hasProgress(save)).toBe(true)
  })

  it('completes the mission, stores the best result and unlocks the next one', () => {
    const save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success'), missions)
    expect(save.missions.b.status).toBe('completed')
    expect(save.missions.b.bestResult).toEqual({ actions: 10, blocks: 4, usage: { seeds: 1, water: 2, energy: 3 }, efficiencyStars: 2 })
    expect(save.missions.c.status).toBe('available')
    expect(save.missions.d.status).toBe('locked')
  })

  it('keeps the best result when a later success is worse', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success', 10), missions)
    save = recordAttempt(save, { ...attempt('b', 'success', 30), efficiencyStars: 1 }, missions)
    expect(save.missions.b.bestResult?.actions).toBe(10)
    expect(save.missions.b.attempts).toBe(2)
  })

  it('never re-locks a completed mission', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success'), missions)
    save = recordAttempt(save, attempt('b', 'error'), missions)
    expect(save.missions.b.status).toBe('completed')
  })

  it('counts revealed hints up to four and stamps them on attempts', () => {
    let save = createInitialSave(missions, now)
    for (let index = 0; index < 6; index += 1) save = registerHint(save, 'a')
    expect(save.missions.a.hintsUsed).toBe(4)
    save = recordAttempt(save, attempt('a', 'error'), missions)
    expect(save.attempts[0].hintsUsed).toBe(4)
  })

  it('stores programs per mission', () => {
    const save = storeProgram(createInitialSave(missions, now), 'a', '{"blocks":{}}')
    expect(save.missions.a.savedProgram).toBe('{"blocks":{}}')
  })

  it('continues at the first available mission not completed', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('a', 'success'), missions)
    save = recordAttempt(save, attempt('b', 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('c')
  })

  it('continues at the last mission when everything is completed', () => {
    let save = createInitialSave(missions, now)
    for (const mission of missions) save = recordAttempt(save, attempt(mission.id, 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('d')
  })

  it('adds new missions to old saves with the right status', () => {
    const save = recordAttempt(createInitialSave(missions.slice(0, 3), now), attempt('c', 'success'), missions.slice(0, 3))
    const synced = syncMissions(save, missions)
    expect(synced.missions.d.status).toBe('available')
  })

  it('compares results by stars then actions', () => {
    const base = { actions: 10, blocks: 4, usage: { seeds: 0, water: 0, energy: 0 }, efficiencyStars: 2 as const }
    expect(isBetterResult(base, null)).toBe(true)
    expect(isBetterResult({ ...base, efficiencyStars: 3 }, base)).toBe(true)
    expect(isBetterResult({ ...base, actions: 8 }, base)).toBe(true)
    expect(isBetterResult({ ...base, actions: 12 }, base)).toBe(false)
  })
})
```

`src/services/storage/saveStorage.test.ts`:
```ts
import { CORRUPT_KEY, loadSave, SAVE_KEY, writeSave } from '@/services/storage/saveStorage'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'

const missions = [
  { id: 'a', order: 0 },
  { id: 'b', order: 1 },
]
const now = '2026-10-14T12:00:00.000Z'

describe('saveStorage', () => {
  it('creates a fresh save when nothing is stored', () => {
    expect(loadSave(window.localStorage, missions, now)).toEqual(createInitialSave(missions, now))
  })

  it('round-trips a save', () => {
    const save = recordAttempt(
      createInitialSave(missions, now),
      {
        missionId: 'a',
        timestamp: now,
        outcome: 'success',
        errorCode: null,
        actions: 3,
        blocks: 3,
        usage: { seeds: 0, water: 0, energy: 3 },
        efficiencyStars: 3,
        pseudocode: 'x',
      },
      missions,
    )
    writeSave(window.localStorage, save)
    expect(loadSave(window.localStorage, missions, now)).toEqual(save)
  })

  it('keeps the game playable when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    expect(loadSave(blocked, missions, now)).toEqual(createInitialSave(missions, now))
    expect(() => writeSave(blocked, createInitialSave(missions, now))).not.toThrow()
    expect(loadSave(null, missions, now).missions.a.status).toBe('available')
  })

  it('backs up corrupt data and starts clean', () => {
    window.localStorage.setItem(SAVE_KEY, '{"version":99}')
    const save = loadSave(window.localStorage, missions, now)
    expect(save).toEqual(createInitialSave(missions, now))
    expect(window.localStorage.getItem(CORRUPT_KEY)).toBe('{"version":99}')
  })
})
```

`src/stores/progressStore.test.ts`:
```ts
import { useProgressStore } from '@/stores/progressStore'
import { SAVE_KEY } from '@/services/storage/saveStorage'

describe('progressStore', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('records attempts, persists them and returns the record', () => {
    const record = useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: '2026-10-14T12:00:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 8,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 7 },
      efficiencyStars: 3,
      pseudocode: 'quando executar:',
    })
    expect(record.attemptNumber).toBe(1)
    expect(useProgressStore.getState().save.missions['m2-row-planting'].status).toBe('available')
    expect(window.localStorage.getItem(SAVE_KEY)).toContain('m1-first-harvest')
  })

  it('resets everything', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().resetProgress()
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(0)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/game/progress src/services/storage/saveStorage.test.ts src/stores/progressStore.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 4: Implementar `src/game/progress/progression.ts`**

```ts
import {
  MAX_HINTS,
  type AttemptInput,
  type AttemptRecord,
  type AssessmentResponse,
  type BestResult,
  type MissionProgress,
  type MissionRef,
  type SaveData,
} from '@/game/progress/types'

function emptyProgress(status: MissionProgress['status']): MissionProgress {
  return { status, attempts: 0, bestResult: null, hintsUsed: 0, errorCounts: {}, savedProgram: null }
}

function sorted(missions: MissionRef[]): MissionRef[] {
  return [...missions].sort((a, b) => a.order - b.order)
}

function initialStatus(mission: MissionRef, missions: MissionRef[], save: SaveData | null): MissionProgress['status'] {
  if (mission.order <= 1) return 'available'
  const previous = missions.find((candidate) => candidate.order === mission.order - 1)
  return previous && save?.missions[previous.id]?.status === 'completed' ? 'available' : 'locked'
}

export function createInitialSave(missions: MissionRef[], now: string): SaveData {
  const ordered = sorted(missions)
  return {
    version: 1,
    participantCode: null,
    createdAt: now,
    missions: Object.fromEntries(ordered.map((mission) => [mission.id, emptyProgress(initialStatus(mission, ordered, null))])),
    attempts: [],
    assessments: { pre: null, post: null },
  }
}

export function syncMissions(save: SaveData, missions: MissionRef[]): SaveData {
  const ordered = sorted(missions)
  const next = { ...save.missions }
  for (const mission of ordered) {
    if (!next[mission.id]) next[mission.id] = emptyProgress(initialStatus(mission, ordered, { ...save, missions: next }))
  }
  return { ...save, missions: next }
}

export function isBetterResult(candidate: BestResult, current: BestResult | null): boolean {
  if (!current) return true
  if (candidate.efficiencyStars !== current.efficiencyStars) return candidate.efficiencyStars > current.efficiencyStars
  return candidate.actions < current.actions
}

export function recordAttempt(save: SaveData, input: AttemptInput, missions: MissionRef[]): SaveData {
  const progress = save.missions[input.missionId] ?? emptyProgress('available')
  const attemptNumber = progress.attempts + 1
  const record: AttemptRecord = {
    ...input,
    id: `${input.missionId}-${attemptNumber}`,
    attemptNumber,
    hintsUsed: progress.hintsUsed,
  }
  const errorCounts = { ...progress.errorCounts }
  if (input.errorCode) errorCounts[input.errorCode] = (errorCounts[input.errorCode] ?? 0) + 1
  const succeeded = input.outcome === 'success' && input.efficiencyStars !== null
  const candidate: BestResult | null = succeeded
    ? { actions: input.actions, blocks: input.blocks, usage: input.usage, efficiencyStars: input.efficiencyStars as BestResult['efficiencyStars'] }
    : null
  const updated: MissionProgress = {
    ...progress,
    attempts: attemptNumber,
    errorCounts,
    status: succeeded || progress.status === 'completed' ? 'completed' : progress.status,
    bestResult: candidate && isBetterResult(candidate, progress.bestResult) ? candidate : progress.bestResult,
  }
  const missionsState = { ...save.missions, [input.missionId]: updated }
  if (succeeded) {
    const current = missions.find((mission) => mission.id === input.missionId)
    const next = current ? missions.find((mission) => mission.order === current.order + 1) : undefined
    if (next && missionsState[next.id]?.status === 'locked') {
      missionsState[next.id] = { ...missionsState[next.id], status: 'available' }
    }
  }
  return { ...save, missions: missionsState, attempts: [...save.attempts, record] }
}

export function registerHint(save: SaveData, missionId: string): SaveData {
  const progress = save.missions[missionId]
  if (!progress) return save
  return {
    ...save,
    missions: { ...save.missions, [missionId]: { ...progress, hintsUsed: Math.min(MAX_HINTS, progress.hintsUsed + 1) } },
  }
}

export function storeProgram(save: SaveData, missionId: string, json: string): SaveData {
  const progress = save.missions[missionId]
  if (!progress) return save
  return { ...save, missions: { ...save.missions, [missionId]: { ...progress, savedProgram: json } } }
}

export function setParticipantCode(save: SaveData, code: string | null): SaveData {
  const trimmed = code?.trim() ?? ''
  return { ...save, participantCode: trimmed === '' ? null : trimmed.slice(0, 32) }
}

export function storeAssessment(save: SaveData, response: AssessmentResponse): SaveData {
  return { ...save, assessments: { ...save.assessments, [response.form]: response } }
}

export function hasProgress(save: SaveData): boolean {
  return save.attempts.length > 0 || Object.values(save.missions).some((progress) => progress.status === 'completed')
}

export function failedAttempts(save: SaveData, missionId: string): number {
  return save.attempts.filter((attempt) => attempt.missionId === missionId && attempt.outcome !== 'success').length
}

export function continueMissionId(save: SaveData, missions: MissionRef[]): string | null {
  if (!hasProgress(save)) return null
  const ordered = sorted(missions)
  const pending = ordered.find((mission) => save.missions[mission.id]?.status === 'available')
  if (pending) return pending.id
  const completed = ordered.filter((mission) => save.missions[mission.id]?.status === 'completed')
  return completed.at(-1)?.id ?? null
}
```

- [ ] **Step 5: Implementar `src/services/storage/saveDataSchema.ts`**

```ts
import { z } from 'zod'
import { ERROR_CODES } from '@/game/world/types'

const errorCode = z.enum(ERROR_CODES)
const usage = z.object({ seeds: z.number(), water: z.number(), energy: z.number() })
const stars = z.union([z.literal(1), z.literal(2), z.literal(3)])

const attemptRecord = z.object({
  id: z.string(),
  missionId: z.string(),
  attemptNumber: z.number().int().positive(),
  timestamp: z.string(),
  outcome: z.enum(['success', 'objectiveFailed', 'error']),
  errorCode: errorCode.nullable(),
  actions: z.number().int().nonnegative(),
  blocks: z.number().int().nonnegative(),
  usage,
  hintsUsed: z.number().int().min(0).max(4),
  efficiencyStars: stars.nullable(),
  pseudocode: z.string(),
})

const missionProgress = z.object({
  status: z.enum(['locked', 'available', 'completed']),
  attempts: z.number().int().nonnegative(),
  bestResult: z.object({ actions: z.number(), blocks: z.number(), usage, efficiencyStars: stars }).nullable(),
  hintsUsed: z.number().int().min(0).max(4),
  errorCounts: z.partialRecord(errorCode, z.number().int().nonnegative()),
  savedProgram: z.string().nullable(),
})

const assessmentResponse = z.object({
  form: z.enum(['pre', 'post']),
  startedAt: z.string(),
  completedAt: z.string(),
  skipped: z.boolean(),
  answers: z.record(z.string(), z.number().int()),
})

export const saveDataSchema = z.object({
  version: z.literal(1),
  participantCode: z.string().nullable(),
  createdAt: z.string(),
  missions: z.record(z.string(), missionProgress),
  attempts: z.array(attemptRecord),
  assessments: z.object({ pre: assessmentResponse.nullable(), post: assessmentResponse.nullable() }),
})
```

Se a versão do Zod instalada não tiver `z.partialRecord` (Zod 3), use `z.record(errorCode, z.number().int().nonnegative()).optional().default({})` com `.partial()` equivalente: `z.object(Object.fromEntries(ERROR_CODES.map((code) => [code, z.number().int().nonnegative().optional()])))`.

- [ ] **Step 6: Implementar `src/services/storage/saveStorage.ts`**

```ts
import { createInitialSave, syncMissions } from '@/game/progress/progression'
import type { MissionRef, SaveData } from '@/game/progress/types'
import { readJson, writeJson } from '@/services/storage/jsonStorage'
import { saveDataSchema } from '@/services/storage/saveDataSchema'

export const SAVE_KEY = 'agroblocks:v1'
export const CORRUPT_KEY = 'agroblocks:corrupt'

export function loadSave(storage: Storage | null, missions: MissionRef[], now: string): SaveData {
  const { value, corrupt, raw } = readJson(storage, SAVE_KEY, saveDataSchema)
  if (value) return syncMissions(value as SaveData, missions)
  if (corrupt && raw !== null) {
    try {
      storage?.setItem(CORRUPT_KEY, raw)
    } catch {
      return createInitialSave(missions, now)
    }
  }
  return createInitialSave(missions, now)
}

export function writeSave(storage: Storage | null, save: SaveData): void {
  writeJson(storage, SAVE_KEY, save)
}
```

- [ ] **Step 7: Implementar `src/stores/progressStore.ts`**

```ts
import { create } from 'zustand'
import { MISSIONS } from '@/data/missions'
import {
  createInitialSave,
  recordAttempt,
  registerHint,
  setParticipantCode,
  storeAssessment,
  storeProgram,
} from '@/game/progress/progression'
import type { AssessmentResponse, AttemptInput, AttemptRecord, SaveData } from '@/game/progress/types'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSave, writeSave } from '@/services/storage/saveStorage'

const missionRefs = MISSIONS.map(({ id, order }) => ({ id, order }))

interface ProgressState {
  save: SaveData
  recordAttempt: (input: AttemptInput) => AttemptRecord
  registerHint: (missionId: string) => void
  storeProgram: (missionId: string, json: string) => void
  setParticipantCode: (code: string | null) => void
  storeAssessment: (response: AssessmentResponse) => void
  resetProgress: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const commit = (save: SaveData) => {
    writeSave(safeStorage(), save)
    set({ save })
  }
  return {
    save: loadSave(safeStorage(), missionRefs, new Date().toISOString()),
    recordAttempt: (input) => {
      const save = recordAttempt(get().save, input, missionRefs)
      commit(save)
      const record = save.attempts.at(-1)
      if (!record) throw new Error('Attempt was not recorded')
      return record
    },
    registerHint: (missionId) => commit(registerHint(get().save, missionId)),
    storeProgram: (missionId, json) => commit(storeProgram(get().save, missionId, json)),
    setParticipantCode: (code) => commit(setParticipantCode(get().save, code)),
    storeAssessment: (response) => commit(storeAssessment(get().save, response)),
    resetProgress: () => commit(createInitialSave(missionRefs, new Date().toISOString())),
  }
})
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS em toda a suíte.

- [ ] **Step 9: Commit**

```bash
git add src/game/progress src/services/storage src/stores
git commit -m "feat(progress): add unlocking, attempts, hints and validated local persistence"
```
