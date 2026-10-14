# AgroBlocks — Fase 3: Programa (AST), pseudocódigo e interpretador

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Representação interna tipada do programa do aluno, gerador de pseudocódigo PT-BR, interpretador baseado em generators com limite de passos e detector de repetição para dicas.

**Architecture:** AST é o contrato único entre Blockly (Fase 4), controller (Fase 5), missões (Fase 6) e UI. Interpretador faz `yield` de cada passo; quem consome aplica ações no engine e devolve `ActionFeedback`. Nada de `eval`.

**Tech Stack:** TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 5)

Leia `plan_index.md` antes de começar.

---

### Task 3.1: AST, construtor de programas e pseudocódigo

**Files:**
- Create: `src/blocks/interpreter/ast.ts`
- Create: `src/blocks/interpreter/programBuilder.ts`
- Create: `src/blocks/interpreter/stripBlockIds.ts`
- Create: `src/blocks/pseudocode/pseudocode.ts`
- Test: `src/blocks/pseudocode/pseudocode.test.ts`

**Interfaces:**
- Consumes: `ActionType`, `SensorType` (Fase 2).
- Produces:
  - `type CompareOp = 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE'`
  - `type Expr`, `type Stmt`, `interface Program { main: Stmt[]; procedures: Record<string, Stmt[]> }` (formas exatas abaixo)
  - Builder: `act`, `repeat`, `whileDo`, `ifThen`, `setVar`, `changeVar`, `call`, `num`, `bool`, `variable`, `sensor`, `compare`, `and`, `or`, `not`, `arith`, `program`
  - `stripBlockIds<T>(value: T): unknown` (remove `blockId` recursivamente, para comparar ASTs em testes)
  - `ACTION_LABELS: Record<ActionType, string>`, `SENSOR_LABELS: Record<SensorType, string>`
  - `exprToText(expr: Expr): string`, `programToPseudocode(program: Program): string`

- [ ] **Step 1: Criar `src/blocks/interpreter/ast.ts`**

```ts
import type { ActionType, SensorType } from '@/game/world/types'

export type CompareOp = 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE'

export type Expr =
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'var'; name: string }
  | { kind: 'sensor'; sensor: SensorType; blockId: string }
  | { kind: 'compare'; op: CompareOp; left: Expr; right: Expr }
  | { kind: 'logic'; op: 'AND' | 'OR'; left: Expr; right: Expr }
  | { kind: 'not'; value: Expr }
  | { kind: 'arith'; op: 'ADD' | 'MINUS'; left: Expr; right: Expr }

export type Stmt =
  | { kind: 'action'; action: ActionType; blockId: string }
  | { kind: 'repeat'; times: Expr; body: Stmt[]; blockId: string }
  | { kind: 'while'; cond: Expr; body: Stmt[]; blockId: string }
  | { kind: 'if'; cond: Expr; then: Stmt[]; else?: Stmt[]; blockId: string }
  | { kind: 'setVar'; name: string; value: Expr; blockId: string }
  | { kind: 'changeVar'; name: string; delta: Expr; blockId: string }
  | { kind: 'call'; name: string; blockId: string }

export interface Program {
  main: Stmt[]
  procedures: Record<string, Stmt[]>
}
```

- [ ] **Step 2: Criar `src/blocks/interpreter/programBuilder.ts`**

