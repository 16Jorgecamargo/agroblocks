import { itemsFor } from '@/data/assessment/items'
import { WORLDS } from '@/data/worlds'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { ERROR_TEXT } from '@/game/rules/errors'
import { WORLD_IDS, type WorldId } from '@/game/worlds/worldTypes'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { cleanText, normalizeKey, studentKeyOf, type TutorialRecord } from '@/shared/student'

export interface DashboardFilters {
  school: string | null
  search: string
  from: string | null
  to: string | null
}

export const EMPTY_FILTERS: DashboardFilters = { school: null, search: '', from: null, to: null }

export type PlotState = 'empty' | 'trying' | 'done'

export interface Plot {
  state: PlotState
  attempts: number
  stars: number
  hints: number
}

export interface WorldCell {
  completed: number
  total: number
  state: PlotState
  attempts: number
  pre: number | null
  post: number | null
}

export interface StudentRow {
  key: string
  name: string
  school: string
  runs: RunSnapshot[]
  runCount: number
  tutorial: TutorialRecord | null
  completedMissions: number
  worldsDone: number
  attempts: number
  hints: number
  errors: number
  lastSeen: string
  plots: Record<string, Plot>
  worlds: Record<WorldId, WorldCell>
}

export interface WorldRow {
  world: WorldId
  name: string
  conceptLabel: string
  finished: number
  attemptsPerStudent: number
  hintsPerStudent: number
  pre: number | null
  post: number | null
}

export interface DashboardModel {
  students: StudentRow[]
  schools: string[]
  summary: {
    students: number
    schools: number
    runs: number
    avgCompletedMissions: number
    avgWorldsDone: number
    attempts: number
    hints: number
    tutorial: { completed: number; skipped: number; unfinished: number }
    avgGain: number | null
  }
  worldRows: WorldRow[]
  topErrors: { code: string; label: string; count: number }[]
}

export type SnapshotAssessment = RunSnapshot['assessments']['garden']['pre']

export function scoreAssessment(response: SnapshotAssessment): number | null {
  if (!response || response.skipped) return null
  return itemsFor(response.world, response.form).filter((item) => response.answers[item.id] === item.correctIndex).length
}

export function tutorialLabel(record: TutorialRecord | null, total = 15): string {
  if (!record) return 'Não terminado'
  return record.status === 'completed' ? 'Concluído' : `Pulado na etapa ${record.step} de ${total}`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function average(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null)
  return present.length === 0 ? null : round(present.reduce((sum, value) => sum + value, 0) / present.length)
}

function matches(run: RunSnapshot, filters: DashboardFilters): boolean {
  if (filters.school && run.student.school !== filters.school) return false
  if (filters.search && !normalizeKey(run.student.name).includes(normalizeKey(filters.search))) return false
  const day = run.updatedAt.slice(0, 10)
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  return true
}

function firstWith<T>(runs: RunSnapshot[], pick: (run: RunSnapshot) => T | null): T | null {
  for (const run of runs) {
    const value = pick(run)
    if (value !== null) return value
  }
  return null
}

function plotOf(runs: RunSnapshot[], missionId: string): Plot {
  const progress = runs.map((run) => run.missions[missionId]).filter((item) => item !== undefined)
  const attempts = runs.reduce((sum, run) => sum + run.attempts.filter((attempt) => attempt.missionId === missionId).length, 0)
  const stars = Math.max(0, ...progress.map((item) => item.bestResult?.efficiencyStars ?? 0))
  const hints = progress.reduce((sum, item) => sum + item.hintsUsed, 0)
  const state: PlotState = progress.some((item) => item.status === 'completed') ? 'done' : attempts > 0 ? 'trying' : 'empty'
  return { state, attempts, stars, hints }
}

function worldCell(runs: RunSnapshot[], world: WorldId, missions: MissionDefinition[], plots: Record<string, Plot>): WorldCell {
  const ids = missions.filter((mission) => mission.world === world).map((mission) => mission.id)
  const completed = ids.filter((id) => plots[id]?.state === 'done').length
  const attempts = ids.reduce((sum, id) => sum + (plots[id]?.attempts ?? 0), 0)
  const pre = firstWith(runs, (run) => scoreAssessment(run.assessments[world]?.pre ?? null))
  const post = firstWith(runs, (run) => scoreAssessment(run.assessments[world]?.post ?? null))
  const state: PlotState = ids.length > 0 && completed === ids.length && post !== null ? 'done' : completed > 0 || attempts > 0 || pre !== null ? 'trying' : 'empty'
  return { completed, total: ids.length, state, attempts, pre, post }
}

