# AgroBlocks — Fase 5: Controller de execução e configurações

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Máquina de estados que executa o programa no ritmo da interface (executar, pausar, continuar, passo a passo, parar, reiniciar, velocidade) sem execuções duplicadas, exposta ao React como external store; store de configurações persistida.

**Architecture:** `ExecutionController` é uma classe sem React que consome o generator do interpretador, aplica ações no engine e publica `ExecutionSnapshot` imutáveis. O tempo é injetado via `Scheduler` (testes usam `ManualScheduler`). Cada execução tem `runId`; callbacks antigos são descartados. O React assina via `useSyncExternalStore` (dispensa store Zustand de sessão — o controller já é a fonte única do estado da partida).

**Tech Stack:** TypeScript, React 19, Zustand, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seções 3 e 5)

Leia `plan_index.md` antes de começar.

---

### Task 5.1: `ExecutionController`

**Files:**
- Create: `src/game/execution/types.ts`
- Create: `src/game/execution/scheduler.ts`
- Create: `src/game/execution/manualScheduler.ts`
- Create: `src/game/execution/describeStep.ts`
- Create: `src/game/execution/controller.ts`
- Test: `src/game/execution/controller.test.ts`

**Interfaces:**
- Consumes: `interpret`, `ExecStep`, `ExecOutcome`, `ActionFeedback`, `DEFAULT_STEP_LIMIT` (Fase 3); `applyAction`, `validateMission`, `MissionGoals`, `MissionValidation`, `GameState`, `GameEvent`, `GameError`, `WorldRules` (Fase 2); `ACTION_LABELS`; `Program`.
- Produces:
  - `type ExecutionStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed'`
  - `type Speed = 0.5 | 1 | 2 | 4`, `SPEEDS: Speed[]`, `BASE_STEP_DELAY_MS = 500`, `stepDelayMs(speed: Speed): number`
  - `type ConsoleKind = 'info' | 'action' | 'check' | 'error' | 'success' | 'warning'`
  - `interface ConsoleEntry { id: number; kind: ConsoleKind; text: string }`
  - `interface ExecutionSnapshot { status; state: GameState; currentBlockId: string | null; lastStep: ExecStep | null; lastEvents: GameEvent[]; log: ConsoleEntry[]; stepCount: number; error: GameError | null; errorBlockId: string | null; validation: MissionValidation | null; runId: number; speed: Speed }`
  - `interface ControllerMission { initialState: GameState; rules: WorldRules; goals: MissionGoals; stepLimit: number }`
  - `interface Scheduler { schedule(callback: () => void, delayMs: number): () => void }`, `browserScheduler: Scheduler`
  - `class ManualScheduler implements Scheduler { pending: number; runNext(): boolean; runAll(limit?: number): void }`
  - `describeStep(step: ExecStep): { kind: ConsoleKind; text: string }`
  - `class ExecutionController` com `subscribe(listener): () => void`, `getSnapshot(): ExecutionSnapshot`, `run(program)`, `step(program)`, `pause()`, `resume()`, `stop()`, `reset()`, `setSpeed(speed)`, `addLog(kind, text)`, `dispose()`

Regras:
- `run` em `idle` inicia e já executa o primeiro passo; em `paused` equivale a `resume`; em `finished`/`failed` restaura o estado inicial e recomeça; em `running` não faz nada.
- `step` em `idle`/`finished`/`failed` inicia nova execução pausada e avança 1 passo; em `paused` avança 1 passo; em `running` não faz nada.
- `stop` restaura o estado inicial mantendo o console; `reset` restaura e limpa o console.
- Programa terminou: `finished` + `validation`. Erro de ação ou limite: `failed` + `error` + `errorBlockId`.
- Console guarda no máximo 200 entradas.

- [ ] **Step 1: Criar tipos e scheduler**

