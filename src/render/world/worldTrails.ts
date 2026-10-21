import type { WorldId } from '@/game/worlds/worldTypes'
import type { Vec2 } from '@/render/world/worldTypes'

function points(list: [number, number][]): Vec2[] {
  return list.map(([x, z]) => ({ x, z }))
}

function arc(centerX: number, centerZ: number, radiusX: number, radiusZ: number, start: number, step: number): Vec2[] {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = start + index * step
    return { x: Math.round((centerX + Math.cos(angle) * radiusX) * 100) / 100, z: Math.round((centerZ + Math.sin(angle) * radiusZ) * 100) / 100 }
  })
}

function spiral(): Vec2[] {
  return Array.from({ length: 12 }, (_, index) => {
    const radius = 8.6 - index * 0.48
    const angle = index * 0.8
    return { x: Math.round(Math.cos(angle) * radius * 100) / 100, z: Math.round(Math.sin(angle) * radius * 100) / 100 }
  })
}

const SPREAD = 1.5

function spread(trail: Vec2[]): Vec2[] {
  return trail.map(({ x, z }) => ({ x: Math.round(x * SPREAD * 100) / 100, z: Math.round(z * SPREAD * 100) / 100 }))
}

const BASE_TRAILS: Record<WorldId, Vec2[]> = {
  garden: points([
    [-7.5, -8],
    [-4.8, -7.2],
    [-2.3, -6],
    [0.2, -4.6],
    [2.8, -3.4],
    [5.4, -2],
    [6.4, 0.6],
    [4, 2.4],
    [1.4, 3.6],
    [-1.2, 4.8],
    [-3.8, 6.2],
    [-6.4, 7.6],
  ]),
  cornfield: points([
    [-8, -8],
    [-4.6, -8],
    [-1.2, -8],
    [2.2, -8],
    [5.6, -8],
    [7.6, -5.2],
    [4.4, -3.6],
    [1, -3.6],
    [-2.4, -3.6],
    [-5.8, -3.6],
    [-7.8, -0.8],
    [-4.6, 1.2],
  ]),
  orchard: arc(0, 0.5, 6.8, 6.8, Math.PI * 1.1, 0.48),
  greenhouse: points([
    [-8, 7.5],
    [-6.2, 5.6],
    [-4.4, 3.7],
    [-2.6, 1.8],
    [-0.8, -0.1],
    [1, -2],
    [3.4, -2.8],
    [5.4, -1.2],
    [5.8, 1.4],
    [4.6, 3.7],
    [3.4, 6],
    [2.2, 8.3],
  ]),
  barnyard: arc(0, 0, 7.4, 5.6, Math.PI * 0.6, 0.5),
  homestead: spiral(),
}

const DRAWN_TRAILS: Partial<Record<WorldId, Vec2[]>> = {
  greenhouse: points([
    [-12, 6],
    [-8.6, 4.8],
    [-5.2, 3.6],
    [-1.8, 2.4],
    [1.6, 1.2],
    [4.8, 2.6],
    [7.8, 4.6],
    [9.6, 7.8],
    [7.6, 10.8],
    [4.2, 11.6],
    [0.8, 10.4],
    [-2.6, 9.6],
  ]),
  orchard: points([
    [-12, -4],
    [-8.6, -2.8],
    [-5.2, -1.4],
    [-2, 0.4],
    [1.4, 1.2],
    [4.8, 0],
    [7.6, -2.2],
    [9.4, -5.4],
    [8, -8.8],
    [4.6, -10],
    [1, -9.2],
    [-2.4, -8],
  ]),
  cornfield: points([
    [-12, 10],
    [-8.5, 9.5],
    [-5, 8.6],
    [-1.5, 7.6],
    [2, 6.2],
    [5.2, 4.4],
    [7.4, 1.6],
    [8.4, -1.8],
    [8.2, -5.4],
    [5.2, -7.4],
    [1.6, -8.2],
    [-2, -9.6],
  ]),
  garden: points([
    [-11, 9],
    [-8, 7],
    [-5.5, 4.5],
    [-3.5, 1.5],
    [-1, -1.5],
    [2.5, -3],
    [6, -2],
    [8.5, 0.5],
    [8, 4],
    [5, 6.5],
    [1.5, 8.5],
    [-1.5, 11],
  ]),
}

export const WORLD_TRAILS: Record<WorldId, Vec2[]> = Object.fromEntries(Object.entries(BASE_TRAILS).map(([world, trail]) => [world, DRAWN_TRAILS[world as WorldId] ?? spread(trail)])) as Record<WorldId, Vec2[]>