function studentRow(key: string, runs: RunSnapshot[], missions: MissionDefinition[]): StudentRow {
  const ordered = [...runs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const newest = ordered[0]
  const attempts = ordered.flatMap((run) => run.attempts)
  const plots = Object.fromEntries(missions.map((mission) => [mission.id, plotOf(ordered, mission.id)]))
  const worlds = Object.fromEntries(WORLD_IDS.map((world) => [world, worldCell(ordered, world, missions, plots)])) as Record<WorldId, WorldCell>
  return {
    key,
    name: cleanText(newest.student.name),
    school: cleanText(newest.student.school),
    runs: ordered,
    runCount: ordered.length,
    tutorial: firstWith(ordered, (run) => run.tutorial),
    completedMissions: missions.filter((mission) => mission.world !== null && plots[mission.id]?.state === 'done').length,
    worldsDone: WORLD_IDS.filter((world) => worlds[world].state === 'done').length,
    attempts: attempts.length,
    hints: ordered.reduce((sum, run) => sum + Object.values(run.missions).reduce((inner, progress) => inner + progress.hintsUsed, 0), 0),
    errors: attempts.filter((attempt) => attempt.outcome !== 'success').length,
    lastSeen: newest.updatedAt,
    plots,
    worlds,
  }
}

export function buildDashboard(runs: RunSnapshot[], missions: MissionDefinition[], filters: DashboardFilters): DashboardModel {
  const schools = [...new Set(runs.map((run) => run.student.school))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const filtered = runs.filter((run) => matches(run, filters))
  const groups = new Map<string, RunSnapshot[]>()
  for (const run of filtered) {
    const key = studentKeyOf(run.student)
    groups.set(key, [...(groups.get(key) ?? []), run])
  }
  const students = [...groups.entries()].map(([key, group]) => studentRow(key, group, missions)).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
  const count = Math.max(1, students.length)

  const worldRows: WorldRow[] = WORLDS.map((world) => {
    const ids = missions.filter((mission) => mission.world === world.id).map((mission) => mission.id)
    const attempts = students.reduce((sum, student) => sum + student.worlds[world.id].attempts, 0)
    const hints = students.reduce((sum, student) => sum + ids.reduce((inner, id) => inner + (student.plots[id]?.hints ?? 0), 0), 0)
    return {
      world: world.id,
      name: world.name,
      conceptLabel: world.conceptLabel,
      finished: students.filter((student) => student.worlds[world.id].state === 'done').length,
      attemptsPerStudent: round(attempts / count),
      hintsPerStudent: round(hints / count),
      pre: average(students.map((student) => student.worlds[world.id].pre)),
      post: average(students.map((student) => student.worlds[world.id].post)),
    }
  })

  const errorCounts = new Map<string, number>()
  for (const run of filtered) for (const attempt of run.attempts) if (attempt.errorCode) errorCounts.set(attempt.errorCode, (errorCounts.get(attempt.errorCode) ?? 0) + 1)
  const topErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, total]) => ({ code, label: ERROR_TEXT[code as keyof typeof ERROR_TEXT]?.message ?? code, count: total }))

  const gains = students.flatMap((student) =>
    WORLD_IDS.map((world) => {
      const cell = student.worlds[world]
      return cell.pre !== null && cell.post !== null ? cell.post - cell.pre : null
    }),
  )

  return {
    students,
    schools,
    summary: {
      students: students.length,
      schools: new Set(students.map((student) => student.school)).size,
      runs: filtered.length,
      avgCompletedMissions: round(students.reduce((sum, student) => sum + student.completedMissions, 0) / count),
      avgWorldsDone: round(students.reduce((sum, student) => sum + student.worldsDone, 0) / count),
      attempts: students.reduce((sum, student) => sum + student.attempts, 0),
      hints: students.reduce((sum, student) => sum + student.hints, 0),
      tutorial: {
        completed: students.filter((student) => student.tutorial?.status === 'completed').length,
        skipped: students.filter((student) => student.tutorial?.status === 'skipped').length,
        unfinished: students.filter((student) => student.tutorial === null).length,
      },
      avgGain: average(gains),
    },
    worldRows,
    topErrors,
  }
}
