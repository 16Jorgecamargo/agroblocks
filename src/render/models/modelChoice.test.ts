import * as modelChoice from '@/render/models/modelChoice'
import { cropModelId, cropStageFor, robotClipFor } from '@/render/models/modelChoice'

describe('modelChoice', () => {
  it('maps plot states and growth to the five crop stages', () => {
    expect(cropStageFor('untilled', 0, 4)).toBeNull()
    expect(cropStageFor('tilled', 0, 4)).toBeNull()
    expect(cropStageFor('harvested', 0, 4)).toBeNull()
    expect(cropStageFor('seeded', 0, 4)).toBe(1)
    expect(cropStageFor('seeded', 2, 4)).toBe(2)
    expect(cropStageFor('growing', 1, 4)).toBe(3)
    expect(cropStageFor('growing', 3, 4)).toBe(4)
    expect(cropStageFor('mature', 0, 4)).toBe(5)
    expect(cropModelId(5)).toBe('crop-5')
  })

  it('no longer maps old decoration kinds', () => {
    expect('decorationModelId' in modelChoice).toBe(false)
  })

  it('chooses the robot clip by priority', () => {
    expect(robotClipFor({ moving: true, failed: true, celebrating: true })).toBe('error')
    expect(robotClipFor({ moving: true, failed: false, celebrating: true })).toBe('success')
    expect(robotClipFor({ moving: true, failed: false, celebrating: false })).toBe('move')
    expect(robotClipFor({ moving: false, failed: false, celebrating: false })).toBe('idle')
  })
})
