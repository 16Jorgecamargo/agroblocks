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
