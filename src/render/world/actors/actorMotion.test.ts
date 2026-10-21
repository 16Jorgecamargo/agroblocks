import { actorOffset, actorPose } from '@/render/world/actors/actorMotion'
import type { Actor } from '@/render/world/worldTypes'

const walker: Actor = { id: 'w', kind: 'worker', route: [{ x: 0, z: 0 }, { x: 4, z: 0 }], task: 'water', tint: '#fff', speed: 1, pause: 2 }

describe('actor motion', () => {
  it('works at the start, walks the route, works at the end and walks back', () => {
    const at = (t: number) => actorPose(walker, t - actorOffset(walker))
    expect(at(1)).toMatchObject({ x: 0, z: 0, moving: false })
    const out = at(4)
    expect(out.moving).toBe(true)
    expect(out.x).toBeCloseTo(2, 5)
    expect(out.heading).toBeCloseTo(Math.PI / 2, 5)
    expect(at(7)).toMatchObject({ x: 4, z: 0, moving: false })
    const back = at(10)
    expect(back.moving).toBe(true)
    expect(back.x).toBeCloseTo(2, 5)
    expect(Math.cos(back.heading - Math.PI / 2)).toBeCloseTo(-1, 5)
    expect(at(13)).toMatchObject({ x: 0, z: 0 })
  })

  it('keeps counting the distance travelled so wheels can roll', () => {
    const at = (t: number) => actorPose(walker, t - actorOffset(walker)).travelled
    expect(at(4)).toBeLessThan(at(5))
    expect(at(17)).toBeGreaterThan(at(4) + 7)
  })

  it('stays put on a single-point route, facing its work', () => {
    const pose = actorPose({ ...walker, route: [{ x: 3, z: -2 }], facing: 1.2 }, 5)
    expect(pose).toMatchObject({ x: 3, z: -2, heading: 1.2, moving: false })
  })

  it('never leaves the route and differs between actors', () => {
    for (let t = 0; t < 30; t += 0.37) {
      const pose = actorPose(walker, t)
      expect(pose.z).toBeCloseTo(0, 5)
      expect(pose.x).toBeGreaterThanOrEqual(-1e-9)
      expect(pose.x).toBeLessThanOrEqual(4 + 1e-9)
    }
    expect(actorOffset(walker)).not.toBe(actorOffset({ ...walker, id: 'other' }))
  })

  it('faces the work at each end while pausing there', () => {
    const actor = { ...walker, facings: [1, -2] as [number, number] }
    expect(actorPose(actor, 1 - actorOffset(actor)).heading).toBe(1)
    expect(actorPose(actor, 7 - actorOffset(actor)).heading).toBe(-2)
  })
})
