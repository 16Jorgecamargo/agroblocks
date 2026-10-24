import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard04: MissionDefinition = {
  id: 'orchard-04',
  order: 14,
  world: 'orchard',
  slot: 4,
  title: 'Consertar a pergunta',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Um "se" com a pergunta errada faz o robô agir na hora errada.',
    goalText: 'Este programa tem um erro. Execute, descubra qual sensor está errado e conserte para colher as maduras.',
  },
  map: { cells: ['. m g m g'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  initialProgram: program([repeat(4, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('harvest')])])]),
  objectives: [{ kind: 'harvestAtLeast', count: 2 }],
  efficiency: { referenceActions: 6, referenceBlocks: 5 },
  hints: [
    'Execute e veja em qual árvore o robô para.',
    'O "se" pergunta sobre o solo, mas o que importa aqui é a fruta.',
    'Só o sensor está errado.',
    'Troque "o solo está seco?" por "a planta está madura?".',
  ],
  solutionExplanation: 'Todas as árvores tinham solo seco, então o "se" deixava o robô colher frutas verdes. A pergunta certa é sobre a fruta.',
  referenceSolution: program([repeat(4, [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])]),
  commonMistakes: {
    PLANT_NOT_MATURE: 'A fruta ainda está verde. Confira a pergunta do "se".',
  },
}
