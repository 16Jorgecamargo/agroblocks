import { offsetPolyline, distanceToPolyline, pointAlong, pointInPolygon, rectDistance, rectPolygon, segmentIntersection } from '@/render/world/geometry'

describe('world geometry', () => {
  it('measures distance to a polyline', () => {
    expect(distanceToPolyline({ x: 1, z: 1 }, [{ x: 0, z: 0 }, { x: 2, z: 0 }])).toBeCloseTo(1)
    expect(distanceToPolyline({ x: 3, z: 0 }, [{ x: 0, z: 0 }, { x: 2, z: 0 }])).toBeCloseTo(1)
  })

  it('tests points inside polygons and rectangles', () => {
    const square = rectPolygon({ minX: 0, maxX: 2, minZ: 0, maxZ: 2 })
    expect(pointInPolygon({ x: 1, z: 1 }, square)).toBe(true)
    expect(pointInPolygon({ x: 3, z: 1 }, square)).toBe(false)
    expect(rectDistance({ x: 1, z: 1 }, { minX: 0, maxX: 2, minZ: 0, maxZ: 2 })).toBe(0)
    expect(rectDistance({ x: 5, z: 1 }, { minX: 0, maxX: 2, minZ: 0, maxZ: 2 })).toBe(3)
  })

  it('finds where two segments cross', () => {
    expect(segmentIntersection({ x: 0, z: -1 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 1, z: 0 })).toEqual({ x: 0, z: 0 })
    expect(segmentIntersection({ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 1 })).toBeNull()
  })

  it('walks along a polyline by fraction', () => {
    expect(pointAlong([{ x: 0, z: 0 }, { x: 4, z: 0 }], 0.25)).toEqual({ x: 1, z: 0 })
  })
})

describe('offsetPolyline', () => {
  it('shifts a path sideways by a fixed distance', () => {
    const line = [{ x: 0, z: 0 }, { x: 4, z: 0 }, { x: 4, z: 4 }]
    const left = offsetPolyline(line, 0.5)
    expect(left).toHaveLength(3)
    const probes = [left[0], left[2], ...left.slice(1).map((point, index) => ({ x: (point.x + left[index].x) / 2, z: (point.z + left[index].z) / 2 }))]
    for (const point of probes) expect(distanceToPolyline(point, line)).toBeCloseTo(0.5, 1)
    expect(left[0].z).toBeCloseTo(-0.5)
    expect(offsetPolyline(line, -0.5)[0].z).toBeCloseTo(0.5)
  })
})
