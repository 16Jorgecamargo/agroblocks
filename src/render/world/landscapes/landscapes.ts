import type { WorldId } from '@/game/worlds/worldTypes'
import { barnyardLandscape } from '@/render/world/landscapes/barnyardLandscape'
import { cornfieldLandscape } from '@/render/world/landscapes/cornfieldLandscape'
import { gardenLandscape } from '@/render/world/landscapes/gardenLandscape'
import { greenhouseLandscape } from '@/render/world/landscapes/greenhouseLandscape'
import { homesteadLandscape } from '@/render/world/landscapes/homesteadLandscape'
import { orchardLandscape } from '@/render/world/landscapes/orchardLandscape'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'

export type { Landscape }

export const LANDSCAPES: Record<WorldId, Landscape> = {
  garden: gardenLandscape,
  cornfield: cornfieldLandscape,
  orchard: orchardLandscape,
  greenhouse: greenhouseLandscape,
  barnyard: barnyardLandscape,
  homestead: homesteadLandscape,
}
