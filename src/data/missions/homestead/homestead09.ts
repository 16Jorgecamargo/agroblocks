import { act, call, program } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead09: MissionDefinition = {
  id: 'homestead-09',
  order: 59,
  world: 'homestead',
  slot: 9,
  title: 'Consertar a chamada',
  concept: 'efficiency',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Chamar um procedimento na hora errada faz o trabalho acontecer no lugar errado.',
    goalText: 'Este programa tem um erro. Execute, veja onde o robô cuida e conserte para cuidar dos dois canteiros à frente.',
  },
  map: { cells: ['. . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  initialProgram: program([call('cuidar'), act('moveForward'), act('moveForward')], { cuidar: [act('prepareSoil'), act('plant'), act('water')] }),
  objectives: [{ kind: 'cellsInState', cells: [[1, 0], [2, 0]], state: 'seeded' }, { kind: 'cellsWet', cells: [[1, 0], [2, 0]] }],
  efficiency: { referenceActions: 8, referenceBlocks: 8 },
  hints: [
    'Execute e veja em qual casa o robô cuida primeiro.',
    'O robô cuidou da casa onde começou.',
    'Ande antes de chamar "cuidar".',
    'mover, cuidar, mover, cuidar.',
  ],
  solutionExplanation: 'O procedimento estava certo; o problema era a ordem da chamada no programa principal.',
  referenceSolution: program([act('moveForward'), call('cuidar'), act('moveForward'), call('cuidar')], { cuidar: [act('prepareSoil'), act('plant'), act('water')] }),
}
