import type { WorldId } from '@/game/worlds/worldTypes'
import type { CropKind } from '@/render/crops/cropShape'
import { styleOf } from '@/render/world/worldStyles'
import type { WorldPaletteColors } from '@/render/world/worldTypes'

export interface WorldTheme {
  crop: CropKind
}

export const WORLD_THEMES: Record<WorldId, WorldTheme> = {
  garden: { crop: 'vegetable' },
  cornfield: { crop: 'corn' },
  orchard: { crop: 'fruit' },
  greenhouse: { crop: 'seedling' },
  barnyard: { crop: 'grain' },
  homestead: { crop: 'mixed' },
}

export function themePalette(theme: WorldId | null | undefined): WorldPaletteColors {
  return styleOf(theme).palette
}
