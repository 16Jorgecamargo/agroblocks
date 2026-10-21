import { cellCenter, cellIndex } from '@/render/world/navigation/occupancy'
import { isOpen, type WalkMask } from '@/render/world/navigation/passability'
import type { Vec2 } from '@/render/world/worldTypes'

const STEPS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

export function segmentClear(mask: WalkMask, from: Vec2, to: Vec2): boolean {
  const length = Math.hypot(to.x - from.x, to.z - from.z)
  const samples = Math.max(1, Math.ceil(length / (mask.grid.cell / 2)))
  for (let step = 0; step <= samples; step += 1) {
    const t = step / samples
    if (!isOpen(mask, { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t })) return false
  }
  return true
}

class Heap {
  private readonly items: number[] = []
  constructor(private readonly score: Float64Array) {}
  get size(): number {
    return this.items.length
  }
  push(item: number): void {
    const items = this.items
    items.push(item)
    let index = items.length - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (this.score[items[parent]] <= this.score[items[index]]) break
      ;[items[parent], items[index]] = [items[index], items[parent]]
      index = parent
    }
  }
  pop(): number {
    const items = this.items
    const top = items[0]
    const last = items.pop() as number
    if (items.length > 0) {
      items[0] = last
      let index = 0
      for (;;) {
        const left = index * 2 + 1
        const right = left + 1
        let smallest = index
        if (left < items.length && this.score[items[left]] < this.score[items[smallest]]) smallest = left
        if (right < items.length && this.score[items[right]] < this.score[items[smallest]]) smallest = right
        if (smallest === index) break
        ;[items[smallest], items[index]] = [items[index], items[smallest]]
        index = smallest
      }
    }
    return top
  }
}

function octile(dx: number, dz: number): number {
  const a = Math.abs(dx)
  const b = Math.abs(dz)
  return Math.max(a, b) + (Math.SQRT2 - 1) * Math.min(a, b)
}

function pull(mask: WalkMask, points: Vec2[]): Vec2[] {
  const result = [points[0]]
  let anchor = 0
  while (anchor < points.length - 1) {
    let next = points.length - 1
    while (next > anchor + 1 && !segmentClear(mask, points[anchor], points[next])) next -= 1
    result.push(points[next])
    anchor = next
  }
  return result
}

export function findPath(mask: WalkMask, from: Vec2, to: Vec2): Vec2[] | null {
  if (!isOpen(mask, from) || !isOpen(mask, to)) return null
  if (segmentClear(mask, from, to)) return [from, to]
  const { grid } = mask
  const start = cellIndex(grid, from)
  const goal = cellIndex(grid, to)
  const total = grid.columns * grid.rows
  const cost = new Float64Array(total).fill(Infinity)
  const score = new Float64Array(total).fill(Infinity)
  const came = new Int32Array(total).fill(-1)
  const closed = new Uint8Array(total)
  const goalColumn = goal % grid.columns
  const goalRow = Math.floor(goal / grid.columns)
  const heap = new Heap(score)
  cost[start] = 0
  score[start] = octile(start % grid.columns - goalColumn, Math.floor(start / grid.columns) - goalRow)
  heap.push(start)
  while (heap.size > 0) {
    const current = heap.pop()
    if (current === goal) break
    if (closed[current]) continue
    closed[current] = 1
    const column = current % grid.columns
    const row = Math.floor(current / grid.columns)
    for (const [dx, dz, step] of STEPS) {
      const x = column + dx
      const z = row + dz
      if (x < 0 || z < 0 || x >= grid.columns || z >= grid.rows) continue
      const next = z * grid.columns + x
      if (!mask.open[next] || closed[next]) continue
      if (dx !== 0 && dz !== 0 && (!mask.open[row * grid.columns + x] || !mask.open[z * grid.columns + column])) continue
      const tentative = cost[current] + step
      if (tentative >= cost[next]) continue
      cost[next] = tentative
      came[next] = current
      score[next] = tentative + octile(x - goalColumn, z - goalRow)
      heap.push(next)
    }
  }
  if (came[goal] < 0 && goal !== start) return null
  const cells: number[] = []
  for (let cell = goal; cell !== start; cell = came[cell]) cells.push(cell)
  const points = [from, ...cells.reverse().slice(0, -1).map((cell) => cellCenter(grid, cell)), to]
  return pull(mask, points)
}