`src/game/execution/types.ts`:
```ts
import type { ExecStep } from '@/blocks/interpreter/interpreter'
import type { MissionGoals, MissionValidation } from '@/game/missions/goals'
import type { GameError, GameEvent, GameState, WorldRules } from '@/game/world/types'

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed'

export type Speed = 0.5 | 1 | 2 | 4

export const SPEEDS: Speed[] = [0.5, 1, 2, 4]

export const BASE_STEP_DELAY_MS = 500

export function stepDelayMs(speed: Speed): number {
  return BASE_STEP_DELAY_MS / speed
}

export type ConsoleKind = 'info' | 'action' | 'check' | 'error' | 'success' | 'warning'

export interface ConsoleEntry {
  id: number
  kind: ConsoleKind
  text: string
}

export interface ExecutionSnapshot {
  status: ExecutionStatus
  state: GameState
  currentBlockId: string | null
  lastStep: ExecStep | null
  lastEvents: GameEvent[]
  log: ConsoleEntry[]
  stepCount: number
  error: GameError | null
  errorBlockId: string | null
  validation: MissionValidation | null
  runId: number
  speed: Speed
}

export interface ControllerMission {
  initialState: GameState
  rules: WorldRules
  goals: MissionGoals
  stepLimit: number
}
```

`src/game/execution/scheduler.ts`:
```ts
export interface Scheduler {
  schedule(callback: () => void, delayMs: number): () => void
}

export const browserScheduler: Scheduler = {
  schedule(callback, delayMs) {
    const handle = window.setTimeout(callback, delayMs)
    return () => window.clearTimeout(handle)
  },
}
```

`src/game/execution/manualScheduler.ts`:
```ts
import type { Scheduler } from '@/game/execution/scheduler'

interface Task {
  callback: () => void
  cancelled: boolean
}

export class ManualScheduler implements Scheduler {
  private tasks: Task[] = []

  schedule(callback: () => void): () => void {
    const task: Task = { callback, cancelled: false }
    this.tasks.push(task)
    return () => {
      task.cancelled = true
    }
  }

  get pending(): number {
    return this.tasks.filter((task) => !task.cancelled).length
  }

  runNext(): boolean {
    while (this.tasks.length > 0) {
      const task = this.tasks.shift()
      if (task && !task.cancelled) {
        task.callback()
        return true
      }
    }
    return false
  }

  runAll(limit = 10000): void {
    for (let count = 0; count < limit && this.runNext(); count += 1) {
      continue
    }
  }
}
```

`src/game/execution/describeStep.ts`:
```ts
import type { ExecStep } from '@/blocks/interpreter/interpreter'
import { ACTION_LABELS } from '@/blocks/pseudocode/pseudocode'
import type { ConsoleKind } from '@/game/execution/types'

export function describeStep(step: ExecStep): { kind: ConsoleKind; text: string } {
  switch (step.type) {
    case 'action':
      return { kind: 'action', text: `Robô: ${ACTION_LABELS[step.action]}.` }
    case 'check':
      return { kind: 'check', text: `${step.label} → ${step.result ? 'sim' : 'não'}` }
    case 'loop':
      return { kind: 'info', text: `Repetição ${step.iteration} de ${step.total}` }
    case 'variable':
      return { kind: 'info', text: `${step.name} = ${step.value}` }
    case 'call':
      return { kind: 'info', text: `Executando o procedimento ${step.name}` }
  }
}
```

- [ ] **Step 2: Escrever teste que falha `src/game/execution/controller.test.ts`**

