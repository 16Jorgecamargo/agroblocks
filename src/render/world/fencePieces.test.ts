import { FENCE, fencePieces } from '@/render/world/fencePieces'
import type { PropItem } from '@/render/world/worldTypes'

function segment(x: number, z: number, rotation = 0, model: PropItem['model'] = 'fence', scale = 1): PropItem {
  return { model, x, z, rotation, scale }
}

describe('fencePieces', () => {
  it('puts one post at each end of a segment and two rails between them', () => {
    const pieces = fencePieces([segment(0, 0)])
    const posts = pieces.filter((piece) => piece.kind === 'post')
    expect(posts.map((post) => post.x).sort((a, b) => a - b)).toEqual([-0.5, 0.5])
    const rails = pieces.filter((piece) => piece.kind === 'rail')
    expect(rails.map((rail) => rail.y)).toEqual(FENCE.railHeights)
    for (const rail of rails) expect(rail.length).toBe(1)
  })

  it('shares posts between neighbouring segments of a line', () => {
    const line = [0, 1, 2, 3].map((index) => segment(index + 0.5, 0))
    const pieces = fencePieces(line)
    expect(pieces.filter((piece) => piece.kind === 'post')).toHaveLength(5)
    expect(pieces.filter((piece) => piece.kind === 'rail')).toHaveLength(8)
  })

  it('closes a square with four shared corner posts', () => {
    const square = [segment(0, -0.5), segment(0, 0.5), segment(-0.5, 0, Math.PI / 2), segment(0.5, 0, Math.PI / 2)]
    expect(fencePieces(square).filter((piece) => piece.kind === 'post')).toHaveLength(4)
  })

  it('builds a gate with taller posts and crossed braces', () => {
    const pieces = fencePieces([segment(0, 0, 0, 'fence-gate')])
    expect(pieces.filter((piece) => piece.kind === 'gatePost')).toHaveLength(2)
    const braces = pieces.filter((piece) => piece.kind === 'brace')
    expect(braces).toHaveLength(2)
    expect(braces[0].tilt).toBeCloseTo(-braces[1].tilt)
    expect(braces[0].tilt).not.toBe(0)
  })

  it('keeps the rail direction of the segment and shrinks short map fences', () => {
    const [rail] = fencePieces([segment(0, 0, Math.PI / 2, 'fence', 0.5)]).filter((piece) => piece.kind === 'rail')
    expect(rail.rotation).toBeCloseTo(Math.PI / 2)
    expect(rail.length).toBeCloseTo(0.5)
    expect(rail.size).toBeCloseTo(0.5)
  })

  it('ignores props that are not fences', () => {
    expect(fencePieces([{ model: 'cow', x: 0, z: 0, rotation: 0, scale: 1 }])).toEqual([])
  })
})
