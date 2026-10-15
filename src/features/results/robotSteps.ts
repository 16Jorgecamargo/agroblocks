import type { Program, Stmt } from '@/blocks/interpreter/ast'
import { exprToText } from '@/blocks/pseudocode/pseudocode'
import type { ActionType } from '@/game/world/types'

const PAST: Record<ActionType, string> = {
  moveForward: 'Moveu para o próximo canteiro',
  turnLeft: 'Virou à esquerda',
  turnRight: 'Virou à direita',
  prepareSoil: 'Preparou o solo',
  plant: 'Plantou uma semente',
  water: 'Regou o canteiro',
  harvest: 'Colheu a planta',
  collectResources: 'Coletou recursos',
}

function withoutQuestionMarks(text: string): string {
  return text.replace(/\?/g, '')
}

export function describeRobotSteps(program: Program, limit = 6): string[] {
  const steps: string[] = []
  const visit = (stmts: Stmt[]) => {
    let index = 0
    while (index < stmts.length && steps.length < limit) {
      const stmt = stmts[index]
      if (stmt.kind === 'action') {
        let count = 1
        while (index + count < stmts.length) {
          const next = stmts[index + count]
          if (next.kind !== 'action' || next.action !== stmt.action) break
          count += 1
        }
        steps.push(count > 1 ? `${PAST[stmt.action]} (${count}x)` : PAST[stmt.action])
        index += count
        continue
      }
      switch (stmt.kind) {
        case 'repeat':
          steps.push(`Repetiu as ações ${exprToText(stmt.times)} vezes`)
          visit(stmt.body)
          break
        case 'while':
          steps.push(`Repetiu enquanto ${withoutQuestionMarks(exprToText(stmt.cond))}`)
          visit(stmt.body)
          break
        case 'if':
          steps.push(`Verificou se ${withoutQuestionMarks(exprToText(stmt.cond))}`)
          visit(stmt.then)
          break
        case 'setVar':
        case 'changeVar':
          steps.push(`Atualizou a variável ${stmt.name}`)
          break
        case 'call':
          steps.push(`Executou o procedimento ${stmt.name}`)
          break
      }
      index += 1
    }
  }
  visit(program.main)
  return steps.slice(0, limit)
}
