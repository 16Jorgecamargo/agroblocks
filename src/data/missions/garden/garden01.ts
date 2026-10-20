import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden01: MissionDefinition = {
  id: 'garden-01',
  order: 1,
  world: 'garden',
  slot: 1,
  title: 'Primeiros passos',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Sequência: o robô faz exatamente o que está nos blocos, um depois do outro, de cima para baixo.',
    goalText: 'O programa já leva o robô dois passos. Complete para ele chegar na planta madura e colher.',
  },
  map: { cells: ['. . . m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  initialProgram: program([act('moveForward'), act('moveForward')]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 4, referenceBlocks: 4 },
  hints: [
    'Conte quantas casas separam o robô da planta.',
    'Dois passos já estão prontos. Falta quanto para chegar?',
    'Depois de chegar, o robô precisa de um bloco de colheita.',
    'Adicione mais um "mover para frente" e depois "colher planta".',
  ],
  solutionExplanation: 'Três passos para a frente levam o robô até a planta, e só então "colher planta" funciona. A ordem dos blocos é a ordem das ações.',
  referenceSolution: program([act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')]),
  commonMistakes: {
    NOTHING_TO_HARVEST: 'O robô tentou colher antes de chegar na planta. Conte as casas de novo.',
  },
}
