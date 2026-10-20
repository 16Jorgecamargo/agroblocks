import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden06: MissionDefinition = {
  id: 'garden-06',
  order: 6,
  world: 'garden',
  slot: 6,
  title: 'Contornar a pedra',
  concept: 'sequencing',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Quando há um obstáculo, a sequência precisa de curvas: virar também é um passo do algoritmo.',
    goalText: 'Desvie da pedra e colha a planta madura do outro lado.',
  },
  map: { cells: ['. . . . .', '. . # . m', '. . . . .'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 11, referenceBlocks: 11 },
  hints: [
    'A pedra está bem no caminho. Passe por cima ou por baixo dela.',
    'Virar não gasta energia, mas conta como um passo do programa.',
    'Depois de passar a pedra, o robô precisa voltar para a linha da planta.',
    'mover, virar à esquerda, mover, virar à direita, mover, mover, virar à direita, mover, virar à esquerda, mover, colher.',
  ],
  solutionExplanation: 'O robô sobe uma linha, passa ao lado da pedra e desce de volta. Cada curva muda para onde o próximo "mover" leva.',
  referenceSolution: program([
    act('moveForward'),
    act('turnLeft'),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('turnLeft'),
    act('moveForward'),
    act('harvest'),
  ]),
  commonMistakes: {
    HIT_OBSTACLE: 'O robô bateu na pedra. Vire antes de chegar nela.',
  },
}
