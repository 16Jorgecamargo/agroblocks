import { itemsFor } from '@/data/assessment/items'
import { SKILL_LABELS } from '@/game/assessment/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { toCsv } from '@/services/export/csv'

const OUTCOME = { success: 'sucesso', objectiveFailed: 'objetivo_nao_cumprido', error: 'erro' } as const

export function studentsCsv(rows: StudentRow[]): string {
  return toCsv(
    [
      'nome',
      'escola',
      'jogadas',
      'tutorial',
      'missoes_concluidas',
      'mundos_concluidos',
      'tentativas',
      'dicas',
      'erros',
      'ultimo_acesso',
      ...WORLD_IDS.flatMap((world) => [`${world}_missoes`, `${world}_pre`, `${world}_pos`]),
    ],
    rows.map((row) => [
      row.name,
      row.school,
      row.runCount,
      tutorialLabel(row.tutorial),
      row.completedMissions,
      row.worldsDone,
      row.attempts,
      row.hints,
      row.errors,
      row.lastSeen,
      ...WORLD_IDS.flatMap((world) => [row.worlds[world].completed, row.worlds[world].pre, row.worlds[world].post]),
    ]),
  )
}

export function attemptsCsv(rows: StudentRow[], missions: MissionDefinition[]): string {
  const byId = new Map(missions.map((mission) => [mission.id, mission]))
  return toCsv(
    ['nome', 'escola', 'jogada', 'missao', 'mundo', 'missao_numero', 'tentativa', 'data_hora', 'resultado', 'codigo_erro', 'comandos', 'blocos', 'dicas', 'eficiencia', 'pseudocodigo'],
    rows.flatMap((row) =>
      row.runs.flatMap((run) =>
        run.attempts.map((attempt) => [
          row.name,
          row.school,
          run.runId,
          attempt.missionId,
          byId.get(attempt.missionId)?.world ?? null,
          byId.get(attempt.missionId)?.slot ?? null,
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
      for (const world of WORLD_IDS) {
        for (const response of [run.assessments[world]?.pre, run.assessments[world]?.post]) {
          if (!response) continue
          for (const item of itemsFor(world, response.form)) {
            const answer = response.answers[item.id]
            lines.push([row.name, row.school, run.runId, world, response.form, item.id, SKILL_LABELS[item.skill], answer ?? null, answer === item.correctIndex ? 'sim' : 'nao'])
          }
        }
      }
    }
  }
  return toCsv(['nome', 'escola', 'jogada', 'mundo', 'forma', 'item', 'habilidade', 'resposta', 'correta'], lines)
}
