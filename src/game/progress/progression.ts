import {
  MAX_HINTS,
  type AttemptInput,
  type AttemptRecord,
  type AssessmentResponse,
  type BestResult,
  type MissionProgress,
  type MissionRef,
  type SaveData,
} from '@/game/progress/types'
import { cleanText, type StudentInfo, type TutorialRecord } from '@/shared/student'

function emptyProgress(status: MissionProgress['status']): MissionProgress {
  return { status, attempts: 0, bestResult: null, hintsUsed: 0, errorCounts: {}, savedProgram: null }
}

function sorted(missions: MissionRef[]): MissionRef[] {
  return [...missions].sort((a, b) => a.order - b.order)
}

function initialStatus(mission: MissionRef, missions: MissionRef[], save: SaveData | null): MissionProgress['status'] {
  if (mission.order <= 1) return 'available'
  const previous = missions.find((candidate) => candidate.order === mission.order - 1)
  return previous && save?.missions[previous.id]?.status === 'completed' ? 'available' : 'locked'
}

export function createInitialSave(missions: MissionRef[], now: string): SaveData {
  const ordered = sorted(missions)
  return {
    version: 1,
    runId: null,
    student: null,
    tutorial: null,
    createdAt: now,
    missions: Object.fromEntries(ordered.map((mission) => [mission.id, emptyProgress(initialStatus(mission, ordered, null))])),
    attempts: [],
    assessments: { pre: null, post: null },
  }
}

export function syncMissions(save: SaveData, missions: MissionRef[]): SaveData {
  const ordered = sorted(missions)
  const next = { ...save.missions }
  for (const mission of ordered) {
    if (!next[mission.id]) next[mission.id] = emptyProgress(initialStatus(mission, ordered, { ...save, missions: next }))
  }
  return { ...save, missions: next }
}

export function isBetterResult(candidate: BestResult, current: BestResult | null): boolean {
  if (!current) return true
  if (candidate.efficiencyStars !== current.efficiencyStars) return candidate.efficiencyStars > current.efficiencyStars
  return candidate.actions < current.actions
}

export function recordAttempt(save: SaveData, input: AttemptInput, missions: MissionRef[]): SaveData {
  const progress = save.missions[input.missionId] ?? emptyProgress('available')
  const attemptNumber = progress.attempts + 1
  const record: AttemptRecord = {
    ...input,
    id: `${input.missionId}-${attemptNumber}`,
    attemptNumber,
    hintsUsed: progress.hintsUsed,
  }
  const errorCounts = { ...progress.errorCounts }
  if (input.errorCode) errorCounts[input.errorCode] = (errorCounts[input.errorCode] ?? 0) + 1
  const succeeded = input.outcome === 'success' && input.efficiencyStars !== null
  const candidate: BestResult | null = succeeded
    ? { actions: input.actions, blocks: input.blocks, usage: input.usage, efficiencyStars: input.efficiencyStars as BestResult['efficiencyStars'] }
    : null
  const updated: MissionProgress = {
    ...progress,
    attempts: attemptNumber,
    errorCounts,
    status: succeeded || progress.status === 'completed' ? 'completed' : progress.status,
    bestResult: candidate && isBetterResult(candidate, progress.bestResult) ? candidate : progress.bestResult,
  }
  const missionsState = { ...save.missions, [input.missionId]: updated }
  if (succeeded) {
    const current = missions.find((mission) => mission.id === input.missionId)
    const next = current ? missions.find((mission) => mission.order === current.order + 1) : undefined
    if (next && missionsState[next.id]?.status === 'locked') {
      missionsState[next.id] = { ...missionsState[next.id], status: 'available' }
    }
  }
  return { ...save, missions: missionsState, attempts: [...save.attempts, record] }
}

export function registerHint(save: SaveData, missionId: string): SaveData {
  const progress = save.missions[missionId]
  if (!progress) return save
  return {
    ...save,
    missions: { ...save.missions, [missionId]: { ...progress, hintsUsed: Math.min(MAX_HINTS, progress.hintsUsed + 1) } },
  }
}

export function storeProgram(save: SaveData, missionId: string, json: string): SaveData {
  const progress = save.missions[missionId]
  if (!progress) return save
  return { ...save, missions: { ...save.missions, [missionId]: { ...progress, savedProgram: json } } }
}

export function assignStudent(save: SaveData, student: StudentInfo, runId: string): SaveData {
  return { ...save, runId, student: { name: cleanText(student.name), school: cleanText(student.school) } }
}

export function recordTutorial(save: SaveData, record: TutorialRecord): SaveData {
  if (save.tutorial?.status === 'completed' && record.status === 'skipped') return save
  return { ...save, tutorial: record }
}

export function storeAssessment(save: SaveData, response: AssessmentResponse): SaveData {
  return { ...save, assessments: { ...save.assessments, [response.form]: response } }
}

export function hasProgress(save: SaveData): boolean {
  return save.attempts.length > 0 || Object.values(save.missions).some((progress) => progress.status === 'completed')
}

export function failedAttempts(save: SaveData, missionId: string): number {
  return save.attempts.filter((attempt) => attempt.missionId === missionId && attempt.outcome !== 'success').length
}

export function continueMissionId(save: SaveData, missions: MissionRef[]): string | null {
  if (!hasProgress(save)) return null
  const ordered = sorted(missions)
  const pending = ordered.find((mission) => save.missions[mission.id]?.status === 'available')
  if (pending) return pending.id
  const completed = ordered.filter((mission) => save.missions[mission.id]?.status === 'completed')
  return completed.at(-1)?.id ?? null
}
