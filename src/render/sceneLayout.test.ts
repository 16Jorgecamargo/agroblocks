import { cellToWorld, generateDecorations } from '@/render/sceneLayout'

describe('sceneLayout', () => {
  it('centers the grid on the origin', () => {
    expect(cellToWorld(0, 0, 3, 3)).toEqual({ x: -1, z: -1 })
    expect(cellToWorld(1, 1, 3, 3)).toEqual({ x: 0, z: 0 })
    expect(cellToWorld(3, 0, 4, 1)).toEqual({ x: 1.5, z: 0 })
  })

  it('is deterministic for the same seed', () => {
    expect(generateDecorations(5, 5, 'm1', { dense: true })).toEqual(generateDecorations(5, 5, 'm1', { dense: true }))
    expect(generateDecorations(5, 5, 'm1', { dense: true })).not.toEqual(generateDecorations(5, 5, 'm2', { dense: true }))
  })

  it('never places scenery on top of the playable grid', () => {
    const width = 8
    const height = 4
    for (const item of generateDecorations(width, height, 'seed', { dense: true })) {
      const insideX = Math.abs(item.x) < width / 2 + 0.5
      const insideZ = Math.abs(item.z) < height / 2 + 0.5
      expect(insideX && insideZ).toBe(false)
    }
  })

  it('surrounds the grid with fences and adds farm buildings', () => {
    const kinds = generateDecorations(4, 4, 'x', { dense: false }).map((item) => item.kind)
    expect(kinds.filter((kind) => kind === 'fence').length).toBeGreaterThanOrEqual(16)
    expect(kinds).toEqual(expect.arrayContaining(['barn', 'windmill', 'silo']))
  })

  it('creates fewer trees and rocks in low graphics mode', () => {
    const scenery = (dense: boolean) =>
      generateDecorations(6, 6, 's', { dense }).filter((item) => item.kind !== 'fence').length
    expect(scenery(false)).toBeLessThan(scenery(true))
  })
})
