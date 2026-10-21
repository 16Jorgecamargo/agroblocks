import type { WorldId } from '@/game/worlds/worldTypes'
import { cornfieldLandscape } from '@/render/world/landscapes/cornfieldLandscape'
import { gardenLandscape } from '@/render/world/landscapes/gardenLandscape'
import { orchardLandscape } from '@/render/world/landscapes/orchardLandscape'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'

export type { Landscape }

export const LANDSCAPES: Partial<Record<WorldId, Landscape>> = {
  garden: gardenLandscape,
  cornfield: cornfieldLandscape,
  orchard: orchardLandscape,
}
