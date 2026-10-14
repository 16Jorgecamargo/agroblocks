import type { Cell, PlotState, Terrain } from '@/game/world/types'

export class MapParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MapParseError'
  }
}

const PLOT_TOKENS: Record<string, PlotState> = {
  '.': 'untilled',
  t: 'tilled',
  s: 'seeded',
  g: 'growing',
  m: 'mature',
  h: 'harvested',
}

const TERRAIN_TOKENS: Record<string, Exclude<Terrain, 'soil'>> = {
  '#': 'obstacle',
  X: 'blocked',
  R: 'reservoir',
  S: 'seedDepot',
}

function parseCellToken(token: string, x: number, y: number): Cell {
  const [head, suffix, ...rest] = token
  const plot = PLOT_TOKENS[head]
  if (plot) {
    if (rest.length > 0 || (suffix !== undefined && suffix !== 'w')) {
      throw new MapParseError(`Token inválido "${token}" em (${x}, ${y})`)
    }
    return { terrain: 'soil', plot, moisture: suffix === 'w' ? 'wet' : 'dry', growth: 0 }
  }
  const terrain = TERRAIN_TOKENS[head]
  if (terrain && token.length === 1) {
    return { terrain, plot: 'untilled', moisture: 'dry', growth: 0 }
  }
  throw new MapParseError(`Token inválido "${token}" em (${x}, ${y})`)
}

export function parseMap(rows: string[]): { width: number; height: number; cells: Cell[][] } {
  if (rows.length === 0) throw new MapParseError('O mapa não tem linhas')
  const tokenRows = rows.map((row) => row.trim().split(/\s+/))
  const width = tokenRows[0].length
  const cells = tokenRows.map((tokens, y) => {
    if (tokens.length !== width) {
      throw new MapParseError(`A linha ${y} tem ${tokens.length} células, esperado ${width}`)
    }
    return tokens.map((token, x) => parseCellToken(token, x, y))
  })
  return { width, height: rows.length, cells }
}
