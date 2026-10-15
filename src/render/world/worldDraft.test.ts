import { createRandom } from '@/render/seededRandom'
import { WorldDraft } from '@/render/world/worldDraft'

const grid = { minX: -2, maxX: 2, minZ: -2, maxZ: 2 }

describe('WorldDraft', () => {
  it('keeps props away from the grid, paths, river and each other', () => {
    const draft = new WorldDraft(createRandom(1), {
      grid,
      paths: [{ points: [{ x: -10, z: 6 }, { x: 10, z: 6 }], width: 1 }],
      river: { points: [{ x: 8, z: -10 }, { x: 8, z: 10 }], width: 2 },
      keepOut: [],
      frontGuard: grid,
    })
    expect(draft.isFree('tree-a', { x: 0, z: 0 })).toBe(false)
    expect(draft.isFree('tree-a', { x: 0, z: 6 })).toBe(false)
    expect(draft.isFree('tree-a', { x: 8, z: 0 })).toBe(false)
    expect(draft.place('tree-a', { x: -6, z: -6 }, 0, 1)).toBe(true)
    expect(draft.isFree('tree-b', { x: -6.2, z: -6 })).toBe(false)
  })

  it('refuses tall props in front of the grid but accepts low ones', () => {
    const draft = new WorldDraft(createRandom(2), { grid, paths: [], river: null, keepOut: [], frontGuard: grid })
    expect(draft.isFree('barn', { x: 4, z: 4 })).toBe(false)
    expect(draft.isFree('flower-red', { x: 4, z: 4 })).toBe(true)
  })

  it('builds fence lines one unit per segment with a gate', () => {
    const draft = new WorldDraft(createRandom(3), { grid, paths: [], river: null, keepOut: [], frontGuard: null })
    const before = draft.props.length
    draft.fenceLine({ x: 10, z: 0 }, { x: 14, z: 0 }, 2)
    const added = draft.props.slice(before)
    expect(added).toHaveLength(4)
    expect(added.filter((prop) => prop.model === 'fence-gate')).toHaveLength(1)
  })
})
