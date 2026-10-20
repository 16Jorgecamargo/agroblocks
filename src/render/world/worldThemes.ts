import type { WorldId } from '@/game/worlds/worldTypes'
import type { CropKind } from '@/render/crops/cropShape'
import { DEFAULT_PALETTE } from '@/render/world/worldPalette'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, Rect, Vec2, WorldDensity, WorldPaletteColors } from '@/render/world/worldTypes'

export interface WorldTheme {
  palette: WorldPaletteColors
  crop: CropKind
  features: FeatureKind[]
}

export const WORLD_THEMES: Record<WorldId, WorldTheme> = {
  garden: { palette: { grass: '#7cc35a', grassDeep: '#63a945', path: '#c9a46b' }, crop: 'vegetable', features: ['vegetableBed'] },
  cornfield: { palette: { grass: '#cdbd62', grassDeep: '#b5a54d', path: '#b88f55' }, crop: 'corn', features: ['cornStalk', 'hayBale'] },
  orchard: { palette: { grass: '#6fb54e', grassDeep: '#57993b', path: '#c29c63' }, crop: 'fruit', features: ['fruitTree'] },
  greenhouse: { palette: { grass: '#83c493', grassDeep: '#69ab7a', path: '#c7b08a' }, crop: 'seedling', features: ['greenhouse', 'vegetableBed'] },
  barnyard: { palette: { grass: '#b9b071', grassDeep: '#a19858', path: '#a9875b' }, crop: 'grain', features: ['hayBale', 'trough'] },
  homestead: { palette: DEFAULT_PALETTE, crop: 'mixed', features: ['cornStalk', 'fruitTree', 'greenhouse', 'vegetableBed', 'hayBale', 'trough'] },
}

const FRUIT_TINTS = ['#e0473c', '#f29a2e', '#f2c94c']

const FEATURE_COUNTS: Record<FeatureKind, number> = {
  cornStalk: 0,
  fruitTree: 14,
  greenhouse: 2,
  vegetableBed: 9,
  hayBale: 6,
  trough: 3,
}

const CORN_PATCHES = 5
const CORN_ROWS = 3
const CORN_COLUMNS = 5
const CORN_SPACING_X = 0.6
const CORN_SPACING_Z = 0.85
const TRIES = 40

function pointIn(area: Rect, random: () => number): Vec2 {
  return { x: area.minX + random() * (area.maxX - area.minX), z: area.minZ + random() * (area.maxZ - area.minZ) }
}

function cornPatch(draft: WorldDraft, center: Vec2, random: () => number): void {
  for (let row = 0; row < CORN_ROWS; row += 1) {
    for (let column = 0; column < CORN_COLUMNS; column += 1) {
      const point = { x: center.x + column * CORN_SPACING_X, z: center.z + row * CORN_SPACING_Z }
      draft.placeFeature('cornStalk', point, random() * 0.6 - 0.3, 0.85 + random() * 0.3)
    }
  }
}

export function addThemeFeatures(draft: WorldDraft, theme: WorldId | null | undefined, area: Rect, density: WorldDensity, random: () => number): void {
  if (!theme) return
  const share = density === 'full' ? 1 : 0.5
  const mixed = theme === 'homestead' ? 0.4 : 1
  for (const kind of WORLD_THEMES[theme].features) {
    if (kind === 'cornStalk') {
      const patches = Math.max(1, Math.round(CORN_PATCHES * share * mixed))
      for (let patch = 0; patch < patches; patch += 1) cornPatch(draft, pointIn(area, random), random)
      continue
    }
    const target = Math.max(1, Math.round(FEATURE_COUNTS[kind] * share * mixed))
    let placed = 0
    for (let tries = 0; tries < target * TRIES && placed < target; tries += 1) {
      const tint = kind === 'fruitTree' ? FRUIT_TINTS[Math.floor(random() * FRUIT_TINTS.length)] : undefined
      if (draft.placeFeature(kind, pointIn(area, random), random() * Math.PI * 2, 0.9 + random() * 0.2, tint)) placed += 1
    }
  }
}

export function themePalette(theme: WorldId | null | undefined): WorldPaletteColors {
  return theme ? WORLD_THEMES[theme].palette : DEFAULT_PALETTE
}
