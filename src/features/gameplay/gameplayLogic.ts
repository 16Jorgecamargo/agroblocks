import type { ExecStep } from '@/blocks/interpreter/interpreter'
import { ACTION_LABELS } from '@/blocks/pseudocode/pseudocode'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'
import { computeEfficiencyStars } from '@/game/missions/efficiency'
import type { CellRef } from '@/game/missions/goals'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { MAX_HINTS, type AttemptInput } from '@/game/progress/types'

export function buildAttemptInput(
  snapshot: ExecutionSnapshot,
  mission: MissionDefinition,
  blockCount: number,
  pseudocode: string,
  timestamp: string,
): AttemptInput {
  const success = snapshot.status === 'finished' && snapshot.validation?.success === true
  const outcome = snapshot.status === 'failed' ? 'error' : success ? 'success' : 'objectiveFailed'
  const actions = snapshot.state.actionCount
  return {
    missionId: mission.id,
    timestamp,
    outcome,
    errorCode: snapshot.error?.code ?? null,
    actions,
    blocks: blockCount,
    usage: snapshot.state.usage,
    efficiencyStars: success ? computeEfficiencyStars({ actions, blocks: blockCount }, mission.efficiency) : null,
    pseudocode,
  }
}

export function loadInitialWorkspace(saved: string | null, mission: MissionDefinition): WorkspaceJson | null {
  if (saved !== null) {
    try {
      const parsed: unknown = JSON.parse(saved)
      return parsed && typeof parsed === 'object' ? (parsed as WorkspaceJson) : null
    } catch {
      return null
    }
  }
  return mission.initialProgram ? programToWorkspaceJson(mission.initialProgram) : null
}

export function objectiveCells(mission: MissionDefinition): CellRef[] {
  const cells = mission.objectives.flatMap((objective) =>
    objective.kind === 'cellsInState' || objective.kind === 'cellsWet' ? objective.cells : [],
  )
  const unique = new Map(cells.map((cell) => [`${cell[0]},${cell[1]}`, cell]))
  return [...unique.values()]
}

export const HINT_LEVEL_LABELS: [string, string, string, string] = [
  'Ideia',
  'O que verificar',
  'Qual bloco usar',
  'Exemplo parcial',
]

export function canRevealHint(revealed: number, failed: number): boolean {
  if (revealed >= MAX_HINTS) return false
  if (revealed === MAX_HINTS - 1) return failed >= 2
  return true
}

export const STATUS_LABELS: Record<ExecutionStatus, string> = {
  idle: 'Pronto para executar',
  running: 'Executando',
  paused: 'Pausado',
  finished: 'Programa terminou',
  failed: 'Execução interrompida por erro',
}

export function currentStepLabel(step: ExecStep | null): string {
  if (!step) return '—'
  switch (step.type) {
    case 'action':
      return ACTION_LABELS[step.action]
    case 'check':
      return `${step.label} → ${step.result ? 'sim' : 'não'}`
    case 'loop':
      return `repetição ${step.iteration} de ${step.total}`
    case 'variable':
      return `${step.name} = ${step.value}`
    case 'call':
      return `procedimento ${step.name}`
  }
}

export type ShortcutAction = 'run' | 'toggle' | 'step' | 'stop'

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function shortcutFor(input: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  targetTag: string
  inEditor: boolean
}): ShortcutAction | null {
  if (input.key === 'Enter' && (input.ctrlKey || input.metaKey)) return 'run'
  if (TYPING_TAGS.has(input.targetTag) || input.inEditor) return null
  if (input.key === 'Escape') return 'stop'
  if (input.targetTag === 'BUTTON') return null
  if (input.key === ' ') return 'toggle'
  if (input.key === '.') return 'step'
  return null
}

export function formatResource(value: number | null): string {
  return value === null ? '∞' : String(value)
}
