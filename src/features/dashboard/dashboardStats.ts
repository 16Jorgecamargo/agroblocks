import { percent, scoreResponse } from '@/game/assessment/scoring'
import { ASSESSMENT_CONCEPT_LABELS, ASSESSMENT_CONCEPTS, type AssessmentConcept } from '@/game/assessment/types'
import { CONCEPT_LABELS, type MissionConcept, type MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus, SaveData } from '@/game/progress/types'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { ErrorCode } from '@/game/world/types'

export interface MissionRow {
  missionId: string
  title: string
  concept: MissionConcept
  conceptLabel: string
  status: MissionStatus
  attempts: number
  successes: number
  errors: number
  hintsUsed: number
  bestActions: number | null
  bestStars: number | null
}

export interface DashboardStats {
  hasData: boolean
  completedPhases: number
  totalPhases: number
  completionRate: number
  totalAttempts: number
  totalHints: number
  missions: MissionRow[]
  topErrors: { code: ErrorCode; label: string; count: number }[]
  concepts: { concept: MissionConcept; label: string; attempts: number; successRate: number }[]
  assessment: { concept: AssessmentConcept; label: string; pre: number | null; post: number | null }[]
}

export function computeDashboard(save: SaveData, missions: MissionDefinition[]): DashboardStats {
  const rows: MissionRow[] = missions.map((mission) => {
    const attempts = save.attempts.filter((attempt) => attempt.missionId === mission.id)
    const progress = save.missions[mission.id]
    return {
      missionId: mission.id,
      title: mission.title,
      concept: mission.concept,
      conceptLabel: CONCEPT_LABELS[mission.concept],
      status: progress?.status ?? 'locked',
      attempts: attempts.length,
      successes: attempts.filter((attempt) => attempt.outcome === 'success').length,
      errors: attempts.filter((attempt) => attempt.outcome === 'error').length,
      hintsUsed: progress?.hintsUsed ?? 0,
      bestActions: progress?.bestResult?.actions ?? null,
      bestStars: progress?.bestResult?.efficiencyStars ?? null,
    }
  })
  const phases = missions.filter((mission) => !mission.tutorial)
  const completedPhases = phases.filter((mission) => save.missions[mission.id]?.status === 'completed').length

  const errorCounts = new Map<ErrorCode, number>()
  for (const attempt of save.attempts) {
    if (attempt.errorCode) errorCounts.set(attempt.errorCode, (errorCounts.get(attempt.errorCode) ?? 0) + 1)
  }
  const topErrors = [...errorCounts]
    .map(([code, count]) => ({ code, label: ERROR_TEXT[code].message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const conceptOrder = [...new Set(missions.map((mission) => mission.concept))]
  const concepts = conceptOrder.map((concept) => {
    const conceptRows = rows.filter((row) => row.concept === concept)
    const attempts = conceptRows.reduce((sum, row) => sum + row.attempts, 0)
    const successes = conceptRows.reduce((sum, row) => sum + row.successes, 0)
    return { concept, label: CONCEPT_LABELS[concept], attempts, successRate: attempts === 0 ? 0 : successes / attempts }
  })

  const preScores = save.assessments.pre ? scoreResponse(save.assessments.pre) : null
  const postScores = save.assessments.post ? scoreResponse(save.assessments.post) : null
  const assessment = ASSESSMENT_CONCEPTS.map((concept) => ({
    concept,
    label: ASSESSMENT_CONCEPT_LABELS[concept],
    pre: preScores ? percent(preScores[concept]) : null,
    post: postScores ? percent(postScores[concept]) : null,
  }))

  return {
    hasData: save.attempts.length > 0 || save.assessments.pre !== null || save.assessments.post !== null,
    completedPhases,
    totalPhases: phases.length,
    completionRate: phases.length === 0 ? 0 : completedPhases / phases.length,
    totalAttempts: save.attempts.length,
    totalHints: rows.reduce((sum, row) => sum + row.hintsUsed, 0),
    missions: rows,
    topErrors,
    concepts,
    assessment,
  }
}
