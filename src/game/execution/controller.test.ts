import { ExecutionController } from '@/game/execution/controller'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import type { ControllerMission } from '@/game/execution/types'
import { act, program, whileDo, bool } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

function setup(stepLimit = 2000) {
  const mission: ControllerMission = {
    initialState: makeState(['. . m .']),
    rules: { growTicks: 3, forbidWaterWet: false },
    goals: { objectives: [{ kind: 'harvestAtLeast', count: 1 }] },
    stepLimit,
  }
  const scheduler = new ManualScheduler()
  const controller = new ExecutionController(mission, scheduler)
  return { mission, scheduler, controller }
}

const solution = program([act('moveForward'), act('moveForward'), act('harvest')])

describe('ExecutionController', () => {
  it('starts idle with the initial state', () => {
    const { controller, mission } = setup()
    expect(controller.getSnapshot().status).toBe('idle')
    expect(controller.getSnapshot().state).toBe(mission.initialState)
  })

  it('runs the first step immediately and the rest on the scheduler', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    expect(controller.getSnapshot()).toMatchObject({ status: 'running', stepCount: 1 })
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('finished')
    expect(snapshot.validation?.success).toBe(true)
    expect(snapshot.state.resources.harvested).toBe(1)
    expect(snapshot.log.at(-1)).toMatchObject({ kind: 'success' })
  })

  it('never schedules two timers for the same run', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.run(solution)
    expect(scheduler.pending).toBe(1)
  })

  it('pauses and resumes without losing progress', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.pause()
    expect(controller.getSnapshot().status).toBe('paused')
    expect(scheduler.pending).toBe(0)
    scheduler.runAll()
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    controller.resume()
    scheduler.runAll()
    expect(controller.getSnapshot().status).toBe('finished')
  })

  it('treats run while paused as resume', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.pause()
    controller.run(solution)
    expect(controller.getSnapshot().status).toBe('running')
    scheduler.runAll()
    expect(controller.getSnapshot().state.robot.x).toBe(2)
  })

  it('steps one instruction at a time from idle', () => {
    const { controller, scheduler } = setup()
    controller.step(solution)
    expect(controller.getSnapshot()).toMatchObject({ status: 'paused', stepCount: 1 })
    expect(scheduler.pending).toBe(0)
    controller.step(solution)
    expect(controller.getSnapshot().state.robot.x).toBe(2)
    controller.step(solution)
    controller.step(solution)
    expect(controller.getSnapshot().status).toBe('finished')
  })

  it('highlights the block of the current step', () => {
    const { controller } = setup()
    controller.step(solution)
    expect(controller.getSnapshot().currentBlockId).toBe(solution.main[0].blockId)
  })

  it('stop restores the initial state, keeps the log and ignores stale timers', () => {
    const { controller, scheduler, mission } = setup()
    controller.run(solution)
    controller.stop()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('idle')
    expect(snapshot.state).toBe(mission.initialState)
    expect(snapshot.log.length).toBeGreaterThan(0)
    scheduler.runAll()
    expect(controller.getSnapshot().state).toBe(mission.initialState)
  })

  it('reset restores the initial state and clears the log', () => {
    const { controller } = setup()
    controller.run(solution)
    controller.reset()
    expect(controller.getSnapshot()).toMatchObject({ status: 'idle', log: [], stepCount: 0, error: null })
  })

  it('fails on an action error and points to the block', () => {
    const { controller, scheduler } = setup()
    const failing = program([act('turnLeft'), act('moveForward')])
    controller.run(failing)
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('failed')
    expect(snapshot.error?.code).toBe('OUT_OF_BOUNDS')
    expect(snapshot.errorBlockId).toBe(failing.main[1].blockId)
    expect(snapshot.log.at(-1)?.kind).toBe('error')
  })

  it('fails with STEP_LIMIT on infinite loops', () => {
    const { controller, scheduler } = setup(30)
    controller.run(program([whileDo(bool(true), [act('turnLeft')])]))
    scheduler.runAll()
    expect(controller.getSnapshot().error?.code).toBe('STEP_LIMIT')
  })

  it('finishes with an explained failure when objectives are not met', () => {
    const { controller, scheduler } = setup()
    controller.run(program([act('moveForward')]))
    scheduler.runAll()
    const snapshot = controller.getSnapshot()
    expect(snapshot.status).toBe('finished')
    expect(snapshot.validation?.success).toBe(false)
    expect(snapshot.log.some((entry) => entry.text === 'Ainda faltam 1 planta(s) para colher.')).toBe(true)
  })

  it('restarts from the initial state when running after finishing', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    scheduler.runAll()
    controller.run(solution)
    expect(controller.getSnapshot().state.robot.x).toBe(1)
    expect(controller.getSnapshot().state.resources.harvested).toBe(0)
  })

  it('reschedules with the new speed', () => {
    const { controller, scheduler } = setup()
    controller.run(solution)
    controller.setSpeed(4)
    expect(controller.getSnapshot().speed).toBe(4)
    expect(scheduler.pending).toBe(1)
  })

  it('stops scheduled work and notifications after dispose', () => {
    const { controller, scheduler } = setup()
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.run(solution)
    listener.mockClear()
    controller.dispose()
    expect(scheduler.pending).toBe(0)
    scheduler.runAll()
    expect(listener).not.toHaveBeenCalled()
    expect(controller.getSnapshot().state.robot.x).toBe(1)
  })

  it('notifies subscribers on every change', () => {
    const { controller } = setup()
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    controller.step(solution)
    expect(listener).toHaveBeenCalled()
    unsubscribe()
    listener.mockClear()
    controller.step(solution)
    expect(listener).not.toHaveBeenCalled()
  })
})
