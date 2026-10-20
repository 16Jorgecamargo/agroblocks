import type { SaveData } from '@/game/progress/types'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { studentKeyOf } from '@/shared/student'

export function toSnapshot(save: SaveData, now: string): RunSnapshot | null {
  if (!save.runId || !save.student) return null
  const missions: RunSnapshot['missions'] = {}
  for (const [id, progress] of Object.entries(save.missions)) {
    const { savedProgram: _dropped, ...rest } = progress
    missions[id] = rest
  }
  return {
    runId: save.runId,
    student: save.student,
    studentKey: studentKeyOf(save.student),
    createdAt: save.createdAt,
    updatedAt: now,
    tutorial: save.tutorial,
    missions,
    attempts: save.attempts,
    assessments: { pre: save.assessments.garden.pre, post: save.assessments.homestead.post },
  }
}