```ts
import { ExecutionController } from '@/game/execution/controller'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import type { ControllerMission } from '@/game/execution/types'
import { act, program, whileDo, bool } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

function setup(stepLimit = 2000) {
  const mission: ControllerMission = {
    initialState: makeState(['. . m .']),
    rules: { growTicks: 3, forbidWaterWet: false },
    goals: { objectives: [{ kind: 'harvestAtLeast', count: 1 }] },
    stepLimit,
  }
  const scheduler = new ManualScheduler()
  const controller = new ExecutionController(mission, scheduler)
  return { mission, scheduler, controller }
}

const solution = program([act('moveForward'), act('moveForward'), act('harvest')])

describe('ExecutionController', () => {
  it('starts idle with the initial state', () => {
    const { controller, mission } = setup()
    expect(controller.getSnapshot().status).toBe('idle')
    expect(controller.getSnapshot().state).toBe(mission.initialState)
  })

  it('runs the first step immediately and the rest on the scheduler', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    expect(controller.getSnapshot()).toMatchObject({ status: 'running', stepCount: 1 })
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('finished')
    expect(snapshot.validation?.success).toBe(true)
    expect(snapshot.state.resources.harvested).toBe(1)
    expect(snapshot.log.at(-1)).toMatchObject({ kind: 'success' })
  })

  it('never schedules two timers for the same run', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.run(solution)
    expect(scheduler.pending).toBe(1)
  })

  it('pauses and resumes without losing progress', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.pause()
    expect(controller.getSnapshot().status).toBe('paused')
    expect(scheduler.pending).toBe(0)
    scheduler.runAll()
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    controller.resume()
    scheduler.runAll()
    expect(controller.getSnapshot().status).toBe('finished')
  })

  it('treats run while paused as resume', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.pause()
    controller.run(solution)
    expect(controller.getSnapshot().status).toBe('running')
    scheduler.runAll()
    expect(controller.getSnapshot().state.robot.x).toBe(2)
  })

  it('steps one instruction at a time from idle', () => {
    const { controller, scheduler } = setup()
    controller.step(solution)
    expect(controller.getSnapshot()).toMatchObject({ status: 'paused', stepCount: 1 })
    expect(scheduler.pending).toBe(0)
    controller.step(solution)
    expect(controller.getSnapshot().state.robot.x).toBe(2)
    controller.step(solution)
    controller.step(solution)
    expect(controller.getSnapshot().status).toBe('finished')
  })

  it('highlights the block of the current step', () => {
    const { controller } = setup()
    controller.step(solution)
    expect(controller.getSnapshot().currentBlockId).toBe(solution.main[0].blockId)
  })

  it('stop restores the initial state, keeps the log and ignores stale timers', () => {
    const { controller, scheduler, mission } = setup()
    controller.run(solution)
    controller.stop()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('idle')
    expect(snapshot.state).toBe(mission.initialState)
    expect(snapshot.log.length).toBeGreaterThan(0)
    scheduler.runAll()
    expect(controller.getSnapshot().state).toBe(mission.initialState)
  })

  it('reset restores the initial state and clears the log', () => {
    const { controller } = setup()
    controller.run(solution)
    controller.reset()
    expect(controller.getSnapshot()).toMatchObject({ status: 'idle', log: [], stepCount: 0, error: null })
  })

  it('fails on an action error and points to the block', () => {
    const { controller, scheduler } = setup()
    const failing = program([act('turnLeft'), act('moveForward')])
    controller.run(failing)
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('failed')
    expect(snapshot.error?.code).toBe('OUT_OF_BOUNDS')
    expect(snapshot.errorBlockId).toBe(failing.main[1].blockId)
    expect(snapshot.log.at(-1)?.kind).toBe('error')
  })

  it('fails with STEP_LIMIT on infinite loops', () => {
    const { controller, scheduler } = setup(30)
    controller.run(program([whileDo(bool(true), [act('turnLeft')])]))
    scheduler.runAll()
    expect(controller.getSnapshot().error?.code).toBe('STEP_LIMIT')
  })

  it('finishes with an explained failure when objectives are not met', () => {
    const { controller, scheduler } = setup()
    controller.run(program([act('moveForward')]))
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('finished')
    expect(snapshot.validation?.success).toBe(false)
    expect(snapshot.log.some((entry) => entry.text === 'Ainda faltam 1 planta(s) para colher.')).toBe(true)
  })

  it('restarts from the initial state when running after finishing', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    scheduler.runAll()
    controller.run(solution)
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    expect(controller.getSnapshot().state.resources.harvested).toBe(0)
  })

  it('reschedules with the new speed', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.setSpeed(4)
    expect(controller.getSnapshot().speed).toBe(4)
    expect(scheduler.pending).toBe(1)
  })

  it('stops scheduled work and notifications after dispose', () => {
    const { controller, scheduler } = setup()
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.run(solution)
    listener.mockClear()
    controller.dispose()
    expect(scheduler.pending).toBe(0)
    scheduler.runAll()
    expect(listener).not.toHaveBeenCalled()
    expect(controller.getSnapshot().state.robot.x).toBe(1)
  })

  it('notifies subscribers on every change', () => {
    const { controller } = setup()
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    controller.step(solution)
    expect(listener).toHaveBeenCalled()
    unsubscribe()
    listener.mockClear()
    controller.step(solution)
    expect(listener).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/game/execution`
