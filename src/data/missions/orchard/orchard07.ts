import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard07: MissionDefinition = {
  id: 'orchard-07',
  order: 27,
  world: 'orchard',
  slot: 7,
  title: 'Sem desperdício',
  concept: 'conditionals',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Regar solo molhado desperdiça água e aqui é proibido.',
    goalText: 'Deixe todos os canteiros molhados sem regar nenhum que já esteja molhado.',
  },
  map: { cells: ['. s sw s sw s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: { forbidWaterWet: true },
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'cellsWet', cells: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] }],
  efficiency: { referenceActions: 8, referenceBlocks: 5 },
  hints: [
    'Alguns canteiros já estão molhados.',
    'Regar um canteiro molhado para o programa com erro.',
    'Pergunte se o solo está seco antes de regar.',
    'repita 5: mover, se o solo está seco?: regar canteiro.',
  ],
  solutionExplanation: 'Só os 3 canteiros secos recebem água; os molhados são deixados como estão.',
  referenceSolution: program([repeat(5, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
  commonMistakes: {
    WATER_WASTED: 'Esse canteiro já estava molhado. Regue só se o solo estiver seco.',
  },
}
