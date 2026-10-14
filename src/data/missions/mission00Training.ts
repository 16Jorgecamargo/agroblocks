import { act, program } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const mission00Training: MissionDefinition = {
  id: 'm0-training',
  order: 0,
  title: 'Treinamento',
  concept: 'interface',
  difficulty: 1,
  tutorial: true,
  briefing: {
    conceptIntro:
      'Um programa é uma lista de instruções que o robô segue, uma de cada vez, de cima para baixo. Neste treinamento você vai aprender a montar, executar e corrigir um programa.',
    goalText: 'Leve o robô até a planta madura e colha.',
  },
  map: { cells: ['. . . . .', '. . m # .', '. . . . .'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 3,
  rules: {},
  allowedBlocks: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right', 'farm_harvest'],
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 3, referenceBlocks: 3 },
  hints: [
    'O robô segue os blocos na ordem em que estão encaixados, de cima para baixo.',
    'Conte quantas casas existem entre o robô e a planta.',
    'Use os blocos da categoria Movimento e depois o bloco "colher planta" (Agricultura).',
    'Exemplo: mover para frente, mover para frente, colher planta.',
  ],
  solutionExplanation:
    'O robô andou duas casas até a planta e então colheu. Cada bloco virou exatamente uma ação, na ordem em que foi encaixado.',
  referenceSolution: program([act('moveForward'), act('moveForward'), act('harvest')]),
  commonMistakes: {
    HIT_OBSTACLE: 'O robô passou da planta e bateu na pedra. Remova um bloco "mover para frente".',
  },
}