Expected: FAIL — `@/game/execution/controller` não encontrado.

- [ ] **Step 4: Implementar `src/game/execution/controller.ts`**

```ts
import type { Program } from '@/blocks/interpreter/ast'
import { interpret, type ActionFeedback, type ExecOutcome, type ExecStep } from '@/blocks/interpreter/interpreter'
import { describeStep } from '@/game/execution/describeStep'
import { browserScheduler, type Scheduler } from '@/game/execution/scheduler'
import {
  stepDelayMs,
  type ConsoleEntry,
  type ConsoleKind,
  type ControllerMission,
  type ExecutionSnapshot,
  type Speed,
} from '@/game/execution/types'
import { validateMission } from '@/game/missions/validateMission'
import { applyAction } from '@/game/rules/applyAction'

const MAX_LOG_ENTRIES = 200

type ProgramGenerator = Generator<ExecStep, ExecOutcome, ActionFeedback | undefined>

export class ExecutionController {
  private snapshot: ExecutionSnapshot
  private readonly listeners = new Set<() => void>()
  private generator: ProgramGenerator | null = null
  private pendingFeedback: ActionFeedback | undefined
  private cancelTimer: (() => void) | null = null
  private runId = 0
  private logId = 0

  constructor(
    private readonly mission: ControllerMission,
    private readonly scheduler: Scheduler = browserScheduler,
    speed: Speed = 1,
  ) {
    this.snapshot = this.initialSnapshot(speed, [])
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): ExecutionSnapshot => this.snapshot

  run(program: Program): void {
    const { status } = this.snapshot
    if (status === 'running') return
    if (status === 'paused') {
      this.resume()
      return
    }
    if (status === 'finished' || status === 'failed') this.restore(false)
    this.start(program)
    this.patch({ status: 'running' })
    this.advance()
    this.scheduleNext()
  }

  step(program: Program): void {
    const { status } = this.snapshot
    if (status === 'running') return
    if (status !== 'paused') {
      if (status !== 'idle') this.restore(false)
      this.start(program)
      this.patch({ status: 'paused' })
    }
    this.advance()
  }

  pause(): void {
    if (this.snapshot.status !== 'running') return
    this.cancel()
    this.patch({ status: 'paused', log: this.appendLog([this.entry('info', 'Execução pausada.')]) })
  }

  resume(): void {
    if (this.snapshot.status !== 'paused') return
    this.patch({ status: 'running', log: this.appendLog([this.entry('info', 'Execução retomada.')]) })
    this.scheduleNext()
  }

  stop(): void {
    if (this.snapshot.status === 'idle') return
    this.restore(true)
    this.patch({ log: this.appendLog([this.entry('info', 'Execução interrompida. A fazenda voltou ao estado inicial.')]) })
  }

  reset(): void {
    this.restore(false)
  }

  setSpeed(speed: Speed): void {
    this.patch({ speed })
    if (this.snapshot.status === 'running') {
      this.cancel()
      this.scheduleNext()
    }
  }

  addLog(kind: ConsoleKind, text: string): void {
    this.patch({ log: this.appendLog([this.entry(kind, text)]) })
  }

  dispose(): void {
    this.cancel()
    this.runId += 1
    this.generator = null
    this.listeners.clear()
  }

  private initialSnapshot(speed: Speed, log: ConsoleEntry[]): ExecutionSnapshot {
    return {
      status: 'idle',
      state: this.mission.initialState,
      currentBlockId: null,
      lastStep: null,
      lastEvents: [],
      log,
      stepCount: 0,
      error: null,
      errorBlockId: null,
      validation: null,
      runId: this.runId,
      speed,
    }
  }

  private start(program: Program): void {
    this.runId += 1
    this.pendingFeedback = undefined
    this.generator = interpret(program, { read: () => this.snapshot.state, stepLimit: this.mission.stepLimit })
    this.patch({ runId: this.runId, log: this.appendLog([this.entry('info', 'Execução iniciada.')]) })
  }

  private restore(keepLog: boolean): void {
    this.cancel()
    this.runId += 1
    this.generator = null
    this.pendingFeedback = undefined
    this.snapshot = this.initialSnapshot(this.snapshot.speed, keepLog ? this.snapshot.log : [])
    this.notify()
  }

  private advance(): void {
    const generator = this.generator
    if (!generator) return
    const next = generator.next(this.pendingFeedback)
    this.pendingFeedback = undefined
    if (next.done) {
      this.finish(next.value)
      return
    }
    const step = next.value
    const stepCount = this.snapshot.stepCount + 1
    if (step.type === 'action') {
      const result = applyAction(this.snapshot.state, step.action, this.mission.rules)
      if (result.error) {
        this.patch({ currentBlockId: step.blockId, lastStep: step, lastEvents: [], stepCount })
        const end = generator.next({ ok: false, error: result.error })
        this.finish(
          end.done ? end.value : { status: 'failed', error: result.error, blockId: step.blockId, steps: stepCount },
        )
        return
      }
      this.pendingFeedback = { ok: true }
      const described = describeStep(step)
      this.patch({
        state: result.state,
        lastEvents: result.events,
        currentBlockId: step.blockId,
        lastStep: step,
        stepCount,
        log: this.appendLog([this.entry(described.kind, described.text)]),
      })
      return
    }
    const described = describeStep(step)
    this.patch({
      lastEvents: [],
      currentBlockId: step.blockId,
      lastStep: step,
      stepCount,
      log: this.appendLog([this.entry(described.kind, described.text)]),
    })
  }

  private finish(outcome: ExecOutcome): void {
    this.cancel()
    this.generator = null
    if (outcome.status === 'failed') {
      this.patch({
        status: 'failed',
        error: outcome.error,
        errorBlockId: outcome.blockId,
        currentBlockId: outcome.blockId,
        validation: null,
        log: this.appendLog([this.entry('error', `${outcome.error.message} Dica: ${outcome.error.hint}`)]),
      })
      return
    }
    const validation = validateMission(this.snapshot.state, this.mission.goals)
    const entries = validation.success
      ? [this.entry('success', 'Missão cumprida! Todos os objetivos foram alcançados.')]
      : [
          this.entry('warning', 'O programa terminou, mas a missão ainda não foi cumprida.'),
          ...[...validation.objectives, ...validation.constraints]
            .filter((result) => !result.met)
            .map((result) => this.entry('warning', result.detail)),
        ]
    this.patch({ status: 'finished', validation, currentBlockId: null, log: this.appendLog(entries) })
  }

  private scheduleNext(): void {
    if (this.snapshot.status !== 'running') return
    const runId = this.runId
    this.cancelTimer = this.scheduler.schedule(() => {
      this.cancelTimer = null
      if (runId !== this.runId || this.snapshot.status !== 'running') return
      this.advance()
      this.scheduleNext()
    }, stepDelayMs(this.snapshot.speed))
  }

  private cancel(): void {
    this.cancelTimer?.()
    this.cancelTimer = null
  }

  private entry(kind: ConsoleKind, text: string): ConsoleEntry {
    this.logId += 1
    return { id: this.logId, kind, text }
  }

  private appendLog(entries: ConsoleEntry[]): ConsoleEntry[] {
    return [...this.snapshot.log, ...entries].slice(-MAX_LOG_ENTRIES)
  }

  private patch(partial: Partial<ExecutionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial }
    this.notify()
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/game/execution && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/execution
git commit -m "feat(execution): add execution controller with pause, step, stop and speed"
```

