import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard10: MissionDefinition = {
  id: 'orchard-10',
  order: 30,
  world: 'orchard',
  slot: 10,
  title: 'Pomar completo',
  concept: 'conditionals',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Desafio final do Pomar: laços e condições juntos para cuidar de um pomar inteiro.',
    goalText: 'Em cada casa do pomar 3×3: colha se estiver madura, senão regue se estiver seca. O robô volta pela coluna da esquerda a cada fileira.',
  },
  map: { cells: ['. m s m', '. s m g', '. g s m', '. X X X'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 4 }, { kind: 'cellsWet', cells: [[2, 0], [1, 1], [2, 2]] }],
  efficiency: { referenceActions: 42, referenceBlocks: 16 },
  hints: [
    'Cada casa pode estar madura, com muda ou crescendo.',
    'Depois de cada fileira, volte pela esquerda e desça uma casa.',
    'Coloque um "se" dentro do "senão" de outro "se".',
    'repita 3: (repita 3: mover, se madura?: colher, senão: se seco?: regar), meia-volta, repita 3: mover, virar à esquerda, mover, virar à esquerda.',
  ],
  solutionExplanation: 'Dois repita percorrem o pomar e dois "se" decidem o que fazer em cada árvore.',
  referenceSolution: program([repeat(3, [repeat(3, [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [ifThen(sensor('isSoilDry'), [act('water')])])]), act('turnRight'), act('turnRight'), repeat(3, [act('moveForward')]), act('turnLeft'), act('moveForward'), act('turnLeft')])]),
}
