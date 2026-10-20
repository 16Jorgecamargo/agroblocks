import { act, changeVar, compare, program, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard02: MissionDefinition = {
  id: 'barnyard-02',
  order: 42,
  world: 'barnyard',
  slot: 2,
  title: 'Contar os passos',
  concept: 'variables',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Uma variável pode contar: comece em 0 e some 1 a cada passo.',
    goalText: 'Use a variável "passos" para andar exatamente 5 casas e colha o grão.',
  },
  map: { cells: ['. . . . . m . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 6, referenceBlocks: 7 },
  hints: [
    'Comece com "passos" valendo 0.',
    'A cada passo, some 1 em "passos".',
    'Repita enquanto "passos" for menor que 5.',
    'definir passos = 0; enquanto passos < 5: mover, mudar passos por 1; colher.',
  ],
  solutionExplanation: 'O contador sobe de 0 até 5 e o laço para sozinho. Contar é um dos usos mais comuns de variáveis.',
  referenceSolution: program([setVar('passos', 0), whileDo(compare('LT', variable('passos'), 5), [act('moveForward'), changeVar('passos', 1)]), act('harvest')]),
}
