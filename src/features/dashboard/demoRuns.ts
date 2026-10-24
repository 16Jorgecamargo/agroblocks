import { itemsFor } from '@/data/assessment/items'
import { WORLDS } from '@/data/worlds'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { ITEMS_PER_FORM } from '@/game/assessment/types'
import { MISSIONS_PER_WORLD, type WorldId } from '@/game/worlds/worldTypes'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { studentKeyOf } from '@/shared/student'

interface DemoPerson {
  name: string
  school: string
  reached: number
  pre: number | null
  post: number | null
  tutorial: 'completed' | 'skipped' | null
}

const PEOPLE: readonly DemoPerson[] = [
  { name: 'Ana Souza', school: 'E.E. Monteiro Lobato', reached: 30, pre: 2, post: 4, tutorial: 'completed' },
  { name: 'Bruno Lima', school: 'E.E. Monteiro Lobato', reached: 22, pre: 1, post: 3, tutorial: 'completed' },
  { name: 'Carla Mendes', school: 'E.E. Monteiro Lobato', reached: 3, pre: 2, post: 4, tutorial: 'skipped' },
  { name: 'Diego Rocha', school: 'Colégio Estadual Rio Verde', reached: 18, pre: 1, post: 4, tutorial: 'completed' },
  { name: 'Eduarda Alves', school: 'Colégio Estadual Rio Verde', reached: 6, pre: 3, post: 4, tutorial: null },
  { name: 'Felipe Costa', school: 'Escola Técnica Agrícola', reached: 14, pre: 3, post: 5, tutorial: 'completed' },
  { name: 'Gabriela Nunes', school: 'Escola Técnica Agrícola', reached: 1, pre: null, post: null, tutorial: 'skipped' },
]

const ERRORS = ['HIT_OBSTACLE', 'PLOT_OCCUPIED', 'WATER_WASTED', 'PLANT_NOT_MATURE', 'NO_WATER']

function answers(world: WorldId, form: 'pre' | 'post', correct: number): Record<string, number> {
  return Object.fromEntries(itemsFor(world, form).map((item, index) => [item.id, index < correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
}

function demoRun(person: DemoPerson, index: number, missions: MissionDefinition[], runIndex: number): RunSnapshot {
  const ordered = [...missions].sort((a, b) => a.order - b.order)
  const start = Date.UTC(2026, 8, 10 + index, 8, 0, 0)
  const at = (step: number) => new Date(start + step * 10 * 60 * 1000).toISOString()
  const attempts: RunSnapshot['attempts'] = []
  const progress: RunSnapshot['missions'] = {}
  ordered.forEach((mission, position) => {
    const done = position <= person.reached
    const failures = done ? (index + position) % 3 : position === person.reached + 1 ? 1 + (index % 3) : 0
    for (let attempt = 0; attempt < failures; attempt += 1) {
      attempts.push({
        id: `demo-${index}-${runIndex}-${mission.id}-${attempt}`,
        missionId: mission.id,
        attemptNumber: attempt + 1,
        timestamp: at(position),
        outcome: 'error',
        errorCode: ERRORS[(index + position + attempt) % ERRORS.length],
        actions: 4 + attempt,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 4 },
        hintsUsed: position % 2,
        efficiencyStars: null,
        pseudocode: 'quando executar:\n    mover para frente\n    mover para frente',
      })
    }
    const stars = (((index + position) % 3) + 1) as 1 | 2 | 3
    if (done) {
      attempts.push({
        id: `demo-${index}-${runIndex}-${mission.id}-ok`,
        missionId: mission.id,
        attemptNumber: failures + 1,
        timestamp: at(position),
        outcome: 'success',
        errorCode: null,
        actions: 6,
        blocks: 5,
        usage: { seeds: 1, water: 1, energy: 6 },
        hintsUsed: position % 2,
        efficiencyStars: stars,
        pseudocode: 'quando executar:\n    mover para frente\n    colher planta',
      })
    }
    progress[mission.id] = {
      status: done ? 'completed' : position === person.reached + 1 ? 'available' : 'locked',
      attempts: failures + (done ? 1 : 0),
      bestResult: done ? { actions: 6, blocks: 5, usage: { seeds: 1, water: 1, energy: 6 }, efficiencyStars: stars } : null,
      hintsUsed: position % 2,
      errorCounts: {},
    }
  })
  const response = (world: WorldId, form: 'pre' | 'post', correct: number | null) =>
    correct === null ? null : { world, form, startedAt: at(0), completedAt: at(0), skipped: false, answers: answers(world, form, correct) }
  const assessments = Object.fromEntries(
    WORLDS.map((world) => {
      const entered = person.reached >= (world.order - 1) * MISSIONS_PER_WORLD
      const finished = person.reached >= world.order * MISSIONS_PER_WORLD
      const pre = person.pre === null ? null : Math.min(ITEMS_PER_FORM, person.pre + ((world.order + index) % 3))
      const post = person.post === null || pre === null ? null : Math.min(ITEMS_PER_FORM, Math.max(pre, person.post + ((world.order + index) % 2)))
      return [world.id, { pre: entered ? response(world.id, 'pre', pre) : null, post: finished ? response(world.id, 'post', post) : null }]
    }),
  ) as RunSnapshot['assessments']
  return {
    runId: `demo-run-${index}-${runIndex}`,
    student: { name: person.name, school: person.school },
    studentKey: studentKeyOf(person),
    createdAt: at(0),
    updatedAt: at(70 + runIndex),
    tutorial: person.tutorial ? { status: person.tutorial, step: person.tutorial === 'completed' ? 15 : 3 + index, at: at(1) } : null,
    missions: progress,
    attempts,
    assessments,
  }
}

export function createDemoRuns(missions: MissionDefinition[]): RunSnapshot[] {
  const runs = PEOPLE.map((person, index) => demoRun(person, index, missions, 0))
  runs.push(demoRun({ ...PEOPLE[1], reached: 1, post: null, tutorial: 'skipped' }, 1, missions, 1))
  return runs
}