```ts
import type { CompareOp, Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import type { ActionType, SensorType } from '@/game/world/types'

let counter = 0

function nextId(): string {
  counter += 1
  return `ref-${counter}`
}

function toExpr(value: number | Expr): Expr {
  return typeof value === 'number' ? { kind: 'number', value } : value
}

export const act = (action: ActionType): Stmt => ({ kind: 'action', action, blockId: nextId() })

export const repeat = (times: number | Expr, body: Stmt[]): Stmt => ({
  kind: 'repeat',
  times: toExpr(times),
  body,
  blockId: nextId(),
})

export const whileDo = (cond: Expr, body: Stmt[]): Stmt => ({ kind: 'while', cond, body, blockId: nextId() })

export const ifThen = (cond: Expr, then: Stmt[], otherwise?: Stmt[]): Stmt =>
  otherwise
    ? { kind: 'if', cond, then, else: otherwise, blockId: nextId() }
    : { kind: 'if', cond, then, blockId: nextId() }

export const setVar = (name: string, value: number | Expr): Stmt => ({
  kind: 'setVar',
  name,
  value: toExpr(value),
  blockId: nextId(),
})

export const changeVar = (name: string, delta: number | Expr): Stmt => ({
  kind: 'changeVar',
  name,
  delta: toExpr(delta),
  blockId: nextId(),
})

export const call = (name: string): Stmt => ({ kind: 'call', name, blockId: nextId() })

export const num = (value: number): Expr => ({ kind: 'number', value })

export const bool = (value: boolean): Expr => ({ kind: 'boolean', value })

export const variable = (name: string): Expr => ({ kind: 'var', name })

export const sensor = (type: SensorType): Expr => ({ kind: 'sensor', sensor: type, blockId: nextId() })

export const compare = (op: CompareOp, left: number | Expr, right: number | Expr): Expr => ({
  kind: 'compare',
  op,
  left: toExpr(left),
  right: toExpr(right),
})

export const and = (left: Expr, right: Expr): Expr => ({ kind: 'logic', op: 'AND', left, right })

export const or = (left: Expr, right: Expr): Expr => ({ kind: 'logic', op: 'OR', left, right })

export const not = (value: Expr): Expr => ({ kind: 'not', value })

export const arith = (op: 'ADD' | 'MINUS', left: number | Expr, right: number | Expr): Expr => ({
  kind: 'arith',
  op,
  left: toExpr(left),
  right: toExpr(right),
})

export const program = (main: Stmt[], procedures: Record<string, Stmt[]> = {}): Program => ({ main, procedures })
```

- [ ] **Step 3: Criar `src/blocks/interpreter/stripBlockIds.ts`**

```ts
export function stripBlockIds<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value, (key, inner: unknown) => (key === 'blockId' ? undefined : inner)))
}
```

- [ ] **Step 4: Escrever teste que falha `src/blocks/pseudocode/pseudocode.test.ts`**

```ts
import {
  act,
  changeVar,
  call,
  compare,
  ifThen,
  not,
  and,
  program,
  repeat,
  sensor,
  setVar,
  variable,
  whileDo,
  arith,
} from '@/blocks/interpreter/programBuilder'
import { exprToText, programToPseudocode } from '@/blocks/pseudocode/pseudocode'

describe('pseudocode', () => {
  it('renders nested statements with four-space indentation', () => {
    const text = programToPseudocode(
      program([
        repeat(3, [ifThen(sensor('isSoilDry'), [act('water')], [act('harvest')]), act('moveForward')]),
      ]),
    )
    expect(text).toBe(
      [
        'quando executar:',
        '    repita 3 vezes:',
        '        se o solo está seco?:',
        '            regar canteiro',
        '        senão:',
        '            colher planta',
        '        mover para frente',
      ].join('\n'),
    )
  })

  it('renders procedures before the main program', () => {
    const text = programToPseudocode(program([call('cuidar')], { cuidar: [act('prepareSoil'), act('plant')] }))
    expect(text).toBe(
      [
        'procedimento cuidar:',
        '    preparar solo',
        '    plantar semente',
        '',
        'quando executar:',
        '    executar cuidar',
      ].join('\n'),
    )
  })

  it('renders variables, while loops and empty bodies', () => {
    const text = programToPseudocode(
      program([setVar('agua', 3), changeVar('agua', -1), changeVar('agua', 2), whileDo(not(sensor('isObstacleAhead')), [])]),
    )
    expect(text).toBe(
      [
        'quando executar:',
        '    agua ← 3',
        '    agua ← agua - 1',
        '    agua ← agua + 2',
        '    enquanto não (existe obstáculo à frente?):',
        '        (nada)',
      ].join('\n'),
    )
  })

  it('renders an empty program', () => {
    expect(programToPseudocode(program([]))).toBe(['quando executar:', '    (nada)'].join('\n'))
  })

  it('parenthesizes nested binary expressions', () => {
    const expr = and(compare('GTE', variable('x'), arith('ADD', 1, 2)), sensor('hasSeeds'))
    expect(exprToText(expr)).toBe('(x ≥ (1 + 2)) e há sementes disponíveis?')
  })
})
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npx vitest run src/blocks/pseudocode`
Expected: FAIL — `@/blocks/pseudocode/pseudocode` não encontrado.

