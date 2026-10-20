import { countProgramBlocks, programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { MISSIONS } from '@/data/missions'
import { getWorld, missionsOfWorld, WORLDS } from '@/data/worlds'
import { playMission } from '@/game/testing/playMission'
import type { WorldId } from '@/game/worlds/worldTypes'

const READY_WORLDS: WorldId[] = ['garden', 'cornfield', 'orchard', 'greenhouse']
const MOVED = new Set(['garden-04', 'cornfield-02', 'orchard-04', 'greenhouse-03', 'barnyard-05', 'homestead-10'])

describe('world missions', () => {
  it.each(READY_WORLDS)('%s has slots 1 to 10', (world) => {
    expect(missionsOfWorld(world, MISSIONS).map((mission) => mission.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it.each(READY_WORLDS)('%s mission 1 starts from a partial program', (world) => {
    expect(missionsOfWorld(world, MISSIONS)[0].initialProgram).toBeDefined()
  })

  it.each(READY_WORLDS)('%s mission 9 starts from a program that fails', (world) => {
    const debug = missionsOfWorld(world, MISSIONS)[8]
    if (!debug.initialProgram) throw new Error('debug mission without a starting program')
    const result = playMission(debug, debug.initialProgram)
    expect(result.outcome.status === 'completed' && result.validation.success).toBe(false)
  })

  it.each(READY_WORLDS)('%s missions 7 and 8 have a limit', (world) => {
    for (const mission of missionsOfWorld(world, MISSIONS).slice(6, 8)) {
      const limited = mission.rules.maxBlocks !== undefined || (mission.constraints?.length ?? 0) > 0 || mission.rules.forbidWaterWet === true
      expect(limited).toBe(true)
    }
  })

  it.each(READY_WORLDS)('%s reference solutions from mission 2 on use the key block of the world', (world) => {
    const key = getWorld(world).keyBlock
    if (!key) return
    for (const mission of missionsOfWorld(world, MISSIONS).slice(1)) expect(programBlockTypes(mission.referenceSolution)).toContain(key)
  })

  it.each(READY_WORLDS)('%s keeps the blocks of earlier worlds available', (world) => {
    const earlier = WORLDS.filter((item) => item.order < getWorld(world).order).flatMap((item) => (item.keyBlock ? [item.keyBlock] : []))
    for (const mission of missionsOfWorld(world, MISSIONS)) for (const block of earlier) expect(mission.allowedBlocks).toContain(block)
  })

  it.each(READY_WORLDS)('%s reference solutions respect the block limit', (world) => {
    for (const mission of missionsOfWorld(world, MISSIONS)) {
      if (mission.rules.maxBlocks !== undefined) expect(countProgramBlocks(mission.referenceSolution)).toBeLessThanOrEqual(mission.rules.maxBlocks)
    }
  })

  it.each(READY_WORLDS)('%s efficiency references match the reference solutions', (world) => {
    for (const mission of missionsOfWorld(world, MISSIONS).filter((item) => !MOVED.has(item.id))) {
      const result = playMission(mission, mission.referenceSolution)
      expect({ id: mission.id, actions: result.state.actionCount, blocks: countProgramBlocks(mission.referenceSolution) }).toEqual({
        id: mission.id,
        actions: mission.efficiency.referenceActions,
        blocks: mission.efficiency.referenceBlocks,
      })
    }
  })
})
