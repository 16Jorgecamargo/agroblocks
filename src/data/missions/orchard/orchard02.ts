import { act, ifThen, program, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard02: MissionDefinition = {
  id: 'orchard-02',
  order: 22,
  world: 'orchard',
  slot: 2,
  title: 'Regar só se precisar',
  concept: 'conditionals',
  difficulty: 1,
  briefing: {
    conceptIntro: 'O sensor "o solo está seco?" responde sim ou não. Use-o no "se" para regar só quando precisa.',
    goalText: 'Ande até a muda e regue só se o solo estiver seco.',
  },
  map: { cells: ['. s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'cellsWet', cells: [[1, 0]] }],
  efficiency: { referenceActions: 2, referenceBlocks: 4 },
  hints: [
    'Primeiro o robô vai até a muda.',
    'Antes de regar, verifique se o solo está seco.',
    'Use "se" com o sensor "o solo está seco?".',
    'mover, se o solo está seco?: regar canteiro.',
  ],
  solutionExplanation: 'Regar dentro do "se" evita desperdício: se o solo já estivesse molhado, o robô não regaria.',
  referenceSolution: program([act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])]),
}
