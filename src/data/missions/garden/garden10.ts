import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

const care = () => [act('prepareSoil'), act('plant'), act('water')]

export const garden10: MissionDefinition = {
  id: 'garden-10',
  order: 10,
  world: 'garden',
  slot: 10,
  title: 'Horta em L',
  concept: 'sequencing',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Desafio final da Horta: junte caminhada, curvas e cuidados numa sequência longa.',
    goalText: 'Prepare, plante e regue os três canteiros da horta em forma de L.',
  },
  map: { cells: ['. . . X', 'X X . X', 'X X . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [
    { kind: 'cellsInState', cells: [[1, 0], [2, 2], [3, 2]], state: 'seeded' },
    { kind: 'cellsWet', cells: [[1, 0], [2, 2], [3, 2]] },
  ],
  efficiency: { referenceActions: 16, referenceBlocks: 16 },
  hints: [
    'Os canteiros são: a casa logo à frente, a do fim da descida e a última à direita.',
    'Em cada canteiro: preparar, plantar, regar.',
    'No fim da fileira de cima, o robô precisa virar para descer.',
    'mover, cuidar, mover, virar à direita, mover, mover, cuidar, virar à esquerda, mover, cuidar.',
  ],
  solutionExplanation: 'O algoritmo alterna caminhada e cuidados, com duas curvas no L. Cada bloco no lugar certo faz a horta inteira.',
  referenceSolution: program([
    act('moveForward'),
    ...care(),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('moveForward'),
    ...care(),
    act('turnLeft'),
    act('moveForward'),
    ...care(),
  ]),
}
