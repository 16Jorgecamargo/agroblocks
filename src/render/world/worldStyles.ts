import type { WorldId } from '@/game/worlds/worldTypes'
import { PALETTE } from '@/render/palette'
import { DEFAULT_PALETTE } from '@/render/world/worldPalette'
import type { WorldPaletteColors } from '@/render/world/worldTypes'

export type Relief = 'flat' | 'rolling' | 'terraced'

export type BorderKind = 'hedge' | 'windbreak' | 'stoneWall' | 'meshFence' | 'woodFence' | 'mixed'

export interface WorldStyle {
  palette: WorldPaletteColors
  sky: string
  hemisphere: { sky: string; ground: string; intensity: number }
  sun: { color: string; intensity: number; position: [number, number, number] }
  relief: Relief
  border: BorderKind
}

function style(palette: WorldPaletteColors, sky: string, sun: WorldStyle['sun'], relief: Relief, border: BorderKind): WorldStyle {
  return { palette, sky, hemisphere: { sky, ground: palette.grassDeep, intensity: 0.9 }, sun, relief, border }
}

export const TRAINING_STYLE: WorldStyle = {
  palette: DEFAULT_PALETTE,
  sky: PALETTE.sky,
  hemisphere: { sky: '#f1f8ff', ground: PALETTE.grassDark, intensity: 0.9 },
  sun: { color: '#ffffff', intensity: 1.5, position: [10, 18, 8] },
  relief: 'flat',
  border: 'woodFence',
}

export const WORLD_STYLES: Record<WorldId, WorldStyle> = {
  garden: style({ grass: '#7cc35a', grassDeep: '#63a945', path: '#c9a46b' }, '#cfeefc', { color: '#fff6e0', intensity: 1.5, position: [10, 18, 8] }, 'flat', 'hedge'),
  cornfield: style({ grass: '#bcc566', grassDeep: '#a3ad52', path: '#b0874f' }, '#f6d9a8', { color: '#ffdca0', intensity: 1.5, position: [14, 12, 4] }, 'rolling', 'windbreak'),
  orchard: style({ grass: '#5fa845', grassDeep: '#4a8f37', path: '#8cc06a' }, '#d6ecf5', { color: '#fff0dc', intensity: 1.3, position: [8, 18, 10] }, 'terraced', 'stoneWall'),
  greenhouse: style({ grass: '#8cc9a0', grassDeep: '#72b088', path: '#d9d2c3' }, '#e3f4f4', { color: '#f2fbff', intensity: 1.4, position: [6, 20, 6] }, 'flat', 'meshFence'),
  barnyard: style({ grass: '#b9b071', grassDeep: '#a19858', path: '#a9875b' }, '#f3e3c8', { color: '#ffe2b0', intensity: 1.45, position: [12, 14, 6] }, 'flat', 'woodFence'),
  homestead: style(DEFAULT_PALETTE, '#cfe8f5', { color: '#ffffff', intensity: 1.5, position: [10, 18, 8] }, 'rolling', 'mixed'),
}

export function styleOf(theme: WorldId | null | undefined): WorldStyle {
  return theme ? WORLD_STYLES[theme] : TRAINING_STYLE
}
