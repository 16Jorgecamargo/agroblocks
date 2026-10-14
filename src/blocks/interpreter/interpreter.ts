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
