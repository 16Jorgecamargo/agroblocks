import type { EfficiencyStars } from '@/game/missions/efficiency'
import type { ErrorCode, ResourceUsage } from '@/game/world/types'
import type { WorldId } from '@/game/worlds/worldTypes'
import type { StudentInfo, TutorialRecord } from '@/shared/student'

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
  world: WorldId
  form: AssessmentForm
  startedAt: string
  completedAt: string
  skipped: boolean
  answers: Record<string, number>
}

export interface WorldAssessments {
  pre: AssessmentResponse | null
  post: AssessmentResponse | null
}

export interface SaveData {
  version: 3
  runId: string | null
  student: StudentInfo | null
  tutorial: TutorialRecord | null
  createdAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: Record<WorldId, WorldAssessments>
}

export interface MissionRef {
  id: string
  order: number
  world: WorldId | null
}
