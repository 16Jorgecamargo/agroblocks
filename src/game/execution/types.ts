import type { ExecStep } from '@/blocks/interpreter/interpreter'
import type { MissionGoals, MissionValidation } from '@/game/missions/goals'
import type { GameError, GameEvent, GameState, WorldRules } from '@/game/world/types'

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed'

export type Speed = 0.5 | 1 | 2 | 4

export const SPEEDS: Speed[] = [0.5, 1, 2, 4]

export const BASE_STEP_DELAY_MS = 500

export function stepDelayMs(speed: Speed): number {
  return BASE_STEP_DELAY_MS / speed
}

export type ConsoleKind = 'info' | 'action' | 'check' | 'error' | 'success' | 'warning'

export interface ConsoleEntry {
  id: number
  kind: ConsoleKind
  text: string
}

export interface ExecutionSnapshot {
  status: ExecutionStatus
  state: GameState
  currentBlockId: string | null
  lastStep: ExecStep | null
  lastEvents: GameEvent[]
  log: ConsoleEntry[]
  stepCount: number
  error: GameError | null
  errorBlockId: string | null
  validation: MissionValidation | null
  runId: number
  speed: Speed
}

export interface ControllerMission {
  initialState: GameState
  rules: WorldRules
  goals: MissionGoals
  stepLimit: number
}
