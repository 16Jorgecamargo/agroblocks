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

function exprBlocks(expr: Expr): number {
  switch (expr.kind) {
    case 'number':
      return 0
    case 'boolean':
    case 'var':
    case 'sensor':
      return 1
    case 'not':
      return 1 + exprBlocks(expr.value)
    case 'compare':
    case 'logic':
    case 'arith':
      return 1 + exprBlocks(expr.left) + exprBlocks(expr.right)
  }
}

function stmtBlocks(stmts: Stmt[]): number {
  let total = 0
  for (const stmt of stmts) {
    total += 1
    if (stmt.kind === 'repeat') total += exprBlocks(stmt.times) + stmtBlocks(stmt.body)
    if (stmt.kind === 'while') total += exprBlocks(stmt.cond) + stmtBlocks(stmt.body)
    if (stmt.kind === 'if') total += exprBlocks(stmt.cond) + stmtBlocks(stmt.then) + stmtBlocks(stmt.else ?? [])
    if (stmt.kind === 'setVar') total += exprBlocks(stmt.value)
    if (stmt.kind === 'changeVar') total += exprBlocks(stmt.delta)
  }
  return total
}

export function countProgramBlocks(program: Program): number {
  const bodies = Object.values(program.procedures)
  return stmtBlocks(program.main) + bodies.length + bodies.reduce((sum, body) => sum + stmtBlocks(body), 0)
}
