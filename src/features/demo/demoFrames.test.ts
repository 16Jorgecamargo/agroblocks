import { getMission } from '@/data/missions'
import { DEMO_TIMING, demoDelayMs, demoFrames, nextDemoFrame } from '@/features/demo/demoFrames'

function mission(id: string) {
  const found = getMission(id)
  if (!found) throw new Error('missing')
  return found
}

describe('demoFrames', () => {
  it('plays the reference solution from the initial farm up to the harvest', () => {
    const harvest = mission('garden-02')
    const frames = demoFrames(harvest)
    expect(frames[0].events).toEqual([])
    expect(frames[0].state.robot).toEqual({ x: 0, y: 4, facing: 'N' })
    expect(frames[1].state.robot).toMatchObject({ x: 0, y: 3, facing: 'N' })
    expect(frames.at(-1)?.state.resources.harvested).toBe(1)
    expect(frames.some((frame) => frame.events.some((event) => event.type === 'plotChanged' && event.to === 'harvested'))).toBe(true)
  })

  it('follows the sensor branch so only real actions become frames', () => {
    const frames = demoFrames(mission('orchard-02'))
    expect(frames.length).toBeGreaterThanOrEqual(2)
    expect(frames.every((frame) => frame.state.width === frames[0].state.width)).toBe(true)
  })

  it('has no frames when the mission has no demonstration', () => {
    expect(demoFrames(mission('greenhouse-02'))).toEqual([])
  })
})

describe('demo playback timing', () => {
  it('holds the first and last frames longer than a step', () => {
    expect(demoDelayMs(0, 4)).toBe(DEMO_TIMING.startHoldMs)
    expect(demoDelayMs(1, 4)).toBe(DEMO_TIMING.stepMs)
    expect(demoDelayMs(3, 4)).toBe(DEMO_TIMING.endHoldMs)
  })

  it('loops back to the first frame and counts the cycle', () => {
    expect(nextDemoFrame({ index: 1, cycle: 0 }, 4)).toEqual({ index: 2, cycle: 0 })
    expect(nextDemoFrame({ index: 3, cycle: 0 }, 4)).toEqual({ index: 0, cycle: 1 })
  })
})
