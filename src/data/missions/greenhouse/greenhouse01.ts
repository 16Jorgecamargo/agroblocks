import { act, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse01: MissionDefinition = {
  id: 'greenhouse-01',
  order: 31,
  world: 'greenhouse',
  slot: 1,
  title: 'Até a parede',
  concept: 'sensors',
  difficulty: 1,
  briefing: {
    conceptIntro: 'O laço "enquanto" repete enquanto a condição for verdadeira. O robô não precisa saber quantas casas são.',
    goalText: 'O programa já tem um "enquanto não há obstáculo à frente". Coloque o passo dentro dele e colha a muda junto da parede.',
  },
  map: { cells: ['. . . . m #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  initialProgram: program([whileDo(not(sensor('isObstacleAhead')), [])]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 5, referenceBlocks: 5 },
  hints: [
    'Você não precisa contar as casas.',
    'O laço já pergunta se há obstáculo à frente.',
    'Coloque "mover para frente" dentro do enquanto.',
    'Depois do laço, colha a planta.',
  ],
  solutionExplanation: 'O enquanto anda até a parede, seja ela perto ou longe. A colheita vem depois, uma vez só.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward')]), act('harvest')]),
}
