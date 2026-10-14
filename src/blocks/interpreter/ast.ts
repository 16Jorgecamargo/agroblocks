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
