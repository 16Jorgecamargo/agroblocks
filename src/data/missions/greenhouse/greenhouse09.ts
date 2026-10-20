import { act, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse09: MissionDefinition = {
  id: 'greenhouse-09',
  order: 39,
  world: 'greenhouse',
  slot: 9,
  title: 'Consertar o laço',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Se a condição do enquanto estiver invertida, o laço nem começa ou nunca para.',
    goalText: 'Este programa tem um erro. Execute, descubra o problema do laço e conserte para colher a muda junto da parede.',
  },
  map: { cells: ['. . . m #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  initialProgram: program([whileDo(sensor('isObstacleAhead'), [act('moveForward')]), act('harvest')]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 4, referenceBlocks: 5 },
  hints: [
    'Execute: o robô andou?',
    'O laço só roda enquanto a condição é verdadeira.',
    'Falta um "não" na condição.',
    'Use "enquanto não há obstáculo à frente".',
  ],
  solutionExplanation: 'Sem o "não", o laço só andaria se já houvesse obstáculo, então nunca começava. Com o "não", ele anda até a parede.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward')]), act('harvest')]),
  commonMistakes: {
    NOTHING_TO_HARVEST: 'O robô ficou parado. Confira a condição do enquanto.',
  },
}
