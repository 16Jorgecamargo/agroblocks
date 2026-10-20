import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

const care = () => [act('prepareSoil'), act('plant'), act('water')]

export const garden05: MissionDefinition = {
  id: 'garden-05',
  order: 5,
  world: 'garden',
  slot: 5,
  title: 'Dois canteiros',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Uma sequência pode ter partes que se repetem. Por enquanto, monte cada parte bloco por bloco.',
    goalText: 'Cuide dos dois canteiros marcados: prepare, plante e regue cada um.',
  },
  map: { cells: ['. . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [
    { kind: 'cellsInState', cells: [[2, 0], [4, 0]], state: 'seeded' },
    { kind: 'cellsWet', cells: [[2, 0], [4, 0]] },
  ],
  efficiency: { referenceActions: 10, referenceBlocks: 10 },
  hints: [
    'Os canteiros ficam na 3ª e na 5ª casa.',
    'O que você fez no primeiro canteiro vale para o segundo.',
    'Entre os canteiros o robô precisa andar duas casas.',
    'mover, mover, preparar, plantar, regar, mover, mover, preparar, plantar, regar.',
  ],
  solutionExplanation: 'A sequência de cuidados aparece duas vezes, com uma caminhada no meio. Repare no padrão: no Milharal você vai aprender a escrever isso com menos blocos.',
  referenceSolution: program([act('moveForward'), act('moveForward'), ...care(), act('moveForward'), act('moveForward'), ...care()]),
}
