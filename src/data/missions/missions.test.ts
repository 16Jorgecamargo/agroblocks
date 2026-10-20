import { MISSIONS, getMission } from '@/data/missions'
import { getWorld } from '@/data/worlds'
import type { WorldId } from '@/game/worlds/worldTypes'
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
  it('keeps ids unique, orders derived from world and slot, training first', () => {
    expect(new Set(MISSIONS.map((item) => item.id)).size).toBe(MISSIONS.length)
    expect(MISSIONS[0].id).toBe('m0-training')
    for (const item of MISSIONS.filter((mission) => mission.world !== null)) {
      const world = getWorld(item.world as WorldId)
      expect(item.order).toBe((world.order - 1) * 10 + (item.slot as number))
      expect(item.id).toBe(`${item.world}-${String(item.slot).padStart(2, '0')}`)
      expect(item.concept).toBe(world.concept)
    }
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
    const result = play(mission('garden-04'), program([repeat(3, [act('moveForward')]), act('harvest')]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NOTHING_TO_HARVEST')
  })

  it('mission 2 hits the fence when repeating seven times', () => {
    const result = play(mission('cornfield-02'), program([repeat(7, [act('moveForward'), act('prepareSoil'), act('plant')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('HIT_OBSTACLE')
  })

  it('mission 3 forbids watering wet soil', () => {
    const result = play(mission('orchard-04'), program([repeat(6, [act('moveForward'), act('water')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('WATER_WASTED')
  })

  it('mission 4 forbids harvesting immature plants', () => {
    const result = play(mission('greenhouse-03'), program([repeat(6, [act('moveForward'), act('harvest')])]))
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('PLANT_NOT_MATURE')
  })

  it('mission 5 runs out of water without visiting the reservoir', () => {
    const result = play(
      mission('barnyard-05'),
      program([repeat(6, [act('moveForward'), act('plant'), act('water')])]),
    )
    expect(result.outcome.status === 'failed' && result.outcome.error.code).toBe('NO_WATER')
  })

  it('mission 6 initial program contains a bug that occupies a planted plot', () => {
    const item = mission('homestead-10')
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

  it('the moved first, row planting and irrigation missions offer a demonstration', () => {
    expect(MISSIONS.filter((item) => item.briefing.demo).map((item) => item.id)).toEqual(['garden-04', 'cornfield-02', 'orchard-04'])
  })

  it('mission 3 checking the sensor without else is still valid', () => {
    const result = play(
      mission('orchard-04'),
      program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
    )
    expect(result.validation.success).toBe(true)
  })
})
