import { itemsForForm } from '@/data/assessment/items'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { createInitialSave, recordAttempt, registerHint, storeAssessment } from '@/game/progress/progression'
import type { AttemptInput, SaveData } from '@/game/progress/types'
import type { ErrorCode } from '@/game/world/types'

const DEMO_ERRORS: ErrorCode[] = ['HIT_OBSTACLE', 'PLOT_OCCUPIED', 'WATER_WASTED', 'PLANT_NOT_MATURE', 'NO_WATER', 'PLOT_OCCUPIED']

export function createDemoSave(missions: MissionDefinition[]): SaveData {
  const refs = missions.map(({ id, order }) => ({ id, order }))
  let save = createInitialSave(refs, '2026-01-01T00:00:00.000Z')
  missions.forEach((mission, index) => {
    const failures = mission.tutorial ? 1 : 1 + (index % 3)
    for (let attempt = 0; attempt < failures; attempt += 1) {
      const input: AttemptInput = {
        missionId: mission.id,
        timestamp: `2026-01-0${1 + (index % 8)}T1${attempt}:00:00.000Z`,
        outcome: 'error',
        errorCode: DEMO_ERRORS[index % DEMO_ERRORS.length],
        actions: 4 + attempt,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 4 },
        efficiencyStars: null,
        pseudocode: '',
      }
      save = recordAttempt(save, input, refs)
    }
    if (index % 2 === 1) save = registerHint(save, mission.id)
    save = recordAttempt(
      save,
      {
        missionId: mission.id,
        timestamp: `2026-01-0${1 + (index % 8)}T15:00:00.000Z`,
        outcome: 'success',
        errorCode: null,
        actions: mission.efficiency.referenceActions + index,
        blocks: mission.efficiency.referenceBlocks + 1,
        usage: { seeds: 0, water: 0, energy: mission.efficiency.referenceActions },
        efficiencyStars: index % 3 === 0 ? 3 : 2,
        pseudocode: '',
      },
      refs,
    )
  })
  const pre = itemsForForm('pre')
  const post = itemsForForm('post')
  save = storeAssessment(save, {
    form: 'pre',
    startedAt: '2026-01-01T09:00:00.000Z',
    completedAt: '2026-01-01T09:10:00.000Z',
    skipped: false,
    answers: Object.fromEntries(pre.map((item, index) => [item.id, index % 2 === 0 ? item.correctIndex : (item.correctIndex + 1) % item.options.length])),
  })
  save = storeAssessment(save, {
    form: 'post',
    startedAt: '2026-01-09T09:00:00.000Z',
    completedAt: '2026-01-09T09:10:00.000Z',
    skipped: false,
    answers: Object.fromEntries(post.map((item, index) => [item.id, index % 5 === 4 ? (item.correctIndex + 1) % item.options.length : item.correctIndex])),
  })
  return save
}
