import { describeRobotSteps } from '@/features/results/robotSteps'
import { act, call, ifThen, not, program, repeat, sensor, setVar, whileDo } from '@/blocks/interpreter/programBuilder'

describe('describeRobotSteps', () => {
  it('narrates a repeat loop like the reference example', () => {
    expect(describeRobotSteps(program([repeat(3, [act('prepareSoil'), act('plant'), act('moveForward')])]))).toEqual([
      'Repetiu as ações 3 vezes',
      'Preparou o solo',
      'Plantou uma semente',
      'Moveu para o próximo canteiro',
    ])
  })

  it('collapses consecutive identical actions', () => {
    expect(describeRobotSteps(program([act('moveForward'), act('moveForward'), act('moveForward'), act('turnRight')]))).toEqual([
      'Moveu para o próximo canteiro (3x)',
      'Virou à direita',
    ])
  })

  it('narrates conditions, loops, variables and procedures', () => {
    expect(
      describeRobotSteps(
        program([setVar('n', 0), whileDo(not(sensor('isObstacleAhead')), [ifThen(sensor('isPlantMature'), [act('harvest')])]), call('cuidar')], {
          cuidar: [act('water')],
        }),
      ),
    ).toEqual([
      'Atualizou a variável n',
      'Repetiu enquanto não (existe obstáculo à frente)',
      'Verificou se a planta está madura',
      'Colheu a planta',
      'Executou o procedimento cuidar',
    ])
  })

  it('limits the list to six steps', () => {
    expect(describeRobotSteps(program([act('water'), act('plant'), act('harvest'), act('turnLeft'), act('prepareSoil'), act('collectResources'), act('moveForward')]))).toHaveLength(6)
  })
})
