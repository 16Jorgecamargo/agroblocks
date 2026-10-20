import { act, call, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead05: MissionDefinition = {
  id: 'homestead-05',
  order: 55,
  world: 'homestead',
  slot: 5,
  title: 'Decidir dentro do procedimento',
  concept: 'efficiency',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Um procedimento pode tomar decisões com "se".',
    goalText: 'Crie um procedimento que planta se o canteiro estiver vazio ou colhe se a planta estiver madura, e use-o na fileira.',
  },
  map: { cells: ['. . m . m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [[1, 0], [3, 0]], state: 'seeded' }, { kind: 'harvestAtLeast', count: 2 }],
  efficiency: { referenceActions: 10, referenceBlocks: 11 },
  hints: [
    'Na fileira há canteiros vazios e plantas maduras.',
    'O procedimento decide o que fazer em cada casa.',
    'Use "se/senão" dentro do procedimento.',
    'cuidar: se vazio: preparar, plantar; senão: se madura: colher.',
  ],
  solutionExplanation: 'O procedimento esconde a decisão; o programa principal só anda e chama "cuidar".',
  referenceSolution: program([repeat(4, [act('moveForward'), call('cuidar')])], { cuidar: [ifThen(sensor('isPlotEmpty'), [act('prepareSoil'), act('plant')], [ifThen(sensor('isPlantMature'), [act('harvest')])])] }),
}