---

### Task 5.2: Armazenamento JSON seguro e store de configurações

**Files:**
- Create: `src/services/storage/jsonStorage.ts`
- Create: `src/services/storage/settingsStorage.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/hooks/useReducedMotion.ts`
- Create: `src/app/PreferenceSync.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/services/storage/jsonStorage.test.ts`, `src/stores/settingsStore.test.ts`, `src/hooks/useReducedMotion.test.tsx`

**Interfaces:**
- Consumes: `Speed`.
- Produces:
  - `safeStorage(): Storage | null`
  - `readJson<T>(storage: Storage | null, key: string, schema: z.ZodType<T>): { value: T | null; corrupt: boolean; raw: string | null }`
  - `writeJson(storage: Storage | null, key: string, value: unknown): boolean`
  - `settingsSchema`, `type Settings = { soundEnabled: boolean; musicEnabled: boolean; motion: 'system' | 'reduced' | 'full'; lowGraphics: boolean; renderMode: 'auto' | '3d' | '2d'; defaultSpeed: Speed; theme: 'light' | 'dark' }`
  - `DEFAULT_SETTINGS: Settings`, `SETTINGS_KEY = 'agroblocks:settings:v1'`, `loadSettings(storage: Storage | null): Settings`, `saveSettings(storage: Storage | null, settings: Settings): void`
  - `useSettingsStore` com `{ settings: Settings; update(patch: Partial<Settings>): void }`
  - `useReducedMotion(): boolean`
  - `PreferenceSync` (aplica `data-theme` e `data-motion` em `<html>`)

