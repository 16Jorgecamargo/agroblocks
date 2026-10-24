import {
  MAX_HINTS,
  type AttemptInput,
  type AttemptRecord,
  type AssessmentResponse,
  type BestResult,
  type MissionProgress,
  type MissionRef,
  type SaveData,
  type WorldAssessments,
} from '@/game/progress/types'
import { WORLD_IDS, type WorldId } from '@/game/worlds/worldTypes'
import { cleanText, type StudentInfo, type TutorialRecord } from '@/shared/student'

function emptyProgress(status: MissionProgress['status']): MissionProgress {
  return { status, attempts: 0, bestResult: null, hintsUsed: 0, errorCounts: {}, savedProgram: null }
}

function sorted(missions: MissionRef[]): MissionRef[] {
  return [...missions].sort((a, b) => a.order - b.order)
}

export function emptyAssessments(): Record<WorldId, WorldAssessments> {
  return Object.fromEntries(WORLD_IDS.map((world) => [world, { pre: null, post: null }])) as Record<WorldId, WorldAssessments>
}

function worldMissions(world: WorldId, missions: MissionRef[]): MissionRef[] {
  return sorted(missions).filter((mission) => mission.world === world)
}

export function isWorldOpen(save: SaveData, world: WorldId, _missions: MissionRef[]): boolean {
  const index = WORLD_IDS.indexOf(world)
  if (index <= 0) return true
  return save.assessments[WORLD_IDS[index - 1]]?.post != null
}

export function refreshUnlocks(save: SaveData, missions: MissionRef[]): SaveData {
  const next = { ...save.missions }
  for (const mission of sorted(missions)) {
    const progress = next[mission.id]
    if (!progress || progress.status !== 'locked') continue
    if (mission.world === null) {
      next[mission.id] = { ...progress, status: 'available' }
      continue
    }
    if (!isWorldOpen(save, mission.world, missions)) continue
    const earlier = worldMissions(mission.world, missions).filter((candidate) => candidate.order < mission.order)
    if (earlier.every((candidate) => next[candidate.id]?.status === 'completed')) next[mission.id] = { ...progress, status: 'available' }
  }
  return { ...save, missions: next }
}

export type WorldStep = { kind: 'preTest' } | { kind: 'mission'; missionId: string } | { kind: 'postTest' } | { kind: 'done' }

export function worldStep(save: SaveData, world: WorldId, missions: MissionRef[]): WorldStep {
  const tests = save.assessments[world]
  if (!tests?.pre) return { kind: 'preTest' }
  const pending = worldMissions(world, missions).find((mission) => save.missions[mission.id]?.status !== 'completed')
  if (pending) return { kind: 'mission', missionId: pending.id }
  if (!tests.post) return { kind: 'postTest' }
  return { kind: 'done' }
}

export function currentWorld(save: SaveData, missions: MissionRef[]): WorldId {
  return WORLD_IDS.find((world) => isWorldOpen(save, world, missions) && worldStep(save, world, missions).kind !== 'done') ?? 'homestead'
}

export function createInitialSave(missions: MissionRef[], now: string): SaveData {
  const ordered = sorted(missions)
  return refreshUnlocks(
    {
      version: 3,
      runId: null,
      student: null,
      tutorial: null,
      createdAt: now,
      missions: Object.fromEntries(ordered.map((mission) => [mission.id, emptyProgress('locked')])),
      attempts: [],
      assessments: emptyAssessments(),
    },
    ordered,
  )
}

export function syncMissions(save: SaveData, missions: MissionRef[]): SaveData {
  const next = { ...save.missions }
  for (const mission of missions) if (!next[mission.id]) next[mission.id] = emptyProgress('locked')
  return refreshUnlocks({ ...save, missions: next, assessments: { ...emptyAssessments(), ...save.assessments } }, missions)
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
  return refreshUnlocks({ ...save, missions: missionsState, attempts: [...save.attempts, record] }, missions)
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

export function storeAssessment(save: SaveData, response: AssessmentResponse, missions: MissionRef[]): SaveData {
  const current = save.assessments[response.world] ?? { pre: null, post: null }
  return refreshUnlocks({ ...save, assessments: { ...save.assessments, [response.world]: { ...current, [response.form]: response } } }, missions)
}

export function hasProgress(save: SaveData): boolean {
  return (
    save.attempts.length > 0 ||
    Object.values(save.missions).some((progress) => progress.status === 'completed') ||
    Object.values(save.assessments).some((tests) => tests?.pre != null || tests?.post != null)
  )
}

export function failedAttempts(save: SaveData, missionId: string): number {
  return save.attempts.filter((attempt) => attempt.missionId === missionId && attempt.outcome !== 'success').length
}

export function continueMissionId(save: SaveData, missions: MissionRef[]): string | null {
  if (!hasProgress(save)) return null
  const ordered = sorted(missions)
  const playable = (mission: MissionRef) => {
    if (mission.world === null) return true
    const step = worldStep(save, mission.world, missions)
    return step.kind === 'mission'
  }
  const pending = ordered.find((mission) => save.missions[mission.id]?.status === 'available' && playable(mission))
  if (pending) return pending.id
  const completed = ordered.filter((mission) => save.missions[mission.id]?.status === 'completed')
  return completed.at(-1)?.id ?? null
}
