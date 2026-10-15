import { cropModelId, cropStageFor, decorationModelId, robotClipFor } from '@/render/models/modelChoice'

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

  it('picks decoration models by kind and variant', () => {
    expect(decorationModelId('tree', 0)).toBe('tree-a')
    expect(decorationModelId('tree', 4)).toBe('tree-b')
    expect(decorationModelId('pine', 2)).toBe('pine')
    expect(decorationModelId('rock', 1)).toBe('rock-b')
    expect(decorationModelId('fence', 0)).toBe('fence')
    expect(decorationModelId('barn', 0)).toBe('barn')
  })

  it('chooses the robot clip by priority', () => {
    expect(robotClipFor({ moving: true, failed: true, celebrating: true })).toBe('error')
    expect(robotClipFor({ moving: true, failed: false, celebrating: true })).toBe('success')
    expect(robotClipFor({ moving: true, failed: false, celebrating: false })).toBe('move')
    expect(robotClipFor({ moving: false, failed: false, celebrating: false })).toBe('idle')
  })
})
