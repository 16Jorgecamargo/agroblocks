import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield05: MissionDefinition = {
  id: 'cornfield-05',
  order: 15,
  world: 'cornfield',
  slot: 5,
  title: 'Milho em intervalos',
  concept: 'repetition',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Padrões regulares cabem num repita, mesmo quando há casas vazias no meio.',
    goalText: 'Colha os 3 pés de milho que aparecem a cada duas casas.',
  },
  map: { cells: ['. m . m . m .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 3 }],
  efficiency: { referenceActions: 9, referenceBlocks: 4 },
  hints: [
    'O milho está na 2ª, 4ª e 6ª casa.',
    'De um pé de milho para o outro são sempre duas casas.',
    'Dentro do repita: andar, colher e andar mais uma.',
    'repita 3 vezes: mover, colher, mover.',
  ],
  solutionExplanation: 'O padrão "andar, colher, andar" se repete três vezes e cobre a fileira com intervalos.',
  referenceSolution: program([repeat(3, [act('moveForward'), act('harvest'), act('moveForward')])]),
  commonMistakes: {
    NOTHING_TO_HARVEST: 'O robô colheu numa casa vazia. Veja o espaço entre os pés de milho.',
  },
}