- [ ] **Step 1: Escrever testes que falham**

`src/services/storage/jsonStorage.test.ts`:
```ts
import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

const schema = z.object({ count: z.number() })

describe('jsonStorage', () => {
  it('returns null without marking corruption when the key is missing', () => {
    expect(readJson(window.localStorage, 'missing', schema)).toEqual({ value: null, corrupt: false, raw: null })
  })

  it('reads valid data', () => {
    writeJson(window.localStorage, 'k', { count: 2 })
    expect(readJson(window.localStorage, 'k', schema).value).toEqual({ count: 2 })
  })

  it('marks invalid JSON and schema mismatches as corrupt', () => {
    window.localStorage.setItem('bad', '{oops')
    window.localStorage.setItem('wrong', JSON.stringify({ count: 'x' }))
    expect(readJson(window.localStorage, 'bad', schema)).toMatchObject({ value: null, corrupt: true, raw: '{oops' })
    expect(readJson(window.localStorage, 'wrong', schema).corrupt).toBe(true)
  })

  it('survives a storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(readJson(throwing, 'k', schema)).toEqual({ value: null, corrupt: false, raw: null })
    expect(writeJson(throwing, 'k', { count: 1 })).toBe(false)
    expect(readJson(null, 'k', schema).value).toBeNull()
  })
})
```

