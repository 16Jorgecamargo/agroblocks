import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden09: MissionDefinition = {
  id: 'garden-09',
  order: 9,
  world: 'garden',
  slot: 9,
  title: 'Consertar a curva',
  concept: 'sequencing',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Consertar um programa também é programar: execute, veja onde o robô errou e troque o bloco certo.',
    goalText: 'Este programa tem um erro. Execute, descubra qual bloco está errado e conserte para colher a planta.',
  },
  map: { cells: ['. . . m', '. # . .'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  initialProgram: program([act('turnRight'), act('moveForward'), act('turnRight'), act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 7, referenceBlocks: 7 },
  hints: [
    'Execute uma vez e observe para onde o robô vai no primeiro passo.',
    'A planta está acima do robô. Para subir, ele precisa virar para qual lado?',
    'Só um bloco está errado.',
    'Troque o primeiro "virar à direita" por "virar à esquerda".',
  ],
  solutionExplanation: 'Virado para a direita, o robô sobe virando à esquerda. Uma única curva para o lado errado mandava o robô para fora da horta.',
  referenceSolution: program([act('turnLeft'), act('moveForward'), act('turnRight'), act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')]),
  commonMistakes: {
    OUT_OF_BOUNDS: 'O robô saiu da horta. Confira o lado da primeira curva.',
  },
}
