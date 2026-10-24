import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse03: MissionDefinition = {
  id: 'greenhouse-03',
  order: 18,
  world: 'greenhouse',
  slot: 3,
  title: 'Programa curto',
  concept: 'sensors',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Com o enquanto, um programa curto cuida de uma fileira inteira.',
    goalText: 'Colha as mudas maduras até a parede usando no máximo 7 blocos.',
  },
  map: { cells: ['. m g m m g m #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: { maxBlocks: 7 },
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 4 }],
  efficiency: { referenceActions: 10, referenceBlocks: 7 },
  hints: [
    'Sem laço o programa fica enorme.',
    'Algumas mudas ainda estão crescendo.',
    'enquanto + se cabem em 7 blocos.',
    'enquanto não há obstáculo: mover, se madura: colher.',
  ],
  solutionExplanation: 'Sete blocos percorrem a fileira inteira e colhem só as maduras.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])]),
}
