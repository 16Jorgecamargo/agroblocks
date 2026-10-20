import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead04: MissionDefinition = {
  id: 'homestead-04',
  order: 54,
  world: 'homestead',
  slot: 4,
  title: 'Colher e voltar',
  concept: 'efficiency',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Cada procedimento faz uma tarefa. Combine vários para resolver um problema maior.',
    goalText: 'Colha os 3 pés maduros e volte para o começo. Crie um procedimento para colher a fileira e outro para dar meia-volta.',
  },
  map: { cells: ['. m m m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 3 }, { kind: 'robotAt', x: 0, y: 0 }],
  efficiency: { referenceActions: 11, referenceBlocks: 11 },
  hints: [
    'Separe o problema em partes: colher e voltar.',
    'Meia-volta são duas curvas para o mesmo lado.',
    'Depois da meia-volta, ande até o começo.',
    'colherFileira; meiaVolta; repita 3: mover.',
  ],
  solutionExplanation: 'Dividir em procedimentos deixa cada parte simples e fácil de testar.',
  referenceSolution: program([call('colherFileira'), call('meiaVolta'), repeat(3, [act('moveForward')])], { colherFileira: [repeat(3, [act('moveForward'), act('harvest')])], meiaVolta: [act('turnRight'), act('turnRight')] }),
}
