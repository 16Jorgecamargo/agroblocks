import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard05: MissionDefinition = {
  id: 'orchard-05',
  order: 25,
  world: 'orchard',
  slot: 5,
  title: 'Colher só as maduras',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Numa fileira misturada, o "se" escolhe o que fazer em cada casa.',
    goalText: 'Colha só as frutas maduras. As que ainda estão crescendo ficam na árvore.',
  },
  map: { cells: ['. m g m g m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 3 }],
  efficiency: { referenceActions: 8, referenceBlocks: 5 },
  hints: [
    'Colher uma fruta verde dá erro.',
    'Passe por todas as árvores com um repita.',
    'Em cada árvore, pergunte se a planta está madura.',
    'repita 5: mover, se a planta está madura?: colher planta.',
  ],
  solutionExplanation: 'O repita passa por todas as árvores; o "se" colhe só as maduras.',
  referenceSolution: program([repeat(5, [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])]),
  commonMistakes: {
    PLANT_NOT_MATURE: 'Essa fruta ainda está verde. Coloque a colheita dentro de um "se".',
  },
}
