import { rectDistance } from '@/render/world/geometry'
import { trailDistance } from '@/render/world/landscapes/landscapeKit'
import { FEATURE_FOOTPRINTS, footprint, isClutter } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { GroundPatch, Polyline, Rect } from '@/render/world/worldTypes'

const CELL = 0.6
const MAX_CELLS = 12
const MIN_SIDE = 3
const MIN_AREA = 6
const GAP = 0.5
const CLEAR = 0.45

function cellRect(area: Rect, row: number, column: number): Rect {
  return { minX: area.minX + column * CELL, maxX: area.minX + (column + 1) * CELL, minZ: area.minZ + row * CELL, maxZ: area.minZ + (row + 1) * CELL }
}

function rectGap(a: Rect, b: Rect): number {
  return Math.hypot(Math.max(0, a.minX - b.maxX, b.minX - a.maxX), Math.max(0, a.minZ - b.maxZ, b.minZ - a.maxZ))
}

function cellIsOpen(cell: Rect, draft: WorldDraft, paths: Polyline[], patches: GroundPatch[]): boolean {
  if (patches.some((patch) => rectGap(cell, patch.rect) < CLEAR)) return false
  if (paths.some((path) => trailDistance(cell, path.points) < path.width / 2 + CLEAR)) return false
  if (draft.props.some((prop) => !isClutter(prop.model) && rectDistance(prop, cell) < footprint(prop.model) * prop.scale + 0.2)) return false
  return draft.features.every((feature) => rectDistance(feature, cell) >= FEATURE_FOOTPRINTS[feature.kind] * feature.scale + 0.2)
}

interface Block {
  row: number
  column: number
  rows: number
  columns: number
}

function bestBlock(grid: boolean[][]): Block | null {
  let best: Block | null = null
  let bestArea = 0
  const rows = grid.length
  const columns = grid[0]?.length ?? 0
  for (let top = 0; top < rows; top += 1) {
    for (let left = 0; left < columns; left += 1) {
      if (!grid[top][left]) continue
      let width = Math.min(MAX_CELLS, columns - left)
      for (let bottom = top; bottom < Math.min(rows, top + MAX_CELLS); bottom += 1) {
        let run = 0
        while (run < width && grid[bottom][left + run]) run += 1
        width = run
        if (width < MIN_SIDE) break
        const height = bottom - top + 1
        if (height < MIN_SIDE) continue
        const usable = (width * CELL - GAP) * (height * CELL - GAP)
        if (usable >= MIN_AREA && usable > bestArea) {
          bestArea = usable
          best = { row: top, column: left, rows: height, columns: width }
        }
      }
    }
  }
  return best
}

export function freeLots(draft: WorldDraft, paths: Polyline[], patches: GroundPatch[], area: Rect): Rect[] {
  const columns = Math.floor((area.maxX - area.minX) / CELL)
  const rows = Math.floor((area.maxZ - area.minZ) / CELL)
  const grid = Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => cellIsOpen(cellRect(area, row, column), draft, paths, patches)))
  const lots: Rect[] = []
  for (let block = bestBlock(grid); block; block = bestBlock(grid)) {
    for (let row = block.row; row < block.row + block.rows; row += 1) for (let column = block.column; column < block.column + block.columns; column += 1) grid[row][column] = false
    lots.push({
      minX: area.minX + block.column * CELL + GAP / 2,
      maxX: area.minX + (block.column + block.columns) * CELL - GAP / 2,
      minZ: area.minZ + block.row * CELL + GAP / 2,
      maxZ: area.minZ + (block.row + block.rows) * CELL - GAP / 2,
    })
  }
  return lots
}
