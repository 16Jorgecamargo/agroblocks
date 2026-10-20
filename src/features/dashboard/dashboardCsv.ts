import { itemsForForm } from '@/data/assessment/items'
import { SKILL_LABELS } from '@/game/assessment/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { toCsv } from '@/services/export/csv'

const OUTCOME = { success: 'sucesso', objectiveFailed: 'objetivo_nao_cumprido', error: 'erro' } as const

export function studentsCsv(rows: StudentRow[]): string {
  return toCsv(
    ['nome', 'escola', 'jogadas', 'tutorial', 'fases_concluidas', 'tentativas', 'dicas', 'erros', 'pre', 'pos', 'ganho', 'ultimo_acesso'],
    rows.map((row) => [row.name, row.school, row.runCount, tutorialLabel(row.tutorial), row.completedPhases, row.attempts, row.hints, row.errors, row.pre, row.post, row.gain, row.lastSeen]),
  )
}

export function attemptsCsv(rows: StudentRow[], missions: MissionDefinition[]): string {
  const byId = new Map(missions.map((mission) => [mission.id, mission]))
  return toCsv(
    ['nome', 'escola', 'jogada', 'missao', 'fase', 'tentativa', 'data_hora', 'resultado', 'codigo_erro', 'comandos', 'blocos', 'dicas', 'eficiencia', 'pseudocodigo'],
    rows.flatMap((row) =>
      row.runs.flatMap((run) =>
        run.attempts.map((attempt) => [
          row.name,
          row.school,
          run.runId,
          attempt.missionId,
          byId.get(attempt.missionId)?.order ?? null,
          attempt.attemptNumber,
          attempt.timestamp,
          OUTCOME[attempt.outcome],
          attempt.errorCode,
          attempt.actions,
          attempt.blocks,
          attempt.hintsUsed,
          attempt.efficiencyStars,
          attempt.pseudocode,
        ]),
      ),
    ),
  )
}

export function assessmentsCsv(rows: StudentRow[]): string {
  const lines: (string | number | null)[][] = []
  for (const row of rows) {
    for (const run of row.runs) {
      for (const response of [run.assessments.garden.pre, run.assessments.garden.post]) {
        if (!response) continue
        if (response.skipped) {
          lines.push([row.name, row.school, run.runId, response.form, null, null, null, 'pulado'])
          continue
        }
        for (const item of itemsForForm(response.form)) {
          const answer = response.answers[item.id]
          lines.push([row.name, row.school, run.runId, response.form, item.id, SKILL_LABELS[item.skill], answer ?? null, answer === item.correctIndex ? 'sim' : 'nao'])
        }
      }
    }
  }
  return toCsv(['nome', 'escola', 'jogada', 'forma', 'item', 'conceito', 'resposta', 'correta'], lines)
}
