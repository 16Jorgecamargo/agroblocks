import { birdPosition, flockBounds } from '@/render/world/Birds'

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
})
