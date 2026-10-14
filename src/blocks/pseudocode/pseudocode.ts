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
