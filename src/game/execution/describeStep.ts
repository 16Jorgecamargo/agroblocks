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