`src/stores/settingsStore.test.ts`:
```ts
import { DEFAULT_SETTINGS, loadSettings, SETTINGS_KEY } from '@/services/storage/settingsStorage'
import { useSettingsStore } from '@/stores/settingsStore'

describe('settings', () => {
  it('falls back to defaults for missing or invalid data', () => {
    expect(loadSettings(window.localStorage)).toEqual(DEFAULT_SETTINGS)
    window.localStorage.setItem(SETTINGS_KEY, '"nope"')
    expect(loadSettings(window.localStorage)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and fills missing ones with defaults', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lowGraphics: true }))
    expect(loadSettings(window.localStorage)).toEqual({ ...DEFAULT_SETTINGS, lowGraphics: true })
  })

  it('persists updates', () => {
    useSettingsStore.getState().update({ renderMode: '2d', defaultSpeed: 2 })
    expect(useSettingsStore.getState().settings.renderMode).toBe('2d')
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({ renderMode: '2d', defaultSpeed: 2 })
  })
})
```

`src/hooks/useReducedMotion.test.tsx`:
```ts
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

describe('useReducedMotion', () => {
  beforeEach(() => useSettingsStore.setState({ settings: DEFAULT_SETTINGS }))

  it('follows the system preference by default', () => {
    mockMatchMedia(true)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('lets the user force reduced or full motion', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    act(() => useSettingsStore.getState().update({ motion: 'reduced' }))
    expect(result.current).toBe(true)
    mockMatchMedia(true)
    act(() => useSettingsStore.getState().update({ motion: 'full' }))
    expect(result.current).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services src/stores src/hooks`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/services/storage/jsonStorage.ts`**

```ts
import type { z } from 'zod'

export function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function readJson<T>(
  storage: Storage | null,
  key: string,
  schema: z.ZodType<T>,
): { value: T | null; corrupt: boolean; raw: string | null } {
  if (!storage) return { value: null, corrupt: false, raw: null }
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { value: null, corrupt: false, raw: null }
  }
  if (raw === null) return { value: null, corrupt: false, raw: null }
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? { value: parsed.data, corrupt: false, raw } : { value: null, corrupt: true, raw }
  } catch {
    return { value: null, corrupt: true, raw }
  }
}

export function writeJson(storage: Storage | null, key: string, value: unknown): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Implementar `src/services/storage/settingsStorage.ts`**

```ts
import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const settingsSchema = z.object({
  soundEnabled: z.boolean(),
  musicEnabled: z.boolean(),
  motion: z.enum(['system', 'reduced', 'full']),
  lowGraphics: z.boolean(),
  renderMode: z.enum(['auto', '3d', '2d']),
  defaultSpeed: z.union([z.literal(0.5), z.literal(1), z.literal(2), z.literal(4)]),
  theme: z.enum(['light', 'dark']),
})

export type Settings = z.infer<typeof settingsSchema>

export const SETTINGS_KEY = 'agroblocks:settings:v1'

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  musicEnabled: false,
  motion: 'system',
  lowGraphics: false,
  renderMode: 'auto',
  defaultSpeed: 1,
  theme: 'light',
}

export function loadSettings(storage: Storage | null): Settings {
  const { value } = readJson(storage, SETTINGS_KEY, settingsSchema.partial())
  return { ...DEFAULT_SETTINGS, ...(value ?? {}) }
}

export function saveSettings(storage: Storage | null, settings: Settings): void {
  writeJson(storage, SETTINGS_KEY, settings)
}
```

- [ ] **Step 5: Implementar `src/stores/settingsStore.ts`**

```ts
import { create } from 'zustand'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSettings, saveSettings, type Settings } from '@/services/storage/settingsStorage'

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(safeStorage()),
  update: (patch) => {
    const settings = { ...get().settings, ...patch }
    saveSettings(safeStorage(), settings)
    set({ settings })
  },
}))
```

- [ ] **Step 6: Implementar `src/hooks/useReducedMotion.ts`**

```ts
import { useSyncExternalStore } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function systemPrefersReduced(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const motion = useSettingsStore((state) => state.settings.motion)
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, () => false)
  if (motion === 'reduced') return true
  if (motion === 'full') return false
  return system
}
```

