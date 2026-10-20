import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard03: MissionDefinition = {
  id: 'orchard-03',
  order: 23,
  world: 'orchard',
  slot: 3,
  title: 'Plantar no vazio',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro: 'O sensor "o canteiro está vazio?" diz se ainda não há planta ali.',
    goalText: 'Plante só nos canteiros vazios da fileira. Os que já têm muda ficam como estão.',
  },
  map: { cells: ['. . s . s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [[1, 0], [2, 0], [3, 0], [4, 0]], state: 'seeded' }],
  efficiency: { referenceActions: 8, referenceBlocks: 6 },
  hints: [
    'Alguns canteiros já têm muda.',
    'Plantar onde já tem muda dá erro.',
    'Dentro do repita: andar e, se estiver vazio, preparar e plantar.',
    'repita 4: mover, se o canteiro está vazio?: preparar solo, plantar semente.',
  ],
  solutionExplanation: 'O "se" dentro do repita olha cada canteiro e só planta nos vazios.',
  referenceSolution: program([repeat(4, [act('moveForward'), ifThen(sensor('isPlotEmpty'), [act('prepareSoil'), act('plant')])])]),
  commonMistakes: {
    PLOT_OCCUPIED: 'Esse canteiro já tinha muda. Use o "se" para plantar só nos vazios.',
  },
}
