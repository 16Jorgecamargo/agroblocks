import { Vector3 } from 'three'
import { birdHeading, birdPosition, flockBounds, wingAngle } from '@/render/world/Birds'

describe('birds', () => {
  it('keeps every bird inside the flock bounds along its whole orbit', () => {
    const points = [{ x: 4, z: -2 }]
    const bounds = flockBounds(points)
    for (let time = 0; time < 30; time += 0.37) {
      const bird = birdPosition(points[0], 0, time)
      expect(bounds.containsPoint(bird)).toBe(true)
    }
  })

  it('covers every point of a flock spread over the map', () => {
    const points = [{ x: -8, z: 5 }, { x: 6, z: 9 }, { x: 0, z: -10 }]
    const bounds = flockBounds(points)
    points.forEach((point, index) => {
      for (let time = 0; time < 20; time += 0.5) expect(bounds.containsPoint(birdPosition(point, index, time))).toBe(true)
    })
  })

  it('beats its wings up and down, with short glides in between', () => {
    const angles = Array.from({ length: 400 }, (_, step) => wingAngle(0, step * 0.05))
    expect(Math.max(...angles)).toBeGreaterThan(0.5)
    expect(Math.min(...angles)).toBeLessThan(-0.5)
    expect(angles.filter((angle) => angle === 0.12).length).toBeGreaterThan(10)
    expect(wingAngle(0, 3)).not.toBe(wingAngle(1, 3))
  })

  it('points its beak where it flies, not sideways', () => {
    const point = { x: 2, z: -3 }
    for (const [index, time] of [[0, 0], [1, 2.3], [2, 7.1]]) {
      const now = birdPosition(point, index, time)
      const next = birdPosition(point, index, time + 0.01)
      const travel = new Vector3(next.x - now.x, 0, next.z - now.z).normalize()
      const heading = birdHeading(index, time)
      const beak = new Vector3(Math.cos(heading), 0, -Math.sin(heading))
      expect(beak.dot(travel)).toBeGreaterThan(0.99)
    }
  })
})
