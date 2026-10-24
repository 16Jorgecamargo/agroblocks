import { act, program } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden02: MissionDefinition = {
  id: 'garden-02',
  order: 2,
  world: 'garden',
  slot: 2,
  title: 'Primeira colheita',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro:
      'Sequenciamento: a ordem das instruções muda o resultado. O robô não adivinha o caminho — ele executa exatamente o que você montar.',
    goalText: 'Leve o robô até a planta madura no alto do mapa e colha.',
    demo: program([act('moveForward'), act('turnLeft'), act('turnRight')]),
  },
  map: { cells: ['. . . . .', '. . . m .', '. . # . .', '. # . . .', '. . . . .'] },
  robot: { x: 0, y: 4, facing: 'N' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 3,
  rules: {},
  allowedBlocks: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right', 'farm_harvest'],
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 8, referenceBlocks: 8 },
  hints: [
    'Planeje o caminho inteiro antes de montar os blocos.',
    'O robô começa virado para cima. Em que ponto ele precisa virar?',
    'Você vai precisar de blocos de Movimento (mover e virar) e de "colher planta".',
    'Comece com: mover para frente, mover para frente, mover para frente, virar à direita...',
  ],
  solutionExplanation:
    'O algoritmo é uma sequência: três passos para cima, uma virada à direita, três passos para a direita e a colheita. Trocar a ordem de qualquer bloco leva o robô a outro lugar.',
  referenceSolution: program([
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('harvest'),
  ]),
  commonMistakes: {
    HIT_OBSTACLE: 'Há pedras no meio da fazenda. Suba pela coluna da esquerda antes de virar.',
    NOTHING_TO_HARVEST: 'O robô colheu no lugar errado. Confira se ele chegou na planta antes do bloco "colher".',
  },
}