- [ ] **Step 7: Implementar `src/app/PreferenceSync.tsx` e montar em `App`**

```tsx
import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function PreferenceSync() {
  const theme = useSettingsStore((state) => state.settings.theme)
  const motion = useSettingsStore((state) => state.settings.motion)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (motion === 'system') delete document.documentElement.dataset.motion
    else document.documentElement.dataset.motion = motion
  }, [motion])

  return null
}
```

Substituir `src/app/App.tsx` por:
```tsx
import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'
import { PreferenceSync } from '@/app/PreferenceSync'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <PreferenceSync />
      <AppRoutes />
    </HashRouter>
  )
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS (todos os testes até aqui).

- [ ] **Step 9: Commit**

```bash
git add src/services src/stores src/hooks src/app
git commit -m "feat(settings): add safe JSON storage, persisted settings and motion preference"
```

---

### Task 5.3: Hook React do controller

**Files:**
- Create: `src/features/gameplay/useExecutionController.ts`
- Test: `src/features/gameplay/useExecutionController.test.tsx`

**Interfaces:**
- Consumes: `ExecutionController`, `ControllerMission`, `Scheduler`, `Speed`.
- Produces: `useExecutionController(mission: ControllerMission, options?: { scheduler?: Scheduler; speed?: Speed }): { controller: ExecutionController; snapshot: ExecutionSnapshot }` — cria um controller por `mission` (identidade), descarta no unmount ou quando a missão muda.

- [ ] **Step 1: Escrever teste que falha**

```tsx
import { act, renderHook } from '@testing-library/react'
import { useExecutionController } from '@/features/gameplay/useExecutionController'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import { act as action, program } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'
import type { ControllerMission } from '@/game/execution/types'

const mission: ControllerMission = {
  initialState: makeState(['. .']),
  rules: { growTicks: 3, forbidWaterWet: false },
  goals: { objectives: [{ kind: 'robotAt', x: 1, y: 0 }] },
  stepLimit: 100,
}

describe('useExecutionController', () => {
  it('re-renders with new snapshots', () => {
    const scheduler = new ManualScheduler()
    const { result } = renderHook(() => useExecutionController(mission, { scheduler }))
    expect(result.current.snapshot.status).toBe('idle')
    act(() => result.current.controller.run(program([action('moveForward')])))
    act(() => scheduler.runAll())
    expect(result.current.snapshot.status).toBe('finished')
    expect(result.current.snapshot.validation?.success).toBe(true)
  })

  it('keeps the same controller across renders for the same mission', () => {
    const { result, rerender } = renderHook(() => useExecutionController(mission))
    const first = result.current.controller
    rerender()
    expect(result.current.controller).toBe(first)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/useExecutionController.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/features/gameplay/useExecutionController.ts`**

```ts
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { ExecutionController } from '@/game/execution/controller'
import type { Scheduler } from '@/game/execution/scheduler'
import type { ControllerMission, ExecutionSnapshot, Speed } from '@/game/execution/types'

export function useExecutionController(
  mission: ControllerMission,
  options: { scheduler?: Scheduler; speed?: Speed } = {},
): { controller: ExecutionController; snapshot: ExecutionSnapshot } {
  const { scheduler, speed } = options
  const controller = useMemo(() => new ExecutionController(mission, scheduler, speed), [mission, scheduler])
  useEffect(() => () => controller.dispose(), [controller])
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  return { controller, snapshot }
}
```

`speed` fica fora das dependências de propósito: a velocidade inicial só vale na criação; mudanças posteriores usam `controller.setSpeed`. Para satisfazer o lint de hooks sem comentário, isso não precisa de ação extra (o projeto não usa ESLint de hooks).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/gameplay && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gameplay
git commit -m "feat(execution): expose execution controller to React"
```
