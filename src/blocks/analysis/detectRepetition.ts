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
