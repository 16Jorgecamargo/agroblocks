import { MISSIONS, getMission, getNextMission } from '@/data/missions'
import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { runProgram } from '@/blocks/interpreter/runProgram'
import { act, program, repeat, ifThen, sensor } from '@/blocks/interpreter/programBuilder'
import type { Program } from '@/blocks/interpreter/ast'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { validateMission } from '@/game/missions/validateMission'
import type { MissionDefinition } from '@/game/missions/missionTypes'

function play(mission: MissionDefinition, code: Program) {
  const controllerMission = toControllerMission(mission)
  const result = runProgram(code, controllerMission.initialState, controllerMission.rules, controllerMission.stepLimit)
  return { ...result, validation: validateMission(result.state, controllerMission.goals) }
}

function mission(id: string): MissionDefinition {
  const found = getMission(id)
  if (!found) throw new Error(`missing ${id}`)
  return found
}

describe('missions', () => {
  it('has seven missions with unique ids and consecutive order', () => {
    expect(MISSIONS.map((item) => item.order)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(new Set(MISSIONS.map((item) => item.id)).size).toBe(7)
    expect(getNextMission('m1-first-harvest')?.id).toBe('m2-row-planting')
    expect(getNextMission('m6-efficient-farm')).toBeUndefined()
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s is solvable by its reference solution', (_id, item) => {
    const result = play(item, item.referenceSolution)
    expect(result.outcome.status).toBe('completed')
    expect(result.validation.success).toBe(true)
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s reference uses only allowed blocks', (_id, item) => {
    const allowed = new Set(item.allowedBlocks)
    for (const type of programBlockTypes(item.referenceSolution)) expect(allowed.has(type)).toBe(true)
  })

  it.each(MISSIONS.map((item) => [item.id, item] as const))('%s has four hints and efficiency references', (_id, item) => {
    expect(item.hints.every((hint) => hint.length > 10)).toBe(true)
    expect(item.efficiency.referenceActions).toBeGreaterThan(0)
    expect(item.efficiency.referenceBlocks).toBeGreaterThan(0)
  })

  it('mission 0 punishes one move too many with an obstacle', () => {
    const result = play(mission('m0-training'), program([act('moveForward'), act('moveForward'), act('moveForward')]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('HIT_OBSTACLE')
  })

  it('mission 1 fails when the robot harvests before turning', () => {
    const result = play(mission('m1-first-harvest'), program([repeat(3, [act('moveForward')]), act('harvest')]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NOTHING_TO_HARVEST')
  })

  it('mission 2 hits the fence when repeating seven times', () => {
    const result = play(mission('m2-row-planting'), program([repeat(7, [act('moveForward'), act('prepareSoil'), act('plant')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('HIT_OBSTACLE')
  })

  it('mission 3 forbids watering wet soil', () => {
    const result = play(mission('m3-smart-irrigation'), program([repeat(6, [act('moveForward'), act('water')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('WATER_WASTED')
  })

  it('mission 4 forbids harvesting immature plants', () => {
    const result = play(mission('m4-auto-harvest'), program([repeat(6, [act('moveForward'), act('harvest')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('PLANT_NOT_MATURE')
  })

  it('mission 5 runs out of water without visiting the reservoir', () => {
    const result = play(
      mission('m5-limited-resources'),
      program([repeat(6, [act('moveForward'), act('plant'), act('water')])]),
    )
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NO_WATER')
  })

  it('mission 6 initial program contains a bug that occupies a planted plot', () => {
    const item = mission('m6-efficient-farm')
    if (!item.initialProgram) throw new Error('mission 6 needs an initial program')
    const result = play(item, item.initialProgram)
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('PLOT_OCCUPIED')
  })

  it.each(MISSIONS.filter((item) => item.briefing.demo).map((item) => [item.id, item] as const))(
    '%s demo runs without errors and does not solve the mission',
    (_id, item) => {
      const demo = item.briefing.demo
      if (!demo) throw new Error('missing demo')
      const result = play(item, demo)
      expect(result.outcome.status).toBe('completed')
      expect(result.validation.success).toBe(false)
    },
  )

  it('missions 1 to 3 offer a demonstration', () => {
    expect(MISSIONS.filter((item) => item.briefing.demo).map((item) => item.order)).toEqual([1, 2, 3])
  })

  it('mission 3 checking the sensor without else is still valid', () => {
    const result = play(
      mission('m3-smart-irrigation'),
      program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
    )
    expect(result.validation.success).toBe(true)
  })
})
