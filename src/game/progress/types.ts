import type { EfficiencyStars } from '@/game/missions/efficiency'
import type { ErrorCode, ResourceUsage } from '@/game/world/types'

export const MAX_HINTS = 4

export type AttemptOutcome = 'success' | 'objectiveFailed' | 'error'

export interface AttemptRecord {
  id: string
  missionId: string
  attemptNumber: number
  timestamp: string
  outcome: AttemptOutcome
  errorCode: ErrorCode | null
  actions: number
  blocks: number
  usage: ResourceUsage
  hintsUsed: number
  efficiencyStars: EfficiencyStars | null
  pseudocode: string
}

export type AttemptInput = Omit<AttemptRecord, 'id' | 'attemptNumber' | 'hintsUsed'>

export interface BestResult {
  actions: number
  blocks: number
  usage: ResourceUsage
  efficiencyStars: EfficiencyStars
}

export type MissionStatus = 'locked' | 'available' | 'completed'

export interface MissionProgress {
  status: MissionStatus
  attempts: number
  bestResult: BestResult | null
  hintsUsed: number
  errorCounts: Partial<Record<ErrorCode, number>>
  savedProgram: string | null
}

export type AssessmentForm = 'pre' | 'post'

export interface AssessmentResponse {
  form: AssessmentForm
  startedAt: string
  completedAt: string
  skipped: boolean
  answers: Record<string, number>
}

export interface SaveData {
  version: 1
  participantCode: string | null
  createdAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: { pre: AssessmentResponse | null; post: AssessmentResponse | null }
}

export interface MissionRef {
  id: string
  order: number
}
