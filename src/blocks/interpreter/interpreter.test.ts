import { interpret, clampRepeatCount } from '@/blocks/interpreter/interpreter'
import { runProgram } from '@/blocks/interpreter/runProgram'
import {
  act,
  bool,
  call,
  changeVar,
  compare,
  ifThen,
  not,
  program,
  repeat,
  sensor,
  setVar,
  variable,
  whileDo,
} from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

const rules = { growTicks: 5, forbidWaterWet: false }
const row = ['. . . . . .']

describe('interpreter', () => {
  it('executes a sequence in order', () => {
    const result = runProgram(program([act('moveForward'), act('moveForward'), act('turnRight')]), makeState(row), rules)
    expect(result.outcome.status).toBe('completed')
    expect(result.state.robot).toEqual({ x: 2, y: 0, facing: 'S' })
  })

  it('repeats a body N times and yields loop steps', () => {
    const result = runProgram(program([repeat(3, [act('moveForward')])]), makeState(row), rules)
    expect(result.state.robot.x).toBe(3)
    expect(result.steps.filter((step) => step.type === 'loop')).toHaveLength(3)
  })

  it('evaluates the repeat count from a variable once', () => {
    const result = runProgram(
      program([setVar('n', 2), repeat(variable('n'), [act('moveForward'), changeVar('n', 5)])]),
      makeState(row),
      rules,
    )
    expect(result.state.robot.x).toBe(2)
  })

  it('clamps repeat counts', () => {
    expect(clampRepeatCount(-3)).toBe(0)
    expect(clampRepeatCount(2.6)).toBe(3)
    expect(clampRepeatCount(5000)).toBe(1000)
    expect(clampRepeatCount(Number.NaN)).toBe(0)
  })

  it('runs a while loop reading sensors from the live state', () => {
    const result = runProgram(program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward')])]), makeState(row), rules)
    expect(result.outcome.status).toBe('completed')
    expect(result.state.robot.x).toBe(5)
  })

  it('takes the then branch and the else branch', () => {
    const watered = runProgram(program([ifThen(sensor('isSoilDry'), [act('water')], [act('turnLeft')])]), makeState(['t']), rules)
    const turned = runProgram(program([ifThen(sensor('isSoilDry'), [act('water')], [act('turnLeft')])]), makeState(['tw']), rules)
    expect(watered.state.cells[0][0].moisture).toBe('wet')
    expect(turned.state.robot.facing).toBe('N')
  })

  it('yields check steps with a readable label and result', () => {
    const result = runProgram(program([ifThen(sensor('isSoilDry'), [])]), makeState(['t']), rules)
    expect(result.steps[0]).toMatchObject({ type: 'check', label: 'o solo está seco?', result: true })
  })

  it('compares variables', () => {
    const result = runProgram(
      program([setVar('i', 0), whileDo(compare('LT', variable('i'), 4), [act('moveForward'), changeVar('i', 1)])]),
      makeState(row),
      rules,
    )
    expect(result.state.robot.x).toBe(4)
    expect(result.steps.filter((step) => step.type === 'variable').at(-1)).toMatchObject({ name: 'i', value: 4 })
  })

  it('treats undefined variables as zero', () => {
    const result = runProgram(program([repeat(variable('nada'), [act('moveForward')])]), makeState(row), rules)
    expect(result.state.robot.x).toBe(0)
  })

  it('calls procedures', () => {
    const result = runProgram(program([call('andar2'), call('andar2')], { andar2: [act('moveForward'), act('moveForward')] }), makeState(row), rules)
    expect(result.state.robot.x).toBe(4)
    expect(result.steps.filter((step) => step.type === 'call')).toHaveLength(2)
  })

  it('stops at the failing action and reports its block id', () => {
    const failing = act('moveForward')
    const result = runProgram(program([act('turnLeft'), failing, act('turnLeft')]), makeState(row), rules)
    expect(result.outcome).toMatchObject({ status: 'failed', blockId: failing.blockId })
    if (result.outcome.status === 'failed') expect(result.outcome.error.code).toBe('OUT_OF_BOUNDS')
    expect(result.state.robot.facing).toBe('N')
  })

  it('interrupts an infinite loop without actions', () => {
    const result = runProgram(program([whileDo(bool(true), [])]), makeState(row), rules, 50)
    expect(result.outcome.status).toBe('failed')
    if (result.outcome.status === 'failed') expect(result.outcome.error.code).toBe('STEP_LIMIT')
  })

  it('interrupts an infinite loop with actions', () => {
    const result = runProgram(program([whileDo(bool(true), [act('turnLeft')])]), makeState(row), rules, 100)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('STEP_LIMIT')
    expect(result.state.actionCount).toBeLessThan(100)
  })

  it('interrupts nested huge repeats', () => {
    const result = runProgram(program([repeat(1000, [repeat(1000, [act('turnLeft')])])]), makeState(row), rules, 2000)
    expect(result.outcome.status).toBe('failed')
  })

  it('fails with INVALID_PROGRAM when calling a missing procedure', () => {
    const result = runProgram(program([call('fantasma')]), makeState(row), rules)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('INVALID_PROGRAM')
  })

  it('stops unbounded recursion', () => {
    const result = runProgram(program([call('loop')], { loop: [call('loop')] }), makeState(row), rules)
    if (result.outcome.status !== 'failed') throw new Error('expected failure')
    expect(result.outcome.error.code).toBe('STEP_LIMIT')
  })

  it('pauses between steps until the consumer resumes it', () => {
    const generator = interpret(program([act('moveForward'), act('turnLeft')]), { read: () => makeState(row), stepLimit: 10 })
    const first = generator.next()
    expect(first.value).toMatchObject({ type: 'action', action: 'moveForward' })
    const second = generator.next({ ok: true })
    expect(second.value).toMatchObject({ type: 'action', action: 'turnLeft' })
    const done = generator.next({ ok: true })
    expect(done).toEqual({ done: true, value: { status: 'completed', steps: 2 } })
  })
})
