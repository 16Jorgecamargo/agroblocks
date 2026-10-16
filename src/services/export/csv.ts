import { itemsForForm } from '@/data/assessment/items'
import type { DashboardStats } from '@/features/dashboard/dashboardStats'
import { ASSESSMENT_CONCEPT_LABELS } from '@/game/assessment/types'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import type { AttemptOutcome, SaveData } from '@/game/progress/types'

const BOM = '\uFEFF'
const SEPARATOR = ';'
const NEWLINE = '\r\n'

function cell(value: string | number | null): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(SEPARATOR))
  return BOM + lines.join(NEWLINE) + NEWLINE
}

const OUTCOME_LABELS: Record<AttemptOutcome, string> = {
  success: 'sucesso',
  objectiveFailed: 'objetivo_nao_cumprido',
  error: 'erro',
}

export function attemptsCsv(save: SaveData, missions: MissionDefinition[]): string {
  const byId = new Map(missions.map((mission) => [mission.id, mission]))
  return toCsv(
    ['aluno', 'missao', 'fase', 'conceito', 'tentativa', 'data_hora', 'resultado', 'codigo_erro', 'comandos', 'blocos', 'sementes', 'agua', 'energia', 'dicas', 'eficiencia'],
    save.attempts.map((attempt) => {
      const mission = byId.get(attempt.missionId)
      return [
        save.student?.name ?? null,
        attempt.missionId,
        mission?.order ?? null,
        mission ? CONCEPT_LABELS[mission.concept] : null,
        attempt.attemptNumber,
        attempt.timestamp,
        OUTCOME_LABELS[attempt.outcome],
        attempt.errorCode,
        attempt.actions,
        attempt.blocks,
        attempt.usage.seeds,
        attempt.usage.water,
        attempt.usage.energy,
        attempt.hintsUsed,
        attempt.efficiencyStars,
      ]
    }),
  )
}

export function missionsCsv(stats: DashboardStats, studentName: string | null): string {
  return toCsv(
    ['aluno', 'missao', 'titulo', 'conceito', 'estado', 'tentativas', 'sucessos', 'erros', 'dicas', 'melhor_comandos', 'melhor_eficiencia'],
    stats.missions.map((row) => [
      studentName,
      row.missionId,
      row.title,
      row.conceptLabel,
      row.status,
      row.attempts,
      row.successes,
      row.errors,
      row.hintsUsed,
      row.bestActions,
      row.bestStars,
    ]),
  )
}

export function assessmentCsv(save: SaveData): string {
  const rows: (string | number | null)[][] = []
  for (const response of [save.assessments.pre, save.assessments.post]) {
    if (!response) continue
    if (response.skipped) {
      rows.push([save.student?.name ?? null, response.form, null, null, null, null, 'pulado'])
      continue
    }
    for (const item of itemsForForm(response.form)) {
      const answer = response.answers[item.id]
      rows.push([
        save.student?.name ?? null,
        response.form,
        item.id,
        item.pairId,
        ASSESSMENT_CONCEPT_LABELS[item.concept],
        answer === undefined ? null : answer,
        answer === item.correctIndex ? 'sim' : 'nao',
      ])
    }
  }
  return toCsv(['aluno', 'forma', 'item', 'par', 'conceito', 'resposta', 'correta'], rows)
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
