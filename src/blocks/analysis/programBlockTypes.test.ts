import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { act, call, compare, ifThen, not, program, repeat, sensor, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'

describe('programBlockTypes', () => {
  it('collects statement and expression block types', () => {
    const types = programBlockTypes(
      program(
        [
          repeat(3, [act('moveForward')]),
          whileDo(not(sensor('isObstacleAhead')), [ifThen(compare('EQ', variable('n'), 2), [call('p')])]),
          setVar('n', 0),
        ],
        { p: [act('harvest')] },
      ),
    )
    expect([...types].sort()).toEqual(
      [
        'controls_repeat_ext',
        'robot_move_forward',
        'controls_whileUntil',
        'logic_negate',
        'sensor_obstacle_ahead',
        'controls_if',
        'logic_compare',
        'variables_get',
        'procedures_callnoreturn',
        'procedures_defnoreturn',
        'variables_set',
        'farm_harvest',
      ].sort(),
    )
  })
})