- [ ] **Step 6: Implementar `src/blocks/pseudocode/pseudocode.ts`**

```ts
import type { CompareOp, Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import type { ActionType, SensorType } from '@/game/world/types'

export const ACTION_LABELS: Record<ActionType, string> = {
  moveForward: 'mover para frente',
  turnLeft: 'virar à esquerda',
  turnRight: 'virar à direita',
  prepareSoil: 'preparar solo',
  plant: 'plantar semente',
  water: 'regar canteiro',
  harvest: 'colher planta',
  collectResources: 'coletar recursos',
}

export const SENSOR_LABELS: Record<SensorType, string> = {
  isPlotEmpty: 'o canteiro está vazio?',
  isSoilDry: 'o solo está seco?',
  isPlantMature: 'a planta está madura?',
  isObstacleAhead: 'existe obstáculo à frente?',
  hasSeeds: 'há sementes disponíveis?',
}

const COMPARE_SYMBOLS: Record<CompareOp, string> = {
  EQ: '=',
  NEQ: '≠',
  LT: '<',
  LTE: '≤',
  GT: '>',
  GTE: '≥',
}

const INDENT = '    '

function wrap(expr: Expr): string {
  const text = exprToText(expr)
  return expr.kind === 'compare' || expr.kind === 'logic' || expr.kind === 'arith' ? `(${text})` : text
}

export function exprToText(expr: Expr): string {
  switch (expr.kind) {
    case 'number':
      return String(expr.value)
    case 'boolean':
      return expr.value ? 'verdadeiro' : 'falso'
    case 'var':
      return expr.name
    case 'sensor':
      return SENSOR_LABELS[expr.sensor]
    case 'compare':
      return `${wrap(expr.left)} ${COMPARE_SYMBOLS[expr.op]} ${wrap(expr.right)}`
    case 'logic':
      return `${wrap(expr.left)} ${expr.op === 'AND' ? 'e' : 'ou'} ${wrap(expr.right)}`
    case 'not':
      return `não (${exprToText(expr.value)})`
    case 'arith':
      return `${wrap(expr.left)} ${expr.op === 'ADD' ? '+' : '-'} ${wrap(expr.right)}`
  }
}

function changeText(name: string, delta: Expr): string {
  if (delta.kind === 'number' && delta.value < 0) return `${name} ← ${name} - ${Math.abs(delta.value)}`
  return `${name} ← ${name} + ${wrap(delta)}`
}

function bodyLines(stmts: Stmt[], depth: number): string[] {
  if (stmts.length === 0) return [`${INDENT.repeat(depth)}(nada)`]
  return stmts.flatMap((stmt) => stmtLines(stmt, depth))
}

function stmtLines(stmt: Stmt, depth: number): string[] {
  const pad = INDENT.repeat(depth)
  switch (stmt.kind) {
    case 'action':
      return [pad + ACTION_LABELS[stmt.action]]
    case 'repeat':
      return [`${pad}repita ${exprToText(stmt.times)} vezes:`, ...bodyLines(stmt.body, depth + 1)]
    case 'while':
      return [`${pad}enquanto ${exprToText(stmt.cond)}:`, ...bodyLines(stmt.body, depth + 1)]
    case 'if': {
      const lines = [`${pad}se ${exprToText(stmt.cond)}:`, ...bodyLines(stmt.then, depth + 1)]
      return stmt.else ? [...lines, `${pad}senão:`, ...bodyLines(stmt.else, depth + 1)] : lines
    }
    case 'setVar':
      return [`${pad}${stmt.name} ← ${exprToText(stmt.value)}`]
    case 'changeVar':
      return [pad + changeText(stmt.name, stmt.delta)]
    case 'call':
      return [`${pad}executar ${stmt.name}`]
  }
}

export function programToPseudocode(program: Program): string {
  const procedureLines = Object.entries(program.procedures).flatMap(([name, body]) => [
    `procedimento ${name}:`,
    ...bodyLines(body, 1),
    '',
  ])
  return [...procedureLines, 'quando executar:', ...bodyLines(program.main, 1)].join('\n')
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/blocks/pseudocode`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/blocks
git commit -m "feat(program): add AST, program builder and Portuguese pseudocode"
```

---

### Task 3.2: Interpretador com generators e executor síncrono

**Files:**
- Create: `src/blocks/interpreter/interpreter.ts`
- Create: `src/blocks/interpreter/runProgram.ts`
- Test: `src/blocks/interpreter/interpreter.test.ts`

**Interfaces:**
- Consumes: `Program`, `Stmt`, `Expr` (Task 3.1); `applyAction`, `evaluateSensor`, `createGameError`, `GameState`, `GameEvent`, `WorldRules`, `GameError` (Fase 2); `exprToText`.
- Produces:
  - `DEFAULT_STEP_LIMIT = 2000`, `MAX_REPEAT = 1000`, `MAX_CALL_DEPTH = 32`
  - `interface InterpreterContext { read: () => GameState; stepLimit: number }`
  - `type ExecStep = { type: 'action'; action: ActionType; blockId: string } | { type: 'check'; blockId: string; label: string; result: boolean } | { type: 'loop'; blockId: string; iteration: number; total: number } | { type: 'variable'; blockId: string; name: string; value: number } | { type: 'call'; blockId: string; name: string }`
  - `type ActionFeedback = { ok: true } | { ok: false; error: GameError }`
  - `type ExecOutcome = { status: 'completed'; steps: number } | { status: 'failed'; error: GameError; blockId: string | null; steps: number }`
  - `clampRepeatCount(value: number): number`
  - `interpret(program: Program, ctx: InterpreterContext): Generator<ExecStep, ExecOutcome, ActionFeedback | undefined>`
  - `interface RunResult { state: GameState; outcome: ExecOutcome; steps: ExecStep[]; events: GameEvent[] }`
  - `runProgram(program: Program, initialState: GameState, rules: WorldRules, stepLimit?: number): RunResult`

Protocolo do generator: o consumidor chama `next()` (sem argumento) para obter o primeiro passo. Depois de um passo `action`, o consumidor aplica a ação e chama `next(feedback)`. Para outros passos chama `next()`. Feedback `{ ok: false }` encerra com `status: 'failed'` e `blockId` do bloco de ação.

Contagem de passos: +1 a cada instrução iniciada, +1 a cada iteração adicional de `repeat`/`while` (a primeira já conta na instrução). Excedeu `stepLimit` → `STEP_LIMIT`.

- [ ] **Step 1: Escrever teste que falha `src/blocks/interpreter/interpreter.test.ts`**

```ts
import { interpret, clampRepeatCount } from '@/blocks/interpreter/interpreter'
import { runProgram } from '@/blocks/interpreter/runProgram'
import {
  act,
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
import { makeState } from '@/game/testing/makeState'

const rules = { growTicks: 5, forbidWaterWet: false }
const row = ['. . . . . .']

describe('interpreter', () => {
  it('executes a sequence in order', () => {
    const result = runProgram(program([act('moveForward'), act('moveForward'), act('turnRight')]), makeState(row), rules)
    expect(result.outcome.status).toBe('completed')
    expect(result.state.robot).toEqual({ x: 2, y: 0, facing: 'S' })
  })

  it('repeats a body N times and yields loop steps', () => {
    const result = runProgram(program([repeat(3, [act('moveForward')])]), makeState(row), rules)
    expect(result.state.robot.x).toBe(3)
    expect(result.steps.filter((step) => step.type === 'loop')).toHaveLength(3)
  })

  it('evaluates the repeat count from a variable once', () => {
    const result = runProgram(
      program([setVar('n', 2), repeat(variable('n'), [act('moveForward'), changeVar('n', 5)])]),
      makeState(row),
      rules,
    )
    expect(result.state.robot.x).toBe(2)
  })

  it('clamps repeat counts', () => {
    expect(clampRepeatCount(-3)).toBe(0)
    expect(clampRepeatCount(2.6)).toBe(3)
    expect(clampRepeatCount(5000)).toBe(1000)
    expect(clampRepeatCount(Number.NaN)).toBe(0)
  })

  it('runs a while loop reading sensors from the live state', () => {
    const result = runProgram(program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward')])]), makeState(row), rules)
    expect(result.outcome.status).toBe('completed')
    expect(result.state.robot.x).toBe(5)
  })

  it('takes the then branch and the else branch', () => {
    const watered = runProgram(program([ifThen(sensor('isSoilDry'), [act('water')], [act('turnLeft')])]), makeState(['t']), rules)
    const turned = runProgram(program([ifThen(sensor('isSoilDry'), [act('water')], [act('turnLeft')])]), makeState(['tw']), rules)
    expect(watered.state.cells[0][0].moisture).toBe('wet')
    expect(turned.state.robot.facing).toBe('N')
  })

  it('yields check steps with a readable label and result', () => {
    const result = runProgram(program([ifThen(sensor('isSoilDry'), [])]), makeState(['t']), rules)
    expect(result.steps[0]).toMatchObject({ type: 'check', label: 'o solo está seco?', result: true })
  })

  it('compares variables', () => {
    const result = runProgram(
      program([setVar('i', 0), whileDo(compare('LT', variable('i'), 4), [act('moveForward'), changeVar('i', 1)])]),
      makeState(row),
      rules,
    )
    expect(result.state.robot.x).toBe(4)
    expect(result.steps.filter((step) => step.type === 'variable').at(-1)).toMatchObject({ name: 'i', value: 4 })
  })

  it('treats undefined variables as zero', () => {
    const result = runProgram(program([repeat(variable('nada'), [act('moveForward')])]), makeState(row), rules)
    expect(result.state.robot.x).toBe(0)
  })

  it('calls procedures', () => {
    const result = runProgram(program([call('andar2'), call('andar2')], { andar2: [act('moveForward'), act('moveForward')] }), makeState(row), rules)
    expect(result.state.robot.x).toBe(4)
    expect(result.steps.filter((step) => step.type === 'call')).toHaveLength(2)
  })

  it('stops at the failing action and reports its block id', () => {
    const failing = act('moveForward')
    const result = runProgram(program([act('turnLeft'), failing, act('turnLeft')]), makeState(row), rules)
    expect(result.outcome).toMatchObject({ status: 'failed', blockId: failing.blockId })
    if (result.outcome.status === 'failed') expect(result.outcome.error.code).toBe('OUT_OF_BOUNDS')
    expect(result.state.robot.facing).toBe('N')
  })

  it('interrupts an infinite loop without actions', () => {
    const result = runProgram(program([whileDo(bool(true), [])]), makeState(row), rules, 50)
    expect(result.outcome.status).toBe('failed')
    if (result.outcome.status === 'failed') expect(result.outcome.error.code).toBe('STEP_LIMIT')
  })

  it('interrupts an infinite loop with actions', () => {
    const result = runProgram(program([whileDo(bool(true), [act('turnLeft')])]), makeState(row), rules, 100)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('STEP_LIMIT')
    expect(result.state.actionCount).toBeLessThan(100)
  })

  it('interrupts nested huge repeats', () => {
    const result = runProgram(program([repeat(1000, [repeat(1000, [act('turnLeft')])])]), makeState(row), rules, 2000)
    expect(result.outcome.status).toBe('failed')
  })

  it('fails with INVALID_PROGRAM when calling a missing procedure', () => {
    const result = runProgram(program([call('fantasma')]), makeState(row), rules)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('INVALID_PROGRAM')
  })

  it('stops unbounded recursion', () => {
    const result = runProgram(program([call('loop')], { loop: [call('loop')] }), makeState(row), rules)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('STEP_LIMIT')
  })

  it('pauses between steps until the consumer resumes it', () => {
    const generator = interpret(program([act('moveForward'), act('turnLeft')]), { read: () => makeState(row), stepLimit: 10 })
    const first = generator.next()
    expect(first.value).toMatchObject({ type: 'action', action: 'moveForward' })
    const second = generator.next({ ok: true })
    expect(second.value).toMatchObject({ type: 'action', action: 'turnLeft' })
    const done = generator.next({ ok: true })
    expect(done).toEqual({ done: true, value: { status: 'completed', steps: 2 } })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/blocks/interpreter`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/blocks/interpreter/interpreter.ts`**

```ts
import type { CompareOp, Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { exprToText } from '@/blocks/pseudocode/pseudocode'
import { createGameError } from '@/game/rules/errors'
import { evaluateSensor } from '@/game/sensors/evaluateSensor'
import type { ActionType, GameError, GameState } from '@/game/world/types'

export const DEFAULT_STEP_LIMIT = 2000
export const MAX_REPEAT = 1000
export const MAX_CALL_DEPTH = 32

export interface InterpreterContext {
  read: () => GameState
  stepLimit: number
}

export type ExecStep =
  | { type: 'action'; action: ActionType; blockId: string }
  | { type: 'check'; blockId: string; label: string; result: boolean }
  | { type: 'loop'; blockId: string; iteration: number; total: number }
  | { type: 'variable'; blockId: string; name: string; value: number }
  | { type: 'call'; blockId: string; name: string }

export type ActionFeedback = { ok: true } | { ok: false; error: GameError }

export type ExecOutcome =
  | { status: 'completed'; steps: number }
  | { status: 'failed'; error: GameError; blockId: string | null; steps: number }

type StepGenerator = Generator<ExecStep, void, ActionFeedback | undefined>

class Halt {
  constructor(
    readonly error: GameError,
    readonly blockId: string | null,
  ) {}
}

function compareNumbers(op: CompareOp, left: number, right: number): boolean {
  switch (op) {
    case 'EQ':
      return left === right
    case 'NEQ':
      return left !== right
    case 'LT':
      return left < right
    case 'LTE':
      return left <= right
    case 'GT':
      return left > right
    case 'GTE':
      return left >= right
  }
}

export function clampRepeatCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(MAX_REPEAT, Math.max(0, Math.round(value)))
}

class Runtime {
  steps = 0
  private readonly variables = new Map<string, number>()

  constructor(
    private readonly program: Program,
    private readonly ctx: InterpreterContext,
  ) {}

  *block(stmts: Stmt[], depth: number): StepGenerator {
    for (const stmt of stmts) yield* this.statement(stmt, depth)
  }

  private count(blockId: string): void {
    this.steps += 1
    if (this.steps > this.ctx.stepLimit) throw new Halt(createGameError('STEP_LIMIT'), blockId)
  }

  private *statement(stmt: Stmt, depth: number): StepGenerator {
    this.count(stmt.blockId)
    switch (stmt.kind) {
      case 'action': {
        const feedback = yield { type: 'action', action: stmt.action, blockId: stmt.blockId }
        if (feedback && !feedback.ok) throw new Halt(feedback.error, stmt.blockId)
        return
      }
      case 'repeat': {
        const total = clampRepeatCount(this.number(stmt.times))
        for (let iteration = 1; iteration <= total; iteration += 1) {
          if (iteration > 1) this.count(stmt.blockId)
          yield { type: 'loop', blockId: stmt.blockId, iteration, total }
          yield* this.block(stmt.body, depth)
        }
        return
      }
      case 'while':
        yield* this.whileLoop(stmt.cond, stmt.body, stmt.blockId, depth)
        return
      case 'if': {
        const result = this.boolean(stmt.cond)
        yield { type: 'check', blockId: stmt.blockId, label: exprToText(stmt.cond), result }
        yield* this.block(result ? stmt.then : (stmt.else ?? []), depth)
        return
      }
      case 'setVar': {
        const value = this.number(stmt.value)
        this.variables.set(stmt.name, value)
        yield { type: 'variable', blockId: stmt.blockId, name: stmt.name, value }
        return
      }
      case 'changeVar': {
        const value = (this.variables.get(stmt.name) ?? 0) + this.number(stmt.delta)
        this.variables.set(stmt.name, value)
        yield { type: 'variable', blockId: stmt.blockId, name: stmt.name, value }
        return
      }
      case 'call': {
        const body = this.program.procedures[stmt.name]
        if (!body) throw new Halt(createGameError('INVALID_PROGRAM'), stmt.blockId)
        if (depth >= MAX_CALL_DEPTH) throw new Halt(createGameError('STEP_LIMIT'), stmt.blockId)
        yield { type: 'call', blockId: stmt.blockId, name: stmt.name }
        yield* this.block(body, depth + 1)
        return
      }
    }
  }

  private *whileLoop(cond: Expr, body: Stmt[], blockId: string, depth: number): StepGenerator {
    let result = this.boolean(cond)
    yield { type: 'check', blockId, label: exprToText(cond), result }
    while (result) {
      yield* this.block(body, depth)
      this.count(blockId)
      result = this.boolean(cond)
      yield { type: 'check', blockId, label: exprToText(cond), result }
    }
  }

  private evaluate(expr: Expr): number | boolean {
    switch (expr.kind) {
      case 'number':
      case 'boolean':
        return expr.value
      case 'var':
        return this.variables.get(expr.name) ?? 0
      case 'sensor':
        return evaluateSensor(this.ctx.read(), expr.sensor)
      case 'compare':
        return compareNumbers(expr.op, this.number(expr.left), this.number(expr.right))
      case 'logic':
        return expr.op === 'AND'
          ? this.boolean(expr.left) && this.boolean(expr.right)
          : this.boolean(expr.left) || this.boolean(expr.right)
      case 'not':
        return !this.boolean(expr.value)
      case 'arith':
        return expr.op === 'ADD'
          ? this.number(expr.left) + this.number(expr.right)
          : this.number(expr.left) - this.number(expr.right)
    }
  }

  private number(expr: Expr): number {
    const value = this.evaluate(expr)
    return typeof value === 'boolean' ? (value ? 1 : 0) : value
  }

  private boolean(expr: Expr): boolean {
    const value = this.evaluate(expr)
    return typeof value === 'number' ? value !== 0 : value
  }
}

export function* interpret(
  program: Program,
  ctx: InterpreterContext,
): Generator<ExecStep, ExecOutcome, ActionFeedback | undefined> {
  const runtime = new Runtime(program, ctx)
  try {
    yield* runtime.block(program.main, 0)
    return { status: 'completed', steps: runtime.steps }
  } catch (caught) {
    if (caught instanceof Halt) {
      return { status: 'failed', error: caught.error, blockId: caught.blockId, steps: runtime.steps }
    }
    throw caught
  }
}
```

- [ ] **Step 4: Implementar `src/blocks/interpreter/runProgram.ts`**

```ts
import { DEFAULT_STEP_LIMIT, interpret, type ActionFeedback, type ExecOutcome, type ExecStep } from '@/blocks/interpreter/interpreter'
import type { Program } from '@/blocks/interpreter/ast'
import { applyAction } from '@/game/rules/applyAction'
import type { GameEvent, GameState, WorldRules } from '@/game/world/types'

export interface RunResult {
  state: GameState
  outcome: ExecOutcome
  steps: ExecStep[]
  events: GameEvent[]
}

export function runProgram(
  program: Program,
  initialState: GameState,
  rules: WorldRules,
  stepLimit: number = DEFAULT_STEP_LIMIT,
): RunResult {
  let state = initialState
  const steps: ExecStep[] = []
  const events: GameEvent[] = []
  const generator = interpret(program, { read: () => state, stepLimit })
  let feedback: ActionFeedback | undefined
  for (;;) {
    const next = generator.next(feedback)
    feedback = undefined
    if (next.done) return { state, outcome: next.value, steps, events }
    steps.push(next.value)
    if (next.value.type === 'action') {
      const result = applyAction(state, next.value.action, rules)
      events.push(...result.events)
      if (result.error) {
        feedback = { ok: false, error: result.error }
      } else {
        state = result.state
        feedback = { ok: true }
      }
    }
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/blocks/interpreter && npm run typecheck`
Expected: PASS, typecheck limpo.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/interpreter
git commit -m "feat(program): add generator-based interpreter with step limit"
```

---

### Task 3.3: Detector de repetição para dicas contextuais

**Files:**
- Create: `src/blocks/analysis/detectRepetition.ts`
- Test: `src/blocks/analysis/detectRepetition.test.ts`

**Interfaces:**
- Consumes: `Program`, `Stmt`.
- Produces:
  - `findRepeatedSequence(stmts: Stmt[]): { length: number; times: number; startIndex: number } | null` — sequência de ≥ 2 instruções repetida ≥ 3 vezes consecutivas (ignora `blockId`).
  - `detectRepetition(program: Program): boolean` — busca no programa principal, corpos aninhados e procedimentos.
  - `REPETITION_TIP: string`

- [ ] **Step 1: Escrever teste que falha**

```ts
import { detectRepetition, findRepeatedSequence } from '@/blocks/analysis/detectRepetition'
import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'

const triple = () => [act('moveForward'), act('prepareSoil'), act('plant')]

describe('detectRepetition', () => {
  it('finds a sequence of two or more commands repeated three times', () => {
    const stmts = [act('turnLeft'), ...triple(), ...triple(), ...triple()]
    expect(findRepeatedSequence(stmts)).toEqual({ length: 3, times: 3, startIndex: 1 })
  })

  it('ignores sequences repeated only twice', () => {
    expect(findRepeatedSequence([...triple(), ...triple()])).toBeNull()
  })

  it('ignores a single command repeated', () => {
    expect(findRepeatedSequence([act('moveForward'), act('moveForward'), act('moveForward')])).toBeNull()
  })

  it('searches inside nested bodies and procedures', () => {
    expect(detectRepetition(program([ifThen(sensor('isSoilDry'), [...triple(), ...triple(), ...triple()])]))).toBe(true)
    expect(detectRepetition(program([], { p: [...triple(), ...triple(), ...triple()] }))).toBe(true)
  })

  it('does not flag programs that already use loops', () => {
    expect(detectRepetition(program([repeat(3, triple())]))).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/blocks/analysis`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/blocks/analysis/detectRepetition.ts`**

```ts
import type { Program, Stmt } from '@/blocks/interpreter/ast'

export const REPETITION_TIP =
  'Você repetiu a mesma sequência de comandos várias vezes. Experimente agrupá-la em um bloco "repita".'

function signature(stmt: Stmt): string {
  return JSON.stringify(stmt, (key, value: unknown) => (key === 'blockId' ? undefined : value))
}

function sameSlice(signatures: string[], a: number, b: number, length: number): boolean {
  for (let offset = 0; offset < length; offset += 1) {
    if (signatures[a + offset] !== signatures[b + offset]) return false
  }
  return true
}

export function findRepeatedSequence(stmts: Stmt[]): { length: number; times: number; startIndex: number } | null {
  const signatures = stmts.map(signature)
  const total = signatures.length
  for (let length = 2; length * 3 <= total; length += 1) {
    for (let start = 0; start + length * 3 <= total; start += 1) {
      let times = 1
      while (start + (times + 1) * length <= total && sameSlice(signatures, start, start + times * length, length)) {
        times += 1
      }
      if (times >= 3) return { length, times, startIndex: start }
    }
  }
  return null
}

function nestedBodies(stmt: Stmt): Stmt[][] {
  switch (stmt.kind) {
    case 'repeat':
    case 'while':
      return [stmt.body]
    case 'if':
      return stmt.else ? [stmt.then, stmt.else] : [stmt.then]
    default:
      return []
  }
}

function hasRepetition(stmts: Stmt[]): boolean {
  if (findRepeatedSequence(stmts)) return true
  return stmts.some((stmt) => nestedBodies(stmt).some(hasRepetition))
}

export function detectRepetition(program: Program): boolean {
  return hasRepetition(program.main) || Object.values(program.procedures).some(hasRepetition)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/blocks/analysis`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/analysis
git commit -m "feat(program): detect repeated command sequences for contextual hints"
```
