import { createRandom } from '@/render/seededRandom'
import { pointInPolygon } from '@/render/world/geometry'
import { blob, rectStain, smoothPath, woodland } from '@/render/world/landscapes/natureKit'
import { TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect } from '@/render/world/worldTypes'

const area: Rect = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }
const draft = () => new WorldDraft(createRandom(3), { grid: null, paths: [], river: null, keepOut: [], frontGuard: null })

describe('nature kit', () => {
  it('draws irregular blobs that still hold their centre', () => {
    const shape = blob({ x: 2, z: -1 }, 2, 1.2, createRandom(1))
    expect(shape.length).toBe(9)
    expect(pointInPolygon({ x: 2, z: -1 }, shape)).toBe(true)
    const radii = shape.map((point) => Math.hypot((point.x - 2) / 2, (point.z + 1) / 1.2))
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.05)
    expect(rectStain({ minX: 0, maxX: 4, minZ: 0, maxZ: 2 }, '#fff', createRandom(2)).points.length).toBe(12)
  })

  it('smooths a road through every node without overshooting the ends', () => {
    const nodes = [
      { x: 0, z: 0 },
      { x: 4, z: 1 },
      { x: 6, z: 5 },
    ]
    const road = smoothPath(nodes)
    expect(road[0]).toEqual(nodes[0])
    expect(road[road.length - 1]).toEqual(nodes[2])
    expect(road).toContainEqual(nodes[1])
    expect(road.length).toBeGreaterThan(nodes.length * 3)
  })

  it('grows woodland in clusters along the edge, thinner on open sides and clear of gaps and blocks', () => {
    const plan = draft()
    const block: Rect = { minX: -10, maxX: -6, minZ: -2, maxZ: 2 }
    woodland(plan, area, createRandom(5), { trees: TREE_MODELS, density: 'full', openSides: ['maxX', 'maxZ'], gaps: [{ x: 10, z: 0 }], avoid: [block] })
    const trees = plan.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))
    expect(trees.length).toBeGreaterThan(20)
    for (const tree of trees) expect(Math.min(tree.x - area.minX, area.maxX - tree.x, tree.z - area.minZ, area.maxZ - tree.z)).toBeLessThan(4)
    expect(trees.filter((tree) => tree.x + tree.z < 0).length).toBeGreaterThan(trees.filter((tree) => tree.x + tree.z > 0).length)
    for (const prop of plan.props) {
      expect(Math.hypot(prop.x - 10, prop.z)).toBeGreaterThan(1.2)
      expect(prop.x > block.minX - 0.7 && prop.x < block.maxX + 0.7 && prop.z > block.minZ - 0.7 && prop.z < block.maxZ + 0.7).toBe(false)
    }
  })
})
