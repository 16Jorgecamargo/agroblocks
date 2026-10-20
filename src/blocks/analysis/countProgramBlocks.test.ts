import { countProgramBlocks } from '@/blocks/analysis/programBlockTypes'
import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { getMission } from '@/data/missions'

describe('countProgramBlocks', () => {
  it('counts statements and their inputs like the editor does', () => {
    expect(countProgramBlocks(program([act('moveForward'), act('harvest')]))).toBe(2)
    expect(countProgramBlocks(program([repeat(6, [act('moveForward'), act('prepareSoil'), act('plant')])]))).toBe(4)
    expect(countProgramBlocks(program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]))).toBe(5)
  })

  it('matches the block count of the row planting reference', () => {
    const mission = getMission('cornfield-02')
    if (!mission) throw new Error('missing mission')
    expect(countProgramBlocks(mission.referenceSolution)).toBe(mission.efficiency.referenceBlocks)
  })
})
