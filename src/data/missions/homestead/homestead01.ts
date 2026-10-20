import { act, call, program } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead01: MissionDefinition = {
  id: 'homestead-01',
  order: 51,
  world: 'homestead',
  slot: 1,
  title: 'Criar um procedimento',
  concept: 'efficiency',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Procedimento: um grupo de blocos com nome. Depois de criado, você chama o nome e o robô faz tudo o que está dentro.',
    goalText: 'O procedimento "cuidar" já existe, mas está vazio. Coloque dentro dele preparar, plantar e regar.',
  },
  map: { cells: ['. .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  initialProgram: program([act('moveForward'), call('cuidar')], { cuidar: [] }),
  objectives: [{ kind: 'cellsInState', cells: [[1, 0]], state: 'seeded' }, { kind: 'cellsWet', cells: [[1, 0]] }],
  efficiency: { referenceActions: 4, referenceBlocks: 6 },
  hints: [
    'O programa principal já chama "cuidar".',
    'O que está dentro de "cuidar" é o que o robô faz quando o nome é chamado.',
    'Os cuidados são três, sempre na mesma ordem.',
    'Dentro de cuidar: preparar solo, plantar semente, regar canteiro.',
  ],
  solutionExplanation: 'O procedimento dá um nome a três ações. O programa principal fica curto e fácil de ler.',
  referenceSolution: program([act('moveForward'), call('cuidar')], { cuidar: [act('prepareSoil'), act('plant'), act('water')] }),
}
