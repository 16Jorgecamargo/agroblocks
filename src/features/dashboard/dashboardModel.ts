import { itemsForForm } from '@/data/assessment/items'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { ERROR_TEXT } from '@/game/rules/errors'
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

export interface StudentRow {
  key: string
  name: string
  school: string
  runs: RunSnapshot[]
  runCount: number
  tutorial: TutorialRecord | null
  completedPhases: number
  attempts: number
  hints: number
  errors: number
  pre: number | null
  post: number | null
  gain: number | null
  lastSeen: string
  plots: Record<string, Plot>
}

export interface PhaseRow {
  missionId: string
  title: string
  completed: number
  attemptsPerStudent: number
  hintsPerStudent: number
  stars: [number, number, number]
}

export interface DashboardModel {
  students: StudentRow[]
  schools: string[]
  summary: {
    students: number
    schools: number
    runs: number
    avgCompletedPhases: number
    attempts: number
    hints: number
    tutorial: { completed: number; skipped: number; unfinished: number }
    avgPre: number | null
    avgPost: number | null
    avgGain: number | null
  }
  phases: PhaseRow[]
  topErrors: { code: string; label: string; count: number }[]
  schoolScores: { school: string; pre: number | null; post: number | null }[]
}

export function scoreAssessment(response: RunSnapshot['assessments']['pre']): number | null {
  if (!response || response.skipped) return null
  return itemsForForm(response.form).filter((item) => response.answers[item.id] === item.correctIndex).length
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

function studentRow(key: string, runs: RunSnapshot[], phaseIds: Set<string>, missionIds: string[]): StudentRow {
  const ordered = [...runs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const newest = ordered[0]
  const attempts = ordered.flatMap((run) => run.attempts)
  const pre = firstWith(ordered, (run) => scoreAssessment(run.assessments.pre))
  const post = firstWith(ordered, (run) => scoreAssessment(run.assessments.post))
  return {
    key,
    name: cleanText(newest.student.name),
    school: cleanText(newest.student.school),
    runs: ordered,
    runCount: ordered.length,
    tutorial: firstWith(ordered, (run) => run.tutorial),
    completedPhases: Math.max(...ordered.map((run) => Object.entries(run.missions).filter(([id, progress]) => phaseIds.has(id) && progress.status === 'completed').length)),
    attempts: attempts.length,
    hints: ordered.reduce((sum, run) => sum + Object.values(run.missions).reduce((inner, progress) => inner + progress.hintsUsed, 0), 0),
    errors: attempts.filter((attempt) => attempt.outcome !== 'success').length,
    pre,
    post,
    gain: pre !== null && post !== null ? post - pre : null,
    lastSeen: newest.updatedAt,
    plots: Object.fromEntries(missionIds.map((id) => [id, plotOf(ordered, id)])),
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
  const missionIds = missions.map((mission) => mission.id)
  const phaseIds = new Set(missions.filter((mission) => !mission.tutorial).map((mission) => mission.id))
  const students = [...groups.entries()].map(([key, group]) => studentRow(key, group, phaseIds, missionIds)).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
  const count = Math.max(1, students.length)

  const phases: PhaseRow[] = [...missions]
    .sort((a, b) => a.order - b.order)
    .map((mission) => {
      const stars: [number, number, number] = [0, 0, 0]
      let completed = 0
      let attempts = 0
      let hints = 0
      for (const student of students) {
        const progress = student.runs.map((run) => run.missions[mission.id]).filter((item) => item !== undefined)
        if (progress.some((item) => item.status === 'completed')) completed += 1
        attempts += student.runs.reduce((sum, run) => sum + run.attempts.filter((attempt) => attempt.missionId === mission.id).length, 0)
        hints += progress.reduce((sum, item) => sum + item.hintsUsed, 0)
        const best = Math.max(0, ...progress.map((item) => item.bestResult?.efficiencyStars ?? 0))
        if (best > 0) stars[best - 1] += 1
      }
      return { missionId: mission.id, title: mission.title, completed, attemptsPerStudent: round(attempts / count), hintsPerStudent: round(hints / count), stars }
    })

  const errorCounts = new Map<string, number>()
  for (const run of filtered) for (const attempt of run.attempts) if (attempt.errorCode) errorCounts.set(attempt.errorCode, (errorCounts.get(attempt.errorCode) ?? 0) + 1)
  const topErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, total]) => ({ code, label: ERROR_TEXT[code as keyof typeof ERROR_TEXT]?.message ?? code, count: total }))

  const bySchool = new Map<string, StudentRow[]>()
  for (const student of students) bySchool.set(student.school, [...(bySchool.get(student.school) ?? []), student])

  return {
    students,
    schools,
    summary: {
      students: students.length,
      schools: bySchool.size,
      runs: filtered.length,
      avgCompletedPhases: round(students.reduce((sum, student) => sum + student.completedPhases, 0) / count),
      attempts: students.reduce((sum, student) => sum + student.attempts, 0),
      hints: students.reduce((sum, student) => sum + student.hints, 0),
      tutorial: {
        completed: students.filter((student) => student.tutorial?.status === 'completed').length,
        skipped: students.filter((student) => student.tutorial?.status === 'skipped').length,
        unfinished: students.filter((student) => student.tutorial === null).length,
      },
      avgPre: average(students.map((student) => student.pre)),
      avgPost: average(students.map((student) => student.post)),
      avgGain: average(students.map((student) => student.gain)),
    },
    phases,
    topErrors,
    schoolScores: [...bySchool.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
      .map(([school, group]) => ({ school, pre: average(group.map((student) => student.pre)), post: average(group.map((student) => student.post)) })),
  }
}
