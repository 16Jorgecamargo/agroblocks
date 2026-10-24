import { act, ifThen, program, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard01: MissionDefinition = {
  id: 'orchard-01',
  order: 11,
  world: 'orchard',
  slot: 1,
  title: 'Só se estiver madura',
  concept: 'conditionals',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Condição: o bloco "se" faz o robô olhar o canteiro antes de agir. Se a condição for verdadeira, o que está dentro acontece.',
    goalText: 'O programa já tem um "se a planta está madura?". Coloque a colheita dentro dele.',
  },
  map: { cells: ['. m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  initialProgram: program([act('moveForward'), ifThen(sensor('isPlantMature'), [])]),
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  efficiency: { referenceActions: 2, referenceBlocks: 4 },
  hints: [
    'O robô precisa andar uma casa até a árvore.',
    'O bloco "se" já está pronto, mas vazio.',
    'Coloque "colher planta" dentro do "se".',
    'mover, se a planta está madura?: colher planta.',
  ],
  solutionExplanation: 'O "se" verifica a planta antes de colher. Assim o robô nunca tenta colher uma fruta verde.',
  referenceSolution: program([act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])]),
}
