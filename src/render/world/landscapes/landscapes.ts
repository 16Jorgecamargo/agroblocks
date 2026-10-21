import type { WorldId } from '@/game/worlds/worldTypes'
import { cornfieldLandscape } from '@/render/world/landscapes/cornfieldLandscape'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'

export type { Landscape }

export const LANDSCAPES: Partial<Record<WorldId, Landscape>> = {
  cornfield: cornfieldLandscape,
}
