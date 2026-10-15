import { crossings, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, addLilies, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

const CROP_ROWS = ['corn-row', 'wheat-row', 'lettuce-row', 'pumpkin-row', 'carrot-row'] as const

export function farmLayout(input: WorldInput, random: () => number): World {
  const hw = input.gridWidth / 2
  const hh = input.gridHeight / 2
  const full = input.density === 'full'
  const grid: Rect = { minX: -hw, maxX: hw, minZ: -hh, maxZ: hh }
  const yardPath: Polyline = { points: [{ x: -hw - 1.5, z: -hh - 5.5 }, { x: -hw * 0.3, z: -hh - 3 }, { x: 0, z: -hh - 1.6 }], width: 1.3 }
  const eastPath: Polyline = { points: [{ x: hw + 1.6, z: 0 }, { x: hw + 6, z: 0.6 }, { x: hw + 12, z: -0.4 }], width: 1.1 }
  const river: Polyline = {
    points: [
      { x: hw + 6.5, z: -hh - 16 },
      { x: hw + 4.5, z: -hh - 6 },
      { x: hw + 5.5, z: 0 },
      { x: hw + 4, z: hh + 6 },
      { x: hw + 6, z: hh + 16 },
    ],
    width: 2,
  }
  const pastureRect: Rect = { minX: -hw - 12, maxX: -hw - 3.5, minZ: -hh - 1, maxZ: hh + 5 }
  const pasture: Vec2[] = rectPolygon(pastureRect)
  const draft = new WorldDraft(random, { grid, paths: [yardPath, eastPath], river, keepOut: [pasture], frontGuard: grid })

  for (const crossing of crossings(eastPath, river)) draft.force('bridge', crossing.point, crossing.angle, 1)
  draft.force('sign', { x: 1.1, z: -hh - 2 }, 0, 1)

  for (let column = 0; column < input.gridWidth; column += 1) {
    const x = column - (input.gridWidth - 1) / 2
    draft.force('fence', { x, z: -hh - 0.55 }, 0, 1)
    draft.force('fence', { x, z: hh + 0.55 }, 0, 1)
  }
  for (let row = 0; row < input.gridHeight; row += 1) {
    const z = row - (input.gridHeight - 1) / 2
    draft.force('fence', { x: -hw - 0.55, z }, Math.PI / 2, 1)
    draft.force('fence', { x: hw + 0.55, z }, Math.PI / 2, 1)
  }

  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ }, 3)
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.placeNear('barn', { x: -hw - 3.5, z: -hh - 9 }, 0.35)
  draft.placeNear('silo', { x: -hw + 1.2, z: -hh - 11 }, 0)
  draft.placeNear('silo-house', { x: hw - 1, z: -hh - 11.5 }, -0.2)
  draft.placeNear('small-barn', { x: hw + 0.8, z: -hh - 7.5 }, -0.4)
  draft.placeNear('tower-windmill', { x: -hw - 9.5, z: -hh - 6.5 }, 0.6)
  draft.placeNear('water-tower', { x: -hw - 7.5, z: -hh - 11 }, 0)
  draft.placeNear('reservoir', { x: -hw + 2.6, z: -hh - 5.2 }, 0.3)
  draft.placeNear('chicken-coop', { x: -hw - 0.4, z: -hh - 6.2 }, 0.5)
  draft.placeNear('log-stack', { x: -hw + 4.2, z: -hh - 6.4 }, 0.2)
  draft.placeNear('open-barn', { x: -hw - 15, z: -hh - 3 }, 1.2)
  draft.placeNear('windmill', { x: hw + 11, z: -hh - 11 }, -0.5)

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      draft.placeNear('apple-tree', { x: hw + 8.5 + column * 2.4, z: -hh - 7 + row * 2.6 }, random() * Math.PI * 2, 0.9 + random() * 0.2)
    }
  }

  CROP_ROWS.forEach((model, rowIndex) => {
    for (let x = -hw + 0.5; x <= hw - 0.5; x += 1) draft.place(model, { x, z: hh + 2.8 + rowIndex * 1.1 }, 0, 1)
  })

  const core: Rect = { minX: -hw - 13, maxX: hw + 16, minZ: -hh - 13, maxZ: hh + 8.5 }
  draft.scatter(FOREST_MODELS, full ? 30 : 15, core, [0.85, 1.15])
  const ring: Rect = { minX: core.minX - 10, maxX: core.maxX + 10, minZ: core.minZ - 10, maxZ: core.maxZ + 10 }
  const outsideCore = (point: Vec2) => point.x < core.minX || point.x > core.maxX || point.z < core.minZ || point.z > core.maxZ
  draft.scatter(FOREST_MODELS, full ? 110 : 55, ring, [0.85, 1.2], outsideCore)
  draft.scatter(TREE_MODELS, full ? 20 : 10, { minX: -hw - 12, maxX: hw + 12, minZ: -hh - 13, maxZ: -hh - 9 }, [0.9, 1.15])

  addLilies(draft, river, 6)
  addClutter(draft, { minX: core.minX - 2, maxX: core.maxX + 2, minZ: core.minZ - 2, maxZ: core.maxZ + 2 }, input.density, 460)

  const animals = [
    ...spawnHerd(random, pasture, [['cow', 2], ['horse', 2], ['pig', 3], ['sheep', 4], ['llama', 1]], 'pasture'),
    ...spawnHerd(random, rectPolygon({ minX: -hw - 2, maxX: hw + 1, minZ: -hh - 4.8, maxZ: -hh - 2.6 }), [['pug', 1]], 'yard'),
  ]

  return {
    ground: { minX: ring.minX - 6, maxX: ring.maxX + 6, minZ: ring.minZ - 6, maxZ: ring.maxZ + 6 },
    island: false,
    paths: [yardPath, eastPath],
    river,
    trail: [],
    props: draft.props,
    pasture,
    animals,
    butterflies: addButterflies(random, { minX: -hw - 3, maxX: hw + 3, minZ: hh + 1.5, maxZ: hh + 7 }, 8),
  }
}
