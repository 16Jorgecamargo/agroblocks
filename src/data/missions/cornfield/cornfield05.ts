import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rectCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield05: MissionDefinition = {
  id: 'cornfield-05',
  order: 10,
  world: 'cornfield',
  slot: 5,
  title: 'Quadrado de milho',
  concept: 'repetition',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Desafio final do Milharal: um repita dentro de outro cobre linhas e colunas.',
    goalText: 'Prepare e plante as 9 casas do quadrado 3×3. O robô volta pela coluna da esquerda a cada fileira.',
  },
  map: { cells: ['. . . .', '. . . .', '. . . .', '. X X X'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rectCells(1, 0, 3, 3), state: 'seeded' }],
  efficiency: { referenceActions: 51, referenceBlocks: 12 },
  hints: [
    'Cada fileira pede o mesmo trabalho: 3 vezes andar, preparar e plantar.',
    'Depois de cada fileira o robô volta para a coluna da esquerda e desce uma casa.',
    'O trabalho de uma fileira inteira vai dentro de outro repita.',
    'repita 3: (repita 3: mover, preparar, plantar), meia-volta, repita 3: mover, virar à esquerda, mover, virar à esquerda.',
  ],
  solutionExplanation: 'O repita de dentro planta uma fileira; o de fora repete isso três vezes, levando o robô para a fileira seguinte.',
  referenceSolution: program([repeat(3, [repeat(3, [act('moveForward'), act('prepareSoil'), act('plant')]), act('turnRight'), act('turnRight'), repeat(3, [act('moveForward')]), act('turnLeft'), act('moveForward'), act('turnLeft')])]),
}
