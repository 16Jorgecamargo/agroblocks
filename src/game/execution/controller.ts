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

export const REWIND_DELAY_MS = 900

type ProgramGenerator = Generator<ExecStep, ExecOutcome, ActionFeedback | undefined>

export class ExecutionController {
  private snapshot: ExecutionSnapshot
  private readonly listeners = new Set<() => void>()
  private generator: ProgramGenerator | null = null
  private pendingFeedback: ActionFeedback | undefined
  private cancelTimer: (() => void) | null = null
  private runId = 0
  private logId = 0
  private rewindPending = false
  private rewinding = false

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
    if (this.rewindPending) {
      this.rewindPending = false
      this.scheduleNext(REWIND_DELAY_MS)
      return
    }
    this.advance()
    this.scheduleNext()
  }

  step(program: Program): void {
    const { status } = this.snapshot
    if (status === 'running' || this.rewinding) return
    if (status !== 'paused') {
      if (status !== 'idle') this.restore(false)
      this.start(program)
      this.patch({ status: 'paused' })
      if (this.rewindPending) {
        this.rewindPending = false
        this.rewinding = true
        const runId = this.runId
        this.cancelTimer = this.scheduler.schedule(() => {
          this.cancelTimer = null
          this.rewinding = false
          if (runId === this.runId) this.advance()
        }, REWIND_DELAY_MS)
        return
      }
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

  clearLog(): void {
    this.patch({ log: [] })
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
    if (this.snapshot.stepCount > 0) this.rewindPending = true
    this.rewinding = false
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

  private scheduleNext(delayMs = stepDelayMs(this.snapshot.speed)): void {
    if (this.snapshot.status !== 'running') return
    const runId = this.runId
    this.cancelTimer = this.scheduler.schedule(() => {
      this.cancelTimer = null
      if (runId !== this.runId || this.snapshot.status !== 'running') return
      this.advance()
      this.scheduleNext()
    }, delayMs)
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
