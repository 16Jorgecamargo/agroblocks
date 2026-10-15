import * as modelChoice from '@/render/models/modelChoice'
import { robotClipFor } from '@/render/models/modelChoice'

describe('modelChoice', () => {
  it('no longer maps old decoration kinds or crop models', () => {
    expect('decorationModelId' in modelChoice).toBe(false)
    expect('cropModelId' in modelChoice).toBe(false)
    expect('cropStageFor' in modelChoice).toBe(false)
  })

  it('chooses the robot clip by priority', () => {
    expect(robotClipFor({ moving: true, failed: true, celebrating: true })).toBe('error')
    expect(robotClipFor({ moving: true, failed: false, celebrating: true })).toBe('success')
    expect(robotClipFor({ moving: true, failed: false, celebrating: false })).toBe('move')
    expect(robotClipFor({ moving: false, failed: false, celebrating: false })).toBe('idle')
  })
})
