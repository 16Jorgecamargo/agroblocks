import { countProgramBlocks, programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import { MISSIONS } from '@/data/missions'
import { getWorld, missionsOfWorld, WORLDS } from '@/data/worlds'
import { playMission } from '@/game/testing/playMission'
import { MISSIONS_PER_WORLD, type WorldId } from '@/game/worlds/worldTypes'

const READY_WORLDS: WorldId[] = ['garden', 'cornfield', 'orchard', 'greenhouse', 'barnyard', 'homestead']
const MOVED = new Set(['garden-02', 'cornfield-02', 'orchard-02', 'greenhouse-02', 'barnyard-02', 'homestead-05'])

describe('world missions', () => {
  it.each(READY_WORLDS)('%s has slots 1 to 5', (world) => {
    expect(missionsOfWorld(world, MISSIONS).map((mission) => mission.slot)).toEqual(Array.from({ length: MISSIONS_PER_WORLD }, (_, index) => index + 1))
  })

  it.each(READY_WORLDS)('%s mission 1 starts from a partial program', (world) => {
    expect(missionsOfWorld(world, MISSIONS)[0].initialProgram).toBeDefined()
  })

  it.each(READY_WORLDS)('%s mission 4 starts from a program that fails', (world) => {
    const debug = missionsOfWorld(world, MISSIONS)[3]
    if (!debug.initialProgram) throw new Error('debug mission without a starting program')
    const result = playMission(debug, debug.initialProgram)
    expect(result.outcome.status === 'completed' && result.validation.success).toBe(false)
  })

  it.each(READY_WORLDS)('%s mission 3 has a limit', (world) => {
    for (const mission of missionsOfWorld(world, MISSIONS).slice(2, 3)) {
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
