import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield01: MissionDefinition = {
  id: 'cornfield-01',
  order: 11,
  world: 'cornfield',
  slot: 1,
  title: 'Andar com repita',
  concept: 'repetition',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Repetição: quando o robô faz a mesma coisa várias vezes, o bloco "repita" faz por você.',
    goalText: 'O programa já tem um "repita 5 vezes" vazio. Coloque o passo dentro dele e colha o milho no fim da fileira.',
  },
  map: { cells: ['. . . . . m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  initialProgram: program([repeat(5, [])]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 6, referenceBlocks: 3 },
  hints: [
    'O milho está 5 casas à frente.',
    'O "repita 5 vezes" já está pronto, mas está vazio.',
    'Coloque "mover para frente" dentro do repita.',
    'Depois do repita, ainda falta colher.',
  ],
  solutionExplanation: 'O repita fez cinco passos com um bloco só. A colheita fica fora do laço porque só acontece uma vez.',
  referenceSolution: program([repeat(5, [act('moveForward')]), act('harvest')]),
  commonMistakes: {
    NOTHING_TO_HARVEST: 'O robô colheu antes de chegar. Confira o que está dentro do repita.',
  },
}
